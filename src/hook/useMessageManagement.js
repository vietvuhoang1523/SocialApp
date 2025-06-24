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

    const fetchNewMessages = useCallback(async () => {
        if (!currentUser?.id || !user?.id) {
            console.log('⚠️ Missing user IDs for fetchNewMessages');
            return;
        }

        try {
            console.log('🆕 Fetching new messages...');
            
            const fetchTime = new Date().toISOString();
            
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
                    const newMessages = latestMessages.filter(msg => !processedMessageIds.current.has(msg.id));
                    
                    if (lastMessageTimestampRef.current) {
                        console.log(`🔍 Checking for duplicates with timestamp after ${lastMessageTimestampRef.current}`);
                    }
                    
                    newMessages.forEach(msg => processedMessageIds.current.add(msg.id));
                    
                    if (newMessages.length > 0) {
                        console.log(`✅ Adding ${newMessages.length} new messages`);
                        const combinedMessages = [...newMessages, ...prev];
                        return deduplicateMessages(sortMessagesByTimestamp(combinedMessages));
                    }
                    return prev;
                });
            }
        } catch (error) {
            console.error('❌ Error fetching new messages:', error);
        }
    }, [currentUser?.id, user?.id, sortMessagesByTimestamp, deduplicateMessages]);

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
        if (!newMessage || !newMessage.id) {
            console.log('⚠️ Invalid WebSocket message received');
            return;
        }
        
        if (newMessage.senderId === currentUser?.id) {
            console.log(`📤 Skipping own message from WebSocket: ${newMessage.id}`);
            return;
        }
        
        if (processedMessageIds.current.has(newMessage.id)) {
            console.log(`🔄 Message ${newMessage.id} already exists, skipping`);
            return;
        }
        
        console.log(`📨 New WebSocket message: ${newMessage.id} from ${newMessage.senderId}`);
        
        processedMessageIds.current.add(newMessage.id);
        
        setMessages(prev => {
            const messageExists = prev.some(msg => msg.id === newMessage.id);
            if (messageExists) {
                console.log(`⚠️ Message ${newMessage.id} already in state, not adding again`);
                return prev;
            }
            
            const msgTimestamp = newMessage.timestamp || newMessage.createdAt;
            if (msgTimestamp) {
                lastMessageTimestampRef.current = msgTimestamp;
            }
            
            return sortMessagesByTimestamp([newMessage, ...prev]);
        });
    }, [sortMessagesByTimestamp, currentUser?.id]);

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