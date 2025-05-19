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
            // const response = await this.api.get('/friends');
            // return response.data;
            // Đảm bảo endpoint này trả về danh sách bạn bè, không phải posts
            console.log('Calling friends API...');
            const response = await this.api.get('/friends'); // Kiểm tra lại endpoint này
            console.log('Response from friends API:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error getting friends:', error);
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
     * Kiểm tra trạng thái bạn bè
     * @param {number} userId - ID của người dùng cần kiểm tra
     * @returns {Promise<string>} Trạng thái bạn bè
     */
    async checkFriendStatus(userId) {
        try {
            // Giả sử endpoint này tồn tại trên backend
            const response = await this.api.get(`/status/${userId}`);
            return response.data.status;
        } catch (error) {
            console.error('Error checking friend status:', error);

            // Nếu API không tồn tại, tự xác định bằng các API khác
            try {
                // Kiểm tra danh sách bạn bè
                const friends = await this.getFriends();
                if (friends.some(friend => friend.userId === userId || friend.friendId === userId)) {
                    return 'FRIEND';
                }

                // Kiểm tra yêu cầu đã gửi
                const sentRequests = await this.getSentFriendRequests();
                if (sentRequests.some(request => request.receiverId === userId)) {
                    return 'PENDING';
                }

                // Kiểm tra yêu cầu đã nhận
                const receivedRequests = await this.getReceivedFriendRequests();
                if (receivedRequests.some(request => request.senderId === userId)) {
                    return 'RECEIVED';
                }

                // Mặc định không phải bạn bè
                return 'NOT_FRIEND';
            } catch (statusError) {
                console.error('Error determining friend status manually:', statusError);
                return 'NOT_FRIEND';
            }
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
     * @param {number} userId - ID của người dùng đã gửi yêu cầu
     * @returns {Promise} Kết quả hủy yêu cầu
     */
    async cancelFriendRequest(userId) {
        try {
            // Đầu tiên tìm ID của yêu cầu kết bạn
            const sentRequests = await this.getSentFriendRequests();
            const request = sentRequests.find(req => req.receiverId === userId);

            if (!request) {
                throw new Error('Không tìm thấy yêu cầu kết bạn');
            }

            // Sau đó gọi API từ chối để hủy yêu cầu
            const response = await this.api.delete(`/reject/${request.id}`);
            return response.data;
        } catch (error) {
            console.error('Error canceling friend request:', error);
            throw error;
        }
    }
}

export default FriendService;
