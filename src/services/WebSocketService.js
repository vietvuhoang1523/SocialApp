import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EMERGENCY_MODE } from '../../EmergencyMode';
import notificationService from './NotificationService';

class WebSocketService {
    constructor() {
        this.client = null;
        this.connected = false;
        this.connecting = false;
        this.eventListeners = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.baseReconnectDelay = 2000;
        this.maxReconnectDelay = 30000;
        this.currentUser = null; // Store current user info
        this.notificationSubscription = null; // Store notification subscription

        // ✅ Configuration to match backend exactly
        this.config = {
            serverUrl: 'http://192.168.100.193:8082/ws', // ✅ Backend WebSocket endpoint
            heartbeatIncoming: 10000, // ✅ Match backend: 10s
            heartbeatOutgoing: 10000, // ✅ Match backend: 10s
            connectionTimeout: 30000, // 30 seconds for backend processing
            debug: true
        };
    }

    // Get current user info for proper subscription paths
    async _getCurrentUserInfo() {
        try {
            // ✅ FIX: Enhanced user info extraction with better email handling
            console.log('🔍 Getting current user info for WebSocket...');

            // Try to get from userData first
            const userData = await AsyncStorage.getItem('userData');
            if (userData) {
                const user = JSON.parse(userData);
                if (user.email && user.id) {
                    this.currentUser = {
                        id: user.id,
                        email: user.email,
                        username: user.email // Backend uses email as username
                    };
                    console.log('✅ Got user info from userData:', this.currentUser.email);
                    return this.currentUser;
                }
            }

            // Try to get from userProfile
            const userProfile = await AsyncStorage.getItem('userProfile');
            if (userProfile) {
                const profile = JSON.parse(userProfile);
                if (profile.email && profile.id) {
                    this.currentUser = {
                        id: profile.id,
                        email: profile.email,
                        username: profile.email
                    };
                    console.log('✅ Got user info from userProfile:', this.currentUser.email);
                    return this.currentUser;
                }
            }

            // Try to decode from token - enhanced parsing
            const token = await AsyncStorage.getItem('accessToken');
            if (token) {
                try {
                    const parts = token.split('.');
                    if (parts.length === 3) {
                        const payload = parts[1];
                        const decoded = JSON.parse(atob(payload));

                        // ✅ FIX: Better email extraction from token
                        const email = decoded.sub || decoded.email || decoded.username;
                        const userId = decoded.userId || decoded.id;

                        if (email && email.includes('@')) {
                            this.currentUser = {
                                id: userId,
                                email: email,
                                username: email
                            };
                            console.log('✅ Got user info from token:', this.currentUser.email);
                            return this.currentUser;
                        }
                    }
                } catch (decodeError) {
                    console.warn('⚠️ Failed to decode token:', decodeError);
                }
            }

            console.warn('⚠️ Could not determine current user info - missing email');
            return null;
        } catch (error) {
            console.error('❌ Error getting current user info:', error);
            return null;
        }
    }

    // ✅ Enhanced token detection - search multiple storage keys
    async _getToken() {
        try {
            const tokenKeys = ['accessToken', 'token', 'authToken', 'userToken', 'jwtToken'];

            for (const key of tokenKeys) {
                const token = await AsyncStorage.getItem(key);
                if (token) {
                    // ✅ Auto-detect JWT tokens (start with "eyJ")
                    if (token.startsWith('eyJ') || token.includes('.')) {
                        console.log(`✅ Found JWT token in storage key: ${key}`);
                        return token;
                    }
                    console.log(`⚠️ Found non-JWT token in ${key}:`, token.substring(0, 20) + '...');
                }
            }

            // ✅ Debug: Show all storage keys to help find token
            console.log('🔍 Debugging AsyncStorage keys...');
            const allKeys = await AsyncStorage.getAllKeys();
            console.log('📦 All AsyncStorage keys:', allKeys);

            for (const key of allKeys) {
                if (key.toLowerCase().includes('token') || key.toLowerCase().includes('auth') || key.toLowerCase().includes('jwt')) {
                    const value = await AsyncStorage.getItem(key);
                    console.log(`🔑 ${key}:`, value ? value.substring(0, 50) + '...' : 'null');
                }
            }

            throw new Error('Không tìm thấy token hợp lệ');
        } catch (error) {
            console.error('❌ Error getting token:', error);
            throw error;
        }
    }

    // Connect to WebSocket - matching backend authentication
    async connect(userInfo = null) {
        // 🆘 EMERGENCY MODE: Mock connection
        if (EMERGENCY_MODE.enabled) {
            console.log('🆘 [EMERGENCY MODE] Mock WebSocket connection');
            this.connected = true;
            return true;
        }

        if (this.connected || this.connecting) {
            console.log('⚠️ Already connected or connecting');
            return this.connected;
        }

        this.connecting = true;
        console.log('🔌 Connecting to WebSocket:', this.config.serverUrl);
        console.log('🔍 Kiểm tra kết nối WebSocket...');
        console.log('🌐 Địa chỉ server:', this.config.serverUrl);

        try {
            // ✅ Get token using enhanced detection
            const token = await this._getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Store user info for later use
            this.currentUser = userInfo;

            // ✅ Create SockJS connection exactly as backend expects
            const socket = new SockJS(this.config.serverUrl);
            this.client = Stomp.over(socket);

            // ✅ Disable console debug if not needed
            if (!this.config.debug) {
                this.client.debug = () => {};
            } else {
                // Thêm gỡ lỗi chi tiết cho các phản hồi WebSocket
                this.client.debug = (message) => {
                    console.log('🛠️ WebSocket Debug:', message);
                    if (message.includes('Received data')) {
                        console.log('📥 Raw WebSocket Data:', message);
                    }
                };
            }

            // ✅ Setup connection with proper authentication headers
            const connectHeaders = {
                'Authorization': `Bearer ${token}`, // ✅ Backend expects this format
                'Content-Type': 'application/json'
            };

            console.log('🔑 Connecting with headers:', {
                Authorization: `Bearer ${token.substring(0, 20)}...`
            });

            return new Promise((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    console.error('❌ Connection timeout');
                    this._cleanup();
                    reject(new Error('Connection timeout'));
                }, this.config.connectionTimeout);

                this.client.connect(
                    connectHeaders,
                    async (frame) => {
                        clearTimeout(timeoutId);
                        console.log('✅ WebSocket connected successfully:', frame);
                        this.connected = true;
                        this.connecting = false;
                        this.reconnectAttempts = 0;

                        // Setup subscriptions asynchronously and handle errors
                        try {
                            await this._setupSubscriptions();
                            resolve(true);
                        } catch (setupError) {
                            console.error('❌ Subscription setup failed:', setupError);
                            // Still resolve as connection succeeded, subscriptions can be retried
                            resolve(true);
                        }
                    },
                    (error) => {
                        clearTimeout(timeoutId);
                        console.error('❌ WebSocket connection failed:', error);
                        this._cleanup();
                        reject(error);
                    }
                );
            });

        } catch (error) {
            console.error('❌ Failed to connect to WebSocket:', error);
            this._cleanup();
            console.error('❌ Lỗi kết nối WebSocket:', error.message);
            throw error;
        }
    }

    // Setup subscriptions after successful connection
    async _setupSubscriptions() {
        console.log('📡 Setting up WebSocket subscriptions...');

        // Enhanced null checks
        if (!this.client) {
            console.error('❌ Cannot setup subscriptions - client is null');
            return;
        }

        if (!this.connected) {
            console.error('❌ Cannot setup subscriptions - not connected');
            return;
        }

        if (!this.client.connected) {
            console.error('❌ Cannot setup subscriptions - STOMP client not connected');
            return;
        }

        try {
            // ✅ Get user email for subscription routing (backend uses email as principal)
            let userEmail = this.currentUser?.email;
            if (!userEmail) {
                // ✅ FIX: Enhanced email extraction with better fallback
                console.log('⚠️ No email in currentUser, trying to extract from token...');
                try {
                    const token = await this._getToken();
                    if (token) {
                        const parts = token.split('.');
                        if (parts.length === 3) {
                            const payload = JSON.parse(atob(parts[1]));
                            userEmail = payload.sub || payload.email || payload.username;

                            // Ensure it's a valid email
                            if (!userEmail || !userEmail.includes('@')) {
                                console.error('❌ Invalid email extracted from token:', userEmail);
                                userEmail = 'unknown@unknown.com'; // Fallback
                            } else {
                                console.log('✅ Extracted email from token:', userEmail);
                            }
                        }
                    }
                } catch (e) {
                    console.error('❌ Could not extract email from token:', e);
                    userEmail = 'unknown@unknown.com'; // Fallback
                }
            }

            if (!userEmail || !userEmail.includes('@')) {
                throw new Error('Cannot setup subscriptions - invalid user email: ' + userEmail);
            }

            console.log('📡 Setting up subscriptions for user email:', userEmail);

            // ✅ Wait a moment for connection to fully stabilize
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Additional client check before each subscription
            if (!this.client || !this.client.connected) {
                throw new Error('STOMP client disconnected during setup');
            }

            // ✅ Subscribe to personal message queue - backend sends new messages here
            console.log('📡 Subscribing to /user/' + userEmail + '/queue/messages');
            this.client.subscribe(`/user/${userEmail}/queue/messages`, (message) => {
                console.log('📨 Received new message via WebSocket:', message.body);
                try {
                    const messageData = JSON.parse(message.body);
                    console.log('📨 Message details:', {
                        id: messageData.id,
                        senderId: messageData.senderId,
                        receiverId: messageData.receiverId,
                        content: messageData.content?.substring(0, 50) + '...'
                    });
                    this._notifyListeners('newMessage', messageData);
                } catch (error) {
                    console.error('❌ Error parsing new message:', error);
                }
            });

            // Check client again
            if (!this.client || !this.client.connected) {
                throw new Error('STOMP client disconnected during setup');
            }

            // ✅ Subscribe to message history queue - backend sends history responses here
            console.log('📡 Subscribing to /user/' + userEmail + '/queue/messages-history');
            this.client.subscribe(`/user/${userEmail}/queue/messages-history`, (message) => {
                console.log('📚 Received message history:', message.body);
                try {
                    const historyData = JSON.parse(message.body);
                    this._notifyListeners('messageHistory', historyData);
                } catch (error) {
                    console.error('❌ Error parsing message history:', error);
                }
            });

            // Check client again
            if (!this.client || !this.client.connected) {
                throw new Error('STOMP client disconnected during setup');
            }

            // ✅ Subscribe to conversations queue
            console.log('📡 Subscribing to /user/' + userEmail + '/queue/conversations');
            this.client.subscribe(`/user/${userEmail}/queue/conversations`, (message) => {
                console.log('💬 Received conversations:', message.body);
                try {
                    const conversationsData = JSON.parse(message.body);
                    this._notifyListeners('conversations', conversationsData);
                } catch (error) {
                    console.error('❌ Error parsing conversations:', error);
                }
            });

            // ✅ Small delays between subscriptions to avoid overwhelming backend
            await new Promise(resolve => setTimeout(resolve, 100));

            // Check client again
            if (!this.client || !this.client.connected) {
                throw new Error('STOMP client disconnected during setup');
            }

            // ✅ Subscribe to unread count queue
            console.log('📡 Subscribing to /user/' + userEmail + '/queue/unread-count');
            this.client.subscribe(`/user/${userEmail}/queue/unread-count`, (message) => {
                console.log('🔢 Received unread count:', message.body);
                try {
                    const countData = JSON.parse(message.body);
                    this._notifyListeners('unreadCount', countData);
                } catch (error) {
                    console.error('❌ Error parsing unread count:', error);
                }
            });

            await new Promise(resolve => setTimeout(resolve, 100));

            // Check client again
            if (!this.client || !this.client.connected) {
                throw new Error('STOMP client disconnected during setup');
            }

            // ✅ Subscribe to read confirmations
            console.log('📡 Subscribing to /user/' + userEmail + '/queue/read-success');
            this.client.subscribe(`/user/${userEmail}/queue/read-success`, (message) => {
                console.log('✅ Message read confirmation:', message.body);
                try {
                    const readData = JSON.parse(message.body);
                    this._notifyListeners('messageRead', readData);
                } catch (error) {
                    console.error('❌ Error parsing read confirmation:', error);
                }
            });

            // Check client again
            if (!this.client || !this.client.connected) {
                throw new Error('STOMP client disconnected during setup');
            }

            // ✅ Subscribe to typing notifications
            console.log('📡 Subscribing to /user/' + userEmail + '/queue/typing');
            this.client.subscribe(`/user/${userEmail}/queue/typing`, (message) => {
                console.log('⌨️ Received typing notification:', message.body);
                try {
                    const typingData = JSON.parse(message.body);
                    this._notifyListeners('typing', typingData);
                } catch (error) {
                    console.error('❌ Error parsing typing notification:', error);
                }
            });

            // Check client again
            if (!this.client || !this.client.connected) {
                throw new Error('STOMP client disconnected during setup');
            }

            // ✅ Subscribe to read-all confirmations
            console.log('📡 Subscribing to /user/' + userEmail + '/queue/read-all-success');
            this.client.subscribe(`/user/${userEmail}/queue/read-all-success`, (message) => {
                console.log('✅ Read all confirmation:', message.body);
                try {
                    const readAllData = JSON.parse(message.body);
                    this._notifyListeners('readAllSuccess', readAllData);
                } catch (error) {
                    console.error('❌ Error parsing read all confirmation:', error);
                }
            });

            console.log('✅ All subscriptions setup successfully');
            this._notifyListeners('connectionStatus', 'connected');

        } catch (error) {
            console.error('❌ Error setting up subscriptions:', error);
            this._notifyListeners('connectionStatus', 'error');

            // Reset connection state on subscription error
            this.connected = false;
            if (this.client) {
                try {
                    this.client.disconnect();
                } catch (disconnectError) {
                    console.error('Error disconnecting after subscription failure:', disconnectError);
                }
            }
            this.client = null;
            throw error; // Re-throw so caller can handle
        }
    }

    // Send message - matching backend endpoint /app/send
    async sendMessage(messageData) {
        // 🆘 EMERGENCY MODE: Skip WebSocket sending
        if (EMERGENCY_MODE.enabled) {
            console.log('🆘 [EMERGENCY MODE] Skipping WebSocket sendMessage');
            return true;
        }

        // ⚡ FIX: Enhanced connection validation
        if (!this.isConnected()) {
            console.error('❌ WebSocket not connected for sending message');
            console.log('🔍 Connection details:', {
                connected: this.connected,
                clientExists: !!this.client,
                stompConnected: this.client?.connected,
                wsReadyState: this.client?.ws?.readyState
            });
            throw new Error('WebSocket not connected');
        }

        // ⚡ FIX: Wait for STOMP client to be truly ready with longer timeout
        try {
            await this._waitForStompReady(10000); // 10 seconds timeout
        } catch (waitError) {
            console.error('❌ STOMP client not ready for sending:', waitError);
            throw new Error('STOMP client not ready for sending messages');
        }

        try {
            // ✅ Prepare message exactly as backend MessageRequest expects
            const messageRequest = {
                content: messageData.content,
                receiverId: parseInt(messageData.receiverId),
                attachmentUrl: messageData.attachmentUrl || null,
                attachmentType: messageData.attachmentType || null,
                messageType: messageData.messageType || 'text',
                timestamp: new Date().toISOString()
                // ✅ Backend will set senderId from SecurityUtils
            };

            console.log('📤 Sending message to /app/send:', JSON.stringify(messageRequest));

            // ⚡ FIX: Add timeout for send operation
            const sendPromise = new Promise((resolve, reject) => {
                try {
                    this.client.send('/app/send', {}, JSON.stringify(messageRequest));
                    resolve(true);
                } catch (sendError) {
                    reject(sendError);
                }
            });

            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Message send timeout')), 8000);
            });

            await Promise.race([sendPromise, timeoutPromise]);
            console.log('✅ Message sent successfully to backend');
            return true;
        } catch (error) {
            console.error('❌ Error sending message:', error);

            // ⚡ FIX: Check if connection is still valid after error
            if (!this.isConnected()) {
                console.error('❌ Connection lost during message send');
                this.connected = false;
            }

            throw error;
        }
    }

    // Get messages between users - backend endpoint /app/get-messages
    async getMessagesBetweenUsers(user1Id, user2Id, options = {}) {
        // 🆘 EMERGENCY MODE: Skip WebSocket sending
        if (EMERGENCY_MODE.enabled) {
            console.log('🆘 [EMERGENCY MODE] Skipping WebSocket getMessagesBetweenUsers');
            return true;
        }

        // Enhanced connection check
        if (!this.isConnected()) {
            throw new Error('WebSocket not connected');
        }

        // Wait for STOMP client to be truly ready
        await this._waitForStompReady();

        try {
            // ✅ Prepare request exactly as backend expects
            const request = {
                user1Id: parseInt(user1Id),
                user2Id: parseInt(user2Id)
            };

            // ✅ Add pagination options if provided
            if (options.enablePagination === true) {
                request.enablePagination = true;
                request.page = parseInt(options.page || 0);
                request.size = parseInt(options.size || 50);
                request.sortBy = options.sortBy || 'timestamp';
                request.order = options.order || 'desc';
            }

            console.log('📤 Requesting messages from /app/get-messages:', JSON.stringify(request));
            this.client.send('/app/get-messages', {}, JSON.stringify(request));
            console.log('✅ Message history request sent');
            return true;
        } catch (error) {
            console.error('❌ Error requesting messages:', error);
            throw error;
        }
    }

    // Get conversations - backend endpoint /app/get-conversations
    async getConversations() {
        // Enhanced connection check
        if (!this.isConnected()) {
            throw new Error('WebSocket not connected');
        }

        // Wait for STOMP client to be truly ready
        await this._waitForStompReady();

        try {
            console.log('📤 Requesting conversations from /app/get-conversations');
            this.client.send('/app/get-conversations', {}, JSON.stringify({}));
            console.log('✅ Conversations request sent');
            return true;
        } catch (error) {
            console.error('❌ Error requesting conversations:', error);
            throw error;
        }
    }

    // Get unread messages - backend endpoint /app/get-unread
    async getUnreadMessages() {
        if (!this.isConnected()) {
            throw new Error('WebSocket not connected');
        }

        await this._waitForStompReady();

        try {
            console.log('📤 Requesting unread messages from /app/get-unread');
            this.client.send('/app/get-unread', {}, JSON.stringify({}));
            console.log('✅ Unread messages request sent');
            return true;
        } catch (error) {
            console.error('❌ Error requesting unread messages:', error);
            throw error;
        }
    }

    // Mark message as read - backend endpoint /app/mark-read
    async markMessageAsRead(messageId) {
        // 🆘 EMERGENCY MODE: Skip WebSocket operation
        if (EMERGENCY_MODE.enabled) {
            console.log('🆘 [EMERGENCY MODE] Skipping WebSocket markMessageAsRead');
            return true;
        }

        if (!this.isConnected()) {
            throw new Error('WebSocket not connected');
        }

        await this._waitForStompReady();

        try {
            // ✅ Backend expects: { messageId: string }
            const request = { messageId: messageId.toString() };
            console.log('📤 Marking message as read:', JSON.stringify(request));
            this.client.send('/app/mark-read', {}, JSON.stringify(request));
            console.log('✅ Mark read request sent');
            return true;
        } catch (error) {
            console.error('❌ Error marking message as read:', error);
            throw error;
        }
    }

    // Mark all messages as read - backend endpoint /app/mark-all-read
    async markAllMessagesAsRead(senderId, receiverId) {
        if (!this.isConnected()) {
            throw new Error('WebSocket not connected');
        }

        await this._waitForStompReady();

        try {
            const request = {
                senderId: parseInt(senderId),
                receiverId: parseInt(receiverId)
            };
            console.log('📤 Marking all messages as read:', JSON.stringify(request));
            this.client.send('/app/mark-all-read', {}, JSON.stringify(request));
            console.log('✅ Mark all read request sent');
            return true;
        } catch (error) {
            console.error('❌ Error marking all messages as read:', error);
            throw error;
        }
    }

    // Send typing notification - backend endpoint /app/typing
    async sendTyping(receiverId, isTyping = true) {
        if (!this.isConnected()) {
            console.warn('⚠️ WebSocket not connected, skipping typing notification');
            return false;
        }

        try {
            await this._waitForStompReady();

            const notification = {
                receiverId: receiverId,
                isTyping: isTyping,
                timestamp: new Date().toISOString()
            };

            console.log('📤 Sending typing notification:', JSON.stringify(notification));
            this.client.send('/app/typing', {}, JSON.stringify(notification));
            return true;
        } catch (error) {
            console.error('❌ Error sending typing notification:', error);
            return false;
        }
    }

    // Get unread messages count - backend endpoint /app/get-unread-count
    async getUnreadMessagesCount() {
        if (!this.isConnected()) {
            throw new Error('WebSocket not connected');
        }

        await this._waitForStompReady();

        try {
            console.log('📤 Requesting unread messages count from /app/get-unread-count');
            this.client.send('/app/get-unread-count', {}, JSON.stringify({}));
            console.log('✅ Unread count request sent');
            return true;
        } catch (error) {
            console.error('❌ Error requesting unread count:', error);
            throw error;
        }
    }

    // Delete message - backend endpoint /app/delete-message
    async deleteMessage(messageId, deleteForEveryone = false) {
        if (!this.isConnected()) {
            throw new Error('WebSocket not connected');
        }

        await this._waitForStompReady();

        try {
            const request = {
                messageId: messageId.toString(),
                deleteForEveryone: deleteForEveryone
            };
            console.log('📤 Deleting message:', JSON.stringify(request));
            this.client.send('/app/delete-message', {}, JSON.stringify(request));
            console.log('✅ Delete message request sent');
            return true;
        } catch (error) {
            console.error('❌ Error deleting message:', error);
            throw error;
        }
    }

    // Mark message as delivered - backend endpoint /app/mark-delivered
    async markMessageAsDelivered(messageId) {
        if (!this.isConnected()) {
            throw new Error('WebSocket not connected');
        }

        await this._waitForStompReady();

        try {
            const request = { messageId: messageId.toString() };
            console.log('📤 Marking message as delivered:', JSON.stringify(request));
            this.client.send('/app/mark-delivered', {}, JSON.stringify(request));
            console.log('✅ Mark delivered request sent');
            return true;
        } catch (error) {
            console.error('❌ Error marking message as delivered:', error);
            throw error;
        }
    }

    // Reconnection logic
    _scheduleReconnect(token) {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error(`❌ Max reconnection attempts reached`);
            this._notifyListeners('connectionStatus', 'failed');
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);

        console.log(`🔄 Scheduling reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
        this._notifyListeners('connectionStatus', 'reconnecting');

        setTimeout(() => {
            if (!this.connected && !this.connecting) {
                console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
                this.connect().catch(error => {
                    console.error('Reconnection failed:', error);
                });
            }
        }, delay);
    }

    // Event handling
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Map());
        }

        const key = 'cb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        this.eventListeners.get(event).set(key, callback);

        return key;
    }

    off(event, callbackKey) {
        if (!this.eventListeners.has(event)) return;

        if (callbackKey) {
            this.eventListeners.get(event).delete(callbackKey);
        } else {
            this.eventListeners.get(event).clear();
        }
    }

    _notifyListeners(event, data) {
        if (!this.eventListeners.has(event)) return;

        this.eventListeners.get(event).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event listener for ${event}:`, error);
            }
        });
    }

    // Enhanced connection status check
    isConnected() {
        // 🆘 EMERGENCY MODE: Always return true
        if (EMERGENCY_MODE.enabled) {
            return true;
        }

        const isStompConnected = this.connected &&
                                this.client &&
                                this.client.connected;

        const isWebSocketOpen = this.client &&
                               this.client.ws &&
                               this.client.ws.readyState === 1; // WebSocket.OPEN = 1

        const isFullyConnected = isStompConnected && isWebSocketOpen;

        console.log('🔍 Connection status check:', {
            connected: this.connected,
            clientExists: !!this.client,
            stompConnected: this.client?.connected,
            wsReadyState: this.client?.ws?.readyState,
            isFullyConnected
        });

        return isFullyConnected;
    }

    getConnectionStatus() {
        if (this.connected && this.client && this.client.connected) {
            return 'connected';
        } else if (this.connecting) {
            return 'connecting';
        } else {
            return 'disconnected';
        }
    }

    // Connect with stored token
    async connectWithStoredToken() {
        // 🆘 EMERGENCY MODE: Skip connection entirely
        if (EMERGENCY_MODE.enabled) {
            console.log('🆘 [EMERGENCY MODE] Skipping WebSocket connection entirely');
            this.connected = true; // Fake connected state
            this._notifyListeners('connectionStatus', 'connected');
            return Promise.resolve();
        }

        try {
            // Try multiple storage keys for token
            let token = await AsyncStorage.getItem('accessToken');

            if (!token) {
                token = await AsyncStorage.getItem('token');
            }

            if (!token) {
                token = await AsyncStorage.getItem('authToken');
            }

            if (!token) {
                console.error('❌ No authentication token found in storage');
                console.log('📋 Available storage keys:');

                // Debug: list all storage keys
                try {
                    const keys = await AsyncStorage.getAllKeys();
                    console.log('🔑 Storage keys:', keys);

                    // Try to find any key that might contain token
                    for (const key of keys) {
                        const value = await AsyncStorage.getItem(key);
                        if (value && typeof value === 'string' && value.includes('eyJ')) {
                            console.log(`🔍 Found potential token in key "${key}":`, value.substring(0, 50) + '...');
                            token = value;
                            break;
                        }
                    }
                } catch (debugError) {
                    console.error('❌ Error debugging storage:', debugError);
                }

                if (!token) {
                    throw new Error('No authentication token found');
                }
            }

            console.log('✅ Found token:', token ? token.substring(0, 50) + '...' : 'null');
            return await this.connect();
        } catch (error) {
            console.error('❌ Failed to connect with stored token:', error);
            throw error;
        }
    }

    // Disconnect
    disconnect() {
        console.log('🔌 Disconnecting WebSocket...');

        if (this.client && this.connected) {
            this.client.disconnect(() => {
                console.log('WebSocket disconnected');
            });
        }

        this.connected = false;
        this.connecting = false;
        this.client = null;
        this.currentUser = null;

        if (this.eventListeners) {
            this.eventListeners.clear();
        }

        this._notifyListeners('connectionStatus', 'disconnected');
    }

    // Helper method to wait for STOMP client to be truly ready
    async _waitForStompReady(maxWaitTime = 5000) {
        // 🆘 EMERGENCY MODE: Skip waiting
        if (EMERGENCY_MODE.enabled) {
            console.log('🆘 [EMERGENCY MODE] Skipping STOMP ready wait');
            return true;
        }

        const startTime = Date.now();

        while (Date.now() - startTime < maxWaitTime) {
            if (this.client &&
                this.client.connected &&
                this.client.ws &&
                this.client.ws.readyState === 1) { // WebSocket.OPEN = 1
                console.log('✅ STOMP client is ready for sending messages');
                return true;
            }

            console.log('⏳ Waiting for STOMP client to be ready...');
            await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
        }

        console.warn('⚠️ STOMP client readiness timeout');
        throw new Error('STOMP client not ready after waiting');
    }

    // === BACKWARD COMPATIBILITY METHODS ===
    onConnectionChange(key, callback) {
        return this.on('connectionStatus', callback);
    }

    offConnectionChange(key) {
        this.off('connectionStatus');
    }

    onMessage(key, callback) {
        return this.on('newMessage', callback);
    }

    offMessage(key) {
        this.off('newMessage');
    }

    onMessageHistory(key, callback) {
        return this.on('messageHistory', callback);
    }

    offMessageHistory(key) {
        this.off('messageHistory');
    }

    onConversations(key, callback) {
        return this.on('conversations', callback);
    }

    offConversations(key) {
        this.off('conversations');
    }

    onUnreadMessages(key, callback) {
        return this.on('unreadMessages', callback);
    }

    offUnreadMessages(key) {
        this.off('unreadMessages');
    }

    onTyping(key, callback) {
        return this.on('typing', callback);
    }

    offTyping(key) {
        this.off('typing');
    }

    onError(key, callback) {
        return this.on('error', callback);
    }

    offError(key) {
        this.off('error');
    }

    // Cleanup connection and reset state
    _cleanup() {
        console.log('🧹 Cleaning up WebSocket connection...');
        this.connected = false;
        this.connecting = false;
        if (this.client) {
            try {
                this.client.disconnect(() => {
                    console.log('✅ WebSocket disconnected during cleanup');
                });
            } catch (error) {
                console.error('Error during cleanup disconnect:', error);
            }
        }
        this.client = null;
        this.currentUser = null;
    }

    // Retry subscriptions if they failed
    async retrySubscriptions() {
        if (!this.isConnected()) {
            console.warn('⚠️ Cannot retry subscriptions - not connected');
            return false;
        }

        try {
            console.log('🔄 Retrying subscription setup...');
            await this._setupSubscriptions();
            return true;
        } catch (error) {
            console.error('❌ Subscription retry failed:', error);
            return false;
        }
    }

    // Subscribe to notifications
    _setupNotificationSubscription() {
        if (!this.connected || !this.client || !this.currentUser) {
            console.error('❌ Cannot subscribe to notifications, not connected or missing user info');
            return false;
        }

        try {
            console.log('🔔 Setting up notification subscription');
            
            // Unsubscribe from previous subscription if exists
            if (this.notificationSubscription) {
                this.notificationSubscription.unsubscribe();
            }
            
            // Subscribe to user-specific notification topic
            const notificationTopic = `/user/${this.currentUser.id}/queue/notifications`;
            
            this.notificationSubscription = this.client.subscribe(
                notificationTopic, 
                (message) => {
                    try {
                        console.log('📣 Received notification:', message.body);
                        const notification = JSON.parse(message.body);
                        
                        // Update local notification count
                        notificationService.incrementLocalUnreadCount();
                        
                        // Notify listeners
                        this._notifyListeners('notification', notification);
                    } catch (error) {
                        console.error('❌ Error handling notification:', error);
                    }
                },
                { id: `notification-${this.currentUser.id}` }
            );
            
            console.log('✅ Notification subscription setup complete');
            return true;
        } catch (error) {
            console.error('❌ Error subscribing to notifications:', error);
            return false;
        }
    }
    
    // Subscribe to notifications
    subscribeToNotifications(callback) {
        const callbackKey = `notification_${Date.now()}`;
        this.on('notification', callbackKey, callback);
        return () => this.off('notification', callbackKey);
    }
    
    // Helper functions for notification event listeners
    onNotification(key, callback) {
        return this.on('notification', key, callback);
    }
    
    offNotification(key) {
        return this.off('notification', key);
    }
}

export default new WebSocketService();
