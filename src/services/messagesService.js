// MessagesService.js - Phiên bản đơn giản tích hợp với WebSocketService
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, DEFAULT_TIMEOUT, DEFAULT_HEADERS } from './api';
import webSocketService from './WebSocketService';

class MessagesService {
    constructor() {
        // Khởi tạo API client
        this.api = axios.create({
            baseURL: `${BASE_URL}/messages`,
            timeout: DEFAULT_TIMEOUT,
            headers: DEFAULT_HEADERS
        });

        // Thiết lập interceptors
        this._setupInterceptors();

        // Khởi tạo cache cho tin nhắn
        this.messagesCache = new Map();

        // Khởi tạo các Map callback
        this.callbacks = {
            newMessage: new Map(),
            messageHistory: new Map(),
            paginatedMessages: new Map(),
            unreadMessages: new Map(),
            messageStatus: new Map()
        };

        // Đăng ký WebSocket callbacks nếu có WebSocketService
        if (webSocketService) {
            this._registerWebSocketCallbacks();
        }
    }

    // Thiết lập interceptors
    _setupInterceptors() {
        // Request interceptor để thêm token
        this.api.interceptors.request.use(
            async (config) => {
                try {
                    const token = await AsyncStorage.getItem('accessToken');
                    const tokenType = await AsyncStorage.getItem('tokenType') || 'Bearer';

                    if (token) {
                        config.headers.Authorization = `${tokenType} ${token}`;
                    }
                } catch (error) {
                    console.error('Lỗi khi thiết lập token:', error);
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor để xử lý phản hồi và refresh token khi cần
        this.api.interceptors.response.use(
            (response) => {
                return response.data?.data !== undefined ? response.data.data : response.data;
            },
            async (error) => {
                if (error.response?.status === 401) {
                    try {
                        if (!error.config._retry) {
                            error.config._retry = true;
                            const refreshToken = await AsyncStorage.getItem('refreshToken');
                            if (refreshToken) {
                                const newTokenResponse = await this.refreshToken(refreshToken);
                                const newToken = newTokenResponse.token || newTokenResponse.data?.token;

                                if (newToken) {
                                    await AsyncStorage.setItem('accessToken', newToken);
                                    error.config.headers.Authorization = `Bearer ${newToken}`;
                                    return this.api(error.config);
                                }
                            }
                        }
                    } catch (refreshError) {
                        console.error('Refresh token thất bại:', refreshError);
                        global.authExpired = true;
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    // Đăng ký callbacks với WebSocket
    _registerWebSocketCallbacks() {
        webSocketService.onMessage('messagesService', this._handleNewMessage.bind(this));
        webSocketService.onMessageHistory('messagesService', this._handleMessageHistory.bind(this));
        webSocketService.onPaginatedMessages('messagesService', this._handlePaginatedMessages.bind(this));
        webSocketService.onUnreadMessages('messagesService', this._handleUnreadMessages.bind(this));
        webSocketService.onReadReceipt('messagesService', this._handleReadReceipt.bind(this));
        webSocketService.onMessageDeleted('messagesService', this._handleMessageDeleted.bind(this));
    }

    // Handler cho các sự kiện WebSocket
    _handleNewMessage(message) {
        if (!message?.id) return;
        this._cacheMessage(message);
        this._notifyCallbacks('newMessage', this.normalizeMessage(message));
    }

    _handleMessageHistory(messages) {
        if (!Array.isArray(messages)) return;
        messages.forEach(msg => this._cacheMessage(msg));
        this._notifyCallbacks('messageHistory', this.normalizeMessages(messages));
    }

    _handlePaginatedMessages(pagedMessages) {
        if (!pagedMessages?.content) return;
        if (Array.isArray(pagedMessages.content)) {
            pagedMessages.content.forEach(msg => this._cacheMessage(msg));
        }
        this._notifyCallbacks('paginatedMessages', this.normalizePagedMessages(pagedMessages));
    }

    _handleUnreadMessages(messages) {
        if (!Array.isArray(messages)) return;
        messages.forEach(msg => this._cacheMessage(msg));
        this._notifyCallbacks('unreadMessages', this.normalizeMessages(messages));
    }

    _handleReadReceipt(receipt) {
        if (!receipt?.messageId) return;

        const message = this.messagesCache.get(receipt.messageId);
        if (message) {
            message.read = true;
            this.messagesCache.set(receipt.messageId, message);
        }

        this._notifyCallbacks('messageStatus', {
            messageId: receipt.messageId,
            status: 'read',
            timestamp: receipt.readTime
        });
    }

    _handleMessageDeleted(data) {
        if (!data?.messageId) return;

        const message = this.messagesCache.get(data.messageId);
        if (message) {
            message.deleted = true;
            message.deletedForAll = data.deleteForEveryone;
            this.messagesCache.set(data.messageId, message);
        }

        this._notifyCallbacks('messageStatus', {
            messageId: data.messageId,
            status: 'deleted',
            deleteForEveryone: data.deleteForEveryone
        });
    }

    // Thông báo cho các callbacks đã đăng ký
    _notifyCallbacks(type, data) {
        if (!this.callbacks[type]) return;

        this.callbacks[type].forEach(callback => {
            try {
                callback(data);
            } catch (e) {
                console.error(`Lỗi trong callback ${type}:`, e);
            }
        });
    }

    // Lưu tin nhắn vào cache
    _cacheMessage(message) {
        if (!message?.id) return;
        this.messagesCache.set(message.id, message);
    }

    // Phương thức để tạo Promise đợi kết quả từ WebSocket
    _createWebSocketPromise(callbackType, tempKey, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this.callbacks[callbackType].delete(tempKey);
                reject(new Error('Timeout chờ phản hồi WebSocket'));
            }, timeout);

            this.callbacks[callbackType].set(tempKey, (result) => {
                clearTimeout(timeoutId);
                this.callbacks[callbackType].delete(tempKey);
                resolve(result);
            });
        });
    }

    // PUBLIC METHODS

    // Đăng ký/hủy đăng ký callbacks
    onNewMessage(key, callback) { this.callbacks.newMessage.set(key, callback); }
    onMessageHistory(key, callback) { this.callbacks.messageHistory.set(key, callback); }
    onPaginatedMessages(key, callback) { this.callbacks.paginatedMessages.set(key, callback); }
    onUnreadMessages(key, callback) { this.callbacks.unreadMessages.set(key, callback); }
    onMessageStatus(key, callback) { this.callbacks.messageStatus.set(key, callback); }

    offNewMessage(key) { this.callbacks.newMessage.delete(key); }
    offMessageHistory(key) { this.callbacks.messageHistory.delete(key); }
    offPaginatedMessages(key) { this.callbacks.paginatedMessages.delete(key); }
    offUnreadMessages(key) { this.callbacks.unreadMessages.delete(key); }
    offMessageStatus(key) { this.callbacks.messageStatus.delete(key); }

    // Phương thức API với WebSocket + fallback

    // Lấy tin nhắn giữa hai người dùng
    async getMessagesBetweenUsers(user1Id, user2Id) {
        try {
            // Thử dùng WebSocket
            if (webSocketService?.isConnected()) {
                try {
                    // Tạo promise để đợi kết quả
                    const promise = this._createWebSocketPromise('messageHistory', 'temp_history');

                    // Gửi yêu cầu qua WebSocket
                    if (webSocketService.getMessagesBetweenUsers(user1Id, user2Id)) {
                        return await promise;
                    }
                } catch (wsError) {
                    console.log('Fallback to REST API:', wsError);
                }
            }

            // Fallback sang REST API
            const response = await this.api.get(`/${user1Id}/${user2Id}`);
            const messages = this.normalizeMessages(response);
            messages.forEach(msg => this._cacheMessage(msg));
            return messages;
        } catch (error) {
            console.error('Lỗi khi lấy tin nhắn:', error);
            throw this.normalizeError(error);
        }
    }

    // Lấy tin nhắn phân trang
    async getMessagesBetweenUsersPaginated(user1Id, user2Id, pagination = {}) {
        try {
            // Thử dùng WebSocket
            if (webSocketService?.isConnected()) {
                try {
                    const promise = this._createWebSocketPromise('paginatedMessages', 'temp_paginated');

                    if (webSocketService.getMessagesBetweenUsersPaginated(user1Id, user2Id, pagination)) {
                        return await promise;
                    }
                } catch (wsError) {
                    console.log('Fallback to REST API:', wsError);
                }
            }

            // Fallback sang REST API
            const params = {
                page: pagination.page || 0,
                size: pagination.size || 20,
                sortBy: 'timestamp',
                order: 'desc'
            };

            const response = await this.api.get(`/${user1Id}/${user2Id}/paginated`, { params });
            const pagedMessages = this.normalizePagedMessages(response);
            if (pagedMessages.content) {
                pagedMessages.content.forEach(msg => this._cacheMessage(msg));
            }
            return pagedMessages;
        } catch (error) {
            console.error('Lỗi khi lấy tin nhắn phân trang:', error);
            throw this.normalizeError(error);
        }
    }

    // Gửi tin nhắn mới
    async sendMessage(messageData) {
        // Tạo ID duy nhất cho tin nhắn tạm thời
        const tempMessageId = `temp-${Date.now()}`;

        try {
            // Thêm một cơ chế theo dõi tin nhắn đang gửi
            if (!this.pendingMessages) {
                this.pendingMessages = new Map();
            }

            // Kiểm tra xem tin nhắn với nội dung tương tự đã được gửi gần đây chưa
            // (trong vòng 2 giây)
            const now = Date.now();
            let isDuplicate = false;

            for (const [id, data] of this.pendingMessages.entries()) {
                // Nếu có tin nhắn với nội dung giống hệt và gửi trong 2 giây gần đây
                if (data.content === messageData.content &&
                    data.receiverId === messageData.receiverId &&
                    now - data.timestamp < 2000) {
                    console.log('Phát hiện tin nhắn trùng lặp, bỏ qua');
                    isDuplicate = true;
                    return data.message; // Trả về tin nhắn đã gửi trước đó
                }
            }

            // Nếu không phải tin nhắn trùng lặp, thêm vào danh sách đang xử lý
            this.pendingMessages.set(tempMessageId, {
                content: messageData.content,
                receiverId: messageData.receiverId,
                timestamp: now
            });

            // Gửi tin nhắn qua API
            const response = await this.api.post('', messageData);
            const savedMessage = this.normalizeMessage(response);

            // Lưu tin nhắn đã gửi
            this.pendingMessages.set(tempMessageId, {
                ...this.pendingMessages.get(tempMessageId),
                message: savedMessage
            });

            // Xóa tin nhắn khỏi danh sách sau 5 giây để tránh tràn bộ nhớ
            setTimeout(() => {
                this.pendingMessages.delete(tempMessageId);
            }, 5000);

            return savedMessage;
        } catch (error) {
            // Xóa khỏi danh sách nếu gặp lỗi
            this.pendingMessages?.delete(tempMessageId);
            throw error;
        }
    }

    // Lấy tin nhắn chưa đọc
    async getUnreadMessages(userId) {
        try {
            // Thử dùng WebSocket
            if (webSocketService?.isConnected()) {
                try {
                    const promise = this._createWebSocketPromise('unreadMessages', 'temp_unread');

                    if (webSocketService.getUnreadMessages()) {
                        return await promise;
                    }
                } catch (wsError) {
                    console.log('Fallback to REST API:', wsError);
                }
            }

            // Fallback sang REST API
            const response = await this.api.get(`/unread/${userId}`);
            const messages = this.normalizeMessages(response);
            messages.forEach(msg => this._cacheMessage(msg));
            return messages;
        } catch (error) {
            console.error('Lỗi khi lấy tin nhắn chưa đọc:', error);
            throw this.normalizeError(error);
        }
    }

    // Đánh dấu tin nhắn đã đọc
    async markMessageAsRead(messageId) {
        try {
            // Lấy thông tin message
            const message = this.messagesCache.get(messageId) || await this.getMessageById(messageId);

            // Cập nhật cache
            if (message) {
                message.read = true;
                this._cacheMessage(message);
            }

            // Thử dùng WebSocket
            if (message?.senderId && webSocketService?.isConnected()) {
                if (webSocketService.sendReadReceipt(messageId, message.senderId)) {
                    return true;
                }
            }

            // Fallback sang REST API
            await this.api.put(`/${messageId}/read`);
            return true;
        } catch (error) {
            console.error('Lỗi khi đánh dấu tin nhắn đã đọc:', error);
            throw this.normalizeError(error);
        }
    }

    // Đánh dấu tất cả tin nhắn đã đọc
    async markAllMessagesAsRead(senderId, receiverId) {
        try {
            // Thử dùng WebSocket
            if (webSocketService?.isConnected()) {
                try {
                    // Tạo đối tượng Promise
                    const promise = new Promise((resolve, reject) => {
                        const timeoutId = setTimeout(() => {
                            webSocketService.offReadAllSuccess('temp_read_all');
                            reject(new Error('Timeout'));
                        }, 5000);

                        webSocketService.onReadAllSuccess('temp_read_all', (result) => {
                            clearTimeout(timeoutId);
                            webSocketService.offReadAllSuccess('temp_read_all');
                            resolve(result);
                        });
                    });

                    if (webSocketService.markAllMessagesAsRead(senderId, receiverId)) {
                        await promise;
                        return true;
                    }
                } catch (wsError) {
                    console.log('Fallback to REST API:', wsError);
                }
            }

            // Fallback sang REST API
            await this.api.put(`/${senderId}/${receiverId}/read-all`);
            return true;
        } catch (error) {
            console.error('Lỗi khi đánh dấu tất cả tin nhắn đã đọc:', error);
            throw this.normalizeError(error);
        }
    }

    // Xóa tin nhắn
    async deleteMessage(messageId, deleteForEveryone = false) {
        try {
            // Cập nhật cache
            const message = this.messagesCache.get(messageId);
            if (message) {
                message.deleted = true;
                message.deletedForAll = deleteForEveryone;
                this._cacheMessage(message);
            }

            // Thử dùng WebSocket
            if (webSocketService?.isConnected()) {
                try {
                    const promise = new Promise((resolve, reject) => {
                        const timeoutId = setTimeout(() => {
                            webSocketService.offDeleteSuccess('temp_delete');
                            reject(new Error('Timeout'));
                        }, 5000);

                        webSocketService.onDeleteSuccess('temp_delete', (result) => {
                            clearTimeout(timeoutId);
                            webSocketService.offDeleteSuccess('temp_delete');
                            resolve(result);
                        });
                    });

                    if (webSocketService.deleteMessage(messageId, deleteForEveryone)) {
                        await promise;
                        return true;
                    }
                } catch (wsError) {
                    console.log('Fallback to REST API:', wsError);
                }
            }

            // Fallback sang REST API
            await this.api.delete(`/${messageId}?deleteForEveryone=${deleteForEveryone}`);
            return true;
        } catch (error) {
            console.error('Lỗi khi xóa tin nhắn:', error);
            throw this.normalizeError(error);
        }
    }

    // Lấy tin nhắn theo ID
    async getMessageById(messageId) {
        // Kiểm tra cache trước
        const cachedMessage = this.messagesCache.get(messageId);
        if (cachedMessage) return cachedMessage;

        // Gọi API nếu không có trong cache
        try {
            const response = await this.api.get(`/${messageId}`);
            const message = this.normalizeMessage(response);
            this._cacheMessage(message);
            return message;
        } catch (error) {
            console.error(`Lỗi khi lấy tin nhắn ID ${messageId}:`, error);
            return null;
        }
    }

    // Refresh token
    async refreshToken(refreshToken) {
        const response = await axios.post(`${BASE_URL}/api/auth/refresh-token`,
            { refreshToken },
            { headers: DEFAULT_HEADERS }
        );
        return response.data;
    }

    // CÁC PHƯƠNG THỨC CHUẨN HÓA DỮ LIỆU

    normalizeMessages(response) {
        let messages = [];

        if (Array.isArray(response)) {
            messages = response;
        } else if (response?.content && Array.isArray(response.content)) {
            messages = response.content;
        } else if (response && typeof response === 'object') {
            messages = [response];
        }

        return messages.map(msg => this.normalizeMessage(msg));
    }

    normalizePagedMessages(response) {
        if (!response) return { content: [], last: true, totalElements: 0 };

        if (response.content && Array.isArray(response.content)) {
            return {
                content: this.normalizeMessages(response.content),
                last: response.last !== undefined ? response.last : true,
                totalElements: response.totalElements || 0,
                totalPages: response.totalPages || 1,
                size: response.size || 20,
                number: response.number || 0
            };
        }

        if (Array.isArray(response)) {
            return {
                content: this.normalizeMessages(response),
                last: true,
                totalElements: response.length,
                totalPages: 1,
                size: response.length,
                number: 0
            };
        }

        return { content: [], last: true, totalElements: 0 };
    }

    normalizeMessage(message) {
        if (!message) return null;

        return {
            id: message.id || `temp-${Date.now()}`,
            content: message.content || '',
            senderId: message.senderId,
            receiverId: message.receiverId,
            createdAt: message.timestamp || message.createdAt || new Date().toISOString(),
            read: message.read || false,
            delivered: message.delivered || false,
            attachmentUrl: message.attachmentUrl || null,
            attachmentType: message.attachmentType || null,
            deletedForAll: message.deletedForAll || false,
            isSending: message.isSending || false
        };
    }

    normalizeError(error) {
        if (error.response?.data) {
            const errorMessage = error.response.data.message ||
                error.response.data.error ||
                'Đã xảy ra lỗi khi gọi API';

            const customError = new Error(errorMessage);
            customError.status = error.response.status;
            customError.originalError = error;
            return customError;
        }

        if (error.request) {
            const networkError = new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet.');
            networkError.isNetworkError = true;
            networkError.originalError = error;
            return networkError;
        }

        return error;
    }
}

// Tạo instance singleton
const messagesService = new MessagesService();
export default messagesService;