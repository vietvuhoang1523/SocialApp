// WebSocketService.js
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BASE_URL } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class WebSocketService {
    constructor() {
        this.client = null;
        this.messageCallbacks = new Map();
        this.typingCallbacks = new Map();
        this.receiptCallbacks = new Map();
        this.errorCallbacks = new Set();
        this.connectionCallbacks = new Set();
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

            // Tạo kết nối mới
            const socket = new SockJS(`${BASE_URL}/ws`);
            this.client = new Client({
                webSocketFactory: () => socket,
                connectHeaders: {
                    Authorization: `Bearer ${token}`
                },
                debug: function (str) {
                    console.log('STOMP: ' + str);
                },
                reconnectDelay: 5000, // Thử kết nối lại sau 5s
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000
            });

            // Xử lý khi kết nối thành công
            this.client.onConnect = (frame) => {
                console.log('Connected to WebSocket:', frame);

                // Đăng ký nhận tin nhắn cá nhân
                this.subscribeToPersonalMessages();

                // Thông báo cho các callbacks về kết nối thành công
                this.connectionCallbacks.forEach(callback => callback(true));
            };

            // Xử lý khi mất kết nối
            this.client.onStompError = (frame) => {
                console.error('STOMP Error:', frame);
                this.errorCallbacks.forEach(callback => callback(frame));
            };

            // Kết nối
            this.client.activate();
        } catch (error) {
            console.error('WebSocket connection error:', error);
            this.errorCallbacks.forEach(callback => callback(error));
        }
    }

    // Ngắt kết nối WebSocket
    disconnect() {
        if (this.client && this.client.connected) {
            this.client.deactivate();
            console.log('WebSocket đã ngắt kết nối');

            // Thông báo cho các callbacks về ngắt kết nối
            this.connectionCallbacks.forEach(callback => callback(false));
        }
    }

    // Đăng ký nhận tin nhắn cá nhân
    async subscribeToPersonalMessages() {
        try {
            if (!this.client || !this.client.connected) {
                console.warn('WebSocket chưa kết nối');
                return;
            }

            // Lấy userId hiện tại
            const userData = await AsyncStorage.getItem('userData');
            const currentUser = userData ? JSON.parse(userData) : null;

            if (!currentUser || !currentUser.id) {
                console.warn('Không có thông tin người dùng');
                return;
            }

            // Đăng ký nhận tin nhắn
            this.messageSubscription = this.client.subscribe(
                `/user/${currentUser.id}/queue/messages`,
                (message) => {
                    try {
                        const receivedMessage = JSON.parse(message.body);
                        console.log('Received message:', receivedMessage);

                        // Gọi các callback đã đăng ký
                        this.messageCallbacks.forEach((callback, key) => {
                            callback(receivedMessage);
                        });
                    } catch (error) {
                        console.error('Error parsing message:', error);
                    }
                }
            );

            // Đăng ký nhận thông báo typing
            this.typingSubscription = this.client.subscribe(
                `/user/${currentUser.id}/queue/typing`,
                (message) => {
                    try {
                        const typingData = JSON.parse(message.body);
                        console.log('Typing notification:', typingData);

                        // Gọi các callback đã đăng ký
                        this.typingCallbacks.forEach((callback, key) => {
                            callback(typingData);
                        });
                    } catch (error) {
                        console.error('Error parsing typing notification:', error);
                    }
                }
            );

            // Đăng ký nhận read receipts
            this.receiptSubscription = this.client.subscribe(
                `/user/${currentUser.id}/queue/receipts`,
                (message) => {
                    try {
                        const receipt = JSON.parse(message.body);
                        console.log('Read receipt:', receipt);

                        // Gọi các callback đã đăng ký
                        this.receiptCallbacks.forEach((callback, key) => {
                            callback(receipt);
                        });
                    } catch (error) {
                        console.error('Error parsing read receipt:', error);
                    }
                }
            );

            // Đăng ký nhận các thông báo lỗi
            this.errorSubscription = this.client.subscribe(
                `/user/${currentUser.id}/queue/errors`,
                (message) => {
                    try {
                        const error = JSON.parse(message.body);
                        console.error('WebSocket error:', error);

                        // Gọi các callback đã đăng ký
                        this.errorCallbacks.forEach(callback => {
                            callback(error);
                        });
                    } catch (error) {
                        console.error('Error parsing error message:', error);
                    }
                }
            );

            console.log('Subscribed to personal messages');
        } catch (error) {
            console.error('Error subscribing to messages:', error);
        }
    }

    // Gửi tin nhắn qua WebSocket
    sendMessage(message) {
        if (!this.client || !this.client.connected) {
            console.warn('WebSocket chưa kết nối, đang thử kết nối...');
            this.connect().then(() => {
                this.sendMessageInternal(message);
            });
            return false;
        }

        return this.sendMessageInternal(message);
    }

    // Hàm nội bộ để gửi tin nhắn
    sendMessageInternal(message) {
        try {
            this.client.publish({
                destination: '/app/send',
                body: JSON.stringify(message),
                headers: { 'content-type': 'application/json' }
            });
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
}

// Tạo và export instance singleton
const webSocketService = new WebSocketService();
export default webSocketService;