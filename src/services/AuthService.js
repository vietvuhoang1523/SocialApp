import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = "http://192.168.100.193:8082/api/auth";

const AuthService = {
    login: async (email, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password
                }),
            });

            // Kiểm tra response
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Đăng nhập thất bại');
            }

            // Parse dữ liệu response
            const responseData = await response.json();
            const data = responseData.authentication; // Truy cập vào đối tượng authentication

            // Lưu token và thông tin người dùng vào AsyncStorage
            await AsyncStorage.setItem('userToken', data.token);
            await AsyncStorage.setItem('refreshToken', data.refreshToken);
            await AsyncStorage.setItem('userData', JSON.stringify(data.user));

            return data;
        } catch (error) {
            console.error('Lỗi đăng nhập:', error);
            throw error;
        }
    },

    // Đăng ký tài khoản mới
    register: async (fullName, email, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fullName,
                    email,
                    password
                }),
            });

            // Kiểm tra response
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Đăng ký thất bại');
            }

            // Parse dữ liệu response
            const data = await response.json();
            return data.registration; // Truy cập vào đối tượng registration
        } catch (error) {
            console.error('Lỗi đăng ký:', error);
            throw error;
        }
    },

    // Xác thực tài khoản với mã xác minh
    verifyAccount: async (email, verificationCode) => {
        try {
            const response = await fetch(`${API_BASE_URL}/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    verificationCode
                }),
            });

            // Kiểm tra response
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Xác thực tài khoản thất bại');
            }

            // Parse dữ liệu response
            const data = await response.json();
            return data.verification; // Truy cập vào đối tượng verification
        } catch (error) {
            console.error('Lỗi xác thực tài khoản:', error);
            throw error;
        }
    },

    // Gửi lại mã xác minh
    resendVerificationCode: async (email) => {
        try {
            const response = await fetch(`${API_BASE_URL}/resend-verification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email
                }),
            });

            // Kiểm tra response
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Không thể gửi lại mã xác minh');
            }

            // Parse dữ liệu response
            const data = await response.json();
            return data.verification; // Truy cập vào đối tượng verification
        } catch (error) {
            console.error('Lỗi gửi lại mã xác minh:', error);
            throw error;
        }
    },

    // Yêu cầu đặt lại mật khẩu (quên mật khẩu)
    sendPasswordResetCode: async (email) => {
        try {
            const response = await fetch(`${API_BASE_URL}/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email
                }),
            });

            // Kiểm tra response
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Không thể gửi yêu cầu đặt lại mật khẩu');
            }

            // Parse dữ liệu response
            const data = await response.json();
            return data.passwordReset; // Truy cập vào đối tượng passwordReset
        } catch (error) {
            console.error('Lỗi gửi yêu cầu đặt lại mật khẩu:', error);
            throw error;
        }
    },

    // Đặt lại mật khẩu với mã xác nhận
    resetPassword: async (email, verificationCode, newPassword) => {
        try {
            const response = await fetch(`${API_BASE_URL}/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    token: verificationCode, // API uses token instead of verificationCode
                    newPassword
                }),
            });

            // Check response
            if (!response.ok) {
                const errorData = await response.text(); // Use text() instead of json() to handle potential non-JSON errors
                throw new Error(errorData || 'Cannot reset password');
            }

            // Parse response data
            const data = await response.json();
            return data; // PasswordResetResponse object
        } catch (error) {
            console.error('Password reset error:', error);
            throw error;
        }
    },

    // Làm mới token
    refreshToken: async () => {
        try {
            const refreshToken = await AsyncStorage.getItem('refreshToken');

            const response = await fetch(`${API_BASE_URL}/refresh-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refreshToken
                }),
            });

            if (!response.ok) {
                throw new Error('Không thể làm mới token');
            }

            const data = await response.json();

            // Lưu token mới
            await AsyncStorage.setItem('userToken', data.accessToken);

            return data.accessToken;
        } catch (error) {
            console.error('Lỗi làm mới token:', error);
            throw error;
        }
    },

    // Kiểm tra token
    introspectToken: async (token) => {
        try {
            const tokenToCheck = token || await AsyncStorage.getItem('userToken');

            const response = await fetch(`${API_BASE_URL}/introspect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: tokenToCheck
                }),
            });

            if (!response.ok) {
                throw new Error('Không thể kiểm tra token');
            }

            const data = await response.json();
            return data; // Đối tượng IntrospectResponse
        } catch (error) {
            console.error('Lỗi kiểm tra token:', error);
            throw error;
        }
    },

    // Đăng xuất
    logout: async () => {
        try {
            // Lấy token từ AsyncStorage
            const token = await AsyncStorage.getItem('userToken');
            const refreshToken = await AsyncStorage.getItem('refreshToken');

            // Gọi API logout
            const response = await fetch(`${API_BASE_URL}/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    token,
                    refreshToken
                }),
            });

            // Xóa thông tin đăng nhập khỏi AsyncStorage
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('refreshToken');
            await AsyncStorage.removeItem('userData');

            return response.ok;
        } catch (error) {
            console.error('Lỗi đăng xuất:', error);
            throw error;
        }
    },

    // Kiểm tra trạng thái đăng nhập
    isAuthenticated: async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');

            if (!token) {
                return false;
            }

            // Gọi API kiểm tra token
            const response = await fetch(`${API_BASE_URL}/introspect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token
                }),
            });

            const data = await response.json();
            return data.valid;
        } catch (error) {
            console.error('Lỗi kiểm tra trạng thái đăng nhập:', error);
            return false;
        }
    },

    // Lấy thông tin người dùng từ AsyncStorage
    getCurrentUser: async () => {
        try {
            const userDataString = await AsyncStorage.getItem('userData');
            if (userDataString) {
                return JSON.parse(userDataString);
            }
            return null;
        } catch (error) {
            console.error('Lỗi lấy thông tin người dùng:', error);
            return null;
        }
    },

    // Lấy token hiện tại
    getToken: async () => {
        try {
            return await AsyncStorage.getItem('userToken');
        } catch (error) {
            console.error('Lỗi lấy token:', error);
            return null;
        }
    }
};

export default AuthService;
