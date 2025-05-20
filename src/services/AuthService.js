// AuthService.js - Bổ sung các router còn thiếu
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
    isAuthenticated(): boolean {
        return this._isAuthenticated;
    }
    updateAuthStatus(status: boolean) {
        this._isAuthenticated = status;
    }
    /**
     * Đăng ký người dùng mới
     * @param {Object} userData - Thông tin đăng ký
     * @returns {Promise} Kết quả đăng ký
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
     * @param {string} email - Email của người dùng
     * @param {string} password - Mật khẩu
     * @returns {Promise} Kết quả đăng nhập
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

                // Log lại token sau khi lưu để kiểm tra
                const savedToken = await AsyncStorage.getItem('accessToken');
                console.log('Token sau khi lưu:', savedToken);
            } else {
                console.error('Không tìm thấy token trong phản hồi');
            }
            // Sau khi đăng nhập thành công, kết nối WebSocket
            webSocketService.connect();

            return response.data;
        } catch (error) {
            console.error('Login error:', error);

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


    // async login(email, password) {
    //     try {
    //         const response = await super.login(email, password);
    //         this._isAuthenticated = true;
    //         return response;
    //     } catch (error) {
    //         this._isAuthenticated = false;
    //         throw error;
    //     }
    // }
    /**
     * Xác minh tài khoản với mã xác nhận
     * @param {string} email - Email của người dùng
     * @param {string} verificationCode - Mã xác nhận
     * @returns {Promise} Kết quả xác minh
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
     * @param {string} email - Email cần gửi lại mã
     * @returns {Promise} Kết quả gửi mã
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
     * @param {string} email - Email cần đặt lại mật khẩu
     * @returns {Promise} Kết quả yêu cầu
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
     * @param {string} email - Email người dùng
     * @param {string} resetToken - Mã xác nhận đặt lại mật khẩu
     * @param {string} newPassword - Mật khẩu mới
     * @returns {Promise} Kết quả đặt lại mật khẩu
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
     * @returns {Promise} Token mới
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
     * @param {string} token - Token cần kiểm tra
     * @returns {Promise} Thông tin về tính hợp lệ của token
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
     * @returns {Promise} Kết quả đăng xuất
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
                    // Ngắt kết nối WebSocket khi đăng xuất
                    webSocketService.disconnect();

                    return { success: true };
                } catch (logoutError) {
                    console.warn('Logout API error:', logoutError);
                    // Tiếp tục xóa token dù có lỗi API
                }
            }

            // Xóa token và dữ liệu người dùng
            await AsyncStorage.removeItem('accessToken');
            await AsyncStorage.removeItem('tokenType');
            await AsyncStorage.removeItem('refreshToken');
            await AsyncStorage.removeItem('userData');

            // Reset biến global
            global.authExpired = false;

            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    }

    // async logout() {
    //     try {
    //         await super.logout();
    //         this._isAuthenticated = false;
    //     } catch (error) {
    //         console.error('Logout error:', error);
    //     }
    // }

    /**
     * Kiểm tra xem người dùng đã đăng nhập chưa
     * @returns {Promise<boolean>} Trạng thái đăng nhập
     */
    // static async isAuthenticated() {
    //     try {
    //         const token = await AsyncStorage.getItem('accessToken');
    //
    //         // Nếu không có token, trả về false
    //         if (!token) return false;
    //
    //         // Thêm logic kiểm tra token hợp lệ với backend (nếu cần)
    //         // Ví dụ: gọi API kiểm tra token
    //         const response = await axios.get('/api/validate-token', {
    //             headers: {
    //                 'Authorization': `Bearer ${token}`
    //             }
    //         });
    //
    //         return response.status === 200;
    //     } catch (error) {
    //         console.error('Authentication check failed:', error);
    //         return false;
    //     }
    // }

    /**
     * Lấy thông tin token hiện tại
     * @returns {Promise<string|null>} Token hoặc null nếu không có
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
     * @returns {Promise<string|null>} Bearer token hoặc null
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
     * @returns {Promise<Object|null>} Thông tin người dùng hoặc null
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
