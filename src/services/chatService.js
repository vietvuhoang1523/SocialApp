// ChatService.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, DEFAULT_TIMEOUT, DEFAULT_HEADERS, FORM_DATA_HEADERS } from './api';
import messagesService from './messagesService';

class ChatService {
    constructor() {
        this.api = axios.create({
            baseURL: `${BASE_URL}`,
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
     * Lấy danh sách cuộc trò chuyện của người dùng hiện tại
     * @returns {Promise<Array>} - Danh sách cuộc trò chuyện
     */
    async getConversations() {
        try {
            // Lấy thông tin người dùng hiện tại
            const currentUser = await this.getCurrentUser();

            if (!currentUser || !currentUser.id) {
                throw new Error('Không có thông tin người dùng hiện tại');
            }

            console.log(`Đang lấy cuộc trò chuyện của người dùng ${currentUser.id}`);

            // Lấy tin nhắn chưa đọc
            const unreadMessages = await messagesService.getUnreadMessages(currentUser.id);

            // Lấy thông tin từ các API khác để tạo danh sách cuộc trò chuyện
            // (Trong trường hợp thực tế, nên có API riêng cho việc này)
            const userProfiles = await this.getUserProfiles(unreadMessages);

            // Tạo danh sách cuộc trò chuyện từ tin nhắn chưa đọc
            const conversations = this.buildConversationsFromMessages(unreadMessages, userProfiles, currentUser.id);

            return conversations;
        } catch (error) {
            console.error('Lỗi khi lấy danh sách cuộc trò chuyện:', error);
            throw error;
        }
    }

    /**
     * Lấy thông tin hồ sơ của các người dùng từ danh sách tin nhắn
     * @param {Array} messages - Danh sách tin nhắn
     * @returns {Promise<Object>} - Map chứa thông tin người dùng
     */
    async getUserProfiles(messages) {
        try {
            // Lấy ID người dùng duy nhất từ tin nhắn
            const userIds = new Set();
            messages.forEach(msg => {
                userIds.add(msg.senderId);
                userIds.add(msg.receiverId);
            });

            const userProfiles = {};

            // Với mỗi ID, lấy thông tin hồ sơ người dùng
            for (const userId of userIds) {
                try {
                    const response = await this.api.get(`/v1/users/profile/${userId}`);
                    userProfiles[userId] = response.data;
                } catch (profileError) {
                    console.error(`Lỗi khi lấy hồ sơ của người dùng ${userId}:`, profileError);
                    // Tạo hồ sơ mặc định nếu không thể lấy
                    userProfiles[userId] = {
                        id: userId,
                        username: `User ${userId}`,
                        profilePicture: null
                    };
                }
            }

            return userProfiles;
        } catch (error) {
            console.error('Lỗi khi lấy thông tin hồ sơ người dùng:', error);
            return {};
        }
    }

    /**
     * Tạo danh sách cuộc trò chuyện từ danh sách tin nhắn
     * @param {Array} messages - Danh sách tin nhắn
     * @param {Object} userProfiles - Map chứa thông tin người dùng
     * @param {number} currentUserId - ID người dùng hiện tại
     * @returns {Array} - Danh sách cuộc trò chuyện
     */
    buildConversationsFromMessages(messages, userProfiles, currentUserId) {
        // Map để lưu cuộc trò chuyện với mỗi người dùng
        const conversationsMap = {};

        // Xử lý từng tin nhắn
        messages.forEach(msg => {
            // Xác định ID của người trò chuyện với người dùng hiện tại
            const partnerId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId;

            // Nếu chưa có cuộc trò chuyện với người này, tạo mới
            if (!conversationsMap[partnerId]) {
                conversationsMap[partnerId] = {
                    id: partnerId.toString(),
                    user: userProfiles[partnerId] || {
                        id: partnerId,
                        username: `User ${partnerId}`,
                        profilePicture: null
                    },
                    messages: [],
                    unreadCount: 0,
                    lastMessageTime: new Date(0)
                };
            }

            // Thêm tin nhắn vào cuộc trò chuyện
            conversationsMap[partnerId].messages.push(msg);

            // Cập nhật số tin nhắn chưa đọc
            if (msg.receiverId === currentUserId && !msg.read) {
                conversationsMap[partnerId].unreadCount++;
            }

            // Cập nhật thời gian tin nhắn cuối cùng
            const msgTime = new Date(msg.createdAt || msg.timestamp);
            if (msgTime > conversationsMap[partnerId].lastMessageTime) {
                conversationsMap[partnerId].lastMessageTime = msgTime;
                conversationsMap[partnerId].lastMessage = msg.content;
            }
        });

        // Chuyển đổi map thành mảng và sắp xếp theo thời gian tin nhắn cuối cùng
        const conversations = Object.values(conversationsMap)
            .sort((a, b) => b.lastMessageTime - a.lastMessageTime)
            .map(convo => ({
                id: convo.id,
                user: convo.user,
                lastMessage: convo.lastMessage || 'Bắt đầu cuộc trò chuyện',
                time: this.formatTimeAgo(convo.lastMessageTime),
                unread: convo.unreadCount > 0
            }));

        return conversations;
    }

    /**
     * Định dạng thời gian thành chuỗi "thời gian trước"
     * @param {Date} date - Thời gian
     * @returns {string} - Chuỗi thời gian
     */
    formatTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'vừa xong';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}p`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;

        return date.toLocaleDateString('vi-VN');
    }

    /**
     * Lấy thông tin người dùng hiện tại từ AsyncStorage
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
     * Tìm kiếm người dùng
     * @param {string} query - Từ khóa tìm kiếm
     * @returns {Promise<Array>} - Kết quả tìm kiếm
     */
    async searchUsers(query) {
        try {
            console.log(`Đang tìm kiếm người dùng với từ khóa: ${query}`);

            const response = await this.api.get('/v1/users/search', {
                params: {
                    query,
                    page: 0,
                    limit: 20
                }
            });

            console.log('Phản hồi từ API tìm kiếm người dùng:', response.data);
            return response.data;
        } catch (error) {
            console.error('Lỗi khi tìm kiếm người dùng:', error);
            throw error;
        }
    }

    /**
     * Lấy thông tin hồ sơ người dùng
     * @param {number} userId - ID người dùng
     * @returns {Promise<Object>} - Thông tin hồ sơ
     */
    async getUserProfile(userId) {
        try {
            console.log(`Đang lấy thông tin hồ sơ người dùng ${userId}`);

            const response = await this.api.get(`/v1/users/profile/${userId}`);

            console.log('Phản hồi từ API lấy hồ sơ người dùng:', response.data);
            return response.data;
        } catch (error) {
            console.error(`Lỗi khi lấy thông tin hồ sơ người dùng ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Gửi tin nhắn
     * @param {Object} messageData - Dữ liệu tin nhắn
     * @returns {Promise<Object>} - Tin nhắn đã gửi
     */
    async sendMessage(messageData) {
        return messagesService.sendMessage(messageData);
    }

    /**
     * Lấy tin nhắn giữa hai người dùng
     * @param {number} user1Id - ID người dùng thứ nhất
     * @param {number} user2Id - ID người dùng thứ hai
     * @param {Object} pagination - Thông tin phân trang
     * @returns {Promise<Array>} - Danh sách tin nhắn
     */
    async getMessages(user1Id, user2Id, pagination) {
        return messagesService.getMessagesBetweenUsersPaginated(user1Id, user2Id, pagination);
    }

    /**
     * Đánh dấu tin nhắn là đã đọc
     * @param {string} messageId - ID tin nhắn
     * @returns {Promise} - Kết quả
     */
    async markAsRead(messageId) {
        return messagesService.markMessageAsRead(messageId);
    }

    /**
     * Đánh dấu tất cả tin nhắn giữa hai người dùng là đã đọc
     * @param {number} senderId - ID người gửi
     * @param {number} receiverId - ID người nhận
     * @returns {Promise} - Kết quả
     */
    async markAllAsRead(senderId, receiverId) {
        return messagesService.markAllMessagesAsRead(senderId, receiverId);
    }

    /**
     * Tải lên ảnh đính kèm trong tin nhắn (không có trong API - chỉ giả lập)
     * @param {Object} file - File ảnh
     * @returns {Promise<string>} - URL của ảnh đã tải lên
     */
    async uploadAttachment(file) {
        try {
            console.log('Đang tải lên tệp đính kèm:', file);

            const formData = new FormData();
            formData.append('file', {
                uri: file.uri,
                type: file.type || 'image/jpeg',
                name: file.fileName || `attachment_${Date.now()}.jpg`
            });

            // Giả định rằng có một API riêng để tải lên tệp đính kèm
            const response = await this.api.post('/upload', formData, {
                headers: FORM_DATA_HEADERS
            });

            console.log('Phản hồi từ API tải lên tệp đính kèm:', response.data);
            return response.data.url;
        } catch (error) {
            console.error('Lỗi khi tải lên tệp đính kèm:', error);
            throw error;
        }
    }
}

// Tạo instance singleton
const chatService = new ChatService();
export default chatService;