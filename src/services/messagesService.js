// MessagesService.js - Cập nhật
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, DEFAULT_TIMEOUT, DEFAULT_HEADERS } from './api';
import webSocketService from './WebSocketService';
class MessagesService {
    constructor() {
        // Cập nhật baseURL để phù hợp với API của backend
        this.api = axios.create({
            baseURL: `${BASE_URL}/messages`,
            timeout: DEFAULT_TIMEOUT,
            headers: DEFAULT_HEADERS,
        });

        // Thêm interceptor để gắn token vào mỗi request
        this.api.interceptors.request.use(
            async (config) => {
                try {
                    const token = await AsyncStorage.getItem('accessToken');
                    const tokenType = await AsyncStorage.getItem('tokenType') || 'Bearer';

                    if (token) {
                        config.headers.Authorization = `${tokenType} ${token}`;
                    }

                    console.log('Request URL:', config.baseURL + config.url);
                    console.log('Request Headers:', JSON.stringify(config.headers));

                    return config;
                } catch (error) {
                    console.error('Error setting auth token:', error);
                    return config;
                }
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Interceptor để xử lý phản hồi và lỗi
        this.api.interceptors.response.use(
            (response) => {
                console.log('Response Status:', response.status);
                // Ghi log dữ liệu phản hồi một cách an toàn
                try {
                    const logData = typeof response.data === 'object'
                        ? JSON.stringify(response.data).substring(0, 200) + '...'
                        : response.data;
                    console.log('Response Data:', logData);
                } catch (e) {
                    console.log('Response Data: [Unable to stringify]');
                }

                // Xử lý định dạng dữ liệu trả về
                if (response.data && response.data.data) {
                    // Nếu dữ liệu được đóng gói trong field "data"
                    return response.data.data;
                }
                return response.data;
            },
            async (error) => {
                console.error('API Error:', error);

                if (error.response) {
                    console.error('Error status:', error.response.status);
                    console.error('Error data:', error.response.data);

                    // Kiểm tra lỗi 401 (Unauthorized)
                    if (error.response.status === 401) {
                        // Thử refresh token
                        try {
                            const originalRequest = error.config;
                            if (!originalRequest._retry) {
                                originalRequest._retry = true;

                                // Gọi API refresh token
                                const refreshToken = await AsyncStorage.getItem('refreshToken');
                                if (refreshToken) {
                                    const response = await this.refreshToken(refreshToken);

                                    // Lưu token mới
                                    const newToken = response.token || response.data?.token;
                                    if (newToken) {
                                        await AsyncStorage.setItem('accessToken', newToken);

                                        // Thử lại request với token mới
                                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                                        return this.api(originalRequest);
                                    }
                                }
                            }
                        } catch (refreshError) {
                            console.error('Token refresh failed:', refreshError);
                            global.authExpired = true;
                        }
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    /**
     * Làm mới token
     * @param {string} refreshToken - Token làm mới
     * @returns {Promise} - Token mới
     */
    async refreshToken(refreshToken) {
        const response = await axios.post(`${BASE_URL}/api/auth/refresh-token`, {
            refreshToken
        }, {
            headers: DEFAULT_HEADERS
        });

        return response.data;
    }

    /**
     * Lấy danh sách tin nhắn giữa hai người dùng
     * @param {number} user1Id - ID người dùng thứ nhất
     * @param {number} user2Id - ID người dùng thứ hai
     * @returns {Promise} - Danh sách tin nhắn
     */
    async getMessagesBetweenUsers(user1Id, user2Id) {
        try {
            console.log(`Đang lấy tin nhắn giữa người dùng ${user1Id} và ${user2Id}`);

            const response = await this.api.get(`/${user1Id}/${user2Id}`);
            return this.normalizeMessages(response);
        } catch (error) {
            console.error('Lỗi khi lấy tin nhắn giữa hai người dùng:', error);
            throw this.normalizeError(error);
        }
    }

    /**
     * Lấy danh sách tin nhắn giữa hai người dùng có phân trang
     * @param {number} user1Id - ID người dùng thứ nhất
     * @param {number} user2Id - ID người dùng thứ hai
     * @param {Object} pagination - Thông tin phân trang
     * @returns {Promise} - Danh sách tin nhắn phân trang
     */
    async getMessagesBetweenUsersPaginated(user1Id, user2Id, pagination = {}) {
        try {
            console.log(`Đang lấy tin nhắn phân trang giữa người dùng ${user1Id} và ${user2Id}`);

            const params = {
                page: pagination.page || 0,
                size: pagination.size || 20,
                sortBy: 'timestamp',
                order: 'desc'
            };

            const response = await this.api.get(`/${user1Id}/${user2Id}/paginated`, { params });
            return this.normalizePagedMessages(response);
        } catch (error) {
            console.error('Lỗi khi lấy tin nhắn phân trang:', error);
            throw this.normalizeError(error);
        }
    }

    /**
     * Gửi tin nhắn mới
     * @param {Object} messageData - Dữ liệu tin nhắn (content, senderId, receiverId)
     * @returns {Promise} - Tin nhắn đã gửi
     */
    // Cập nhật phương thức sendMessage để sử dụng WebSocket khi có thể
    async sendMessage(messageData) {
        try {
            console.log('Đang gửi tin nhắn:', messageData);

            // Lấy thông tin user hiện tại từ AsyncStorage
            const userData = await AsyncStorage.getItem('userData');
            const currentUser = userData ? JSON.parse(userData) : null;

            // Tạo payload phù hợp với MessageRequest của backend
            const payload = {
                content: messageData.content || '',
                receiverId: messageData.receiverId,
                attachmentUrl: messageData.attachmentUrl || null
            };

            // Ưu tiên gửi qua WebSocket
            if (webSocketService.isConnected()) {
                const success = webSocketService.sendMessage(payload);

                if (success) {
                    // Trả về tin nhắn tạm thời để hiển thị ngay lập tức
                    return this.normalizeMessage({
                        ...payload,
                        id: `temp-${Date.now()}`,
                        senderId: currentUser?.id,
                        createdAt: new Date().toISOString(),
                        isSending: true
                    });
                }
            }

            // Fallback về REST API nếu WebSocket không hoạt động
            const response = await this.api.post('', payload);
            return this.normalizeMessage(response);

        } catch (error) {
            console.error('Lỗi khi gửi tin nhắn:', error);
            throw this.normalizeError(error);
        }
    }

    /**
     * Lấy tin nhắn chưa đọc của người dùng
     * @param {number} userId - ID người dùng
     * @returns {Promise} - Danh sách tin nhắn chưa đọc
     */
    async getUnreadMessages(userId) {
        try {
            console.log(`Đang lấy tin nhắn chưa đọc của người dùng ${userId}`);

            const response = await this.api.get(`/unread/${userId}`);
            return this.normalizeMessages(response);
        } catch (error) {
            console.error('Lỗi khi lấy tin nhắn chưa đọc:', error);
            throw this.normalizeError(error);
        }
    }

    /**
     * Lấy số lượng tin nhắn chưa đọc
     * @param {number} userId - ID người dùng
     * @returns {Promise<number>} - Số lượng tin nhắn chưa đọc
     */
    async getUnreadMessagesCount(userId) {
        try {
            console.log(`Đang lấy số lượng tin nhắn chưa đọc của người dùng ${userId}`);

            const response = await this.api.get(`/unread-count/${userId}`);
            return response.count || 0;
        } catch (error) {
            console.error('Lỗi khi lấy số lượng tin nhắn chưa đọc:', error);
            return 0; // Trả về 0 nếu có lỗi
        }
    }

    /**
     * Đánh dấu tin nhắn đã đọc
     * @param {string} messageId - ID tin nhắn
     * @returns {Promise} - Kết quả
     */
    // Cập nhật phương thức markMessageAsRead để sử dụng WebSocket
    async markMessageAsRead(messageId) {
        try {
            console.log(`Đang đánh dấu tin nhắn ${messageId} là đã đọc`);

            // Lấy thông tin về message từ cache hoặc state
            const message = await this.getMessageById(messageId);

            // Nếu có thông tin về người gửi, gửi read receipt qua WebSocket
            if (message && message.senderId) {
                const sentViaWebSocket = webSocketService.sendReadReceipt(messageId, message.senderId);
                if (sentViaWebSocket) {
                    return true;
                }
            }

            // Fallback về REST API nếu cần
            await this.api.put(`/${messageId}/read`);
            return true;
        } catch (error) {
            console.error('Lỗi khi đánh dấu tin nhắn đã đọc:', error);
            throw this.normalizeError(error);
        }
    }
    // Thêm hàm mới để lấy tin nhắn theo ID (có thể cần cache để làm việc này)
    async getMessageById(messageId) {
        // Thực hiện từ cache nếu có
        // Hoặc gọi API để lấy thông tin message
        // Đây là implementation đơn giản
        try {
            const response = await this.api.get(`/${messageId}`);
            return this.normalizeMessage(response);
        } catch (error) {
            console.error(`Lỗi khi lấy tin nhắn ID ${messageId}:`, error);
            return null;
        }
    }


    /**
     * Đánh dấu tất cả tin nhắn giữa hai người dùng là đã đọc
     * @param {number} senderId - ID người gửi
     * @param {number} receiverId - ID người nhận
     * @returns {Promise} - Kết quả
     */
    async markAllMessagesAsRead(senderId, receiverId) {
        try {
            console.log(`Đang đánh dấu tất cả tin nhắn giữa ${senderId} và ${receiverId} là đã đọc`);

            await this.api.put(`/${senderId}/${receiverId}/read-all`);
            return true;
        } catch (error) {
            console.error('Lỗi khi đánh dấu tất cả tin nhắn đã đọc:', error);
            throw this.normalizeError(error);
        }
    }

    /**
     * Đánh dấu tin nhắn đã nhận
     * @param {string} messageId - ID tin nhắn
     * @returns {Promise} - Kết quả
     */
    async markMessageAsDelivered(messageId) {
        try {
            console.log(`Đang đánh dấu tin nhắn ${messageId} là đã nhận`);

            await this.api.put(`/${messageId}/delivered`);
            return true;
        } catch (error) {
            console.error('Lỗi khi đánh dấu tin nhắn đã nhận:', error);
            return false; // Trả về false nếu có lỗi
        }
    }

    /**
     * Xóa tin nhắn
     * @param {string} messageId - ID tin nhắn
     * @param {boolean} deleteForEveryone - Xóa cho tất cả (true) hoặc chỉ cho bản thân (false)
     * @returns {Promise} - Kết quả
     */
    async deleteMessage(messageId, deleteForEveryone = false) {
        try {
            console.log(`Đang xóa tin nhắn ${messageId}, xóa cho tất cả: ${deleteForEveryone}`);

            await this.api.delete(`/${messageId}?deleteForEveryone=${deleteForEveryone}`);
            return true;
        } catch (error) {
            console.error('Lỗi khi xóa tin nhắn:', error);
            throw this.normalizeError(error);
        }
    }

    // Phương thức hỗ trợ chuẩn hóa dữ liệu

    /**
     * Chuẩn hóa danh sách tin nhắn
     * @param {Array|Object} response - Phản hồi từ API
     * @returns {Array} - Danh sách tin nhắn đã chuẩn hóa
     */
    normalizeMessages(response) {
        // Kiểm tra và chuyển đổi response thành mảng
        let messages = [];

        if (Array.isArray(response)) {
            messages = response;
        } else if (response && response.content && Array.isArray(response.content)) {
            messages = response.content;
        } else if (response && typeof response === 'object') {
            // Trường hợp response là object duy nhất
            messages = [response];
        }

        // Chuẩn hóa từng tin nhắn
        return messages.map(msg => this.normalizeMessage(msg));
    }

    /**
     * Chuẩn hóa dữ liệu tin nhắn có phân trang
     * @param {Object} response - Phản hồi từ API
     * @returns {Object} - Dữ liệu tin nhắn phân trang đã chuẩn hóa
     */
    normalizePagedMessages(response) {
        if (!response) return { content: [], last: true, totalElements: 0 };

        // Xử lý trường hợp response có cấu trúc Spring Data Page
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

        // Xử lý trường hợp response là mảng đơn giản
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

        // Trường hợp không xác định
        return { content: [], last: true, totalElements: 0 };
    }

    /**
     * Chuẩn hóa dữ liệu tin nhắn đơn
     * @param {Object} message - Tin nhắn từ API
     * @returns {Object} - Tin nhắn đã chuẩn hóa
     */
    normalizeMessage(message) {
        if (!message) return null;

        // Đảm bảo các trường cần thiết tồn tại
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
            deletedForAll: message.deletedForAll || false
        };
    }

    /**
     * Chuẩn hóa lỗi
     * @param {Error} error - Lỗi gốc
     * @returns {Error} - Lỗi đã chuẩn hóa
     */
    normalizeError(error) {
        if (error.response && error.response.data) {
            // Trích xuất thông báo lỗi từ phản hồi
            const errorMessage = error.response.data.message ||
                error.response.data.error ||
                'Đã xảy ra lỗi khi gọi API';

            const customError = new Error(errorMessage);
            customError.status = error.response.status;
            customError.originalError = error;
            return customError;
        }

        // Nếu là lỗi network
        if (error.request) {
            const networkError = new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet của bạn.');
            networkError.isNetworkError = true;
            networkError.originalError = error;
            return networkError;
        }

        // Lỗi khác
        return error;
    }
}

// Tạo instance singleton
const messagesService = new MessagesService();
export default messagesService;