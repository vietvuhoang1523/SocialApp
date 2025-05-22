// WebSocketService.js - Updated để sử dụng WS_BASE_URL
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { WS_BASE_URL, WS_CONFIG } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class WebSocketService {
    constructor() {
        this.client = null;
        this.connected = false;
        this.messageCallbacks = new Map();
        this.typingCallbacks = new Map();
        this.receiptCallbacks = new Map();
        this.errorCallbacks = new Set();
        this.connectionCallbacks = new Set();
        this.subscriptions = {};
        this.currentUserId = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    // Kết nối đến server WebSocket
    async connect() {
        if (this.client && this.client.connected) {
            console.log('WebSocket đã kết nối');
            return Promise.resolve();
        }

        try {
            const token = await AsyncStorage.getItem('accessToken');
            if (!token) {
                throw new Error('Không có token để kết nối WebSocket');
            }

            // Lấy thông tin user hiện tại
            const userData = await AsyncStorage.getItem('userData');
            const currentUser = userData ? JSON.parse(userData) : null;
            this.currentUserId = currentUser?.id;

            if (!this.currentUserId) {
                throw new Error('Không có thông tin user để kết nối WebSocket');
            }

            // Đóng kết nối cũ nếu có
            if (this.client) {
                this.disconnect();
            }

            console.log('Connecting to WebSocket at:', WS_CONFIG.ENDPOINT);

            // Tạo socket connection
            const socket = new SockJS(WS_CONFIG.ENDPOINT);

            // Tạo client STOMP với các tùy chọn
            this.client = new Client({
                webSocketFactory: () => socket,
                connectHeaders: {
                    Authorization: `Bearer ${token}`
                },
                debug: function (str) {
                    console.log('STOMP: ' + str);
                },
                reconnectDelay: WS_CONFIG.RECONNECT_DELAY,
                heartbeatIncoming: WS_CONFIG.HEARTBEAT_INCOMING,
                heartbeatOutgoing: WS_CONFIG.HEARTBEAT_OUTGOING
            });

            // Promise để theo dõi trạng thái kết nối
            return new Promise((resolve, reject) => {
                // Xử lý khi kết nối thành công
                this.client.onConnect = (frame) => {
                    console.log('Connected to WebSocket. Frame:', frame);
                    this.connected = true;
                    this.reconnectAttempts = 0;

                    // Đăng ký nhận tin nhắn sau khi kết nối thành công
                    this.subscribeToPersonalMessages();

                    // Thông báo cho các callbacks về kết nối thành công
                    this.connectionCallbacks.forEach(callback => callback(true));

                    resolve();
                };

                // Xử lý lỗi STOMP
                this.client.onStompError = (frame) => {
                    console.error('STOMP Error. Frame:', frame);
                    this.connected = false;
                    this.errorCallbacks.forEach(callback => callback(frame));
                    reject(new Error(`STOMP Error: ${frame.headers.message || 'Unknown error'}`));
                };

                // Xử lý ngắt kết nối WebSocket
                this.client.onWebSocketClose = (event) => {
                    console.log('WebSocket connection closed. Event:', event);
                    this.connected = false;
                    this.connectionCallbacks.forEach(callback => callback(false));

                    // Tự động kết nối lại nếu chưa vượt quá số lần thử
                    if (this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.reconnectAttempts++;
                        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

                        setTimeout(() => {
                            this.connect().catch(error => {
                                console.error('Reconnection failed:', error);
                            });
                        }, WS_CONFIG.RECONNECT_DELAY);
                    }
                };

                // Xử lý lỗi WebSocket
                this.client.onWebSocketError = (event) => {
                    console.error('WebSocket error. Event:', event);
                    reject(new Error('WebSocket connection failed'));
                };

                // Activate kết nối
                this.client.activate();
                console.log('WebSocket client activated');
            });
        } catch (error) {
            console.error('WebSocket connection error:', error);
            this.connected = false;
            this.errorCallbacks.forEach(callback => callback(error));
            throw error;
        }
    }

    // Ngắt kết nối WebSocket
    disconnect() {
        if (this.client) {
            // Hủy tất cả subscription trước
            this.unsubscribeAll();

            // Deactivate client
            this.client.deactivate();
            console.log('WebSocket đã ngắt kết nối');
            this.connected = false;

            // Thông báo cho callbacks
            this.connectionCallbacks.forEach(callback => callback(false));
        }
    }

    // Hủy tất cả các subscription
    unsubscribeAll() {
        Object.values(this.subscriptions).forEach(subscription => {
            if (subscription && subscription.unsubscribe) {
                try {
                    subscription.unsubscribe();
                    console.log('Unsubscribed from:', subscription.id);
                } catch (e) {
                    console.error('Error unsubscribing:', e);
                }
            }
        });

        this.subscriptions = {};
    }

    // Đăng ký nhận tin nhắn cá nhân
    async subscribeToPersonalMessages() {
        try {
            if (!this.client || !this.client.connected) {
                console.warn('WebSocket chưa kết nối, không thể subscribe');
                return;
            }

            if (!this.currentUserId) {
                console.warn('Không có userId, không thể subscribe');
                return;
            }

            const userId = this.currentUserId;
            console.log('Subscribing to messages for user ID:', userId);

            try {
                // Subscribe nhận tin nhắn
                this.subscriptions.messages = this.client.subscribe(
                    `/user/${userId}/queue/messages`,
                    (message) => {
                        try {
                            const receivedMessage = JSON.parse(message.body);
                            console.log('Received message via WebSocket:', receivedMessage);

                            // Gọi tất cả callbacks đã đăng ký
                            this.messageCallbacks.forEach((callback) => {
                                callback(receivedMessage);
                            });
                        } catch (error) {
                            console.error('Error parsing message:', error);
                        }
                    }
                );
                console.log('Subscribed to messages with ID:', this.subscriptions.messages.id);

                // Subscribe nhận thông báo typing
                this.subscriptions.typing = this.client.subscribe(
                    `/user/${userId}/queue/typing`,
                    (message) => {
                        try {
                            const typingData = JSON.parse(message.body);
                            console.log('Typing notification:', typingData);
                            this.typingCallbacks.forEach((callback) => {
                                callback(typingData);
                            });
                        } catch (error) {
                            console.error('Error parsing typing notification:', error);
                        }
                    }
                );

                // Subscribe nhận read receipts
                this.subscriptions.receipts = this.client.subscribe(
                    `/user/${userId}/queue/receipts`,
                    (message) => {
                        try {
                            const receipt = JSON.parse(message.body);
                            console.log('Read receipt:', receipt);
                            this.receiptCallbacks.forEach((callback) => {
                                callback(receipt);
                            });
                        } catch (error) {
                            console.error('Error parsing read receipt:', error);
                        }
                    }
                );

                // Subscribe nhận thông báo lỗi
                this.subscriptions.errors = this.client.subscribe(
                    `/user/${userId}/queue/errors`,
                    (message) => {
                        try {
                            const error = JSON.parse(message.body);
                            console.error('WebSocket error message:', error);
                            this.errorCallbacks.forEach(callback => {
                                callback(error);
                            });
                        } catch (error) {
                            console.error('Error parsing error message:', error);
                        }
                    }
                );

                // Subscribe nhận thông báo trạng thái người dùng
                this.subscriptions.userStatus = this.client.subscribe(
                    '/topic/user-status',
                    (message) => {
                        try {
                            const statusData = JSON.parse(message.body);
                            console.log('User status update:', statusData);
                        } catch (error) {
                            console.error('Error parsing user status:', error);
                        }
                    }
                );

                console.log('Successfully subscribed to all topics');
            } catch (subError) {
                console.error('Error during subscription process:', subError);
            }
        } catch (error) {
            console.error('Error in subscribeToPersonalMessages:', error);
        }
    }

    // Gửi tin nhắn qua WebSocket
    sendMessage(message) {
        if (!this.client || !this.client.connected) {
            console.warn('WebSocket chưa kết nối, thử kết nối lại...');
            return false;
        }

        try {
            console.log('Sending message via WebSocket:', message);

            // Đảm bảo payload có đủ thông tin cần thiết
            const payload = {
                content: message.content || '',
                receiverId: message.receiverId,
                attachmentUrl: message.attachmentUrl || null
            };

            // Gửi tin nhắn tới endpoint `/app/send`
            this.client.publish({
                destination: '/app/send',
                body: JSON.stringify(payload),
                headers: { 'content-type': 'application/json' }
            });

            console.log('Message sent successfully via WebSocket');
            return true;
        } catch (error) {
            console.error('Error sending message via WebSocket:', error);
            return false;
        }
    }

    // Hàm nội bộ để gửi tin nhắn
    sendMessageInternal(message) {
        try {
            if (!this.client || !this.client.connected) {
                console.error('Không thể gửi tin nhắn: WebSocket không kết nối');
                return false;
            }

            console.log('Sending message via WebSocket:', message);

            this.client.publish({
                destination: '/app/send',
                body: JSON.stringify(message),
                headers: { 'content-type': 'application/json' }
            });

            console.log('Message sent successfully');
            return true;
        } catch (error) {
            console.error('Error sending message via WebSocket:', error);
            return false;
        }
    }

    // Gửi thông báo đang nhập tin nhắn
    sendTyping(receiverId, isTyping = true) {
        if (!this.client || !this.client.connected) {
            return false;
        }

        try {
            const notification = {
                receiverId: receiverId,
                typing: isTyping
            };

            this.client.publish({
                destination: '/app/typing',
                body: JSON.stringify(notification),
                headers: { 'content-type': 'application/json' }
            });
            return true;
        } catch (error) {
            console.error('Error sending typing notification:', error);
            return false;
        }
    }

    // Gửi xác nhận đã đọc tin nhắn
    sendReadReceipt(messageId, senderId) {
        if (!this.client || !this.client.connected) {
            return false;
        }

        try {
            const receipt = {
                messageId: messageId,
                senderId: senderId
            };

            this.client.publish({
                destination: '/app/mark-read',
                body: JSON.stringify(receipt),
                headers: { 'content-type': 'application/json' }
            });
            return true;
        } catch (error) {
            console.error('Error sending read receipt:', error);
            return false;
        }
    }

    // Đăng ký callback khi nhận tin nhắn mới
    onMessage(key, callback) {
        this.messageCallbacks.set(key, callback);
        console.log(`Registered message callback for key: ${key}`);
    }

    // Đăng ký callback khi có thông báo đang nhập
    onTyping(key, callback) {
        this.typingCallbacks.set(key, callback);
    }

    // Đăng ký callback khi có xác nhận đã đọc
    onReadReceipt(key, callback) {
        this.receiptCallbacks.set(key, callback);
    }

    // Đăng ký callback khi có lỗi
    onError(callback) {
        this.errorCallbacks.add(callback);
    }

    // Đăng ký callback khi trạng thái kết nối thay đổi
    onConnectionChange(callback) {
        this.connectionCallbacks.add(callback);
        // Gọi callback ngay với trạng thái hiện tại
        if (callback && this.client) {
            callback(this.client.connected);
        }
    }

    // Hủy đăng ký callback khi nhận tin nhắn mới
    offMessage(key) {
        this.messageCallbacks.delete(key);
        console.log(`Unregistered message callback for key: ${key}`);
    }

    // Hủy đăng ký callback khi có thông báo đang nhập
    offTyping(key) {
        this.typingCallbacks.delete(key);
    }

    // Hủy đăng ký callback khi có xác nhận đã đọc
    offReadReceipt(key) {
        this.receiptCallbacks.delete(key);
    }

    // Hủy đăng ký callback khi có lỗi
    offError(callback) {
        this.errorCallbacks.delete(callback);
    }

    // Hủy đăng ký callback khi trạng thái kết nối thay đổi
    offConnectionChange(callback) {
        this.connectionCallbacks.delete(callback);
    }

    // Kiểm tra trạng thái kết nối
    isConnected() {
        return this.client && this.client.connected;
    }

    // Phương thức để giúp debug trạng thái kết nối
    getConnectionStatus() {
        if (!this.client) {
            return { status: 'INACTIVE', details: 'Client chưa được khởi tạo' };
        }

        return {
            status: this.client.connected ? 'CONNECTED' : 'DISCONNECTED',
            details: {
                connected: this.client.connected,
                currentUserId: this.currentUserId,
                reconnectAttempts: this.reconnectAttempts,
                maxReconnectAttempts: this.maxReconnectAttempts,
                subscriptions: Object.keys(this.subscriptions),
                callbacksCount: {
                    messages: this.messageCallbacks.size,
                    typing: this.typingCallbacks.size,
                    receipts: this.receiptCallbacks.size,
                    errors: this.errorCallbacks.size,
                    connections: this.connectionCallbacks.size
                }
            }
        };
    }

    // Force reconnect
    async forceReconnect() {
        console.log('Force reconnecting WebSocket...');
        this.disconnect();
        this.reconnectAttempts = 0;
        return this.connect();
    }
}

// Tạo và export instance singleton
const webSocketService = new WebSocketService();
export default webSocketService;