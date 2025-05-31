// api.js - Cập nhật với WS_BASE_URL riêng biệt
// File cấu hình cho các API calls
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for API
export const BASE_URL = 'http://192.168.0.102:8082/api';

// Default timeout
export const DEFAULT_TIMEOUT = 15000;

// Default headers
export const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
};

// Create axios instance
const api = axios.create({
    baseURL: BASE_URL,
    timeout: DEFAULT_TIMEOUT,
    headers: DEFAULT_HEADERS
});

// Request interceptor to add token
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.warn('Failed to get token:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        if (error.response?.status === 401) {
            // Clear token on 401
            try {
                await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userData']);
            } catch (storageError) {
                console.error('Error clearing storage:', storageError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;

// === LEGACY COMPATIBILITY ===
// Keep these for backward compatibility

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

// Default pagination
export const DEFAULT_PAGINATION = {
    page: 0,
    size: 20,
    sortBy: ['timestamp'],
    order: 'desc'
};

// WebSocket config
export const WS_CONFIG = {
    ENDPOINT: `/ws`,
    RECONNECT_DELAY: 3000,
    HEARTBEAT_INCOMING: 4000,
    HEARTBEAT_OUTGOING: 4000,
    CONNECTION_TIMEOUT: 10000,
    MAX_RECONNECT_ATTEMPTS: 5
};

// Format error
export const formatError = (error) => {
    if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        return {
            status,
            message: data.message || data.error || 'Đã xảy ra lỗi không xác định.',
            data: data
        };
    } else if (error.request) {
        return {
            status: 0,
            message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet của bạn.',
            isNetworkError: true
        };
    } else {
        return {
            status: -1,
            message: error.message || 'Đã xảy ra lỗi không xác định.',
            error: error
        };
    }
};

// Normalize response
export const normalizeResponse = (response) => {
    if (!response) return null;

    if (response.data !== undefined) {
        return response.data;
    }

    return response;
};

// Check authentication
export const isAuthenticated = async () => {
    try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const token = await AsyncStorage.getItem('accessToken');
        return !!token;
    } catch (error) {
        console.error('Lỗi khi kiểm tra trạng thái đăng nhập:', error);
        return false;
    }
};

// Get current user
export const getCurrentUser = async () => {
    try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;

        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
            return JSON.parse(userData);
        }

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

// Format time ago
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
