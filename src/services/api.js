// // api.js
// import appConfig from './config';
//
// // URL cơ sở của API từ config.js
// export const BASE_URL = appConfig.extra.apiUrl;
//
// // Cài đặt timeout mặc định cho các yêu cầu API
// export const DEFAULT_TIMEOUT = 10000; // 10 giây
//
// // Định dạng header mặc định cho các yêu cầu API
// export const DEFAULT_HEADERS = {
//     'Accept': 'application/json',
//     'Content-Type': 'application/json',
// };
//
// // Configuration cho FormData requests
// export const FORM_DATA_HEADERS = {
//     'Content-Type': 'multipart/form-data',
// };
//
// // Các mã lỗi API và thông báo tương ứng
// export const ERROR_MESSAGES = {
//     400: 'Yêu cầu không hợp lệ.',
//     401: 'Bạn cần đăng nhập để tiếp tục.',
//     403: 'Bạn không có quyền truy cập vào tính năng này.',
//     404: 'Không tìm thấy tài nguyên yêu cầu.',
//     500: 'Đã xảy ra lỗi từ máy chủ. Vui lòng thử lại sau.',
//     502: 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.',
//     default: 'Đã xảy ra lỗi. Vui lòng thử lại sau.'
// };
// api.js - Cập nhật
// File cấu hình cho các API calls

// URL cơ sở cho backend API
export const BASE_URL = 'http://192.168.0.100:8082/api'; // Thay thế bằng URL thực tế của bạn

// Timeout mặc định cho các requests (30 giây)
export const DEFAULT_TIMEOUT = 30000;

// Headers mặc định cho các API calls
export const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
};

// Headers cho FormData (sử dụng khi upload files)
export const FORM_DATA_HEADERS = {
    'Content-Type': 'multipart/form-data',
    'Accept': 'application/json',
};

// Endpoint paths
export const API_ENDPOINTS = {
    // Auth endpoints
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    REFRESH_TOKEN: '/api/auth/refresh-token',

    // User endpoints
    USER_PROFILE: '/api/users/profile',
    SEARCH_USERS: '/api/users/search',

    // Message endpoints
    MESSAGES: '/api/messages',
    CONVERSATIONS: '/api/messages/conversations',
    UNREAD_MESSAGES: '/api/messages/unread',

    // Friend endpoints
    FRIENDS: '/api/friends',
    FRIEND_REQUESTS: '/api/friends/requests',
};

// Cấu hình pagination mặc định
export const DEFAULT_PAGINATION = {
    page: 0,
    size: 20,
    sortBy: ['timestamp'],
    order: 'desc'
};

// Định dạng response errors
export const formatError = (error) => {
    if (error.response) {
        // Lỗi từ server
        const status = error.response.status;
        const data = error.response.data;

        return {
            status,
            message: data.message || data.error || 'Đã xảy ra lỗi không xác định.',
            data: data
        };
    } else if (error.request) {
        // Lỗi network - không có phản hồi từ server
        return {
            status: 0,
            message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet của bạn.',
            isNetworkError: true
        };
    } else {
        // Lỗi khác
        return {
            status: -1,
            message: error.message || 'Đã xảy ra lỗi không xác định.',
            error: error
        };
    }
};

// Chuẩn hóa dữ liệu phản hồi
export const normalizeResponse = (response) => {
    // Nếu response là null hoặc undefined
    if (!response) return null;

    // Nếu dữ liệu được đóng gói trong field "data"
    if (response.data !== undefined) {
        return response.data;
    }

    // Trong trường hợp khác, trả về nguyên response
    return response;
};

// Phương thức hỗ trợ để kiểm tra xem người dùng đã đăng nhập chưa
export const isAuthenticated = async () => {
    try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const token = await AsyncStorage.getItem('accessToken');
        return !!token; // Trả về true nếu có token, false nếu không
    } catch (error) {
        console.error('Lỗi khi kiểm tra trạng thái đăng nhập:', error);
        return false;
    }
};

// Lấy thông tin người dùng đã đăng nhập
export const getCurrentUser = async () => {
    try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;

        // Thử lấy từ userData trước
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
        console.error('Lỗi khi lấy thông tin người dùng hiện tại:', error);
        return null;
    }
};

// Định dạng thời gian thành "time ago"
export const formatTimeAgo = (date) => {
    if (!date) return '';

    const now = new Date();
    const messageDate = typeof date === 'string' ? new Date(date) : date;
    const diffInSeconds = Math.floor((now - messageDate) / 1000);

    if (diffInSeconds < 60) return 'vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}p`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;

    return messageDate.toLocaleDateString('vi-VN');
};
export const WS_CONFIG = {
    ENDPOINT: `${BASE_URL.replace('http', 'ws')}/ws`, // hoặc custom endpoint tùy vào server
    RECONNECT_DELAY: 5000, // 5 giây
    HEARTBEAT_INCOMING: 4000,
    HEARTBEAT_OUTGOING: 4000
};