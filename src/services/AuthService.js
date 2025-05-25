// AuthService.js - Updated phần WebSocket connection
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, DEFAULT_TIMEOUT, DEFAULT_HEADERS } from './api';
import webSocketService from './WebSocketService';

class AuthService {
    constructor() {
        this.api = axios.create({
            baseURL: `${BASE_URL}/auth`,
            timeout: DEFAULT_TIMEOUT,
            headers: DEFAULT_HEADERS,
        });
        this._isAuthenticated = false;
        this.checkInitialAuthStatus();
    }

    // Kiểm tra trạng thái xác thực ban đầu khi khởi tạo
    async checkInitialAuthStatus() {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            this._isAuthenticated = !!token;
        } catch (error) {
            console.error('Initial auth status check failed:', error);
            this._isAuthenticated = false;
        }
    }

    // Phương thức async để kiểm tra chi tiết
    async checkAuthentication() {
        try {
            const token = await AsyncStorage.getItem('accessToken');

            if (!token) {
                this._isAuthenticated = false;
                return false;
            }

            // Kiểm tra token với backend (nếu cần)
            try {
                const response = await this.api.post('/introspect', { token });
                this._isAuthenticated = response.data.valid === true;
                return this._isAuthenticated;
            } catch (introspectError) {
                console.error('Token introspection error:', introspectError);
                this._isAuthenticated = false;
                return false;
            }
        } catch (error) {
            console.error('Authentication check failed:', error);
            this._isAuthenticated = false;
            return false;
        }
    }

    // Phương thức instance đồng bộ
    isAuthenticated() {
        return this._isAuthenticated;
    }

    updateAuthStatus(status) {
        this._isAuthenticated = status;
    }

    /**
     * Đăng ký người dùng mới
     */
    async register(userData) {
        try {
            console.log('Đang gọi API đăng ký với email:', userData.email);

            const response = await this.api.post('/register', userData);

            console.log('Phản hồi từ API đăng ký:', response.data);
            return response.data;
        } catch (error) {
            console.error('Register error:', error);
            if (error.response) {
                console.error('Error status:', error.response.status);
                console.error('Error data:', error.response.data);
            }
            throw error;
        }
    }

    /**
     * Đăng nhập người dùng bằng email và mật khẩu
     */
    async login(email, password) {
        try {
            console.log('Đang gọi API đăng nhập với email:', email);

            const response = await this.api.post('/login', {
                email,
                password
            });

            console.log('Phản hồi từ API đăng nhập:', response.data);

            // Kiểm tra cấu trúc phản hồi từ server
            let tokenData = response.data;

            // Nếu dữ liệu lồng trong đối tượng authentication
            if (response.data.authentication) {
                tokenData = response.data.authentication;
            }

            // Xác định token
            const accessToken = tokenData.token || tokenData.accessToken;

            // Nếu token tồn tại, lưu vào AsyncStorage
            if (accessToken) {
                console.log('Lưu access token:', accessToken);
                await AsyncStorage.setItem('accessToken', accessToken);

                // Lưu loại token (nếu có)
                if (tokenData.tokenType) {
                    await AsyncStorage.setItem('tokenType', tokenData.tokenType);
                }

                // Lưu refresh token (nếu có)
                if (tokenData.refreshToken) {
                    console.log('Lưu refresh token');
                    await AsyncStorage.setItem('refreshToken', tokenData.refreshToken);
                }

                // Lưu thông tin người dùng (nếu có)
                if (tokenData.user) {
                    console.log('Lưu thông tin người dùng');
                    await AsyncStorage.setItem('userData', JSON.stringify(tokenData.user));
                }

                // Cập nhật trạng thái authentication
                this._isAuthenticated = true;

                // Log lại token sau khi lưu để kiểm tra
                const savedToken = await AsyncStorage.getItem('accessToken');
                console.log('Token sau khi lưu:', savedToken);

                // Sau khi đăng nhập thành công, kết nối WebSocket
                try {
                    console.log('Bắt đầu kết nối WebSocket sau khi đăng nhập...');
                    await webSocketService.connect();
                    console.log('WebSocket connected successfully after login');
                } catch (wsError) {
                    console.error('Failed to connect WebSocket after login:', wsError);
                    // Không throw error vì login đã thành công
                    // Có thể thử kết nối lại sau
                    setTimeout(() => {
                        webSocketService.connect().catch(retryError => {
                            console.error('WebSocket retry connection failed:', retryError);
                        });
                    }, 3000);
                }
            } else {
                console.error('Không tìm thấy token trong phản hồi');
            }

            return response.data;
        } catch (error) {
            console.error('Login error:', error);
            this._isAuthenticated = false;

            // Log chi tiết lỗi để debug
            if (error.response) {
                console.error('Error status:', error.response.status);
                console.error('Error data:', error.response.data);
            } else if (error.request) {
                console.error('No response received:', error.request);
            } else {
                console.error('Error message:', error.message);
            }

            throw error;
        }
    }

    /**
     * Xác minh tài khoản với mã xác nhận
     */
    async verifyAccount(email, verificationCode) {
        try {
            console.log('Đang gọi API xác minh tài khoản:', email);

            const response = await this.api.post('/verify', {
                email,
                verificationCode
            });

            console.log('Phản hồi từ API xác minh:', response.data);
            return response.data;
        } catch (error) {
            console.error('Verification error:', error);
            if (error.response) {
                console.error('Error status:', error.response.status);
                console.error('Error data:', error.response.data);
            }
            throw error;
        }
    }

    /**
     * Gửi lại mã xác minh
     */
    async resendVerificationCode(email) {
        try {
            console.log('Đang gọi API gửi lại mã xác minh cho:', email);

            const response = await this.api.post('/resend-verification', {
                email
            });

            console.log('Phản hồi từ API gửi lại mã:', response.data);
            return response.data;
        } catch (error) {
            console.error('Resend verification error:', error);
            if (error.response) {
                console.error('Error status:', error.response.status);
                console.error('Error data:', error.response.data);
            }
            throw error;
        }
    }

    /**
     * Yêu cầu đặt lại mật khẩu
     */
    async requestPasswordReset(email) {
        try {
            console.log('Đang gọi API yêu cầu đặt lại mật khẩu cho:', email);

            const response = await this.api.post('/forgot-password', {
                email
            });

            console.log('Phản hồi từ API yêu cầu đặt lại mật khẩu:', response.data);
            return response.data;
        } catch (error) {
            console.error('Password reset request error:', error);
            if (error.response) {
                console.error('Error status:', error.response.status);
                console.error('Error data:', error.response.data);
            }
            throw error;
        }
    }

    /**
     * Đặt lại mật khẩu với mã xác nhận
     */
    async resetPassword(email, resetToken, newPassword) {
        try {
            console.log('Đang gọi API đặt lại mật khẩu cho:', email);

            const response = await this.api.post('/reset-password', {
                email,
                resetToken,
                newPassword
            });

            console.log('Phản hồi từ API đặt lại mật khẩu:', response.data);
            return response.data;
        } catch (error) {
            console.error('Password reset error:', error);
            if (error.response) {
                console.error('Error status:', error.response.status);
                console.error('Error data:', error.response.data);
            }
            throw error;
        }
    }

    /**
     * Làm mới token
     */
    async refreshToken() {
        try {
            const refreshToken = await AsyncStorage.getItem('refreshToken');

            if (!refreshToken) {
                throw new Error('Không có refresh token');
            }

            console.log('Đang gọi API làm mới token');

            const response = await this.api.post('/refresh-token', {
                refreshToken
            });

            console.log('Phản hồi từ API làm mới token:', response.data);

            // Cập nhật token mới vào storage
            const tokenData = response.data;

            if (tokenData.token || tokenData.accessToken) {
                const newToken = tokenData.token || tokenData.accessToken;
                await AsyncStorage.setItem('accessToken', newToken);

                if (tokenData.refreshToken) {
                    await AsyncStorage.setItem('refreshToken', tokenData.refreshToken);
                }

                this._isAuthenticated = true;
            }

            return response.data;
        } catch (error) {
            console.error('Refresh token error:', error);
            if (error.response) {
                console.error('Error status:', error.response.status);
                console.error('Error data:', error.response.data);
            }
            throw error;
        }
    }

    /**
     * Kiểm tra tính hợp lệ của token
     */
    async introspectToken(token = null) {
        try {
            // Nếu không có token được cung cấp, lấy từ storage
            if (!token) {
                token = await AsyncStorage.getItem('accessToken');
            }

            if (!token) {
                throw new Error('Không có token để kiểm tra');
            }

            console.log('Đang gọi API kiểm tra token');

            const response = await this.api.post('/introspect', {
                token
            });

            console.log('Phản hồi từ API kiểm tra token:', response.data);
            return response.data;
        } catch (error) {
            console.error('Token introspection error:', error);
            if (error.response) {
                console.error('Error status:', error.response.status);
                console.error('Error data:', error.response.data);
            }
            throw error;
        }
    }

    /**
     * Đăng xuất người dùng
     */
    async logout() {
        try {
            // Nếu cần gọi API logout ở backend
            const token = await AsyncStorage.getItem('accessToken');
            if (token) {
                try {
                    await this.api.post('/logout', {
                        token
                    }, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    // Xóa token
                    await AsyncStorage.removeItem('accessToken');
                    await AsyncStorage.removeItem('refreshToken');

                    // Quan trọng: Xóa dữ liệu profile để tránh hiển thị dữ liệu của tài khoản cũ
                    await AsyncStorage.removeItem('userProfile');

                    // Các xử lý logout khác nếu có
                    return true;
                } catch (logoutError) {
                    console.warn('Logout API error:', logoutError);
                    // Tiếp tục xóa token dù có lỗi API
                }
            }

            // Ngắt kết nối WebSocket khi đăng xuất
            try {
                console.log('Ngắt kết nối WebSocket khi đăng xuất...');
                webSocketService.disconnect();
                console.log('WebSocket disconnected successfully');
            } catch (wsError) {
                console.error('Error disconnecting WebSocket:', wsError);
            }

            // Xóa token và dữ liệu người dùng
            await AsyncStorage.removeItem('accessToken');
            await AsyncStorage.removeItem('tokenType');
            await AsyncStorage.removeItem('refreshToken');
            await AsyncStorage.removeItem('userData');

            // Reset biến global và trạng thái
            global.authExpired = false;
            this._isAuthenticated = false;

            console.log('Đăng xuất thành công');
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    }

    /**
     * Lấy thông tin token hiện tại
     */
    async getToken() {
        try {
            return await AsyncStorage.getItem('accessToken');
        } catch (error) {
            console.error('Get token error:', error);
            return null;
        }
    }

    /**
     * Lấy token với tiền tố Bearer để sử dụng trong header
     */
    async getBearerToken() {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            const tokenType = await AsyncStorage.getItem('tokenType') || 'Bearer';

            if (token) {
                return `${tokenType} ${token}`;
            }
            return null;
        } catch (error) {
            console.error('Get bearer token error:', error);
            return null;
        }
    }

    /**
     * Lấy thông tin người dùng đã lưu
     */
    async getUserData() {
        try {
            const userData = await AsyncStorage.getItem('userData');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Get user data error:', error);
            return null;
        }
    }
}

// Tạo instance singleton
const authService = new AuthService();
export default authService;
