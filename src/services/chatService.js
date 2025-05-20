// ChatService.js - Cập nhật (tiếp)
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, DEFAULT_TIMEOUT, DEFAULT_HEADERS, FORM_DATA_HEADERS } from './api';
import messagesService from './messagesService';

class ChatService {
    constructor() {
        this.api = axios.create({
            baseURL: `${BASE_URL}`,  // Cập nhật baseURL để phù hợp với API của backend
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
                // Xử lý dữ liệu trả về để đảm bảo tính nhất quán
                let responseData = response.data;

                // Nếu dữ liệu được đóng gói trong field "data"
                if (responseData && responseData.data !== undefined) {
                    responseData = responseData.data;
                }

                return responseData;
            },
            async (error) => {
                console.error('API Error:', error);

                if (error.response) {
                    // Kiểm tra lỗi 401 (Unauthorized)
                    if (error.response.status === 401) {
                        // Xử lý refresh token và thử lại request
                        try {
                            const originalRequest = error.config;
                            if (!originalRequest._retry) {
                                originalRequest._retry = true;
                                const refreshToken = await AsyncStorage.getItem('refreshToken');
                                if (refreshToken) {
                                    const response = await this.refreshToken(refreshToken);
                                    const newToken = response.token || response.data?.token;
                                    if (newToken) {
                                        await AsyncStorage.setItem('accessToken', newToken);
                                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                                        return this.api(originalRequest);
                                    }
                                }
                            }
                        } catch (refreshError) {
                            console.error('Token refresh failed:', refreshError);
                            this.handleAuthFailure();
                        }
                    }
                }

                return Promise.reject(this.normalizeError(error));
            }
        );
    }

    /**
     * Xử lý khi xác thực thất bại
     */
    handleAuthFailure() {
        // Đánh dấu là đã hết hạn authentication
        global.authExpired = true;

        // Có thể thực hiện chuyển hướng đến màn hình đăng nhập
        // Hoặc thông báo cho người dùng
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

            // Thử gọi API chuyên biệt cho cuộc trò chuyện trước
            try {
                const conversations = await this.api.get('/messages/conversations');
                return this.normalizeConversations(conversations);
            } catch (apiError) {
                console.log('API chuyên biệt không có hoặc gặp lỗi, sử dụng phương pháp thay thế');

                // Phương pháp thay thế: Tạo cuộc trò chuyện từ tin nhắn
                // Lấy tin nhắn chưa đọc và tất cả cuộc trò chuyện gần đây
                const [unreadMessages, recentMessages] = await Promise.all([
                    messagesService.getUnreadMessages(currentUser.id),
                    this.getRecentMessages(currentUser.id)
                ]);

                // Kết hợp và lọc dữ liệu để tạo danh sách cuộc trò chuyện
                const allMessages = [...unreadMessages, ...recentMessages];
                const userProfiles = await this.getUserProfiles(allMessages);
                return this.buildConversationsFromMessages(allMessages, userProfiles, currentUser.id);
            }
        } catch (error) {
            console.error('Lỗi khi lấy danh sách cuộc trò chuyện:', error);
            return []; // Trả về mảng rỗng nếu có lỗi
        }
    }

    /**
     * Lấy tin nhắn gần đây cho tất cả cuộc trò chuyện
     * @param {number} userId - ID người dùng
     * @returns {Promise<Array>} - Danh sách tin nhắn gần đây
     */
    async getRecentMessages(userId) {
        try {
            // Đầu tiên lấy danh sách bạn bè
            const friendService = await import('./FriendService').then(module => module.default);
            const friendsData = await friendService.getFriends();

            // Xác định danh sách bạn bè
            let friendIds = [];

            if (Array.isArray(friendsData)) {
                friendIds = friendsData
                    .filter(friend => friend && (friend.sender || friend.receiver))
                    .map(friend => {
                        // Xác định ID của bạn bè
                        const isCurrentUserSender = friend.sender && friend.sender.id === userId;
                        return isCurrentUserSender ? friend.receiver.id : friend.sender.id;
                    });
            }

            // Nếu không có bạn bè, trả về mảng rỗng
            if (friendIds.length === 0) {
                return [];
            }

            // Lấy tin nhắn gần đây từ mỗi người bạn
            const recentMessages = [];
            const messagesToFetch = Math.min(friendIds.length, 10); // Giới hạn số lượng yêu cầu

            for (let i = 0; i < messagesToFetch; i++) {
                try {
                    const messages = await messagesService.getMessagesBetweenUsersPaginated(
                        userId,
                        friendIds[i],
                        { page: 0, size: 1 } // Chỉ lấy tin nhắn gần đây nhất
                    );

                    if (messages && messages.content && messages.content.length > 0) {
                        recentMessages.push(messages.content[0]);
                    }
                } catch (error) {
                    console.warn(`Không thể lấy tin nhắn với người dùng ${friendIds[i]}:`, error);
                }
            }

            return recentMessages;
        } catch (error) {
            console.error('Lỗi khi lấy tin nhắn gần đây:', error);
            return [];
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
                if (msg.senderId) userIds.add(msg.senderId);
                if (msg.receiverId) userIds.add(msg.receiverId);
            });

            const userProfiles = {};

            // Trước tiên, kiểm tra trong cache
            for (const userId of userIds) {
                const cachedProfile = await this.getCachedUserProfile(userId);
                if (cachedProfile) {
                    userProfiles[userId] = cachedProfile;
                    userIds.delete(userId);
                }
            }

            // Nếu còn userIds chưa có trong cache, gọi API
            if (userIds.size > 0) {
                // Tạo danh sách promise cho các yêu cầu API
                const userPromises = Array.from(userIds).map(async (userId) => {
                    try {
                        const profile = await this.getUserProfile(userId);
                        // Lưu vào cache
                        await this.cacheUserProfile(userId, profile);
                        return { userId, profile };
                    } catch (error) {
                        console.error(`Lỗi khi lấy thông tin người dùng ${userId}:`, error);
                        // Trả về hồ sơ mặc định
                        return {
                            userId,
                            profile: {
                                id: userId,
                                username: `User ${userId}`,
                                profilePicture: null
                            }
                        };
                    }
                });

                // Chờ tất cả các yêu cầu hoàn thành
                const userResults = await Promise.all(userPromises);

                // Thêm vào đối tượng userProfiles
                userResults.forEach(({ userId, profile }) => {
                    userProfiles[userId] = profile;
                });
            }

            return userProfiles;
        } catch (error) {
            console.error('Lỗi khi lấy thông tin hồ sơ người dùng:', error);
            return {};
        }
    }

    /**
     * Lấy thông tin người dùng từ cache
     * @param {number} userId - ID người dùng
     * @returns {Promise<Object|null>} - Thông tin người dùng hoặc null
     */
    async getCachedUserProfile(userId) {
        try {
            const cacheKey = `user_profile_${userId}`;
            const cachedData = await AsyncStorage.getItem(cacheKey);
            if (cachedData) {
                const profile = JSON.parse(cachedData);
                const cachedTime = profile._cachedAt || 0;
                const now = Date.now();

                // Kiểm tra cache còn hiệu lực không (24 giờ)
                if (now - cachedTime < 24 * 60 * 60 * 1000) {
                    delete profile._cachedAt; // Xóa trường metadata
                    return profile;
                }
            }
            return null;
        } catch (error) {
            console.error('Lỗi khi lấy cache người dùng:', error);
            return null;
        }
    }

    /**
     * Lưu thông tin người dùng vào cache
     * @param {number} userId - ID người dùng
     * @param {Object} profile - Thông tin người dùng
     */
    async cacheUserProfile(userId, profile) {
        try {
            const cacheKey = `user_profile_${userId}`;
            // Thêm thời gian cache
            const profileWithTimestamp = {
                ...profile,
                _cachedAt: Date.now()
            };
            await AsyncStorage.setItem(cacheKey, JSON.stringify(profileWithTimestamp));
        } catch (error) {
            console.error('Lỗi khi lưu cache người dùng:', error);
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
            const partnerId = msg.senderId == currentUserId ? msg.receiverId : msg.senderId;

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
            if (msg.receiverId == currentUserId && !msg.read) {
                conversationsMap[partnerId].unreadCount++;
            }

            // Cập nhật thời gian tin nhắn cuối cùng
            const msgTime = new Date(msg.createdAt || msg.timestamp);
            if (msgTime > conversationsMap[partnerId].lastMessageTime) {
                conversationsMap[partnerId].lastMessageTime = msgTime;
                conversationsMap[partnerId].lastMessage = msg.content || '(Không có nội dung)';
            }
        });

        // Chuyển đổi map thành mảng và sắp xếp theo thời gian tin nhắn cuối cùng
        const conversations = Object.values(conversationsMap)
            .sort((a, b) => b.lastMessageTime - a.lastMessageTime)
            .map(convo => ({
                id: convo.id,
                user: {
                    id: convo.user.id,
                    username: convo.user.username || convo.user.fullName || `User ${convo.user.id}`,
                    profilePicture: convo.user.profilePicture || convo.user.avatarUrl
                },
                lastMessage: convo.lastMessage || 'Bắt đầu cuộc trò chuyện',
                time: this.formatTimeAgo(convo.lastMessageTime),
                unread: convo.unreadCount > 0
            }));

        return conversations;
    }

    /**
     * Chuẩn hóa dữ liệu cuộc trò chuyện
     * @param {Array|Object} conversations - Dữ liệu cuộc trò chuyện từ API
     * @returns {Array} - Dữ liệu cuộc trò chuyện đã chuẩn hóa
     */
    normalizeConversations(conversations) {
        // Kiểm tra và chuyển đổi conversations thành mảng
        let conversationList = [];

        if (Array.isArray(conversations)) {
            conversationList = conversations;
        } else if (conversations && conversations.content && Array.isArray(conversations.content)) {
            conversationList = conversations.content;
        } else if (conversations && typeof conversations === 'object') {
            // Chuyển đổi Object thành Array nếu cần
            conversationList = [conversations];
        }

        // Chuẩn hóa định dạng dữ liệu
        return conversationList.map(conv => {
            const partner = conv.partner || {};
            const lastMessage = conv.lastMessage || {};

            return {
                id: conv.id || partner.id?.toString() || Math.random().toString(),
                user: {
                    id: partner.id?.toString(),
                    username: partner.fullName || partner.username || `User ${partner.id}`,
                    profilePicture: partner.avatarUrl || partner.profilePicture
                },
                lastMessage: lastMessage.content || conv.lastMessageText || 'Bắt đầu cuộc trò chuyện',
                time: this.formatTimeAgo(conv.lastActivity || lastMessage.timestamp || lastMessage.createdAt || new Date()),
                unread: (conv.unreadCount > 0) || conv.hasUnread || false
            };
        });
    }

    /**
     * Định dạng thời gian thành chuỗi "thời gian trước"
     * @param {Date|string} date - Thời gian
     * @returns {string} - Chuỗi thời gian
     */
    formatTimeAgo(date) {
        if (!date) return '';

        const now = new Date();
        const messageDate = typeof date === 'string' ? new Date(date) : date;
        const diffInSeconds = Math.floor((now - messageDate) / 1000);

        if (diffInSeconds < 60) return 'vừa xong';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}p`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;

        return messageDate.toLocaleDateString('vi-VN');
    }

    /**
     * Lấy thông tin người dùng hiện tại từ AsyncStorage
     * @returns {Promise<Object|null>} - Thông tin người dùng hoặc null
     */
    async getCurrentUser() {
        try {
            // Thử lấy từ userData
            const userData = await AsyncStorage.getItem('userData');
            if (userData) {
                return JSON.parse(userData);
            }

            // Nếu không có, thử lấy từ userProfile
            const userProfile = await AsyncStorage.getItem('userProfile');
            if (userProfile) {
                return JSON.parse(userProfile);
            }

            return null;
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

            const response = await this.api.get('/users/search', {
                params: {
                    keyword: query,
                    query,
                    page: 0,
                    size: 20
                }
            });

            return this.normalizeSearchResults(response);
        } catch (error) {
            console.error('Lỗi khi tìm kiếm người dùng:', error);
            return { content: [] }; // Trả về đối tượng với mảng rỗng
        }
    }

    /**
     * Chuẩn hóa kết quả tìm kiếm người dùng
     * @param {Array|Object} results - Kết quả tìm kiếm
     * @returns {Object} - Kết quả tìm kiếm chuẩn hóa
     */
    normalizeSearchResults(results) {
        // Xử lý trường hợp không có kết quả
        if (!results) return { content: [] };

        // Xử lý trường hợp results là mảng
        if (Array.isArray(results)) {
            return {
                content: results.map(user => this.normalizeUserProfile(user))
            };
        }

        // Xử lý trường hợp results có thuộc tính content
        if (results.content && Array.isArray(results.content)) {
            return {
                ...results,
                content: results.content.map(user => this.normalizeUserProfile(user))
            };
        }

        // Xử lý trường hợp results là một đối tượng
        if (typeof results === 'object') {
            return {
                content: [this.normalizeUserProfile(results)]
            };
        }

        return { content: [] };
    }

    /**
     * Chuẩn hóa thông tin người dùng
     * @param {Object} user - Thông tin người dùng
     * @returns {Object} - Thông tin người dùng chuẩn hóa
     */
    normalizeUserProfile(user) {
        if (!user) return null;

        return {
            id: user.id?.toString(),
            username: user.username || user.fullName || user.displayName || `User ${user.id}`,
            fullName: user.fullName || user.displayName || user.username || `User ${user.id}`,
            profilePicture: user.profilePicture || user.avatarUrl,
            email: user.email || '',
            online: user.online || false,
            lastActive: user.lastActive || null
        };
    }

    /**
     * Lấy thông tin hồ sơ người dùng
     * @param {number} userId - ID người dùng
     * @returns {Promise<Object>} - Thông tin hồ sơ
     */
    async getUserProfile(userId) {
        try {
            console.log(`Đang lấy thông tin hồ sơ người dùng ${userId}`);

            // Thử lấy từ cache trước
            const cachedProfile = await this.getCachedUserProfile(userId);
            if (cachedProfile) {
                return cachedProfile;
            }

            // Nếu không có trong cache, gọi API
            const response = await this.api.get(`/users/profile/${userId}`);
            const profile = this.normalizeUserProfile(response);

            // Lưu vào cache
            await this.cacheUserProfile(userId, profile);

            return profile;
        } catch (error) {
            console.error(`Lỗi khi lấy thông tin hồ sơ người dùng ${userId}:`, error);
            return {
                id: userId,
                username: `User ${userId}`,
                profilePicture: null
            };
        }
    }

    /**
     * Tải lên ảnh đính kèm trong tin nhắn
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

            // Gọi API tải lên
            const response = await this.api.post('/upload', formData, {
                headers: FORM_DATA_HEADERS
            });

            // Xử lý phản hồi
            let attachmentUrl = '';
            if (response && typeof response === 'string') {
                attachmentUrl = response;
            } else if (response && response.url) {
                attachmentUrl = response.url;
            } else if (response && response.data && response.data.url) {
                attachmentUrl = response.data.url;
            }

            console.log('Tệp đính kèm đã được tải lên:', attachmentUrl);
            return attachmentUrl;
        } catch (error) {
            console.error('Lỗi khi tải lên tệp đính kèm:', error);

            // Trong môi trường development, tạo URL giả
            if (__DEV__) {
                return file.uri; // Sử dụng URL cục bộ
            }

            throw error;
        }
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
const chatService = new ChatService();
export default chatService;