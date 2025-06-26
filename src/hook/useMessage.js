// src/hooks/useMessage.js
// React Hook để quản lý tin nhắn với WebSocket
import { useState, useCallback, useRef, useEffect } from 'react';
import { Alert } from 'react-native';
import webSocketService from '../services/WebSocketService';
import messagesService from '../services/messagesService';

/**
 * Hook để quản lý tin nhắn trong cuộc trò chuyện
 * @param {Object} currentUser - Người dùng hiện tại
 * @param {Object} targetUser - Người dùng đích (đang chat với)
 */
const useMessage = (currentUser, targetUser) => {
    // State quản lý tin nhắn
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    
    // State cho pagination
    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 50;
    
    // State cho typing
    const [isTyping, setIsTyping] = useState(false);
    const [typingUsers, setTypingUsers] = useState(new Set());
    
    // Refs để tránh duplicate và manage state
    const messageIds = useRef(new Set());
    const lastLoadTime = useRef(null);
    const typingTimeoutRef = useRef(null);
    
    // Event listener unsubscribe functions
    const listenersRef = useRef([]);

    /**
     * Normalize message data từ server
     */
    const normalizeMessage = useCallback((rawMessage) => {
        if (!rawMessage) return null;

        return {
            id: rawMessage.id,
            content: rawMessage.content || '',
            senderId: rawMessage.senderId,
            receiverId: rawMessage.receiverId,
            senderName: rawMessage.senderName || null,
            senderAvatar: rawMessage.senderAvatar || null,
            timestamp: rawMessage.timestamp ? new Date(rawMessage.timestamp) : new Date(),
            read: rawMessage.read || false,
            delivered: rawMessage.isDelivered || false,
            attachmentUrl: rawMessage.attachmentUrl || null,
            attachmentType: rawMessage.attachmentType || null,
            deletedForAll: rawMessage.deletedForAll || false,
            messageType: rawMessage.messageType || 'text',
            // UI states
            isSending: false,
            isError: false,
            isOptimistic: false
        };
    }, []);

    /**
     * Thêm tin nhắn vào danh sách (tránh duplicate)
     */
    const addMessage = useCallback((newMessage) => {
        const normalized = normalizeMessage(newMessage);
        if (!normalized || messageIds.current.has(normalized.id)) {
            return;
        }

        messageIds.current.add(normalized.id);
        setMessages(prev => {
            // Tìm vị trí chèn dựa trên timestamp (sắp xếp desc - mới nhất trước)
            const insertIndex = prev.findIndex(msg => 
                new Date(msg.timestamp) < new Date(normalized.timestamp)
            );
            
            if (insertIndex === -1) {
                // Thêm vào cuối nếu message cũ nhất
                return [...prev, normalized];
            } else {
                // Chèn vào vị trí phù hợp
                const newArray = [...prev];
                newArray.splice(insertIndex, 0, normalized);
                return newArray;
            }
        });
    }, [normalizeMessage]);

    /**
     * Cập nhật tin nhắn existing
     */
    const updateMessage = useCallback((messageId, updates) => {
        setMessages(prev => prev.map(msg => 
            msg.id === messageId ? { ...msg, ...updates } : msg
        ));
    }, []);

    /**
     * Xóa tin nhắn khỏi danh sách
     */
    const removeMessage = useCallback((messageId) => {
        messageIds.current.delete(messageId);
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
    }, []);

    /**
     * Load tin nhắn từ server
     */
    const loadMessages = useCallback(async (options = {}) => {
        if (!currentUser?.id || !targetUser?.id) {
            console.log('❌ Missing user IDs');
            return;
        }

        if (loading) {
            console.log('⏸️ Already loading messages');
            return;
        }

        try {
            setLoading(true);
            console.log('📄 Loading messages...');

            const result = await webSocketMessageService.getMessages(
                currentUser.id,
                targetUser.id,
                {
                    enablePagination: true,
                    page: options.page || 0,
                    size: options.size || pageSize,
                    sortBy: 'timestamp',
                    order: 'desc'
                }
            );

            if (result && result.messages) {
                const newMessages = result.messages.filter(msg => 
                    !messageIds.current.has(msg.id)
                );

                // Add to messageIds set
                newMessages.forEach(msg => messageIds.current.add(msg.id));

                if (options.page === 0) {
                    // Fresh load - replace all messages
                    setMessages(newMessages.map(normalizeMessage));
                    setCurrentPage(0);
                } else {
                    // Load more - append to existing
                    setMessages(prev => [...prev, ...newMessages.map(normalizeMessage)]);
                    setCurrentPage(options.page);
                }

                // Update pagination info
                if (result.pagination) {
                    setHasMore(!result.pagination.last);
                } else {
                    setHasMore(newMessages.length >= pageSize);
                }

                console.log(`✅ Loaded ${newMessages.length} messages`);
            } else if (Array.isArray(result)) {
                // Backward compatibility
                const newMessages = result.filter(msg => 
                    !messageIds.current.has(msg.id)
                );

                newMessages.forEach(msg => messageIds.current.add(msg.id));
                
                if (options.page === 0) {
                    setMessages(newMessages.map(normalizeMessage));
                } else {
                    setMessages(prev => [...prev, ...newMessages.map(normalizeMessage)]);
                }
                
                setHasMore(false); // No pagination info available
                console.log(`✅ Loaded ${newMessages.length} messages (legacy format)`);
            }

            lastLoadTime.current = Date.now();

        } catch (error) {
            console.error('❌ Failed to load messages:', error);
            Alert.alert('Lỗi', 'Không thể tải tin nhắn. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }, [currentUser?.id, targetUser?.id, loading, pageSize, normalizeMessage]);

    /**
     * Load more messages (pagination)
     */
    const loadMoreMessages = useCallback(async () => {
        if (!hasMore || loading) return;
        
        await loadMessages({ page: currentPage + 1 });
    }, [hasMore, loading, currentPage, loadMessages]);

    /**
     * Refresh messages
     */
    const refreshMessages = useCallback(async () => {
        setRefreshing(true);
        messageIds.current.clear();
        await loadMessages({ page: 0 });
        setRefreshing(false);
    }, [loadMessages]);

    /**
     * Gửi tin nhắn
     */
    const sendMessage = useCallback(async (messageData) => {
        if (!currentUser?.id || !targetUser?.id) {
            Alert.alert('Lỗi', 'Thông tin người dùng không hợp lệ');
            return false;
        }

        if (sending) {
            console.log('⏸️ Already sending a message');
            return false;
        }

        if (!messageData.content?.trim() && !messageData.attachmentUrl) {
            console.log('⚠️ Empty message content');
            return false;
        }

        try {
            setSending(true);

            // Tạo optimistic message
            const optimisticId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const optimisticMessage = {
                id: optimisticId,
                content: messageData.content?.trim() || '',
                senderId: currentUser.id,
                receiverId: targetUser.id,
                senderName: currentUser.name || currentUser.email,
                senderAvatar: currentUser.avatar || null,
                timestamp: new Date(),
                read: false,
                delivered: false,
                attachmentUrl: messageData.attachmentUrl || null,
                attachmentType: messageData.attachmentType || null,
                messageType: messageData.messageType || 'text',
                isSending: true,
                isOptimistic: true,
                isError: false
            };

            // Add optimistic message to UI
            addMessage(optimisticMessage);

            // Prepare payload for server
            const payload = {
                content: messageData.content?.trim() || '',
                receiverId: targetUser.id,
                attachmentUrl: messageData.attachmentUrl || null,
                attachmentType: messageData.attachmentType || null,
                messageType: messageData.messageType || 'text',
                replyToMessageId: messageData.replyToMessageId || null
            };

            console.log('📤 Sending message via WebSocket:', payload);

            // Send via WebSocket
            const success = await webSocketMessageService.sendMessage(payload);

            if (success) {
                // Update optimistic message status
                updateMessage(optimisticId, {
                    isSending: false,
                    delivered: true
                });

                console.log('✅ Message sent successfully');
                return true;
            } else {
                throw new Error('Failed to send message via WebSocket');
            }

        } catch (error) {
            console.error('❌ Failed to send message:', error);
            
            // Mark optimistic message as error
            updateMessage(optimisticId, {
                isSending: false,
                isError: true,
                errorMessage: error.message
            });

            Alert.alert('Lỗi gửi tin nhắn', error.message);
            return false;
        } finally {
            setSending(false);
        }
    }, [currentUser, targetUser, sending, addMessage, updateMessage]);

    /**
     * Gửi thông báo typing
     */
    const sendTypingNotification = useCallback(async (isTyping) => {
        if (!targetUser?.id) return;

        try {
            await webSocketMessageService.sendTypingNotification(targetUser.id, isTyping);
            setIsTyping(isTyping);

            // Auto stop typing after 3 seconds
            if (isTyping) {
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }
                typingTimeoutRef.current = setTimeout(() => {
                    sendTypingNotification(false);
                }, 3000);
            }
        } catch (error) {
            console.error('❌ Failed to send typing notification:', error);
        }
    }, [targetUser?.id]);

    /**
     * Đánh dấu tin nhắn đã đọc
     */
    const markAsRead = useCallback(async (messageId) => {
        try {
            await webSocketMessageService.markAsRead(messageId);
            updateMessage(messageId, { read: true });
        } catch (error) {
            console.error('❌ Failed to mark as read:', error);
        }
    }, [updateMessage]);

    /**
     * Đánh dấu tất cả tin nhắn đã đọc
     */
    const markAllAsRead = useCallback(async () => {
        if (!currentUser?.id || !targetUser?.id) return;

        try {
            await webSocketMessageService.markAllAsRead(targetUser.id, currentUser.id);
            
            // Update all unread messages from target user
            setMessages(prev => prev.map(msg => 
                msg.senderId === targetUser.id && !msg.read 
                    ? { ...msg, read: true }
                    : msg
            ));
        } catch (error) {
            console.error('❌ Failed to mark all as read:', error);
        }
    }, [currentUser?.id, targetUser?.id]);

    /**
     * Xóa tin nhắn
     */
    const deleteMessage = useCallback(async (messageId, deleteForEveryone = false) => {
        try {
            await webSocketMessageService.deleteMessage(messageId, deleteForEveryone);
            
            if (deleteForEveryone) {
                removeMessage(messageId);
            } else {
                updateMessage(messageId, { deletedForAll: true });
            }
        } catch (error) {
            console.error('❌ Failed to delete message:', error);
            Alert.alert('Lỗi', 'Không thể xóa tin nhắn');
        }
    }, [removeMessage, updateMessage]);

    /**
     * Setup WebSocket event listeners
     */
    useEffect(() => {
        if (!currentUser?.id || !targetUser?.id) return;

        const setupListeners = async () => {
            try {
                await webSocketMessageService.initialize();

                // 🚫 REMOVED: newMessage listener to prevent duplicates
                // This was causing multiple message processing
                // All newMessage handling is now centralized in useChatWebSocket.js

                // Listen for typing notifications
                const unsubscribeTyping = webSocketMessageService.on('typing', (notification) => {
                    if (notification.senderId === targetUser.id) {
                        if (notification.typing) {
                            setTypingUsers(prev => new Set([...prev, targetUser.id]));
                        } else {
                            setTypingUsers(prev => {
                                const newSet = new Set(prev);
                                newSet.delete(targetUser.id);
                                return newSet;
                            });
                        }
                    }
                });

                // Listen for read receipts
                const unsubscribeReadReceipt = webSocketMessageService.on('readReceipt', (receipt) => {
                    updateMessage(receipt.messageId, { read: true });
                });

                // Listen for message deleted
                const unsubscribeMessageDeleted = webSocketMessageService.on('messageDeleted', (data) => {
                    if (data.deleteForEveryone) {
                        removeMessage(data.messageId);
                    } else {
                        updateMessage(data.messageId, { deletedForAll: true });
                    }
                });

                // Store unsubscribe functions (excluding removed newMessage listener)
                listenersRef.current = [
                    unsubscribeTyping,
                    unsubscribeReadReceipt,
                    unsubscribeMessageDeleted
                ];

                console.log('✅ WebSocket listeners setup complete');

            } catch (error) {
                console.error('❌ Failed to setup WebSocket listeners:', error);
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

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [currentUser?.id, targetUser?.id, addMessage, updateMessage, removeMessage, markAsRead]);

    /**
     * Load messages when users change
     */
    useEffect(() => {
        if (currentUser?.id && targetUser?.id) {
            messageIds.current.clear();
            setMessages([]);
            setCurrentPage(0);
            setHasMore(true);
            loadMessages({ page: 0 });
        }
    }, [currentUser?.id, targetUser?.id, loadMessages]);

    return {
        // Message data
        messages,
        loading,
        sending,
        refreshing,
        hasMore,
        
        // Typing state
        isTyping,
        typingUsers: Array.from(typingUsers),
        
        // Actions
        sendMessage,
        loadMessages,
        loadMoreMessages,
        refreshMessages,
        sendTypingNotification,
        markAsRead,
        markAllAsRead,
        deleteMessage,
        
        // Service status
        isConnected: webSocketMessageService.isConnected(),
        serviceStatus: webSocketMessageService.getStatus()
    };
};

export default useMessage; 