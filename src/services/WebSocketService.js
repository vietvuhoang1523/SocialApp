import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { WS_CONFIG } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class WebSocketService {
    constructor() {
        this.client = null;
        this.connected = false;
        this.currentUserId = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.subscriptions = {};
        // Thêm biến theo dõi tin nhắn đã gửi để tránh trùng lặp
        this.sentMessages = new Map();
        this.messageDeduplicationWindow = 3000; // 3 giây

        // Thêm biến theo dõi tin nhắn đã nhận
        this.receivedMessages = new Map();

        // Tạo Map lưu trữ các callback
        this.callbackMaps = {
            message: new Map(),
            messageHistory: new Map(),
            paginatedMessages: new Map(),
            unreadMessages: new Map(),
            unreadCount: new Map(),
            typing: new Map(),
            receipt: new Map(),
            readSuccess: new Map(),
            readAllSuccess: new Map(),
            conversations: new Map(),
            deleteSuccess: new Map(),
            deliveredSuccess: new Map(),
            messageDeleted: new Map()
        };

        // Tạo Set lưu trữ các callback không cần key
        this.errorCallbacks = new Set();
        this.connectionCallbacks = new Set();
    }

    // Kết nối WebSocket
    async connect() {
        if (this.client && this.client.connected) {
            console.log('WebSocket đã kết nối');
            return Promise.resolve();
        }

        try {
            // Lấy token và thông tin người dùng
            const token = await AsyncStorage.getItem('accessToken');
            const userData = await AsyncStorage.getItem('userData');

            if (!token) throw new Error('Không có token để kết nối WebSocket');

            const currentUser = userData ? JSON.parse(userData) : null;
            this.currentUserId = currentUser?.id;

            if (!this.currentUserId) throw new Error('Không có thông tin user để kết nối WebSocket');

            // Đóng kết nối cũ nếu có
            if (this.client) this.disconnect();

            // Tạo socket và client STOMP
            const socket = new SockJS(WS_CONFIG.ENDPOINT);
            this.client = new Client({
                webSocketFactory: () => socket,
                connectHeaders: { Authorization: `Bearer ${token}` },
                debug: str => console.log('STOMP: ' + str),
                reconnectDelay: WS_CONFIG.RECONNECT_DELAY,
                heartbeatIncoming: WS_CONFIG.HEARTBEAT_INCOMING,
                heartbeatOutgoing: WS_CONFIG.HEARTBEAT_OUTGOING
            });

            return new Promise((resolve, reject) => {
                // Xử lý kết nối thành công
                this.client.onConnect = frame => {
                    console.log('Connected to WebSocket');
                    this.connected = true;
                    this.reconnectAttempts = 0;
                    this.subscribeToPersonalMessages();
                    this.connectionCallbacks.forEach(cb => cb(true));
                    resolve(true);
                };

                // Xử lý lỗi STOMP
                this.client.onStompError = frame => {
                    console.error('STOMP Error');
                    this.connected = false;
                    this.errorCallbacks.forEach(cb => cb(frame));
                    reject(new Error(`STOMP Error: ${frame.headers.message || 'Unknown error'}`));
                };

                this.client.activate();
            });
        } catch (error) {
            console.error('WebSocket connection error:', error);
            this.connected = false;
            this.errorCallbacks.forEach(cb => cb(error));
            throw error;
        }
    }

    // Ngắt kết nối WebSocket
    disconnect() {
        if (this.client) {
            this.unsubscribeAll();
            this.client.deactivate();
            console.log('WebSocket đã ngắt kết nối');
            this.connected = false;
            this.connectionCallbacks.forEach(cb => cb(false));
        }
    }

    // Hủy tất cả đăng ký
    unsubscribeAll() {
        Object.values(this.subscriptions).forEach(sub => {
            if (sub && sub.unsubscribe) {
                try {
                    sub.unsubscribe();
                } catch (e) {
                    console.error('Error unsubscribing:', e);
                }
            }
        });
        this.subscriptions = {};
    }

    // Đăng ký nhận tin nhắn
    async subscribeToPersonalMessages() {
        if (!this.client || !this.client.connected || !this.currentUserId) {
            console.warn('Không thể subscribe: WebSocket chưa kết nối hoặc không có userId');
            return;
        }

        const userId = this.currentUserId;

        try {
            // Danh sách các đăng ký cần thực hiện
            const subscriptions = [
                // Định dạng: [tên subscription, đường dẫn, callback map]
                ['messages', `/user/${userId}/queue/messages`, 'message'],
                ['messagesHistory', `/user/${userId}/queue/messages-history`, 'messageHistory'],
                ['messagesPaginated', `/user/${userId}/queue/messages-paginated`, 'paginatedMessages'],
                ['unreadMessages', `/user/${userId}/queue/unread-messages`, 'unreadMessages'],
                ['unreadCount', `/user/${userId}/queue/unread-count`, 'unreadCount'],
                ['receipts', `/user/${userId}/queue/receipts`, 'receipt'],
                ['readSuccess', `/user/${userId}/queue/read-success`, 'readSuccess'],
                ['readAllSuccess', `/user/${userId}/queue/read-all-success`, 'readAllSuccess'],
                ['conversations', `/user/${userId}/queue/conversations`, 'conversations'],
                ['deleteSuccess', `/user/${userId}/queue/delete-success`, 'deleteSuccess'],
                ['deliveredSuccess', `/user/${userId}/queue/delivered-success`, 'deliveredSuccess'],
                ['errors', `/user/${userId}/queue/errors`, null],
                ['messageDeleted', `/topic/message-deleted`, 'messageDeleted'],
                ['messageDeletedById', `/topic/message-deleted/${userId}`, 'messageDeleted'],
                ['typing', `/topic/typing/${userId}`, 'typing']
            ];

            // Đăng ký từng subscription
            for (const [key, destination, callbackType] of subscriptions) {
                this.subscriptions[key] = this.client.subscribe(
                    destination,
                    message => {
                        try {
                            const data = JSON.parse(message.body);

                            // Xử lý đặc biệt cho errors
                            if (key === 'errors') {
                                console.error('WebSocket error message:', data);
                                this.errorCallbacks.forEach(cb => cb(data));
                                return;
                            }

                            // Xử lý đặc biệt cho unreadCount
                            const finalData = key === 'unreadCount' ? data.count : data;

                            // Thông báo cho các callback đã đăng ký
                            if (callbackType) {
                                this.callbackMaps[callbackType].forEach(cb => cb(finalData));
                            }
                        } catch (error) {
                            console.error(`Error parsing ${key} message:`, error);
                        }
                    }
                );
            }

            console.log('Đã đăng ký thành công tất cả các topic');
        } catch (error) {
            console.error('Lỗi khi đăng ký các subscription:', error);
        }
    }

    // Hàm trợ giúp để kiểm tra kết nối và tạo payload
    _prepareRequest(destination, payload = {}) {
        if (!this.client || !this.client.connected) {
            console.warn('WebSocket chưa kết nối, không thể gửi yêu cầu');
            return false;
        }

        try {
            this.client.publish({
                destination,
                body: JSON.stringify(payload),
                headers: { 'content-type': 'application/json' }
            });
            return true;
        } catch (error) {
            console.error(`Error sending request to ${destination}:`, error);
            return false;
        }
    }

    // === CÁC PHƯƠNG THỨC GỬI YÊU CẦU ===

    // Gửi tin nhắn mới
    sendMessage(message) {
        if (!this.client || !this.client.connected) {
            console.warn('WebSocket chưa kết nối, không thể gửi tin nhắn');
            return false;
        }

        try {
            // Tạo mã băm đơn giản để nhận dạng tin nhắn
            const messageHash = `${message.content || ''}_${message.receiverId}_${Date.now()}`;

            // Kiểm tra xem tin nhắn này đã được gửi gần đây chưa
            for (const [hash, timestamp] of this.sentMessages.entries()) {
                // Nếu nội dung giống nhau và người nhận giống nhau
                if (hash.startsWith(`${message.content || ''}_${message.receiverId}`)) {
                    // Và thời gian gửi gần nhau (trong vòng 3 giây)
                    if (Date.now() - timestamp < this.messageDeduplicationWindow) {
                        console.warn('Phát hiện tin nhắn trùng lặp, bỏ qua:', message);
                        return false;
                    }
                }
            }

            // Chuẩn bị payload
            const payload = {
                content: message.content || '',
                receiverId: message.receiverId,
                attachmentUrl: message.attachmentUrl || null,
                _requestId: message._requestId || `req_${Date.now()}`
            };

            // Gửi tin nhắn
            this.client.publish({
                destination: '/app/send',
                body: JSON.stringify(payload),
                headers: { 'content-type': 'application/json' }
            });

            // Lưu tin nhắn vào cache để tránh gửi trùng lặp
            this.sentMessages.set(messageHash, Date.now());

            // Xóa các tin nhắn cũ từ cache sau một khoảng thời gian
            setTimeout(() => {
                this.sentMessages.delete(messageHash);
            }, this.messageDeduplicationWindow * 2);

            return true;
        } catch (error) {
            console.error('Lỗi khi gửi tin nhắn qua WebSocket:', error);
            return false;
        }
    }

    // Lấy tin nhắn giữa hai người dùng
    getMessagesBetweenUsers(user1Id, user2Id) {
        return this._prepareRequest('/app/get-messages', { user1Id, user2Id });
    }

    // Lấy tin nhắn phân trang
    getMessagesBetweenUsersPaginated(user1Id, user2Id, pagination = {}) {
        const payload = {
            user1Id,
            user2Id,
            page: pagination.page || 0,
            size: pagination.size || 20,
            sortBy: pagination.sortBy || 'timestamp',
            order: pagination.order || 'desc'
        };
        return this._prepareRequest('/app/get-messages-paginated', payload);
    }

    // Lấy tin nhắn chưa đọc
    getUnreadMessages() {
        return this._prepareRequest('/app/get-unread');
    }

    // Lấy số lượng tin nhắn chưa đọc
    getUnreadMessagesCount() {
        return this._prepareRequest('/app/get-unread-count');
    }

    // Đánh dấu tin nhắn đã đọc
    sendReadReceipt(messageId, senderId) {
        return this._prepareRequest('/app/mark-read', { messageId, senderId });
    }

    // Đánh dấu tất cả tin nhắn đã đọc
    markAllMessagesAsRead(senderId, receiverId) {
        return this._prepareRequest('/app/mark-all-read', { senderId, receiverId });
    }

    // Lấy danh sách cuộc trò chuyện
    getConversations() {
        return this._prepareRequest('/app/get-conversations');
    }

    // Xóa tin nhắn
    deleteMessage(messageId, deleteForEveryone = false) {
        return this._prepareRequest('/app/delete-message', { messageId, deleteForEveryone });
    }

    // Đánh dấu tin nhắn đã nhận
    markMessageAsDelivered(messageId) {
        return this._prepareRequest('/app/mark-delivered', { messageId });
    }

    // Gửi thông báo đang nhập
    sendTyping(receiverId, isTyping = true) {
        return this._prepareRequest('/app/typing', { receiverId, typing: isTyping });
    }

    // === PHƯƠNG THỨC ĐĂNG KÝ CALLBACK ===

    // Hàm trợ giúp đăng ký callback
    _registerCallback(mapName, key, callback) {
        if (typeof callback === 'function') {
            this.callbackMaps[mapName].set(key, callback);
            return true;
        }
        return false;
    }

    // Hàm trợ giúp hủy đăng ký callback
    _unregisterCallback(mapName, key) {
        return this.callbackMaps[mapName].delete(key);
    }

    // Tạo các phương thức đăng ký và hủy đăng ký callback
    onMessage(key, callback) { return this._registerCallback('message', key, callback); }
    onMessageHistory(key, callback) { return this._registerCallback('messageHistory', key, callback); }
    onPaginatedMessages(key, callback) { return this._registerCallback('paginatedMessages', key, callback); }
    onUnreadMessages(key, callback) { return this._registerCallback('unreadMessages', key, callback); }
    onUnreadCount(key, callback) { return this._registerCallback('unreadCount', key, callback); }
    onTyping(key, callback) { return this._registerCallback('typing', key, callback); }
    onReadReceipt(key, callback) { return this._registerCallback('receipt', key, callback); }
    onReadSuccess(key, callback) { return this._registerCallback('readSuccess', key, callback); }
    onReadAllSuccess(key, callback) { return this._registerCallback('readAllSuccess', key, callback); }
    onConversations(key, callback) { return this._registerCallback('conversations', key, callback); }
    onDeleteSuccess(key, callback) { return this._registerCallback('deleteSuccess', key, callback); }
    onDeliveredSuccess(key, callback) { return this._registerCallback('deliveredSuccess', key, callback); }
    onMessageDeleted(key, callback) { return this._registerCallback('messageDeleted', key, callback); }

    offMessage(key) { return this._unregisterCallback('message', key); }
    offMessageHistory(key) { return this._unregisterCallback('messageHistory', key); }
    offPaginatedMessages(key) { return this._unregisterCallback('paginatedMessages', key); }
    offUnreadMessages(key) { return this._unregisterCallback('unreadMessages', key); }
    offUnreadCount(key) { return this._unregisterCallback('unreadCount', key); }
    offTyping(key) { return this._unregisterCallback('typing', key); }
    offReadReceipt(key) { return this._unregisterCallback('receipt', key); }
    offReadSuccess(key) { return this._unregisterCallback('readSuccess', key); }
    offReadAllSuccess(key) { return this._unregisterCallback('readAllSuccess', key); }
    offConversations(key) { return this._unregisterCallback('conversations', key); }
    offDeleteSuccess(key) { return this._unregisterCallback('deleteSuccess', key); }
    offDeliveredSuccess(key) { return this._unregisterCallback('deliveredSuccess', key); }
    offMessageDeleted(key) { return this._unregisterCallback('messageDeleted', key); }

    // Đăng ký callback cho lỗi
    onError(callback) {
        if (typeof callback === 'function') {
            this.errorCallbacks.add(callback);
            return true;
        }
        return false;
    }

    // Hủy đăng ký callback cho lỗi
    offError(callback) {
        return this.errorCallbacks.delete(callback);
    }

    // Đăng ký callback cho thay đổi trạng thái kết nối
    onConnectionChange(callback) {
        if (typeof callback === 'function') {
            this.connectionCallbacks.add(callback);
            if (this.client) {
                callback(this.client.connected);
            }
            return true;
        }
        return false;
    }

    // Hủy đăng ký callback cho thay đổi trạng thái kết nối
    offConnectionChange(callback) {
        return this.connectionCallbacks.delete(callback);
    }

    // Kiểm tra trạng thái kết nối
    isConnected() {
        return this.client && this.client.connected;
    }

    // Phương thức để debug trạng thái kết nối
    getConnectionStatus() {
        if (!this.client) {
            return { status: 'INACTIVE', details: 'Client chưa được khởi tạo' };
        }

        // Tạo đối tượng chứa số lượng callback đã đăng ký
        const callbackCounts = {};
        Object.entries(this.callbackMaps).forEach(([key, map]) => {
            callbackCounts[key] = map.size;
        });
        callbackCounts.errors = this.errorCallbacks.size;
        callbackCounts.connections = this.connectionCallbacks.size;

        return {
            status: this.client.connected ? 'CONNECTED' : 'DISCONNECTED',
            details: {
                connected: this.client.connected,
                currentUserId: this.currentUserId,
                reconnectAttempts: this.reconnectAttempts,
                subscriptions: Object.keys(this.subscriptions),
                callbacksCount: callbackCounts
            }
        };
    }

    // Kết nối lại
    async forceReconnect() {
        console.log('Kết nối lại WebSocket...');
        this.disconnect();
        this.reconnectAttempts = 0;
        return this.connect();
    }
}

// Tạo và export instance
const webSocketService = new WebSocketService();
export default webSocketService;