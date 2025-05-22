// WebSocketService.js
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BASE_URL } from './api';
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
    }

    // Kết nối đến server WebSocket
    async connect() {
        if (this.client && this.client.connected) {
            console.log('WebSocket đã kết nối');
            return;
        }

        try {
            const token = await AsyncStorage.getItem('accessToken');
            if (!token) {
                throw new Error('Không có token để kết nối WebSocket');
            }

            // Đóng kết nối cũ nếu có
            if (this.client) {
                this.disconnect();
            }

            // Loại bỏ '/api' từ BASE_URL nếu có
            const baseUrlWithoutApi = BASE_URL.includes('/api')
                ? BASE_URL.substring(0, BASE_URL.indexOf('/api'))
                : BASE_URL;

            console.log('Connecting to WebSocket at:', `${baseUrlWithoutApi}/ws`);

            // Lưu token để sử dụng trong connectHeaders
            const authToken = token;

            // Tạo socket connection
            const socket = new SockJS(`${baseUrlWithoutApi}/ws`);

            // Tạo client STOMP với các tùy chọn
            this.client = new Client({
                webSocketFactory: () => socket,
                // QUAN TRỌNG: Đặt token vào connectHeaders đúng định dạng
                connectHeaders: {
                    Authorization: `Bearer ${authToken}`
                },
                debug: function (str) {
                    console.log('STOMP: ' + str);
                },
                reconnectDelay: 5000,
                heartbeatIncoming: 10000,
                heartbeatOutgoing: 10000
            });

            // Xử lý khi kết nối thành công
            this.client.onConnect = (frame) => {
                console.log('Connected to WebSocket. Frame:', frame);
                this.connected = true;

                // Đăng ký nhận tin nhắn sau khi kết nối thành công
                this.subscribeToPersonalMessages();

                // Thông báo cho các callbacks về kết nối thành công
                this.connectionCallbacks.forEach(callback => callback(true));
            };

            // Xử lý lỗi STOMP
            this.client.onStompError = (frame) => {
                console.error('STOMP Error. Frame:', frame);
                this.connected = false;
                this.errorCallbacks.forEach(callback => callback(frame));
            };

            // Xử lý ngắt kết nối WebSocket
            this.client.onWebSocketClose = (event) => {
                console.log('WebSocket connection closed. Event:', event);
                this.connected = false;
                this.connectionCallbacks.forEach(callback => callback(false));
            };

            // Thêm xử lý lỗi WebSocket
            this.client.onWebSocketError = (event) => {
                console.error('WebSocket error. Event:', event);
            };

            // Activate kết nối
            this.client.activate();
            console.log('WebSocket client activated');
        } catch (error) {
            console.error('WebSocket connection error:', error);
            this.connected = false;
            this.errorCallbacks.forEach(callback => callback(error));
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

            // Lấy userId hiện tại
            const userData = await AsyncStorage.getItem('userData');
            const currentUser = userData ? JSON.parse(userData) : null;

            if (!currentUser || !currentUser.id) {
                console.warn('Không có thông tin người dùng, không thể subscribe');
                return;
            }

            const userId = currentUser.id;
            console.log('Subscribing to messages for user ID:', userId);

            try {
                // Subscribe nhận tin nhắn
                this.subscriptions.messages = this.client.subscribe(
                    `/user/${userId}/queue/messages`,
                    (message) => {
                        try {
                            const receivedMessage = JSON.parse(message.body);
                            console.log('Received message:', receivedMessage);
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
                console.log('Subscribed to typing with ID:', this.subscriptions.typing.id);

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
                console.log('Subscribed to receipts with ID:', this.subscriptions.receipts.id);

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
                console.log('Subscribed to errors with ID:', this.subscriptions.errors.id);

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
                console.log('Subscribed to user status with ID:', this.subscriptions.userStatus.id);

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
            console.warn('WebSocket chưa kết nối, đang thử kết nối...');
            this.connect().then(() => {
                setTimeout(() => {
                    this.sendMessageInternal(message);
                }, 1000); // Đợi 1 giây sau khi kết nối để đảm bảo kết nối ổn định
            }).catch(error => {
                console.error('Không thể kết nối để gửi tin nhắn:', error);
            });
            return false;
        }

        return this.sendMessageInternal(message);
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
                connectedVersion: this.client.connectedVersion,
                hasDebugEnabled: !!this.client.debug,
                reconnectDelay: this.client.reconnectDelay,
                heartbeatIncoming: this.client.heartbeatIncoming,
                heartbeatOutgoing: this.client.heartbeatOutgoing,
                subscriptions: Object.keys(this.subscriptions)
            }
        };
    }
}

// Tạo và export instance singleton
const webSocketService = new WebSocketService();
export default webSocketService;