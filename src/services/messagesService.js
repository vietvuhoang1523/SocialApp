// MessagesService.js - WebSocket Only - Không sử dụng REST API
import AsyncStorage from '@react-native-async-storage/async-storage';
import webSocketService from './WebSocketService';

class MessagesService {
    constructor() {
        this.eventListeners = new Map();
        this.cache = new Map();
        this.lastMessageId = null;
        this.wsTimeout = 20000; // Tăng timeout lên 20 giây để backend có thời gian xử lý
        this.callbacks = new Map();
        
        // Setup WebSocket listeners
        this._setupWebSocketListeners();

        // ✅ Enhanced caching system with persistence
        this._setupMessageCache();
    }

    _setupWebSocketListeners() {
        // 🚫 REMOVED: newMessage listener to prevent duplicates
        // This listener was causing duplicate message processing
        // All newMessage handling is now done in useChatWebSocket.js

        // Message history
        webSocketService.on('messageHistory', (data) => {
            console.log('📚 [MessagesService] Message history received');
            
            let messages = [];
            let pagination = null;

            if (data?.messages) {
                messages = data.messages;
                pagination = data.pagination;
            } else if (Array.isArray(data)) {
                messages = data;
            }

            const normalizedMessages = messages.map(msg => this.normalizeMessage(msg));
            normalizedMessages.forEach(message => this._cacheMessage(message));

            const result = pagination 
                ? { messages: normalizedMessages, pagination }
                : normalizedMessages;
                
            this._notifyCallbacks('messageHistory', result);
        });

        // Conversations
        webSocketService.on('conversations', (conversations) => {
            console.log('💬 [MessagesService] Conversations received:', conversations?.length || 0);
            this._notifyCallbacks('conversations', conversations);
        });

        // Other listeners...
        webSocketService.on('unreadMessages', (messages) => {
            const normalizedMessages = messages.map(msg => this.normalizeMessage(msg));
            this._notifyCallbacks('unreadMessages', normalizedMessages);
        });

        webSocketService.on('typing', (notification) => {
            this._notifyCallbacks('typing', notification);
        });

        webSocketService.on('error', (error) => {
            this._notifyCallbacks('error', error);
        });

        webSocketService.on('readSuccess', (data) => {
            this._notifyCallbacks('readSuccess', data);
        });

        webSocketService.on('unreadCount', (data) => {
            this._notifyCallbacks('unreadCount', data);
        });

        console.log('✅ [MessagesService] All WebSocket listeners setup complete');
    }

    // Get messages between users with improved WebSocket handling
    async getMessagesBetweenUsers(user1Id, user2Id) {
        try {
            console.log(`📥 Loading messages between ${user1Id} and ${user2Id}`);
            
            // Try WebSocket first if connected
            if (webSocketService.isConnected()) {
                try {
                    console.log('🔌 Using WebSocket for message history...');
                    
                    // Send WebSocket request
                    await webSocketService.getMessagesBetweenUsers(user1Id, user2Id);
                    
                    // Wait for WebSocket response
                    return new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            console.warn('⚠️ WebSocket timeout, falling back to REST API');
                            this._getMessagesViaREST(user1Id, user2Id).then(resolve).catch(reject);
                        }, this.wsTimeout);

                        // Listen for WebSocket response
                        const handleResponse = (data) => {
                            clearTimeout(timeout);
                            webSocketService.off('messageHistory', handleResponse);
                            
                            // Handle both array and paginated response
                            if (data && data.messages) {
                                resolve(data.messages); // Return just messages for backward compatibility
                            } else if (Array.isArray(data)) {
                                resolve(data);
                            } else {
                                console.warn('Unexpected response format, falling back to REST');
                                this._getMessagesViaREST(user1Id, user2Id).then(resolve).catch(reject);
                            }
                        };

                        webSocketService.on('messageHistory', handleResponse);
                    });

                } catch (wsError) {
                    console.warn('⚠️ WebSocket request failed:', wsError.message);
                    // Fall through to REST API
                }
            }

            // Fallback to REST API
            return await this._getMessagesViaREST(user1Id, user2Id);

        } catch (error) {
            console.error('❌ Error getting messages:', error);
            throw new Error('Failed to load messages');
        }
    }

    // Private method to get messages via REST API
    async _getMessagesViaREST(user1Id, user2Id) {
        console.log('❌ REST API not supported by backend - messages only available via WebSocket');
        throw new Error('Backend only supports WebSocket for messages. Please ensure WebSocket connection is established.');
    }

    // Send message with WebSocket - WebSocket only
    async sendMessage(messageData) {
        try {
            console.log('📤 [MessagesService] Sending message:', messageData);

            // Validate message data
            if (!messageData.receiverId) {
                throw new Error('Receiver ID is required');
            }

            if (!messageData.content && !messageData.attachmentUrl) {
                throw new Error('Message content or attachment is required');
            }

            // ⚡ FIX: Better WebSocket connection checking
            const isConnected = webSocketService.isConnected();
            console.log('🔍 [MessagesService] WebSocket connection status:', {
                isConnected,
                serviceStatus: webSocketService.getConnectionStatus()
            });
            
            if (!isConnected) {
                // ⚡ FIX: Try to reconnect once before failing
                console.log('🔄 [MessagesService] WebSocket not connected, attempting reconnection...');
                try {
                    await webSocketService.connectWithStoredToken();
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for connection to stabilize
                    
                    if (!webSocketService.isConnected()) {
                        throw new Error('Reconnection failed - WebSocket still not connected');
                    }
                    console.log('✅ [MessagesService] Reconnection successful');
                } catch (reconnectError) {
                    console.error('❌ [MessagesService] Reconnection failed:', reconnectError);
                    throw new Error('WebSocket not connected and reconnection failed. Backend only supports WebSocket for sending messages.');
                }
            }

            console.log('🔌 [MessagesService] Sending message via WebSocket...');
            
            // ⚡ FIX: Add timeout wrapper for WebSocket send
            const sendPromise = webSocketService.sendMessage(messageData);
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('WebSocket send timeout')), 15000);
            });
            
            await Promise.race([sendPromise, timeoutPromise]);
            
            console.log('✅ [MessagesService] Message sent successfully via WebSocket');
            return { success: true, method: 'websocket' };

        } catch (error) {
            console.error('❌ [MessagesService] Error sending message:', error);
            
            // ⚡ FIX: Provide more specific error information
            const errorDetails = {
                message: error.message,
                isConnected: webSocketService.isConnected(),
                serviceStatus: webSocketService.getConnectionStatus()
            };
            console.error('❌ [MessagesService] Error details:', errorDetails);
            
            throw new Error(`Failed to send message via WebSocket: ${error.message}`);
        }
    }

    // Get conversations with WebSocket - WebSocket only
    async getConversations() {
        try {
            console.log('📥 Loading conversations');
            console.log('🔍 Connection status check:', webSocketService.getConnectionStatus());

            // ✅ FIX: Allow connections in "connecting" state and retry if needed
            const connectionStatus = webSocketService.getConnectionStatus();
            
            if (connectionStatus === 'disconnected') {
                console.log('🔄 WebSocket disconnected, attempting to connect...');
                try {
                    await webSocketService.connectWithStoredToken();
                    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for connection to stabilize
                } catch (connectError) {
                    console.error('❌ Failed to connect WebSocket:', connectError);
                    throw new Error('WebSocket not connected. Backend only supports WebSocket for conversations.');
                }
            }

            // ✅ Try to get conversations regardless of exact connection state
            try {
                console.log('📤 Requesting conversations from service...');
                await webSocketService.getConversations();
                
                return new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        console.error('⚠️ WebSocket timeout for conversations');
                        reject(new Error('WebSocket timeout - conversations not received'));
                    }, this.wsTimeout);

                    const handleResponse = (response) => {
                        clearTimeout(timeout);
                        webSocketService.off('conversations', handleResponse);
                        console.log('🔍 Raw conversations response:', response);
                        let conversationsData = [];
                        
                        // Handle different response formats from backend
                        if (response && response.conversations && Array.isArray(response.conversations)) {
                            // Backend returns: { conversations: [...], count: X, status: "success" }
                            conversationsData = response.conversations;
                            console.log(`📊 Found ${response.count || conversationsData.length} conversations in response`);
                        } else if (Array.isArray(response)) {
                            // Backend returns: [conversation1, conversation2, ...]
                            conversationsData = response;
                            console.log(`📊 Found ${conversationsData.length} conversations as array`);
                        } else if (response && response.data && Array.isArray(response.data)) {
                            // Another possible format
                            conversationsData = response.data;
                            console.log(`📊 Found ${conversationsData.length} conversations in data field`);
                        } else {
                            console.log('⚠️ Unexpected response format:', typeof response, response);
                            conversationsData = [];
                        }
                        
                        resolve(conversationsData);
                    };
                    
                    webSocketService.on('conversations', handleResponse);
                });
                
            } catch (wsError) {
                console.error('❌ WebSocket request failed for conversations:', wsError.message);
                throw wsError;
            }
            
        } catch (error) {
            console.error('❌ Error getting conversations:', error);
            throw new Error('Failed to load conversations');
        }
    }

    // Get unread messages with WebSocket - WebSocket only
    async getUnreadMessages() {
        try {
            console.log('📥 Loading unread messages');

            if (webSocketService.isConnected()) {
                await webSocketService.getUnreadMessages();
                return true; // Request sent, results will come via listener
            } else {
                throw new Error('WebSocket not connected. Backend only supports WebSocket for unread messages.');
            }

        } catch (error) {
            console.error('❌ Error getting unread messages:', error);
            throw new Error('Failed to load unread messages');
        }
    }

    // Mark message as read with WebSocket - WebSocket only
    async markMessageAsRead(messageId) {
        try {
            console.log(`📖 Marking message ${messageId} as read`);

            if (webSocketService.isConnected()) {
                await webSocketService.markMessageAsRead(messageId);
                return { success: true, method: 'websocket' };
            } else {
                throw new Error('WebSocket not connected. Backend only supports WebSocket for mark as read.');
            }

        } catch (error) {
            console.error('❌ Error marking message as read:', error);
            throw new Error('Failed to mark message as read');
        }
    }

    // Mark all messages as read between two users - WebSocket only
    async markAllMessagesAsRead(senderId, receiverId) {
        try {
            console.log(`📖 Marking all messages as read between ${senderId} and ${receiverId}`);

            // ✅ Only use WebSocket - backend doesn't support REST API for this
            if (webSocketService.isConnected()) {
                try {
                    // ✅ Use WebSocket method - backend supports /app/mark-all-read
                    await webSocketService.markAllMessagesAsRead(senderId, receiverId);
                    console.log('✅ WebSocket markAllMessagesAsRead successful');
                    return { success: true, method: 'websocket' };
                } catch (wsError) {
                    console.error('❌ WebSocket markAllMessagesAsRead failed:', wsError);
                    throw wsError;
                }
            } else {
                // ✅ No fallback to REST API - backend only supports WebSocket
                throw new Error('WebSocket not connected and backend only supports WebSocket for mark-all-read');
            }

        } catch (error) {
            console.error('❌ Error marking all messages as read:', error);
            // Don't throw error for this non-critical operation
            return { success: false, error: error.message };
        }
    }

    // Send typing notification with WebSocket
    async sendTypingNotification(receiverId, isTyping = true) {
        try {
            if (webSocketService.isConnected()) {
                return await webSocketService.sendTyping(receiverId, isTyping);
            }
            
            console.warn('🔌 WebSocket not connected, cannot send typing notification');
            return false;
        } catch (error) {
            console.error('❌ Error sending typing notification:', error);
            return false;
        }
    }

    // Normalize message format to ensure consistency with backend ChatMessageResponse
    normalizeMessage(message) {
        if (!message) return null;

        return {
            id: message.id,
            content: message.content,
            senderId: message.senderId,
            receiverId: message.receiverId,
            timestamp: message.timestamp,
            attachmentUrl: message.attachmentUrl,
            attachmentType: message.attachmentType,
            isRead: message.read || message.isRead || false, // Backend uses 'read' field
            isDelivered: message.isDelivered || false,
            messageType: message.messageType || 'TEXT',
            senderName: message.senderName,
            senderAvatar: message.senderAvatar,
            deletedForAll: message.deletedForAll || false
        };
    }

    // ✅ Enhanced caching system with persistence
    _setupMessageCache() {
        // Memory cache for recent messages
        this.messageCache = new Map();
        this.conversationCache = new Map();
        
        // LocalStorage persistence key
        this.CACHE_KEY_PREFIX = 'socialapp_messages_';
        this.CONVERSATION_CACHE_KEY = 'socialapp_conversations';
        
        // Cache expiry time (30 minutes)
        this.CACHE_EXPIRY = 30 * 60 * 1000;
    }

    _cacheMessage(message) {
        if (!message || !message.id) return;
        
        const normalizedMessage = this.normalizeMessage(message);
        this.messageCache.set(message.id, {
            message: normalizedMessage,
            timestamp: Date.now()
        });
        
        // Also persist to AsyncStorage for reload persistence
        this._persistMessageToLocalStorage(normalizedMessage).catch(err => {
            console.warn('⚠️ Failed to persist message:', err);
        });
    }

    _getCachedMessage(messageId) {
        const cached = this.messageCache.get(messageId);
        if (cached && (Date.now() - cached.timestamp) < this.CACHE_EXPIRY) {
            return cached.message;
        }
        return null;
    }

    async _persistMessageToLocalStorage(message) {
        try {
            // Create conversation key based on participants
            const conversationKey = this._getConversationKey(message.senderId, message.receiverId);
            const cacheKey = `${this.CACHE_KEY_PREFIX}${conversationKey}`;
            
            // Get existing messages from AsyncStorage
            let existingMessages = [];
            const cached = await AsyncStorage.getItem(cacheKey);
            if (cached) {
                const parsedCache = JSON.parse(cached);
                if (parsedCache.timestamp && (Date.now() - parsedCache.timestamp) < this.CACHE_EXPIRY) {
                    existingMessages = parsedCache.messages || [];
                }
            }
            
            // Add new message if not already exists
            const messageExists = existingMessages.some(msg => msg.id === message.id);
            if (!messageExists) {
                existingMessages.unshift(message); // Add to beginning (newest first)
                
                // Keep only last 100 messages per conversation
                if (existingMessages.length > 100) {
                    existingMessages = existingMessages.slice(0, 100);
                }
                
                // Save to AsyncStorage
                await AsyncStorage.setItem(cacheKey, JSON.stringify({
                    messages: existingMessages,
                    timestamp: Date.now()
                }));
            }
        } catch (error) {
            console.warn('⚠️ Failed to persist message to AsyncStorage:', error);
        }
    }

    _getConversationKey(user1Id, user2Id) {
        // Create consistent key regardless of order
        const ids = [parseInt(user1Id), parseInt(user2Id)].sort((a, b) => a - b);
        return `${ids[0]}_${ids[1]}`;
    }

    async _loadMessagesFromLocalStorage(user1Id, user2Id) {
        try {
            const conversationKey = this._getConversationKey(user1Id, user2Id);
            const cacheKey = `${this.CACHE_KEY_PREFIX}${conversationKey}`;
            
            const cached = await AsyncStorage.getItem(cacheKey);
            if (cached) {
                const parsedCache = JSON.parse(cached);
                if (parsedCache.timestamp && (Date.now() - parsedCache.timestamp) < this.CACHE_EXPIRY) {
                    console.log(`✅ Loaded ${parsedCache.messages.length} messages from AsyncStorage cache`);
                    return parsedCache.messages || [];
                }
            }
        } catch (error) {
            console.warn('⚠️ Failed to load messages from AsyncStorage:', error);
        }
        return [];
    }

    // Subscribe to events
    on(event, callback) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, new Set());
        }
        this.callbacks.get(event).add(callback);
    }

    // Unsubscribe from events
    off(event, callback) {
        if (this.callbacks.has(event)) {
            this.callbacks.get(event).delete(callback);
        }
    }

    // Notify callbacks
    _notifyCallbacks(event, data) {
        if (this.callbacks.has(event)) {
            this.callbacks.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in callback for ${event}:`, error);
                }
            });
        }
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }

    // Get cached message
    getCachedMessage(messageId) {
        return this.cache.get(messageId);
    }

    // Get connection status
    getConnectionStatus() {
        return webSocketService.getConnectionStatus();
    }

    // Connect WebSocket
    async connectWebSocket() {
        try {
            return await webSocketService.connectWithStoredToken();
        } catch (error) {
            console.error('❌ Failed to connect WebSocket:', error);
            throw error;
        }
    }

    // Disconnect WebSocket
    disconnectWebSocket() {
        webSocketService.disconnect();
    }

    // ✅ Get messages with pagination support - WebSocket with localStorage fallback
    async getMessagesBetweenUsersPaginated(user1Id, user2Id, options = {}) {
        try {
            const {
                page = 0,
                size = 20,
                sortBy = 'timestamp',
                order = 'desc'
            } = options;

            console.log(`📥 Loading paginated messages between ${user1Id} and ${user2Id}`, {
                page, size, sortBy, order
            });

            // ✅ FIX: Try localStorage first for immediate response on page 0
            if (page === 0) {
                const cachedMessages = this._loadMessagesFromLocalStorage(user1Id, user2Id);
                if (cachedMessages.length > 0) {
                    console.log(`💾 Using cached messages (${cachedMessages.length}) while fetching latest from server`);
                    
                    // Return cached messages immediately
                    const paginatedCached = cachedMessages.slice(0, size);
                    
                    // Fetch fresh data in background
                    this._fetchFreshMessages(user1Id, user2Id, options).catch(err => {
                        console.warn('⚠️ Background fetch failed:', err);
                    });
                    
                    return {
                        messages: paginatedCached,
                        pagination: {
                            currentPage: 0,
                            totalPages: Math.ceil(cachedMessages.length / size),
                            totalElements: cachedMessages.length,
                            size: paginatedCached.length,
                            hasNext: cachedMessages.length > size,
                            hasPrevious: false,
                            first: true,
                            last: cachedMessages.length <= size
                        },
                        method: 'cache',
                        cached: true
                    };
                }
            }
            
            // ✅ Use WebSocket for fresh data
            return await this._fetchFreshMessages(user1Id, user2Id, options);

        } catch (error) {
            console.error('❌ Error getting paginated messages:', error);
            
            // ✅ Final fallback to localStorage if everything fails
            const fallbackMessages = this._loadMessagesFromLocalStorage(user1Id, user2Id);
            if (fallbackMessages.length > 0) {
                console.log('🆘 Using localStorage fallback due to error');
                const paginatedFallback = fallbackMessages.slice(page * size, (page + 1) * size);
                
                return {
                    messages: paginatedFallback,
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(fallbackMessages.length / size),
                        totalElements: fallbackMessages.length,
                        size: paginatedFallback.length,
                        hasNext: (page + 1) * size < fallbackMessages.length,
                        hasPrevious: page > 0,
                        first: page === 0,
                        last: (page + 1) * size >= fallbackMessages.length
                    },
                    method: 'fallback',
                    cached: true
                };
            }
            
            throw new Error('Failed to load paginated messages');
        }
    }

    // ✅ Helper method to fetch fresh messages from WebSocket
    async _fetchFreshMessages(user1Id, user2Id, options = {}) {
        const {
            page = 0,
            size = 20,
            sortBy = 'timestamp',
            order = 'desc'
        } = options;

        if (webSocketService.isConnected()) {
            try {
                console.log('🔌 Using WebSocket for paginated message history...');
                
                // ✅ Send WebSocket request with pagination options
                await webSocketService.getMessagesBetweenUsers(user1Id, user2Id, {
                    enablePagination: true,
                    page,
                    size,
                    sortBy,
                    order
                });
                
                // Wait for WebSocket response
                return new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        console.error('⚠️ WebSocket timeout for paginated messages');
                        reject(new Error('WebSocket timeout - paginated messages not received'));
                    }, this.wsTimeout);

                    // Listen for WebSocket response
                    const handleResponse = (data) => {
                        clearTimeout(timeout);
                        webSocketService.off('messageHistory', handleResponse);
                        
                        // Handle paginated response
                        if (data && data.messages && data.pagination) {
                            const normalizedMessages = data.messages.map(msg => this.normalizeMessage(msg));
                            
                            // ✅ Cache the fresh messages
                            normalizedMessages.forEach(msg => this._cacheMessage(msg));
                            
                            resolve({
                                messages: normalizedMessages,
                                pagination: data.pagination,
                                method: 'websocket'
                            });
                        } else if (Array.isArray(data)) {
                            // Fallback for non-paginated response
                            const normalizedMessages = data.map(msg => this.normalizeMessage(msg));
                            
                            // ✅ Cache the fresh messages
                            normalizedMessages.forEach(msg => this._cacheMessage(msg));
                            
                            resolve({
                                messages: normalizedMessages,
                                pagination: {
                                    currentPage: 0,
                                    totalPages: 1,
                                    totalElements: normalizedMessages.length,
                                    size: normalizedMessages.length,
                                    hasNext: false,
                                    hasPrevious: false,
                                    first: true,
                                    last: true
                                },
                                method: 'websocket'
                            });
                        } else {
                            reject(new Error('Unexpected WebSocket response format'));
                        }
                    };

                    webSocketService.on('messageHistory', handleResponse);
                });

            } catch (wsError) {
                console.error('❌ WebSocket request failed for paginated messages:', wsError.message);
                throw wsError;
            }
        } else {
            throw new Error('WebSocket not connected. Backend only supports WebSocket for messages.');
        }
    }

    // ✅ UTILITY METHODS for pagination and WebSocket-only operations

    // Create pagination parameters
    createPaginationParams(page = 0, size = 20, sortBy = 'timestamp', order = 'desc') {
        return {
            page: Math.max(0, page),
            size: Math.max(1, Math.min(100, size)), // Limit between 1-100
            sortBy,
            order
        };
    }

    // Load first page of messages
    async loadFirstPage(user1Id, user2Id, size = 20) {
        const options = this.createPaginationParams(0, size);
        return await this.getMessagesBetweenUsersPaginated(user1Id, user2Id, options);
    }

    // Load next page of messages
    async loadNextPage(user1Id, user2Id, currentPage = 0, size = 20) {
        const options = this.createPaginationParams(currentPage + 1, size);
        return await this.getMessagesBetweenUsersPaginated(user1Id, user2Id, options);
    }

    // Load previous page of messages
    async loadPreviousPage(user1Id, user2Id, currentPage = 1, size = 20) {
        const options = this.createPaginationParams(Math.max(0, currentPage - 1), size);
        return await this.getMessagesBetweenUsersPaginated(user1Id, user2Id, options);
    }

    // Check if WebSocket is ready for messaging
    isWebSocketReady() {
        return webSocketService.isConnected();
    }

    // Wait for WebSocket connection
    async waitForWebSocketConnection(timeout = 10000) {
        return new Promise((resolve, reject) => {
            if (this.isWebSocketReady()) {
                resolve(true);
                return;
            }

            const timeoutId = setTimeout(() => {
                reject(new Error('WebSocket connection timeout'));
            }, timeout);

            const checkConnection = () => {
                if (this.isWebSocketReady()) {
                    clearTimeout(timeoutId);
                    resolve(true);
                } else {
                    setTimeout(checkConnection, 100);
                }
            };

            checkConnection();
        });
    }

    // Force WebSocket reconnection
    async forceReconnectWebSocket() {
        try {
            console.log('🔄 Force reconnecting WebSocket...');
            webSocketService.disconnect();
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            return await webSocketService.connectWithStoredToken();
        } catch (error) {
            console.error('❌ Force reconnection failed:', error);
            throw error;
        }
    }

    async sendGetMessages(user1Id, user2Id, page = 0, size = 20, order = 'desc', sortBy = ['timestamp']) {
        return new Promise((resolve, reject) => {
            if (!webSocketService.isConnected()) {
                reject(new Error('WebSocket not connected'));
                return;
            }

            // Lắng nghe response
            const handleResponse = (data) => {
                webSocketService.off('messageHistory', handleResponse);
                resolve(data);
            };
            webSocketService.on('messageHistory', handleResponse);

            // Gửi request
            webSocketService.sendGetMessages(user1Id, user2Id, page, size, order, sortBy);

            // Timeout nếu không có phản hồi
            setTimeout(() => {
                webSocketService.off('messageHistory', handleResponse);
                reject(new Error('Timeout waiting for message history'));
            }, 15000);
        });
    }
}

export default new MessagesService();

