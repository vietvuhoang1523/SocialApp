// useMessageManagement.js - Hook quản lý tin nhắn
import { useState, useCallback, useEffect, useRef } from 'react';
import messagesService from '../services/messagesService';

const useMessageManagement = (currentUser, user) => {
    // 📱 State management
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState(null);

    // 🔧 References
    const currentPageRef = useRef(0);
    const isLoadingRef = useRef(false);
    const processedMessageIds = useRef(new Set());
    const paginationInfoRef = useRef(null);
    const lastMessageTimestampRef = useRef(null);
    const flatListRef = useRef(null);

    // 📊 Stats for debugging
    useEffect(() => {
        console.log(`📊 Messages state updated: ${messages.length} total messages`);
        if (messages.length > 0) {
            const latest = messages[0];
            console.log(`📊 Latest message: ${latest?.content?.substring(0, 30)}... from ${latest?.senderId} at ${latest?.timestamp || latest?.createdAt}`);
            
            if (latest?.timestamp || latest?.createdAt) {
                lastMessageTimestampRef.current = latest?.timestamp || latest?.createdAt;
            }
        }
    }, [messages.length]);

    const sortMessagesByTimestamp = useCallback((msgs) => {
        return [...msgs].sort((a, b) => {
            const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
            const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
            return timeB - timeA;
        });
    }, []);

    const deduplicateMessages = useCallback((msgs) => {
        const uniqueIds = new Set();
        return msgs.filter(msg => {
            if (!msg.id || uniqueIds.has(msg.id)) {
                return false;
            }
            uniqueIds.add(msg.id);
            return true;
        });
    }, []);

    const fetchMessages = useCallback(async (page = 0, isRefresh = false) => {
        if (isLoadingRef.current && !isRefresh) {
            console.log('⚠️ Already loading messages, skipping...');
            return;
        }

        if (!currentUser?.id || !user?.id) {
            console.log('⚠️ Missing user IDs for fetchMessages:', {
                currentUserId: currentUser?.id,
                userId: user?.id,
                hasCurrentUser: !!currentUser,
                hasUser: !!user
            });
            return;
        }

        // 🚨 CRITICAL: Check if trying to chat with yourself
        if (currentUser?.id === user?.id) {
            console.error('❌ Cannot load messages: trying to chat with yourself!', {
                currentUserId: currentUser?.id,
                targetUserId: user?.id
            });
            setError('Không thể tải tin nhắn với chính mình');
            return;
        }

        // 🔍 DEBUG: Log detailed user info for backend debugging
        console.log('📝 [fetchMessages] User details:', {
            currentUser: {
                id: currentUser?.id,
                email: currentUser?.email,
                name: currentUser?.name
            },
            targetUser: {
                id: user?.id,
                email: user?.email,
                name: user?.name
            },
            page,
            isRefresh
        });

        try {
            isLoadingRef.current = true;
            
            if (isRefresh) {
                setRefreshing(true);
                console.log('🔄 Refreshing messages...');
            } else {
                setLoading(true);
                console.log(`📥 Fetching messages page ${page}...`);
            }

            const response = await messagesService.getMessagesBetweenUsersPaginated(
                currentUser?.id, 
                user?.id, 
                {
                    page,
                    size: 20,
                    sortBy: 'timestamp',
                    order: 'desc'
                }
            );
            
            if (response && response.messages) {
                const newMessages = response.messages;
                console.log(`✅ Fetched ${newMessages.length} messages from API`);

                if (isRefresh || page === 0) {
                    const sortedMessages = sortMessagesByTimestamp(newMessages);
                    setMessages(sortedMessages);
                    currentPageRef.current = 0;
                    
                    processedMessageIds.current.clear();
                    sortedMessages.forEach(msg => processedMessageIds.current.add(msg.id));
                } else {
                    setMessages(prev => {
                        const filteredNew = newMessages.filter(msg => !processedMessageIds.current.has(msg.id));
                        filteredNew.forEach(msg => processedMessageIds.current.add(msg.id));
                        
                        const combinedMessages = [...prev, ...filteredNew];
                        return sortMessagesByTimestamp(combinedMessages);
                    });
                }
                
                currentPageRef.current = page;
                paginationInfoRef.current = response.pagination;
                
                if (response.pagination) {
                    setHasMore(response.pagination.hasNext);
                } else {
                    setHasMore(newMessages.length >= 20);
                }
                
                setError(null);
            } else {
                console.log('⚠️ No messages data received');
                if (isRefresh || page === 0) {
                    setMessages([]);
                }
                setHasMore(false);
            }

        } catch (error) {
            console.error('❌ Error fetching messages:', error);
            setError(error.message || 'Failed to load messages');
            
            if (isRefresh || page === 0) {
                setMessages([]);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
            isLoadingRef.current = false;
        }
    }, [currentUser?.id, user?.id, sortMessagesByTimestamp]);

    const loadMessages = useCallback(async () => {
        console.log('🚀 Loading initial messages...');
        await fetchMessages(0, false);
    }, [fetchMessages]);

    // 🔄 Safe refresh function - only used when absolutely necessary
    const fetchNewMessages = useCallback(async (forceRefresh = false) => {
        if (!currentUser?.id || !user?.id) {
            console.log('⚠️ Missing user IDs for fetchNewMessages');
            return;
        }

        // 🔒 PROTECTION: Don't fetch if we have recent messages and WebSocket is connected
        if (!forceRefresh && messages.length > 0 && lastMessageTimestampRef.current) {
            const lastMessageTime = new Date(lastMessageTimestampRef.current).getTime();
            const now = Date.now();
            const timeDiff = now - lastMessageTime;
            
            // If last message is less than 30 seconds old, skip fetch (WebSocket should handle new messages)
            if (timeDiff < 30000) {
                console.log(`🚫 Skipping fetchNewMessages - last message only ${Math.round(timeDiff/1000)}s ago, WebSocket should handle new messages`);
                return;
            }
        }

        try {
            console.log('🆕 Fetching new messages...', { forceRefresh, messageCount: messages.length });
            
            const response = await messagesService.getMessagesBetweenUsersPaginated(
                currentUser?.id, 
                user?.id, 
                {
                    page: 0,
                    size: 20,
                    sortBy: 'timestamp',
                    order: 'desc'
                }
            );
            
            if (response && response.messages) {
                const latestMessages = response.messages;
                console.log(`✅ Fetched ${latestMessages.length} latest messages`);

                setMessages(prev => {
                    // 🔒 CRITICAL: More aggressive duplicate filtering
                    const newMessages = latestMessages.filter(msg => {
                        // Skip if already processed
                        if (processedMessageIds.current.has(msg.id)) {
                            return false;
                        }
                        
                        // Skip if already exists in current state  
                        if (prev.some(existingMsg => existingMsg.id === msg.id)) {
                            console.log(`🔒 [fetchNewMessages] Duplicate blocked in state: ${msg.id}`);
                            return false;
                        }
                        
                        return true;
                    });
                    
                    if (lastMessageTimestampRef.current) {
                        console.log(`🔍 Checking for duplicates with timestamp after ${lastMessageTimestampRef.current}`);
                    }
                    
                    newMessages.forEach(msg => processedMessageIds.current.add(msg.id));
                    
                    if (newMessages.length > 0) {
                        console.log(`✅ Adding ${newMessages.length} new messages via fetchNewMessages`);
                        const combinedMessages = [...newMessages, ...prev];
                        return deduplicateMessages(sortMessagesByTimestamp(combinedMessages));
                    } else {
                        console.log(`📭 No new messages to add from fetchNewMessages (${latestMessages.length} total fetched, all duplicates)`);
                    }
                    return prev;
                });
            }
        } catch (error) {
            console.error('❌ Error fetching new messages:', error);
        }
    }, [currentUser?.id, user?.id, messages.length, sortMessagesByTimestamp, deduplicateMessages]);

    const onRefresh = useCallback(async () => {
        console.log('🔄 Refreshing messages...');
        await fetchMessages(0, true);
    }, [fetchMessages]);

    const loadMoreMessages = useCallback(async () => {
        if (!hasMore || isLoadingRef.current) {
            console.log('⚠️ Cannot load more: hasMore =', hasMore, ', isLoading =', isLoadingRef.current);
            return;
        }

        const nextPage = currentPageRef.current + 1;
        console.log(`📄 Loading more messages, page ${nextPage}...`);
        await fetchMessages(nextPage, false);
    }, [hasMore, fetchMessages]);

    const handleNewWebSocketMessage = useCallback((newMessage) => {
        // Kiểm tra message hợp lệ
        if (!newMessage?.id || !newMessage?.senderId || !newMessage?.receiverId) {
            console.warn('⚠️ [useMessageManagement] Invalid message:', newMessage);
            return;
        }
        
        console.log(`📨 [useMessageManagement] Processing message ${newMessage.id}`);
        
        // 🔒 CRITICAL: Triple-check for duplicates before processing
        if (processedMessageIds.current.has(newMessage.id)) {
            console.log(`🚫 [useMessageManagement] DUPLICATE BLOCKED: Message ${newMessage.id} already processed`);
            return;
        }
        
        // 🔒 CRITICAL: Mark as processed IMMEDIATELY to prevent race conditions
        processedMessageIds.current.add(newMessage.id);
        
        // Auto-cleanup old processed IDs (keep last 200)
        if (processedMessageIds.current.size > 200) {
            const idsArray = Array.from(processedMessageIds.current);
            const toRemove = idsArray.slice(0, idsArray.length - 200);
            toRemove.forEach(id => processedMessageIds.current.delete(id));
            console.log('🧹 [useMessageManagement] Cleaned up old processed message IDs');
        }

        // Chuẩn hóa message
        const normalizedMessage = {
            id: newMessage.id,
            content: newMessage.content,
            senderId: newMessage.senderId,
            receiverId: newMessage.receiverId,
            timestamp: newMessage.timestamp || new Date().toISOString(),
            attachmentUrl: newMessage.attachmentUrl,
            isRead: newMessage.isRead || false,
            isDelivered: true,
            messageType: newMessage.messageType || 'TEXT',
            status: 'delivered'
        };

        // Thêm vào UI ngay lập tức
        setMessages(prevMessages => {
            // Double-check trong state để đảm bảo
            if (prevMessages.some(msg => msg.id === normalizedMessage.id)) {
                console.log(`🔄 [useMessageManagement] Message ${normalizedMessage.id} already in UI`);
                return prevMessages;
            }

            console.log(`✅ [useMessageManagement] Adding message ${normalizedMessage.id} to UI`);
            return [normalizedMessage, ...prevMessages];
        });

    }, [setMessages]);

    useEffect(() => {
        return () => {
            processedMessageIds.current.clear();
            isLoadingRef.current = false;
            lastMessageTimestampRef.current = null;
        };
    }, []);

    return {
        messages,
        setMessages,
        loading,
        refreshing,
        hasMore,
        error,
        
        fetchMessages,
        loadMessages,
        fetchNewMessages,
        onRefresh,
        loadMoreMessages,
        handleNewWebSocketMessage
    };
};

export default useMessageManagement; 