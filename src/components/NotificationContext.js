import React, { createContext, useState, useContext, useEffect } from 'react';
import notificationService from '../services/NotificationService';
import { AppState } from 'react-native';
import WebSocketService from '../services/WebSocketService'; 

// Create notification context
const NotificationContext = createContext();

// Custom hook to use notification context
export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

// Provider component
export const NotificationProvider = ({ children }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [appState, setAppState] = useState(AppState.currentState);
    
    // Subscribe to WebSocket notifications
    useEffect(() => {
        // Subscribe to notification events from WebSocket
        const unsubscribe = WebSocketService.subscribeToNotifications((notification) => {
            // Handle new notification
            console.log('🔔 Received new notification:', notification);
            
            // Add to notifications list
            setNotifications(prev => [notification, ...prev]);
            
            // Update unread count
            setUnreadCount(prev => prev + 1);
        });
        
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);
    
    // Monitor app state for active/background
    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            setAppState(nextAppState);
        });
        
        return () => {
            subscription.remove();
        };
    }, []);
    
    // Refresh notifications when app comes to foreground
    useEffect(() => {
        if (appState === 'active') {
            fetchUnreadCount();
        }
    }, [appState]);
    
    // Fetch initial unread count
    useEffect(() => {
        fetchUnreadCount();
    }, []);
    
    // Fetch unread notification count
    const fetchUnreadCount = async () => {
        try {
            const count = await notificationService.getUnreadCount();
            setUnreadCount(count);
        } catch (error) {
            console.error('Error fetching unread notification count:', error);
        }
    };
    
    // Fetch notifications with pagination
    const fetchNotifications = async (refresh = false) => {
        try {
            if (loading) return;
            
            setLoading(true);
            
            const pageToFetch = refresh ? 0 : page;
            
            const result = await notificationService.getNotifications(pageToFetch);
            
            if (refresh) {
                setNotifications(result.content || []);
            } else {
                setNotifications(prev => [...prev, ...(result.content || [])]);
            }
            
            setHasMore(!result.last);
            
            if (!refresh) {
                setPage(pageToFetch + 1);
            } else {
                setPage(1);
            }
            
            return result;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return null;
        } finally {
            setLoading(false);
        }
    };
    
    // Mark a notification as read
    const markAsRead = async (notificationId) => {
        try {
            const success = await notificationService.markAsRead(notificationId);
            
            if (success) {
                // Update local state
                setNotifications(prev => 
                    prev.map(notification => 
                        notification.id === notificationId 
                            ? { ...notification, read: true } 
                            : notification
                    )
                );
                
                // Update unread count
                if (unreadCount > 0) {
                    setUnreadCount(prev => prev - 1);
                }
            }
            
            return success;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return false;
        }
    };
    
    // Mark all notifications as read
    const markAllAsRead = async () => {
        try {
            const success = await notificationService.markAllAsRead();
            
            if (success) {
                // Update local state
                setNotifications(prev => 
                    prev.map(notification => ({ ...notification, read: true }))
                );
                
                // Reset unread count
                setUnreadCount(0);
            }
            
            return success;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            return false;
        }
    };
    
    // Delete a notification
    const deleteNotification = async (notificationId) => {
        try {
            const success = await notificationService.deleteNotification(notificationId);
            
            if (success) {
                // Find the notification to check if it's unread
                const notification = notifications.find(n => n.id === notificationId);
                
                // Update local state
                setNotifications(prev => prev.filter(n => n.id !== notificationId));
                
                // Update unread count if it was unread
                if (notification && !notification.read && unreadCount > 0) {
                    setUnreadCount(prev => prev - 1);
                }
            }
            
            return success;
        } catch (error) {
            console.error('Error deleting notification:', error);
            return false;
        }
    };
    
    // Context value
    const value = {
        unreadCount,
        notifications,
        loading,
        hasMore,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications: () => fetchNotifications(true),
    };
    
    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationContext; 