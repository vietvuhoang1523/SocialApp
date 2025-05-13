import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Config from './config';

class UserProfileService {
    constructor() {
        // Lấy địa chỉ API từ config.js
        this.API_URL = Config.extra.apiUrl + '/v1';
    }

    // Lấy header xác thực
    async getAuthHeader() {
        try {
            const token = await AsyncStorage.getItem('userToken');
            return {
                'Authorization': `Bearer ${token}`
            };
        } catch (error) {
            console.error('Lỗi lấy token:', error);
            throw new Error('Không thể lấy token xác thực');
        }
    }

    // Lấy thông tin hồ sơ người dùng hiện tại
    async getCurrentUserProfile() {
        try {
            const headers = await this.getAuthHeader();
            const response = await axios.get(`${this.API_URL}/users/profile`, { headers });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    // Lấy thông tin hồ sơ người dùng khác theo ID
    async getUserProfile(userId) {
        try {
            const headers = await this.getAuthHeader();
            const response = await axios.get(`${this.API_URL}/users/profile/${userId}`, { headers });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    // Cập nhật thông tin hồ sơ
    async updateProfile(profileData) {
        try {
            const headers = await this.getAuthHeader();
            const response = await axios.put(`${this.API_URL}/users/profile`, profileData, {
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    // Tải ảnh đại diện
    async uploadProfilePicture(file) {
        try {
            const headers = await this.getAuthHeader();

            // Tạo FormData để tải ảnh
            const formData = new FormData();
            formData.append('file', {
                uri: file.uri,
                type: file.type || 'image/jpeg',
                name: file.fileName || 'profile-picture.jpg'
            });

            const response = await axios.post(`${this.API_URL}/users/profile-picture`, formData, {
                headers: {
                    ...headers,
                    'Content-Type': 'multipart/form-data'
                }
            });

            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    // Tải ảnh bìa
    async uploadCoverImage(file) {
        try {
            const headers = await this.getAuthHeader();

            // Tạo FormData để tải ảnh
            const formData = new FormData();
            formData.append('file', {
                uri: file.uri,
                type: file.type || 'image/jpeg',
                name: file.fileName || 'cover-image.jpg'
            });

            const response = await axios.post(`${this.API_URL}/users/cover-image`, formData, {
                headers: {
                    ...headers,
                    'Content-Type': 'multipart/form-data'
                }
            });

            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    // Lấy cài đặt quyền riêng tư
    async getPrivacySettings() {
        try {
            const headers = await this.getAuthHeader();
            const response = await axios.get(`${this.API_URL}/users/privacy-settings`, { headers });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    // Cập nhật cài đặt quyền riêng tư
    async updatePrivacySettings(settingsData) {
        try {
            const headers = await this.getAuthHeader();
            const response = await axios.put(`${this.API_URL}/users/privacy-settings`, settingsData, {
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    // Lấy cài đặt thông báo
    async getNotificationSettings() {
        try {
            const headers = await this.getAuthHeader();
            const response = await axios.get(`${this.API_URL}/users/notification-settings`, { headers });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    // Cập nhật cài đặt thông báo
    async updateNotificationSettings(settingsData) {
        try {
            const headers = await this.getAuthHeader();
            const response = await axios.put(`${this.API_URL}/users/notification-settings`, settingsData, {
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    // Xử lý lỗi
    handleError(error) {
        if (error.response) {
            // Máy chủ trả về lỗi
            console.error('Lỗi từ máy chủ:', error.response.data);
            console.error('Trạng thái:', error.response.status);

            // Kiểm tra nếu là lỗi xác thực (401)
            if (error.response.status === 401) {
                // Gọi hàm xử lý lỗi xác thực
                this.handleAuthError();
                throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
            }

            throw new Error(error.response.data.message || 'Đã có lỗi xảy ra');
        } else if (error.request) {
            // Không nhận được phản hồi từ máy chủ
            console.error('Yêu cầu:', error.request);
            throw new Error('Không thể kết nối đến máy chủ');
        } else {
            // Lỗi khác
            console.error('Lỗi:', error.message);
            throw new Error('Đã có lỗi xảy ra');
        }
    }

    // Xử lý lỗi xác thực
    async handleAuthError() {
        try {
            // Thử làm mới token
            const AuthService = require('./AuthService').default;
            await AuthService.refreshToken();
        } catch (refreshError) {
            // Nếu không thể làm mới token, đăng xuất người dùng
            const AuthService = require('./AuthService').default;
            await AuthService.logout();

            // Thông báo cho ứng dụng biết phiên đăng nhập đã hết hạn
            // Đây là một cách đơn giản để thông báo, có thể sử dụng EventEmitter hoặc Context API
            global.authExpired = true;
        }
    }
}

export default UserProfileService;
