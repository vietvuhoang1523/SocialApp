// FriendService.js - Dựa trên ConnectionController
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, DEFAULT_TIMEOUT, DEFAULT_HEADERS } from './api';

class FriendService {
    constructor() {
        this.api = axios.create({
            baseURL: `${BASE_URL}/v1/connections`,
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
                        global.authExpired = true;
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    /**
     * Gửi lời mời kết bạn qua email
     * @param {string} receiverEmail - Email của người nhận lời mời
     * @returns {Promise} Kết quả gửi lời mời
     */
    async sendFriendRequestByEmail(receiverEmail) {
        try {
            console.log('Đang gửi lời mời kết bạn tới:', receiverEmail);

            const response = await this.api.post('/send-request-by-email', null, {
                params: { receiverEmail }
            });

            console.log('Phản hồi từ API gửi lời mời:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error sending friend request by email:', error);
            throw error;
        }
    }

    /**
     * Gửi lời mời kết bạn theo user ID
     * @param {number} userId - ID của người nhận lời mời
     * @returns {Promise} Kết quả gửi lời mời
     */
    async sendFriendRequestById(userId) {
        try {
            console.log('Đang gửi lời mời kết bạn tới user ID:', userId);

            const response = await this.api.post(`/send-request/${userId}`);

            console.log('Phản hồi từ API gửi lời mời:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error sending friend request by ID:', error);
            throw error;
        }
    }

    /**
     * Chấp nhận yêu cầu kết bạn
     * @param {number} friendshipId - ID của yêu cầu kết bạn
     * @returns {Promise} Kết quả chấp nhận yêu cầu
     */
    async acceptFriendRequest(friendshipId) {
        try {
            const response = await this.api.put(`/accept/${friendshipId}`);
            return response.data;
        } catch (error) {
            console.error('Error accepting friend request:', error);
            throw error;
        }
    }

    /**
     * Từ chối yêu cầu kết bạn
     * @param {number} friendshipId - ID của yêu cầu kết bạn
     * @returns {Promise} Kết quả từ chối yêu cầu
     */
    async rejectFriendRequest(friendshipId) {
        try {
            const response = await this.api.delete(`/reject/${friendshipId}`);
            return response.data;
        } catch (error) {
            console.error('Error rejecting friend request:', error);
            throw error;
        }
    }

    /**
     * Lấy danh sách bạn bè
     * @returns {Promise} Danh sách bạn bè
     */
    async getFriends() {
        try {
            console.log('🔄 Calling getFriends API...');
            const response = await this.api.get('/friends');
            console.log('✅ Friends API response:', JSON.stringify(response.data, null, 2));
            return response.data;
        } catch (error) {
            console.error('❌ Error getting friends:', error);
            console.error('❌ Error details:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Lấy danh sách yêu cầu kết bạn đã gửi
     * @returns {Promise} Danh sách yêu cầu đã gửi
     */
    async getSentFriendRequests() {
        try {
            const response = await this.api.get('/requests/sent');
            return response.data;
        } catch (error) {
            console.error('Error getting sent friend requests:', error);
            throw error;
        }
    }
    // Phương thức lấy danh sách yêu cầu kết bạn đang chờ
    async getPendingFriendRequests() {
        try {
            const response = await this.api.get('/requests/sent');
            return response.data;
        } catch (error) {
            console.error('Error fetching pending friend requests:', error);
            throw error;
        }
    }

    /**
     * Lấy danh sách yêu cầu kết bạn đã nhận
     * @returns {Promise} Danh sách yêu cầu đã nhận
     */
    async getReceivedFriendRequests() {
        try {
            const response = await this.api.get('/requests/received');
            return response.data;
        } catch (error) {
            console.error('Error getting received friend requests:', error);
            throw error;
        }
    }

    /**
     * Hủy kết bạn (thêm phương thức này mặc dù không có trong controller)
     * @param {number} userId - ID của người dùng muốn hủy kết bạn
     * @returns {Promise} Kết quả hủy kết bạn
     */
    async unfriend(userId) {
        try {
            // Giả sử endpoint này tồn tại trên backend
            const response = await this.api.delete(`/friends/${userId}`);
            return response.data;
        } catch (error) {
            console.error('Error unfriending:', error);
            throw error;
        }
    }

    /**
     * Kiểm tra trạng thái bạn bè cho 1 user - An toàn hơn
     * @param {number} userId - ID của người dùng cần kiểm tra
     * @returns {Promise<string>} Trạng thái bạn bè
     */
    async checkSingleFriendStatus(userId) {
        try {
            console.log('🔍 Checking single friend status for user:', userId);
            
            // Sử dụng batch API với 1 user
            const statusMap = await this.getBatchFriendshipStatus([userId]);
            const status = statusMap[userId] || 'NOT_FRIEND';
            
            console.log('✅ Single friend status:', status);
            return status;
            
        } catch (error) {
            console.error('❌ Error checking single friend status:', error);
            return 'NOT_FRIEND';
        }
    }

    /**
     * Kiểm tra trạng thái bạn bè
     * @param {number} userId - ID của người dùng cần kiểm tra
     * @returns {Promise<string>} Trạng thái bạn bè
     */
    async checkFriendStatus(userId) {
        try {
            console.log('🔍 Checking friend status for user:', userId);
            
            // Sử dụng single method mới
            return await this.checkSingleFriendStatus(userId);
            
        } catch (error) {
            console.error('❌ Error in checkFriendStatus:', error);
            return 'NOT_FRIEND';
        }
    }

    // Trong FriendService.js

// Thêm phương thức tìm kiếm người dùng theo email
    async findUserByEmail(email) {
        try {
            const response = await this.api.get('/find-user-by-email', {
                params: { email }
            });
            return response.data;
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    }



    /**
     * Hủy yêu cầu kết bạn đã gửi
     * @param {number} friendshipId - ID của friendship record
     * @returns {Promise} Kết quả hủy yêu cầu
     */
    async cancelFriendRequest(friendshipId) {
        try {
            console.log('Đang hủy yêu cầu kết bạn ID:', friendshipId);

            const response = await this.api.delete(`/cancel-request/${friendshipId}`);

            console.log('Phản hồi từ API hủy lời mời:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error canceling friend request:', error);
            throw error;
        }
    }

    /**
     * Lấy trạng thái kết bạn hàng loạt cho nhiều user
     * @param {Array<number>} userIds - Danh sách ID người dùng cần kiểm tra
     * @returns {Promise<Object>} Object mapping userId -> status
     */
    async getBatchFriendshipStatus(userIds) {
        try {
            console.log('🔍 Checking friendship status for users:', userIds);
            
            const response = await this.api.post('/batch-status', {
                userIds: userIds
            });
            
            console.log('✅ Batch friendship status response:', response.data);
            return response.data.data || response.data;
        } catch (error) {
            console.error('❌ Error getting batch friendship status:', error);
            
            // Fallback: Return NOT_FRIEND for all users to avoid calling checkFriendStatus (infinite loop)
            console.log('⚠️ Using fallback: setting all users as NOT_FRIEND');
            const statusMap = {};
            for (const userId of userIds) {
                statusMap[userId] = 'NOT_FRIEND';
            }
            return statusMap;
        }
    }
}

// Export instance thay vì class để có thể gọi method trực tiếp
const friendService = new FriendService();
export default friendService;
