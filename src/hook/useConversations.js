// src/hooks/useConversations.js
// React Hook để quản lý danh sách cuộc trò chuyện
import { useState, useCallback, useRef, useEffect } from 'react';
import { Alert } from 'react-native';
import webSocketMessageService from '../services/WebSocketMessageService';

/**
 * Hook để quản lý danh sách cuộc trò chuyện và tin nhắn chưa đọc
 * @param {Object} currentUser - Người dùng hiện tại
 */
const useConversations = (currentUser) => {
    // State quản lý conversations
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    
    // State quản lý unread messages
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadMessages, setUnreadMessages] = useState([]);
    
    // Refs
    const conversationIds = useRef(new Set());
    const listenersRef = useRef([]);

    /**
     * Normalize conversation data từ server
     */
    const normalizeConversation = useCallback((rawConversation) => {
        if (!rawConversation) return null;

        return {
            id: rawConversation.id,
            participantId: rawConversation.participantId,
            participantName: rawConversation.participantName || 'Unknown User',
            participantAvatar: rawConversation.participantAvatar || null,
            lastMessage: rawConversation.lastMessage || null,
            lastMessageTime: rawConversation.lastMessageTime ? 
                new Date(rawConversation.lastMessageTime) : null,
            unreadCount: rawConversation.unreadCount || 0,
            isOnline: rawConversation.isOnline || false,
            lastSeen: rawConversation.lastSeen ? 
                new Date(rawConversation.lastSeen) : null
        };
    }, []);

    /**
     * Load danh sách cuộc trò chuyện
     */
    const loadConversations = useCallback(async () => {
        if (!currentUser?.id) {
            console.log('❌ Missing current user ID');
            return;
        }

        if (loading) {
            console.log('⏸️ Already loading conversations');
            return;
        }

        try {
            setLoading(true);
            console.log('📄 Loading conversations...');

            const result = await webSocketMessageService.getConversations();

            if (Array.isArray(result)) {
                const newConversations = result
                    .map(normalizeConversation)
                    .filter(conv => conv && !conversationIds.current.has(conv.id));

                // Add to conversationIds set
                newConversations.forEach(conv => conversationIds.current.add(conv.id));

                // Sort by last message time
                const sortedConversations = newConversations.sort((a, b) => {
                    if (!a.lastMessageTime && !b.lastMessageTime) return 0;
                    if (!a.lastMessageTime) return 1;
                    if (!b.lastMessageTime) return -1;
                    return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
                });

                setConversations(sortedConversations);
                console.log(`✅ Loaded ${newConversations.length} conversations`);
            } else {
                console.warn('⚠️ Invalid conversations data format');
                setConversations([]);
            }

        } catch (error) {
            console.error('❌ Failed to load conversations:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách cuộc trò chuyện. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }, [currentUser?.id, loading, normalizeConversation]);

    /**
     * Refresh conversations
     */
    const refreshConversations = useCallback(async () => {
        setRefreshing(true);
        conversationIds.current.clear();
        await loadConversations();
        setRefreshing(false);
    }, [loadConversations]);

    /**
     * Load tin nhắn chưa đọc
     */
    const loadUnreadMessages = useCallback(async () => {
        if (!currentUser?.id) return;

        try {
            console.log('📄 Loading unread messages...');

            const result = await webSocketMessageService.getUnreadMessages();

            if (Array.isArray(result)) {
                setUnreadMessages(result);
                console.log(`✅ Loaded ${result.length} unread messages`);
            } else {
                console.warn('⚠️ Invalid unread messages data format');
                setUnreadMessages([]);
            }

        } catch (error) {
            console.error('❌ Failed to load unread messages:', error);
        }
    }, [currentUser?.id]);

    /**
     * Load số lượng tin nhắn chưa đọc
     */
    const loadUnreadCount = useCallback(async () => {
        if (!currentUser?.id) return;

        try {
            console.log('📄 Loading unread count...');

            const result = await webSocketMessageService.getUnreadCount();

            if (typeof result === 'number') {
                setUnreadCount(result);
                console.log(`✅ Unread count: ${result}`);
            } else if (result && typeof result.count === 'number') {
                setUnreadCount(result.count);
                console.log(`✅ Unread count: ${result.count}`);
            } else {
                console.warn('⚠️ Invalid unread count data format:', result);
                setUnreadCount(0);
            }

        } catch (error) {
            console.error('❌ Failed to load unread count:', error);
        }
    }, [currentUser?.id]);

    /**
     * Cập nhật conversation với tin nhắn mới
     */
    const updateConversationWithNewMessage = useCallback((message) => {
        setConversations(prev => {
            const conversationIndex = prev.findIndex(conv => 
                conv.participantId === message.senderId || 
                conv.participantId === message.receiverId
            );

            if (conversationIndex >= 0) {
                // Update existing conversation
                const updatedConversations = [...prev];
                const conversation = { ...updatedConversations[conversationIndex] };
                
                conversation.lastMessage = message.content;
                conversation.lastMessageTime = new Date(message.timestamp);
                
                // Increase unread count if message is not from current user
                if (message.senderId !== currentUser?.id) {
                    conversation.unreadCount = (conversation.unreadCount || 0) + 1;
                }

                updatedConversations[conversationIndex] = conversation;

                // Move to top
                updatedConversations.splice(conversationIndex, 1);
                updatedConversations.unshift(conversation);

                return updatedConversations;
            } else {
                // Create new conversation
                const otherUserId = message.senderId === currentUser?.id ? 
                    message.receiverId : message.senderId;
                    
                const newConversation = {
                    id: `conv-${otherUserId}`,
                    participantId: otherUserId,
                    participantName: message.senderName || 'Unknown User',
                    participantAvatar: message.senderAvatar || null,
                    lastMessage: message.content,
                    lastMessageTime: new Date(message.timestamp),
                    unreadCount: message.senderId !== currentUser?.id ? 1 : 0,
                    isOnline: false,
                    lastSeen: null
                };

                conversationIds.current.add(newConversation.id);
                return [newConversation, ...prev];
            }
        });
    }, [currentUser?.id]);

    /**
     * Đánh dấu conversation đã đọc
     */
    const markConversationAsRead = useCallback((participantId) => {
        setConversations(prev => prev.map(conv => 
            conv.participantId === participantId 
                ? { ...conv, unreadCount: 0 }
                : conv
        ));

        // Update global unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    /**
     * Xóa conversation
     */
    const deleteConversation = useCallback((conversationId) => {
        conversationIds.current.delete(conversationId);
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    }, []);

    /**
     * Setup WebSocket event listeners
     */
    useEffect(() => {
        if (!currentUser?.id) return;

        const setupListeners = async () => {
            try {
                await webSocketMessageService.initialize();

                // Listen for new messages to update conversations
                const unsubscribeNewMessage = webSocketMessageService.on('newMessage', (message) => {
                    console.log('📨 Updating conversation with new message:', message);
                    updateConversationWithNewMessage(message);
                    
                    // Update unread count if message is not from current user
                    if (message.senderId !== currentUser.id) {
                        setUnreadCount(prev => prev + 1);
                    }
                });

                // Listen for read receipts
                const unsubscribeReadReceipt = webSocketMessageService.on('readReceipt', (receipt) => {
                    markConversationAsRead(receipt.senderId);
                });

                // Listen for status updates
                const unsubscribeStatusUpdate = webSocketMessageService.on('statusUpdate', (update) => {
                    setConversations(prev => prev.map(conv => 
                        conv.participantId === update.userId
                            ? { 
                                ...conv, 
                                isOnline: update.status === 'online',
                                lastSeen: update.lastSeen ? new Date(update.lastSeen) : conv.lastSeen
                            }
                            : conv
                    ));
                });

                // Store unsubscribe functions
                listenersRef.current = [
                    unsubscribeNewMessage,
                    unsubscribeReadReceipt,
                    unsubscribeStatusUpdate
                ];

                console.log('✅ Conversation WebSocket listeners setup complete');

            } catch (error) {
                console.error('❌ Failed to setup conversation listeners:', error);
            }
        };

        setupListeners();

        // Cleanup on unmount or user change
        return () => {
            listenersRef.current.forEach(unsubscribe => {
                if (typeof unsubscribe === 'function') {
                    unsubscribe();
                }
            });
            listenersRef.current = [];
        };
    }, [currentUser?.id, updateConversationWithNewMessage, markConversationAsRead]);

    /**
     * Load initial data when user changes
     */
    useEffect(() => {
        if (currentUser?.id) {
            conversationIds.current.clear();
            setConversations([]);
            setUnreadCount(0);
            setUnreadMessages([]);
            
            // Load data
            loadConversations();
            loadUnreadCount();
            loadUnreadMessages();
        }
    }, [currentUser?.id, loadConversations, loadUnreadCount, loadUnreadMessages]);

    /**
     * Tìm conversation bằng participant ID
     */
    const findConversationByParticipant = useCallback((participantId) => {
        return conversations.find(conv => conv.participantId === participantId);
    }, [conversations]);

    /**
     * Lấy conversation theo ID
     */
    const getConversationById = useCallback((conversationId) => {
        return conversations.find(conv => conv.id === conversationId);
    }, [conversations]);

    return {
        // Conversation data
        conversations,
        loading,
        refreshing,
        
        // Unread data
        unreadCount,
        unreadMessages,
        
        // Actions
        loadConversations,
        refreshConversations,
        loadUnreadMessages,
        loadUnreadCount,
        markConversationAsRead,
        deleteConversation,
        updateConversationWithNewMessage,
        
        // Utils
        findConversationByParticipant,
        getConversationById,
        
        // Service status
        isConnected: webSocketMessageService.isConnected(),
        serviceStatus: webSocketMessageService.getStatus()
    };
};

export default useConversations; 