// MessagesService.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, DEFAULT_TIMEOUT, DEFAULT_HEADERS } from './api';

class MessagesService {
    constructor() {
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
                console.log('Response Data:', JSON.stringify(response.data).substring(0, 200) + '...');
                return response;
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
                                    await AsyncStorage.setItem('accessToken', response.data.token);

                                    // Thử lại request với token mới
                                    originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
                                    return this.api(originalRequest);
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
        const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {
            refreshToken
        }, {
            headers: DEFAULT_HEADERS
        });

        return response;
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

            console.log('Phản hồi từ API lấy tin nhắn:', response.data);
            return response.data;
        } catch (error) {
            console.error('Lỗi khi lấy tin nhắn giữa hai người dùng:', error);
            if (error.response) {
                console.error('Error status:', error.response.status);
                console.error('Error data:', error.response.data);
            }
            throw error;
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
                size: pagination.size || 20
            };

            const response = await this.api.get(`/${user1Id}/${user2Id}/paginated`, { params });

            console.log('Phản hồi từ API lấy tin nhắn phân trang:', response.data);
            return response.data;
        } catch (error) {
            console.error('Lỗi khi lấy tin nhắn phân trang:', error);
            if (error.response) {
                console.error('Error status:', error.response.status);
                console.error('Error data:', error.response.data);
            }
            throw error;
        }
    }

    /**
     * Gửi tin nhắn mới
     * @param {Object} messageData - Dữ liệu tin nhắn (content, senderId, receiverId)
     * @returns {Promise} - Tin nhắn đã gửi
     */
    async sendMessage(messageData) {
        try {
            console.log('Đang gửi tin nhắn:', messageData);

            const response = await this.api.post('', messageData);

            console.log('Phản hồi từ API gửi tin nhắn:', response.data);
            return response.data;
        } catch (error) {
            console.error('Lỗi khi gửi tin nhắn:', error);
            if (error.response) {
                console.error('Error status:', error.response.status);
                console.error('Error data:', error.response.data);
            }
            throw error;
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

            console.log('Phản hồi từ API lấy tin nhắn chưa đọc:', response.data);
            return response.data;
        } catch (error) {
            console.error('Lỗi khi lấy tin nhắn chưa đọc:', error);
            if (error.response) {
                console.error('Error status:', error.response.status);
                console.error('Error data:', error.response.data);
            }
            throw error;
        }
    }

    /**
     * Đánh dấu tin nhắn đã đọc
     * @param {string} messageId - ID tin nhắn
     * @returns {Promise} - Kết quả
     */
    async markMessageAsRead(messageId) {
        try {
            console.log(`Đang đánh dấu tin nhắn ${messageId} là đã đọc`);

            const response = await this.api.put(`/${messageId}/read`);

            console.log('Phản hồi từ API đánh dấu tin nhắn đã đọc:', response.data);
            return response.data;
        } catch (error) {
            console.error('Lỗi khi đánh dấu tin nhắn đã đọc:', error);
            if (error.response) {
                console.error('Error status:', error.response.status);
                console.error('Error data:', error.response.data);
            }
            throw error;
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

            const response = await this.api.put(`/${senderId}/${receiverId}/read-all`);

            console.log('Phản hồi từ API đánh dấu tất cả tin nhắn đã đọc:', response.data);
            return response.data;
        } catch (error) {
            console.error('Lỗi khi đánh dấu tất cả tin nhắn đã đọc:', error);
            if (error.response) {
                console.error('Error status:', error.response.status);
                console.error('Error data:', error.response.data);
            }
            throw error;
        }
    }

    /**
     * Lấy thông tin người dùng từ AsyncStorage
     * @returns {Promise<Object|null>} - Thông tin người dùng hoặc null
     */
    async getCurrentUser() {
        try {
            const userData = await AsyncStorage.getItem('userData');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Lỗi khi lấy thông tin người dùng từ AsyncStorage:', error);
            return null;
        }
    }

    /**
     * Lấy tất cả cuộc trò chuyện của người dùng (phương thức giả lập vì không có trong API)
     * @param {number} userId - ID người dùng
     * @returns {Promise} - Danh sách cuộc trò chuyện
     */
    async getConversations(userId) {
        try {
            console.log(`Đang lấy cuộc trò chuyện của người dùng ${userId}`);

            // Giả lập api call - trong thực tế cần endpoint riêng hoặc xử lý ở client
            // Lấy tin nhắn chưa đọc
            const unreadMessages = await this.getUnreadMessages(userId);

            // Tạo danh sách các người dùng duy nhất từ tin nhắn
            const userIds = new Set();
            unreadMessages.forEach(msg => {
                if (msg.senderId !== userId) {
                    userIds.add(msg.senderId);
                } else if (msg.receiverId !== userId) {
                    userIds.add(msg.receiverId);
                }
            });

            // Khởi tạo danh sách cuộc trò chuyện
            const conversations = [];

            // Với mỗi người dùng, lấy tin nhắn gần nhất
            for (const partnerId of userIds) {
                const messages = await this.getMessagesBetweenUsers(userId, partnerId);

                if (messages && messages.length > 0) {
                    // Sắp xếp tin nhắn theo thời gian để lấy tin nhắn mới nhất
                    messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                    const lastMessage = messages[0];
                    const unreadCount = messages.filter(msg => msg.receiverId === userId && !msg.read).length;

                    conversations.push({
                        partnerId,
                        lastMessage,
                        unreadCount,
                        updatedAt: lastMessage.createdAt
                    });
                }
            }

            // Sắp xếp theo thời gian tin nhắn mới nhất
            conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

            return conversations;
        } catch (error) {
            console.error('Lỗi khi lấy cuộc trò chuyện:', error);
            throw error;
        }
    }
}

// Tạo instance singleton
const messagesService = new MessagesService();
export default messagesService;