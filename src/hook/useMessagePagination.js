import { useState, useEffect, useCallback, useRef } from 'react';
import messagesService from '../services/messagesService';

/**
 * React Hook để quản lý phân trang tin nhắn tương thích với Backend social-matching
 * @param {number} user1Id - ID người dùng thứ nhất
 * @param {number} user2Id - ID người dùng thứ hai  
 * @param {number} pageSize - Số tin nhắn mỗi trang (default: 20)
 * @returns {object} Object chứa messages, pagination info và các methods
 */
export const useMessagePagination = (user1Id, user2Id, pageSize = 20) => {
    const [messages, setMessages] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [allMessages, setAllMessages] = useState(new Map());
    
    // Refs để tránh stale closure
    const loadingRef = useRef(false);
    const currentRequestRef = useRef(null);

    // Load một trang cụ thể
    const loadPage = useCallback(async (page = 0, append = false, forceReload = false) => {
        if (loadingRef.current && !forceReload) {
            console.log('Already loading, skipping...');
            return;
        }
        
        // Cancel previous request if still pending
        if (currentRequestRef.current) {
            currentRequestRef.current.cancelled = true;
        }

        const requestId = Date.now();
        currentRequestRef.current = { id: requestId, cancelled: false };
        
        loadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            console.log(`📄 Loading messages page ${page} (size: ${pageSize})`);
            
            const result = await messagesService.getMessagesBetweenUsersPaginated(
                user1Id, 
                user2Id, 
                { 
                    page, 
                    size: pageSize,
                    sortBy: 'timestamp',
                    order: 'desc'
                }
            );

            // Check if request was cancelled
            if (currentRequestRef.current?.cancelled || currentRequestRef.current?.id !== requestId) {
                console.log('Request was cancelled, ignoring result');
                return;
            }

            if (result && result.pagination) {
                // Paginated response từ Backend
                console.log(`✅ Loaded ${result.messages.length} messages (page ${result.pagination.currentPage})`);
                
                setPagination(result.pagination);
                
                if (append) {
                    // Append to existing messages (for infinite scroll)
                    setMessages(prev => {
                        const newMessages = [...prev];
                        result.messages.forEach(msg => {
                            if (!newMessages.find(m => m.id === msg.id)) {
                                newMessages.push(msg);
                            }
                        });
                        return newMessages;
                    });
                } else {
                    // Replace messages (for page navigation)
                    setMessages(result.messages);
                }

                // Store in all messages map để tránh duplicate
                result.messages.forEach(msg => {
                    setAllMessages(prev => new Map(prev.set(msg.id, msg)));
                });
            } else if (result && Array.isArray(result)) {
                // Non-paginated response (fallback/backward compatibility)
                console.log(`✅ Loaded ${result.length} messages (no pagination)`);
                setMessages(result);
                setPagination(null);
                
                result.forEach(msg => {
                    setAllMessages(prev => new Map(prev.set(msg.id, msg)));
                });
            } else {
                // Empty result
                console.log('📭 No messages found');
                setMessages([]);
                setPagination(null);
            }

        } catch (err) {
            // Check if request was cancelled
            if (currentRequestRef.current?.cancelled || currentRequestRef.current?.id !== requestId) {
                return;
            }
            
            console.error('❌ Error loading messages:', err);
            setError(err.message || 'Failed to load messages');
        } finally {
            if (currentRequestRef.current?.id === requestId) {
                loadingRef.current = false;
                setLoading(false);
                currentRequestRef.current = null;
            }
        }
    }, [user1Id, user2Id, pageSize]);

    // Load trang tiếp theo (for infinite scroll)
    const loadNextPage = useCallback(() => {
        if (pagination && pagination.hasNext && !loadingRef.current) {
            console.log(`📄 Loading next page: ${pagination.currentPage + 1}`);
            loadPage(pagination.currentPage + 1, true);
        }
    }, [pagination, loadPage]);

    // Load trang trước đó
    const loadPreviousPage = useCallback(() => {
        if (pagination && pagination.hasPrevious && !loadingRef.current) {
            console.log(`📄 Loading previous page: ${pagination.currentPage - 1}`);
            loadPage(pagination.currentPage - 1, false);
        }
    }, [pagination, loadPage]);

    // Refresh toàn bộ
    const refresh = useCallback(() => {
        console.log('🔄 Refreshing messages...');
        setMessages([]);
        setAllMessages(new Map());
        setPagination(null);
        loadPage(0, false, true);
    }, [loadPage]);

    // Load first page - sử dụng helper method của messagesService
    const loadFirstPage = useCallback(async () => {
        try {
            console.log('📄 Loading first page with helper method...');
            const result = await messagesService.loadFirstPage(user1Id, user2Id, pageSize);
            
            if (result && result.pagination) {
                setPagination(result.pagination);
                setMessages(result.messages);
                result.messages.forEach(msg => {
                    setAllMessages(prev => new Map(prev.set(msg.id, msg)));
                });
            } else if (result && Array.isArray(result)) {
                setMessages(result);
                setPagination(null);
                result.forEach(msg => {
                    setAllMessages(prev => new Map(prev.set(msg.id, msg)));
                });
            }
        } catch (err) {
            console.error('❌ Error loading first page:', err);
            setError(err.message);
        }
    }, [user1Id, user2Id, pageSize]);

    // Go to specific page
    const goToPage = useCallback((pageNumber) => {
        if (pageNumber >= 0 && (!pagination || pageNumber < pagination.totalPages)) {
            console.log(`📄 Going to page ${pageNumber}`);
            loadPage(pageNumber, false);
        }
    }, [pagination, loadPage]);

    // Auto load first page when user IDs change
    useEffect(() => {
        if (user1Id && user2Id) {
            console.log(`🚀 Initializing message pagination for users ${user1Id} <-> ${user2Id}`);
            loadPage(0, false, true);
        }
        
        // Cleanup on unmount or user change
        return () => {
            if (currentRequestRef.current) {
                currentRequestRef.current.cancelled = true;
            }
        };
    }, [user1Id, user2Id, loadPage]);

    // 🚫 REMOVED: newMessage listener to prevent duplicates
    // This listener was causing duplicate message processing
    // All newMessage handling is now centralized in useChatWebSocket.js

    // Utility functions
    const hasNextPage = pagination?.hasNext || false;
    const hasPreviousPage = pagination?.hasPrevious || false;
    const currentPage = pagination?.currentPage || 0;
    const totalPages = pagination?.totalPages || 0;
    const totalElements = pagination?.totalElements || messages.length;
    const isFirstPage = pagination?.first || currentPage === 0;
    const isLastPage = pagination?.last || !hasNextPage;

    // Advanced utilities
    const getMessageById = useCallback((messageId) => {
        return allMessages.get(messageId);
    }, [allMessages]);

    const getMessagesPage = useCallback((pageNum) => {
        return loadPage(pageNum, false);
    }, [loadPage]);

    return {
        // Data
        messages,
        pagination,
        allMessages,
        
        // State
        loading,
        error,
        
        // Actions
        loadPage,
        loadNextPage,
        loadPreviousPage,
        loadFirstPage,
        refresh,
        goToPage,
        
        // Computed values
        hasNextPage,
        hasPreviousPage,
        currentPage,
        totalPages,
        totalElements,
        isFirstPage,
        isLastPage,
        
        // Utilities
        getMessageById,
        getMessagesPage,
        
        // Meta info
        isEmpty: messages.length === 0,
        messageCount: messages.length,
        loadedPagesCount: pagination ? Math.floor(messages.length / pageSize) : 1
    };
};

export default useMessagePagination; 