// src/services/WebSocketMessageService.js
// WebSocket Message Service - Tương thích với backend WebSocketMessageController
import webSocketService from './WebSocketService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

/**
 * WebSocket Message Service
 * Tương thích với backend WebSocketMessageController.java
 * Tất cả endpoints từ backend:
 * - /app/send - Gửi tin nhắn
 * - /app/get-messages - Lấy tin nhắn (có phân trang)
 * - /app/get-unread - Lấy tin nhắn chưa đọc
 * - /app/get-unread-count - Đếm tin nhắn chưa đọc
 * - /app/mark-read - Đánh dấu đã đọc
 * - /app/mark-all-read - Đánh dấu tất cả đã đọc
 * - /app/get-conversations - Lấy danh sách cuộc trò chuyện
 * - /app/delete-message - Xóa tin nhắn
 * - /app/mark-delivered - Đánh dấu đã gửi
 * - /app/typing - Thông báo đang gõ
 * - /app/search-messages - Tìm kiếm tin nhắn
 * - /app/get-messages-with-attachments - Tin nhắn có đính kèm
 * - /app/get-message-statistics - Thống kê tin nhắn
 * - /app/get-recent-messages - Tin nhắn gần đây
 * - /app/restore-message - Khôi phục tin nhắn
 * - /app/forward-message - Chuyển tiếp tin nhắn
 * - /app/add-reaction - Thêm reaction
 * - /app/remove-reaction - Xóa reaction
 * - /app/reply-message - Trả lời tin nhắn
 * - /app/update-status - Cập nhật trạng thái
 * - /app/get-messages-by-date-range - Tin nhắn theo thời gian
 */
class WebSocketMessageService {
    constructor() {
        this.pendingRequests = new Map();
        this.requestTimeout = 25000; // 25 giây timeout
        this.eventCallbacks = new Map();
        this.isInitialized = false;
    }

    /**
     * Khởi tạo service và đăng ký listeners
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('✅ WebSocketMessageService already initialized');
            return;
        }

        try {
            // Đảm bảo WebSocket đã kết nối
            if (!webSocketService.isConnected()) {
                console.log('🔌 WebSocket chưa kết nối, đang kết nối...');
                await webSocketService.connectWithStoredToken();
            }

            // Đăng ký các listeners cho response từ server
            this._registerResponseListeners();

            this.isInitialized = true;
            console.log('✅ WebSocketMessageService đã được khởi tạo thành công');
        } catch (error) {
            console.error('❌ Lỗi khởi tạo WebSocketMessageService:', error);
            throw error;
        }
    }

    /**
     * Đăng ký các listeners để nhận response từ server
     */
    _registerResponseListeners() {
        // Server gửi tin nhắn lịch sử qua /user/queue/messages-history
        webSocketService.subscribe('/user/queue/messages-history', (message) => {
            console.log('📨 Received message history:', message);
            this._resolveRequest('messageHistory', message.body);
        });

        // Server gửi tin nhắn mới qua /user/queue/messages
        webSocketService.subscribe('/user/queue/messages', (message) => {
            console.log('📨 Received new message:', message.body);
            this._notifyListeners('newMessage', message.body);
        });

        // Server gửi thông báo chưa đọc qua /user/queue/unread-messages
        webSocketService.subscribe('/user/queue/unread-messages', (message) => {
            console.log('📨 Received unread messages:', message.body);
            this._resolveRequest('unreadMessages', message.body);
        });

        // Server gửi số lượng chưa đọc qua /user/queue/unread-count
        webSocketService.subscribe('/user/queue/unread-count', (message) => {
            console.log('📨 Received unread count:', message.body);
            this._resolveRequest('unreadCount', message.body);
        });

        // Server gửi danh sách cuộc trò chuyện qua /user/queue/conversations
        webSocketService.subscribe('/user/queue/conversations', (message) => {
            console.log('📨 Received conversations:', message.body);
            this._resolveRequest('conversations', message.body);
        });

        // Server gửi thông báo typing qua /user/queue/typing
        webSocketService.subscribe('/user/queue/typing', (message) => {
            console.log('📨 Received typing notification:', message.body);
            this._notifyListeners('typing', message.body);
        });

        // Server gửi thông báo đã đọc qua /user/queue/read-receipt
        webSocketService.subscribe('/user/queue/read-receipt', (message) => {
            console.log('📨 Received read receipt:', message.body);
            this._notifyListeners('readReceipt', message.body);
        });

        // Server gửi thông báo tin nhắn bị xóa qua /user/queue/message-deleted
        webSocketService.subscribe('/user/queue/message-deleted', (message) => {
            console.log('📨 Received message deleted:', message.body);
            this._notifyListeners('messageDeleted', message.body);
        });

        // Server gửi reactions qua /user/queue/reactions
        webSocketService.subscribe('/user/queue/reactions', (message) => {
            console.log('📨 Received reactions:', message.body);
            this._resolveRequest('reactions', message.body);
        });

        // Server gửi cập nhật trạng thái qua /user/queue/status-update
        webSocketService.subscribe('/user/queue/status-update', (message) => {
            console.log('📨 Received status update:', message.body);
            this._notifyListeners('statusUpdate', message.body);
        });

        // Server gửi kết quả search qua /user/queue/search-results
        webSocketService.subscribe('/user/queue/search-results', (message) => {
            console.log('📨 Received search results:', message.body);
            this._resolveRequest('searchResults', message.body);
        });

        // Server gửi thống kê qua /user/queue/statistics
        webSocketService.subscribe('/user/queue/statistics', (message) => {
            console.log('📨 Received statistics:', message.body);
            this._resolveRequest('statistics', message.body);
        });

        // Server gửi lỗi qua /user/queue/errors
        webSocketService.subscribe('/user/queue/errors', (message) => {
            console.error('❌ Received error from server:', message.body);
            const error = typeof message.body === 'string' ? 
                JSON.parse(message.body) : message.body;
            this._rejectAllPendingRequests(new Error(error.message || 'Server error'));
        });

        console.log('✅ WebSocket message listeners registered');
    }

    /**
     * Tạo Promise để đợi response từ server
     */
    _createRequest(type, timeout = this.requestTimeout) {
        return new Promise((resolve, reject) => {
            const requestId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const timeoutId = setTimeout(() => {
                this.pendingRequests.delete(requestId);
                reject(new Error(`Request timeout: ${type}`));
            }, timeout);

            this.pendingRequests.set(requestId, {
                type,
                resolve,
                reject,
                timeoutId,
                timestamp: Date.now()
            });

            return requestId;
        });
    }

    /**
     * Resolve request khi nhận được response
     */
    _resolveRequest(type, data) {
        const requestsToResolve = [];
        
        // Tìm tất cả requests cùng type
        for (const [requestId, request] of this.pendingRequests.entries()) {
            if (request.type === type) {
                requestsToResolve.push({ requestId, request });
            }
        }

        // Resolve request mới nhất (LIFO)
        if (requestsToResolve.length > 0) {
            const latestRequest = requestsToResolve.reduce((latest, current) => {
                return current.request.timestamp > latest.request.timestamp ? current : latest;
            });

            clearTimeout(latestRequest.request.timeoutId);
            this.pendingRequests.delete(latestRequest.requestId);
            
            try {
                const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
                latestRequest.request.resolve(parsedData);
            } catch (error) {
                latestRequest.request.reject(new Error('Failed to parse response data'));
            }
        }
    }

    /**
     * Reject tất cả pending requests
     */
    _rejectAllPendingRequests(error) {
        for (const [requestId, request] of this.pendingRequests.entries()) {
            clearTimeout(request.timeoutId);
            request.reject(error);
        }
        this.pendingRequests.clear();
    }

    /**
     * Thông báo cho listeners
     */
    _notifyListeners(eventType, data) {
        const callbacks = this.eventCallbacks.get(eventType) || [];
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        
        callbacks.forEach(callback => {
            try {
                callback(parsedData);
            } catch (error) {
                console.error(`❌ Error in ${eventType} callback:`, error);
            }
        });
    }

    // =================== MESSAGING ENDPOINTS ===================

    /**
     * Gửi tin nhắn - /app/send
     */
    async sendMessage(messageData) {
        await this.initialize();

        const payload = {
            content: messageData.content,
            receiverId: messageData.receiverId,
            attachmentUrl: messageData.attachmentUrl || null,
            attachmentType: messageData.attachmentType || null,
            messageType: messageData.messageType || 'text',
            replyToMessageId: messageData.replyToMessageId || null
        };

        console.log('📤 Sending message:', payload);
        
        return webSocketService.publish('/app/send', payload);
    }

    /**
     * Lấy tin nhắn giữa hai người - /app/get-messages
     */
    async getMessages(user1Id, user2Id, options = {}) {
        await this.initialize();

        const request = this._createRequest('messageHistory');

        const payload = {
            user1Id: user1Id,
            user2Id: user2Id,
            enablePagination: options.enablePagination || false,
            page: options.page || 0,
            size: options.size || 50,
            sortBy: options.sortBy || 'timestamp',
            order: options.order || 'desc'
        };

        console.log('📤 Getting messages:', payload);
        
        webSocketService.publish('/app/get-messages', payload);
        return request;
    }

    /**
     * Lấy tin nhắn chưa đọc - /app/get-unread
     */
    async getUnreadMessages() {
        await this.initialize();

        const request = this._createRequest('unreadMessages');
        
        console.log('📤 Getting unread messages');
        webSocketService.publish('/app/get-unread', {});
        
        return request;
    }

    /**
     * Đếm tin nhắn chưa đọc - /app/get-unread-count
     */
    async getUnreadCount() {
        await this.initialize();

        const request = this._createRequest('unreadCount');
        
        console.log('📤 Getting unread count');
        webSocketService.publish('/app/get-unread-count', {});
        
        return request;
    }

    /**
     * Đánh dấu tin nhắn đã đọc - /app/mark-read
     */
    async markAsRead(messageId) {
        await this.initialize();

        const payload = { messageId: messageId.toString() };
        
        console.log('📤 Marking message as read:', payload);
        return webSocketService.publish('/app/mark-read', payload);
    }

    /**
     * Đánh dấu tất cả tin nhắn đã đọc - /app/mark-all-read
     */
    async markAllAsRead(senderId, receiverId) {
        await this.initialize();

        const payload = { senderId, receiverId };
        
        console.log('📤 Marking all messages as read:', payload);
        return webSocketService.publish('/app/mark-all-read', payload);
    }

    /**
     * Lấy danh sách cuộc trò chuyện - /app/get-conversations
     */
    async getConversations() {
        await this.initialize();

        const request = this._createRequest('conversations');
        
        console.log('📤 Getting conversations');
        webSocketService.publish('/app/get-conversations', {});
        
        return request;
    }

    /**
     * Xóa tin nhắn - /app/delete-message
     */
    async deleteMessage(messageId, deleteForEveryone = false) {
        await this.initialize();

        const payload = { 
            messageId: messageId.toString(),
            deleteForEveryone
        };
        
        console.log('📤 Deleting message:', payload);
        return webSocketService.publish('/app/delete-message', payload);
    }

    /**
     * Đánh dấu tin nhắn đã gửi - /app/mark-delivered
     */
    async markAsDelivered(messageId) {
        await this.initialize();

        const payload = { messageId: messageId.toString() };
        
        console.log('📤 Marking message as delivered:', payload);
        return webSocketService.publish('/app/mark-delivered', payload);
    }

    /**
     * Gửi thông báo đang gõ - /app/typing
     */
    async sendTypingNotification(receiverId, isTyping = true) {
        await this.initialize();

        const payload = { receiverId, typing: isTyping };
        
        console.log('📤 Sending typing notification:', payload);
        return webSocketService.publish('/app/typing', payload);
    }

    /**
     * Tìm kiếm tin nhắn - /app/search-messages
     */
    async searchMessages(keyword, withUserId = null, page = 0, size = 20) {
        await this.initialize();

        const request = this._createRequest('searchResults');

        const payload = { keyword, page, size };
        if (withUserId) payload.withUserId = withUserId;
        
        console.log('📤 Searching messages:', payload);
        webSocketService.publish('/app/search-messages', payload);
        
        return request;
    }

    /**
     * Lấy tin nhắn có đính kèm - /app/get-messages-with-attachments
     */
    async getMessagesWithAttachments(withUserId = null, attachmentType = '', page = 0, size = 20) {
        await this.initialize();

        const request = this._createRequest('attachmentMessages');

        const payload = { page, size };
        if (withUserId) payload.withUserId = withUserId;
        if (attachmentType) payload.attachmentType = attachmentType;
        
        console.log('📤 Getting messages with attachments:', payload);
        webSocketService.publish('/app/get-messages-with-attachments', payload);
        
        return request;
    }

    /**
     * Lấy thống kê tin nhắn - /app/get-message-statistics
     */
    async getMessageStatistics(withUserId = null, startDate = '', endDate = '') {
        await this.initialize();

        const request = this._createRequest('statistics');

        const payload = {};
        if (withUserId) payload.withUserId = withUserId;
        if (startDate) payload.startDate = startDate;
        if (endDate) payload.endDate = endDate;
        
        console.log('📤 Getting message statistics:', payload);
        webSocketService.publish('/app/get-message-statistics', payload);
        
        return request;
    }

    /**
     * Lấy tin nhắn gần đây - /app/get-recent-messages
     */
    async getRecentMessages(limit = 50) {
        await this.initialize();

        const request = this._createRequest('recentMessages');

        const payload = { limit };
        
        console.log('📤 Getting recent messages:', payload);
        webSocketService.publish('/app/get-recent-messages', payload);
        
        return request;
    }

    /**
     * Khôi phục tin nhắn - /app/restore-message
     */
    async restoreMessage(messageId) {
        await this.initialize();

        const payload = { messageId: messageId.toString() };
        
        console.log('📤 Restoring message:', payload);
        return webSocketService.publish('/app/restore-message', payload);
    }

    /**
     * Chuyển tiếp tin nhắn - /app/forward-message
     */
    async forwardMessage(originalMessageId, receiverId, additionalText = '') {
        await this.initialize();

        const payload = {
            originalMessageId: originalMessageId.toString(),
            receiverId,
            additionalText
        };
        
        console.log('📤 Forwarding message:', payload);
        return webSocketService.publish('/app/forward-message', payload);
    }

    /**
     * Thêm reaction - /app/add-reaction
     */
    async addReaction(messageId, reactionType) {
        await this.initialize();

        const request = this._createRequest('reactions');

        const payload = {
            messageId: messageId.toString(),
            reactionType
        };
        
        console.log('📤 Adding reaction:', payload);
        webSocketService.publish('/app/add-reaction', payload);
        
        return request;
    }

    /**
     * Xóa reaction - /app/remove-reaction
     */
    async removeReaction(messageId, reactionType) {
        await this.initialize();

        const request = this._createRequest('reactions');

        const payload = {
            messageId: messageId.toString(),
            reactionType
        };
        
        console.log('📤 Removing reaction:', payload);
        webSocketService.publish('/app/remove-reaction', payload);
        
        return request;
    }

    /**
     * Trả lời tin nhắn - /app/reply-message
     */
    async replyMessage(messageData) {
        await this.initialize();

        const payload = {
            content: messageData.content,
            receiverId: messageData.receiverId,
            attachmentUrl: messageData.attachmentUrl || null,
            replyToMessageId: messageData.replyToMessageId
        };
        
        console.log('📤 Replying to message:', payload);
        return webSocketService.publish('/app/reply-message', payload);
    }

    /**
     * Cập nhật trạng thái - /app/update-status
     */
    async updateStatus(status) {
        await this.initialize();

        const payload = { status };
        
        console.log('📤 Updating status:', payload);
        return webSocketService.publish('/app/update-status', payload);
    }

    /**
     * Lấy tin nhắn theo khoảng thời gian - /app/get-messages-by-date-range
     */
    async getMessagesByDateRange(withUserId, startDate, endDate, page = 0, size = 20) {
        await this.initialize();

        const request = this._createRequest('dateRangeMessages');

        const payload = {
            withUserId,
            startDate,
            endDate,
            page,
            size
        };
        
        console.log('📤 Getting messages by date range:', payload);
        webSocketService.publish('/app/get-messages-by-date-range', payload);
        
        return request;
    }

    // =================== EVENT LISTENERS ===================

    /**
     * Đăng ký listener cho sự kiện
     */
    on(eventType, callback) {
        if (!this.eventCallbacks.has(eventType)) {
            this.eventCallbacks.set(eventType, []);
        }
        
        const callbacks = this.eventCallbacks.get(eventType);
        callbacks.push(callback);
        
        // Return unsubscribe function
        return () => {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        };
    }

    /**
     * Hủy đăng ký listener
     */
    off(eventType, callback) {
        const callbacks = this.eventCallbacks.get(eventType);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Cleanup service
     */
    cleanup() {
        // Clear all pending requests
        this._rejectAllPendingRequests(new Error('Service cleanup'));
        
        // Clear all callbacks
        this.eventCallbacks.clear();
        
        this.isInitialized = false;
        console.log('🧹 WebSocketMessageService cleaned up');
    }

    /**
     * Kiểm tra trạng thái kết nối
     */
    isConnected() {
        return webSocketService.isConnected();
    }

    /**
     * Lấy thông tin trạng thái
     */
    getStatus() {
        return {
            connected: this.isConnected(),
            initialized: this.isInitialized,
            pendingRequests: this.pendingRequests.size,
            registeredEvents: this.eventCallbacks.size
        };
    }
}

// Export singleton instance
const webSocketMessageService = new WebSocketMessageService();
export default webSocketMessageService; 