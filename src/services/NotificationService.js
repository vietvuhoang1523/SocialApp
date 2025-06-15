import axios from 'axios';
import {BASE_URL, DEFAULT_HEADERS, ERROR_MESSAGES, DEFAULT_TIMEOUT} from './api';
import authService from './AuthService';
import AsyncStorage from '@react-native-async-storage/async-storage';

class NotificationService {
    constructor() {
        this.api = axios.create({
            baseURL: BASE_URL,
            timeout: DEFAULT_TIMEOUT,
            headers: DEFAULT_HEADERS,
        });
        
        // Add token interceptor
        this.api.interceptors.request.use(async (config) => {
            try {
                const token = await authService.getBearerToken();
                if (token) {
                    config.headers.Authorization = token;
                }
                return config;
            } catch (error) {
                console.error('Error getting token:', error);
                return config;
            }
        });
        
        // Initialize local notification count
        this.initializeNotificationCount();
    }
    
    // Helper to handle errors
    handleError(error) {
        console.error('Notification API Error:', error);
        
        if (error.response) {
            // Error with response from server
            const status = error.response.status;
            const message = error.response.data?.message || ERROR_MESSAGES[status] || ERROR_MESSAGES.default;
            
            throw new Error(message);
        } else if (error.request) {
            // Error with no response from server
            throw new Error(ERROR_MESSAGES.default);
        } else {
            // Other error
            throw new Error(error.message || ERROR_MESSAGES.default);
        }
    }
    
    // Initialize local notification count
    async initializeNotificationCount() {
        try {
            const count = await AsyncStorage.getItem('unreadNotificationCount');
            if (count === null) {
                await AsyncStorage.setItem('unreadNotificationCount', '0');
            }
        } catch (error) {
            console.error('Error initializing notification count:', error);
        }
    }
    
    // Get all notifications
    async getNotifications(page = 0, size = 20) {
        try {
            console.log('📣 Fetching notifications');
            const response = await this.api.get('/notifications', {
                params: { page, size }
            });
            
            console.log(`✅ Fetched ${response.data?.content?.length || 0} notifications`);
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching notifications:', error);
            this.handleError(error);
            return { content: [], last: true };
        }
    }
    
    // Get unread notification count
    async getUnreadCount() {
        try {
            const response = await this.api.get('/notifications/unread-count');
            console.log('📊 Unread notification count:', response.data);
            
            // Update local storage
            await AsyncStorage.setItem('unreadNotificationCount', response.data.count.toString());
            
            return response.data.count;
        } catch (error) {
            console.error('❌ Error fetching unread notification count:', error);
            
            // Fall back to local storage
            try {
                const localCount = await AsyncStorage.getItem('unreadNotificationCount');
                return parseInt(localCount || '0', 10);
            } catch (e) {
                return 0;
            }
        }
    }
    
    // Mark a notification as read
    async markAsRead(notificationId) {
        try {
            await this.api.patch(`/notifications/${notificationId}/read`);
            console.log(`✅ Marked notification ${notificationId} as read`);
            
            // Update local count
            this.decrementLocalUnreadCount();
            
            return true;
        } catch (error) {
            console.error(`❌ Error marking notification ${notificationId} as read:`, error);
            this.handleError(error);
            return false;
        }
    }
    
    // Mark all notifications as read
    async markAllAsRead() {
        try {
            await this.api.patch('/notifications/mark-all-read');
            console.log('✅ Marked all notifications as read');
            
            // Reset local count
            await AsyncStorage.setItem('unreadNotificationCount', '0');
            
            return true;
        } catch (error) {
            console.error('❌ Error marking all notifications as read:', error);
            this.handleError(error);
            return false;
        }
    }
    
    // Delete a notification
    async deleteNotification(notificationId) {
        try {
            await this.api.delete(`/notifications/${notificationId}`);
            console.log(`✅ Deleted notification ${notificationId}`);
            return true;
        } catch (error) {
            console.error(`❌ Error deleting notification ${notificationId}:`, error);
            this.handleError(error);
            return false;
        }
    }
    
    // Get notification settings
    async getNotificationSettings() {
        try {
            const response = await this.api.get('/notifications/settings');
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching notification settings:', error);
            this.handleError(error);
            return {};
        }
    }
    
    // Update notification settings
    async updateNotificationSettings(settings) {
        try {
            await this.api.put('/notifications/settings', settings);
            return true;
        } catch (error) {
            console.error('❌ Error updating notification settings:', error);
            this.handleError(error);
            return false;
        }
    }
    
    // Increment local unread count (used when new notification arrives)
    async incrementLocalUnreadCount() {
        try {
            const currentCount = await AsyncStorage.getItem('unreadNotificationCount') || '0';
            const newCount = (parseInt(currentCount, 10) + 1).toString();
            await AsyncStorage.setItem('unreadNotificationCount', newCount);
            return parseInt(newCount, 10);
        } catch (error) {
            console.error('Error incrementing notification count:', error);
            return null;
        }
    }
    
    // Decrement local unread count
    async decrementLocalUnreadCount() {
        try {
            const currentCount = await AsyncStorage.getItem('unreadNotificationCount') || '0';
            const newCount = Math.max(0, parseInt(currentCount, 10) - 1).toString();
            await AsyncStorage.setItem('unreadNotificationCount', newCount);
            return parseInt(newCount, 10);
        } catch (error) {
            console.error('Error decrementing notification count:', error);
            return null;
        }
    }
    
    // Register device token for push notifications
    async registerDeviceToken(token, deviceType = 'android') {
        try {
            await this.api.post('/notifications/device', {
                token,
                deviceType,
                active: true
            });
            console.log('📱 Device registered for push notifications');
            return true;
        } catch (error) {
            console.error('❌ Error registering device for push notifications:', error);
            return false;
        }
    }
}

export default new NotificationService(); 