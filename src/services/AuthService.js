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

    // Các phương thức khác giữ nguyên
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
            console.error('Lỗi kiểm tra token:', error);
            return false;
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
    }
};

export default AuthService;
