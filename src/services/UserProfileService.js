// UserProfileService.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, DEFAULT_TIMEOUT, DEFAULT_HEADERS, FORM_DATA_HEADERS } from './api';

class UserProfileService {
    constructor() {
        this.api = axios.create({
            baseURL: `${BASE_URL}/v1/users`,
            timeout: DEFAULT_TIMEOUT,
            headers: DEFAULT_HEADERS,
        });

        // Thêm interceptor để gắn token vào mỗi request
        this.api.interceptors.request.use(
            async (config) => {
                const token = await AsyncStorage.getItem('accessToken');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Interceptor để xử lý lỗi 401 và refresh token nếu cần
        this.api.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                // Kiểm tra lỗi 401 (Unauthorized) và chưa thử refresh token
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        // Gọi API refresh token (cần implement)
                        // const refreshToken = await AsyncStorage.getItem('refreshToken');
                        // const response = await AuthService.refreshToken(refreshToken);
                        // Lưu token mới
                        // await AsyncStorage.setItem('accessToken', response.data.accessToken);

                        // Thử lại request ban đầu với token mới
                        // originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
                        // return this.api(originalRequest);

                        // Nếu chưa implement refresh token, set biến để thông báo lỗi auth
                        global.authExpired = true;
                        return Promise.reject(error);
                    } catch (refreshError) {
                        // Xóa token và chuyển đến màn hình đăng nhập
                        global.authExpired = true;
                        return Promise.reject(error);
                    }
                }
                return Promise.reject(error);
            }
        );
    }

    // Lấy thông tin profile của người dùng hiện tại
    async getCurrentUserProfile() {
        try {
            const response = await this.api.get('/profile');
            return response.data;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    // Lấy thông tin profile của người dùng theo ID
    async getUserProfile(userId) {
        try {
            const response = await this.api.get(`/profile/${userId}`);
            return response.data;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    // Cập nhật thông tin profile
    async updateProfile(profileData) {
        try {
            const response = await this.api.put('/profile', profileData);
            return response.data;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    // Tải lên ảnh đại diện
    async uploadProfilePicture(file) {
        try {
            const formData = new FormData();
            formData.append('file', {
                uri: file.uri,
                type: file.type || 'image/jpeg',
                name: file.fileName || 'profile_picture.jpg'
            });

            const response = await this.api.post('/profile-picture', formData, {
                headers: FORM_DATA_HEADERS,
            });
            return response.data;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    // Tải lên ảnh bìa
    async uploadCoverImage(file) {
        try {
            const formData = new FormData();
            formData.append('file', {
                uri: file.uri,
                type: file.type || 'image/jpeg',
                name: file.fileName || 'cover_image.jpg'
            });

            const response = await this.api.post('/cover-image', formData, {
                headers: FORM_DATA_HEADERS,
            });
            return response.data;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    // Lấy cài đặt quyền riêng tư
    async getPrivacySettings() {
        try {
            const response = await this.api.get('/privacy-settings');
            return response.data;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    // Cập nhật cài đặt quyền riêng tư
    async updatePrivacySettings(settings) {
        try {
            const response = await this.api.put('/privacy-settings', settings);
            return response.data;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    // Lấy cài đặt thông báo
    async getNotificationSettings() {
        try {
            const response = await this.api.get('/notification-settings');
            return response.data;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    // Cập nhật cài đặt thông báo
    async updateNotificationSettings(settings) {
        try {
            const response = await this.api.put('/notification-settings', settings);
            return response.data;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    // Lấy URL xem file (ảnh đại diện, ảnh bìa, v.v.) - ĐÃ SỬA
    getFileUrl(bucketName, path) {
        // Thêm /v1/users vào đường dẫn
        return `${BASE_URL}/api/files/image?bucketName=${encodeURIComponent(bucketName)}&path=${encodeURIComponent(path)}`;
    }
    // Phương thức tìm kiếm người dùng
    async searchUsers(query, page = 0, limit = 20) {
        try {
            const response = await this.api.get('/search', {
                params: {
                    query: query,
                    page: page,
                    limit: limit
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error searching users:', error);
            throw error;
        }
    }

    // Xử lý lỗi chung
    handleError(error) {
        console.error('API Error:', error);
        if (error.response) {
            // Xử lý lỗi từ response server
            console.error('Error data:', error.response.data);
            console.error('Error status:', error.response.status);

            // Kiểm tra lỗi 401 (Unauthorized)
            if (error.response.status === 401) {
                global.authExpired = true;
            }
        } else if (error.request) {
            // Request đã được gửi nhưng không nhận được response
            console.error('No response received:', error.request);
        } else {
            // Lỗi khi setting up request
            console.error('Error message:', error.message);
        }
    }


}

// Export instance thay vì class để có thể gọi method trực tiếp
const userProfileService = new UserProfileService();
export default userProfileService;
