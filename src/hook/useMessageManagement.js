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

    // 📊 Stats for debugging
    useEffect(() => {
        console.log(`📊 Messages state updated: ${messages.length} total messages`);
        if (messages.length > 0) {
            const latest = messages[0];
            console.log(`📊 Latest message: ${latest?.content?.substring(0, 30)}... from ${latest?.senderId} at ${latest?.createdAt}`);
        }
    }, [messages.length]);

    // 📥 Fetch messages with pagination using correct API
    const fetchMessages = useCallback(async (page = 0, isRefresh = false) => {
        if (isLoadingRef.current && !isRefresh) {
            console.log('⚠️ Already loading messages, skipping...');
            return;
        }

        if (!currentUser?.id || !user?.id) {
            console.log('⚠️ Missing user IDs for fetchMessages');
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

            // Use paginated API with correct method name
            const response = await messagesService.getMessagesBetweenUsersPaginated(
                currentUser.id, 
                user.id, 
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
                    // Reset for refresh or first load
                    setMessages(newMessages);
                    currentPageRef.current = 0;
                    processedMessageIds.current.clear();
                    newMessages.forEach(msg => processedMessageIds.current.add(msg.id));
                } else {
                    // Append for pagination
                    setMessages(prev => {
                        const filteredNew = newMessages.filter(msg => !processedMessageIds.current.has(msg.id));
                        filteredNew.forEach(msg => processedMessageIds.current.add(msg.id));
                        return [...prev, ...filteredNew];
                    });
                }
                
                currentPageRef.current = page;
                paginationInfoRef.current = response.pagination;
                
                // Update hasMore based on pagination info
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
    }, [currentUser?.id, user?.id]);

    // 📥 Load initial messages
    const loadMessages = useCallback(async () => {
        console.log('🚀 Loading initial messages...');
        await fetchMessages(0, false);
    }, [currentUser?.id, user?.id]);

    // 🔄 Fetch new messages (for real-time updates)
    const fetchNewMessages = useCallback(async () => {
        if (!currentUser?.id || !user?.id) {
            console.log('⚠️ Missing user IDs for fetchNewMessages');
            return;
        }

        try {
            console.log('🆕 Fetching new messages...');
            
            // Get first page to check for new messages
            const response = await messagesService.getMessagesBetweenUsersPaginated(
                currentUser.id, 
                user.id, 
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
                    // Chỉ thêm các message thực sự mới vào đầu mảng
                    const newMessages = latestMessages.filter(msg => !processedMessageIds.current.has(msg.id));
                    newMessages.forEach(msg => processedMessageIds.current.add(msg.id));
                    if (newMessages.length > 0) {
                        return [...newMessages, ...prev]; // mới nhất đầu mảng
                    }
                    return prev;
                });
            }
        } catch (error) {
            console.error('❌ Error fetching new messages:', error);
        }
    }, [currentUser?.id, user?.id]);

    // 🔄 Refresh handler
    const onRefresh = useCallback(async () => {
        console.log('🔄 Refreshing messages...');
        await fetchMessages(0, true);
    }, [currentUser?.id, user?.id]);

    // 📄 Load more messages (pagination)
    const loadMoreMessages = useCallback(async () => {
        if (!hasMore || isLoadingRef.current) {
            console.log('⚠️ Cannot load more: hasMore =', hasMore, ', isLoading =', isLoadingRef.current);
            return;
        }

        const nextPage = currentPageRef.current + 1;
        console.log(`📄 Loading more messages, page ${nextPage}...`);
        await fetchMessages(nextPage, false);
    }, [hasMore, currentUser?.id, user?.id]);

    // 📨 Handle new WebSocket message
    const handleNewWebSocketMessage = useCallback((newMessage) => {
        if (!newMessage || !newMessage.id) {
            console.log('⚠️ Invalid WebSocket message received');
            return;
        }
        // Check if message already exists
        if (processedMessageIds.current.has(newMessage.id)) {
            console.log(`🔄 Message ${newMessage.id} already exists, skipping`);
            return;
        }
        console.log(`📨 New WebSocket message: ${newMessage.id} from ${newMessage.senderId}`);
        processedMessageIds.current.add(newMessage.id);
        setMessages(prev => [newMessage, ...prev]); // luôn thêm vào đầu mảng
    }, []);

    // 🧹 Cleanup on unmount
    useEffect(() => {
        return () => {
            processedMessageIds.current.clear();
            isLoadingRef.current = false;
        };
    }, []);

    return {
        // State
        messages,
        setMessages,
        loading,
        refreshing,
        hasMore,
        error,
        
        // Functions
        fetchMessages,
        loadMessages,
        fetchNewMessages,
        onRefresh,
        loadMoreMessages,
        handleNewWebSocketMessage
    };
};

export default useMessageManagement; 