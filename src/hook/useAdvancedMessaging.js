// src/hooks/useAdvancedMessaging.js
// Hook để sử dụng các tính năng messaging nâng cao

import { useState, useCallback, useEffect, useRef } from 'react';
import webSocketHelper from '../services/WebSocketHelper';

/**
 * Hook để quản lý các tính năng messaging nâng cao
 * Hỗ trợ tất cả endpoints từ Spring Boot WebSocket Controller
 */
const useAdvancedMessaging = (currentUser) => {
    // === STATE MANAGEMENT ===
    const [isInitialized, setIsInitialized] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    
    // Search & Filter states
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [attachmentMessages, setAttachmentMessages] = useState([]);
    const [messagesByDate, setMessagesByDate] = useState([]);
    
    // Statistics states
    const [messageStats, setMessageStats] = useState({});
    const [recentMessages, setRecentMessages] = useState([]);
    
    // Real-time states
    const [typingUsers, setTypingUsers] = useState(new Map());
    const [onlineUsers, setOnlineUsers] = useState(new Map());
    const [messageReactions, setMessageReactions] = useState(new Map());
    
    // UI states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const callbacksRegistered = useRef(false);

    // === INITIALIZATION ===
    
    useEffect(() => {
        if (currentUser?.id && !isInitialized) {
            initializeAdvancedMessaging();
        }
        
        return () => {
            cleanup();
        };
    }, [currentUser?.id]);

    const initializeAdvancedMessaging = useCallback(async () => {
        try {
            console.log('🚀 Initializing Advanced Messaging...');
            
            await webSocketHelper.initialize();
            registerCallbacks();
            
            setIsInitialized(true);
            setConnectionStatus('connected');
            
            console.log('✅ Advanced Messaging initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Advanced Messaging:', error);
            setError(error.message);
        }
    }, []);

    const registerCallbacks = useCallback(() => {
        if (callbacksRegistered.current) return;

        // Real-time message callbacks
        webSocketHelper.onNewMessage((message) => {
            console.log('📨 New message in advanced hook:', message);
            // Có thể thêm logic xử lý tin nhắn mới ở đây
        });

        // Typing notifications
        webSocketHelper.onTyping((notification) => {
            console.log('⌨️ Typing notification:', notification);
            setTypingUsers(prev => {
                const newMap = new Map(prev);
                if (notification.isTyping) {
                    newMap.set(notification.senderId, {
                        ...notification,
                        timestamp: Date.now()
                    });
                } else {
                    newMap.delete(notification.senderId);
                }
                return newMap;
            });
        });

        // Status updates
        webSocketHelper.onStatusUpdate((statusUpdate) => {
            console.log('📊 Status update:', statusUpdate);
            setOnlineUsers(prev => {
                const newMap = new Map(prev);
                newMap.set(statusUpdate.userId, statusUpdate);
                return newMap;
            });
        });

        // Reactions
        webSocketHelper.onReactions((reactionData) => {
            console.log('😀 Reaction update:', reactionData);
            setMessageReactions(prev => {
                const newMap = new Map(prev);
                const messageId = reactionData.messageId;
                const currentReactions = newMap.get(messageId) || {};
                
                if (reactionData.action === 'added') {
                    const reactionType = reactionData.reactionType;
                    currentReactions[reactionType] = currentReactions[reactionType] || [];
                    if (!currentReactions[reactionType].includes(reactionData.userId)) {
                        currentReactions[reactionType].push(reactionData.userId);
                    }
                } else if (reactionData.action === 'removed') {
                    const reactionType = reactionData.reactionType;
                    if (currentReactions[reactionType]) {
                        currentReactions[reactionType] = currentReactions[reactionType]
                            .filter(userId => userId !== reactionData.userId);
                        if (currentReactions[reactionType].length === 0) {
                            delete currentReactions[reactionType];
                        }
                    }
                }
                
                newMap.set(messageId, currentReactions);
                return newMap;
            });
        });

        // Connection changes
        webSocketHelper.onConnectionChange((status) => {
            setConnectionStatus(status.status);
        });

        // Error handling
        webSocketHelper.onError((error) => {
            console.error('❌ WebSocket error in advanced hook:', error);
            setError(error.error);
        });

        callbacksRegistered.current = true;
        console.log('✅ Advanced messaging callbacks registered');
    }, []);

    // === SEARCH & FILTER FUNCTIONS ===

    const searchMessages = useCallback(async (keyword, withUserId = null, page = 0, size = 20) => {
        if (!keyword?.trim()) {
            setError('Từ khóa tìm kiếm không được để trống');
            return;
        }

        try {
            setSearchLoading(true);
            setError(null);

            console.log('🔍 Searching messages:', { keyword, withUserId, page, size });
            const results = await webSocketHelper.searchMessages(keyword, withUserId, page, size);
            
            setSearchResults(results.messages || []);
            console.log('✅ Search completed:', results);
            
            return results;
        } catch (error) {
            console.error('❌ Search failed:', error);
            setError(error.message);
            return { messages: [], status: 'error' };
        } finally {
            setSearchLoading(false);
        }
    }, []);

    const getMessagesWithAttachments = useCallback(async (withUserId = null, attachmentType = '', page = 0, size = 20) => {
        try {
            setLoading(true);
            setError(null);

            console.log('📎 Getting messages with attachments:', { withUserId, attachmentType, page, size });
            const results = await webSocketHelper.getMessagesWithAttachments(withUserId, attachmentType, page, size);
            
            setAttachmentMessages(results.messages || []);
            console.log('✅ Attachment messages loaded:', results);
            
            return results;
        } catch (error) {
            console.error('❌ Failed to get attachment messages:', error);
            setError(error.message);
            return { messages: [], status: 'error' };
        } finally {
            setLoading(false);
        }
    }, []);

    const getMessagesByDateRange = useCallback(async (withUserId, startDate, endDate, page = 0, size = 20) => {
        try {
            setLoading(true);
            setError(null);

            console.log('📅 Getting messages by date range:', { withUserId, startDate, endDate, page, size });
            const results = await webSocketHelper.getMessagesByDateRange(withUserId, startDate, endDate, page, size);
            
            setMessagesByDate(results.messages || []);
            console.log('✅ Messages by date loaded:', results);
            
            return results;
        } catch (error) {
            console.error('❌ Failed to get messages by date:', error);
            setError(error.message);
            return { messages: [], status: 'error' };
        } finally {
            setLoading(false);
        }
    }, []);

    // === STATISTICS FUNCTIONS ===

    const getMessageStatistics = useCallback(async (withUserId = null, startDate = '', endDate = '') => {
        try {
            setLoading(true);
            setError(null);

            console.log('📊 Getting message statistics:', { withUserId, startDate, endDate });
            const stats = await webSocketHelper.getMessageStatistics(withUserId, startDate, endDate);
            
            setMessageStats(stats);
            console.log('✅ Statistics loaded:', stats);
            
            return stats;
        } catch (error) {
            console.error('❌ Failed to get statistics:', error);
            setError(error.message);
            return { status: 'error' };
        } finally {
            setLoading(false);
        }
    }, []);

    const getRecentMessages = useCallback(async (limit = 50) => {
        try {
            setLoading(true);
            setError(null);

            console.log('🕐 Getting recent messages:', { limit });
            const results = await webSocketHelper.getRecentMessages(limit);
            
            setRecentMessages(results.messages || []);
            console.log('✅ Recent messages loaded:', results);
            
            return results;
        } catch (error) {
            console.error('❌ Failed to get recent messages:', error);
            setError(error.message);
            return { messages: [], status: 'error' };
        } finally {
            setLoading(false);
        }
    }, []);

    // === MESSAGE ACTIONS ===

    const restoreMessage = useCallback(async (messageId) => {
        try {
            setError(null);

            console.log('♻️ Restoring message:', messageId);
            const result = await webSocketHelper.restoreMessage(messageId);
            
            console.log('✅ Message restored:', result);
            return result;
        } catch (error) {
            console.error('❌ Failed to restore message:', error);
            setError(error.message);
            return { status: 'error', error: error.message };
        }
    }, []);

    const forwardMessage = useCallback(async (originalMessageId, receiverId, additionalText = '') => {
        try {
            setError(null);

            console.log('📤 Forwarding message:', { originalMessageId, receiverId, additionalText });
            const result = await webSocketHelper.forwardMessage(originalMessageId, receiverId, additionalText);
            
            console.log('✅ Message forwarded:', result);
            return result;
        } catch (error) {
            console.error('❌ Failed to forward message:', error);
            setError(error.message);
            return { status: 'error', error: error.message };
        }
    }, []);

    // === REACTION FUNCTIONS ===

    const addReaction = useCallback(async (messageId, reactionType) => {
        try {
            setError(null);

            console.log('😀 Adding reaction:', { messageId, reactionType });
            const result = await webSocketHelper.addReaction(messageId, reactionType);
            
            console.log('✅ Reaction added:', result);
            return result;
        } catch (error) {
            console.error('❌ Failed to add reaction:', error);
            setError(error.message);
            return { status: 'error', error: error.message };
        }
    }, []);

    const removeReaction = useCallback(async (messageId, reactionType) => {
        try {
            setError(null);

            console.log('😶 Removing reaction:', { messageId, reactionType });
            const result = await webSocketHelper.removeReaction(messageId, reactionType);
            
            console.log('✅ Reaction removed:', result);
            return result;
        } catch (error) {
            console.error('❌ Failed to remove reaction:', error);
            setError(error.message);
            return { status: 'error', error: error.message };
        }
    }, []);

    // === REAL-TIME FUNCTIONS ===

    const sendTypingNotification = useCallback(async (receiverId, isTyping = true) => {
        try {
            console.log('⌨️ Sending typing notification:', { receiverId, isTyping });
            const result = await webSocketHelper.sendTypingNotification(receiverId, isTyping);
            
            return result;
        } catch (error) {
            console.error('❌ Failed to send typing notification:', error);
            return false;
        }
    }, []);

    const updateUserStatus = useCallback(async (status) => {
        try {
            setError(null);

            console.log('📊 Updating user status:', status);
            const result = await webSocketHelper.updateUserStatus(status);
            
            console.log('✅ Status updated:', result);
            return result;
        } catch (error) {
            console.error('❌ Failed to update status:', error);
            setError(error.message);
            return { status: 'error', error: error.message };
        }
    }, []);

    // === UTILITY FUNCTIONS ===

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const clearSearchResults = useCallback(() => {
        setSearchResults([]);
    }, []);

    const clearAttachmentMessages = useCallback(() => {
        setAttachmentMessages([]);
    }, []);

    const clearMessagesByDate = useCallback(() => {
        setMessagesByDate([]);
    }, []);

    const isUserTyping = useCallback((userId) => {
        const typingInfo = typingUsers.get(userId);
        if (!typingInfo) return false;
        
        // Remove typing status after 3 seconds of inactivity
        const now = Date.now();
        if (now - typingInfo.timestamp > 3000) {
            setTypingUsers(prev => {
                const newMap = new Map(prev);
                newMap.delete(userId);
                return newMap;
            });
            return false;
        }
        
        return true;
    }, [typingUsers]);

    const isUserOnline = useCallback((userId) => {
        const userStatus = onlineUsers.get(userId);
        return userStatus?.status === 'online';
    }, [onlineUsers]);

    const getMessageReactions = useCallback((messageId) => {
        return messageReactions.get(messageId) || {};
    }, [messageReactions]);

    const cleanup = useCallback(() => {
        if (callbacksRegistered.current) {
            webSocketHelper.cleanup();
            callbacksRegistered.current = false;
        }
        
        // Clear all states
        setSearchResults([]);
        setAttachmentMessages([]);
        setMessagesByDate([]);
        setMessageStats({});
        setRecentMessages([]);
        setTypingUsers(new Map());
        setOnlineUsers(new Map());
        setMessageReactions(new Map());
        setError(null);
        setIsInitialized(false);
        
        console.log('🧹 Advanced messaging cleaned up');
    }, []);

    // === RETURN HOOK API ===
    
    return {
        // Status
        isInitialized,
        connectionStatus,
        loading,
        searchLoading,
        error,
        
        // Search & Filter
        searchResults,
        attachmentMessages,
        messagesByDate,
        searchMessages,
        getMessagesWithAttachments,
        getMessagesByDateRange,
        clearSearchResults,
        clearAttachmentMessages,
        clearMessagesByDate,
        
        // Statistics
        messageStats,
        recentMessages,
        getMessageStatistics,
        getRecentMessages,
        
        // Message Actions
        restoreMessage,
        forwardMessage,
        
        // Reactions
        addReaction,
        removeReaction,
        getMessageReactions,
        messageReactions,
        
        // Real-time
        sendTypingNotification,
        updateUserStatus,
        isUserTyping,
        isUserOnline,
        typingUsers,
        onlineUsers,
        
        // Utility
        clearError,
        cleanup,
        
        // WebSocket Helper access (for advanced usage)
        webSocketHelper
    };
};

export default useAdvancedMessaging; 