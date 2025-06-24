import { useState, useEffect, useRef } from 'react';
import webSocketService from '../services/WebSocketService';
import { EMERGENCY_MODE } from '../../EmergencyMode';

const useChatWebSocket = (currentUserId, receiverId, handleNewWebSocketMessage) => {
    // 🆘 EMERGENCY MODE: Return mock WebSocket state
    if (EMERGENCY_MODE.enabled) {
        console.log('🆘 [EMERGENCY MODE] Using mock WebSocket state');
        
        return {
            isConnected: true, // Fake connected state
            connectionError: null,
            isTyping: false,
            isOtherUserTyping: false,
            lastMessage: null,
            sendMessage: async () => {
                console.log('🆘 [EMERGENCY MODE] Mock message sent via WebSocket');
                return true;
            },
            sendTypingNotification: () => {
                console.log('🆘 [EMERGENCY MODE] Mock typing notification');
                return true;
            },
            markMessageAsRead: async () => {
                console.log('🆘 [EMERGENCY MODE] Mock mark as read');
                return { success: true };
            },
            reconnect: async () => {
                console.log('🆘 [EMERGENCY MODE] Mock reconnect');
                return true;
            },
            getConnectionStatus: () => 'connected'
        };
    }

    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
    const [lastMessage, setLastMessage] = useState(null);
    
    const connectionKey = useRef(null);
    const typingTimeoutRef = useRef(null);
    const eventKeys = useRef({}); // Store event keys for cleanup

    useEffect(() => {
        if (!currentUserId || !receiverId) {
            console.log('⚠️ Missing user IDs, không thể kết nối WebSocket');
            console.log('currentUserId:', currentUserId, 'receiverId:', receiverId);
                    return;
                }

        connectionKey.current = `chat_${currentUserId}_${receiverId}`;
        console.log(`🔌 Khởi tạo WebSocket connection: ${connectionKey.current}`);

        // Hàm xử lý lỗi
        const handleError = (error) => {
            console.error('❌ WebSocket error:', error);
            setConnectionError(error);
            setIsConnected(false);
        };

        // Hàm xử lý tin nhắn mới
        const handleNewMessage = (message) => {
            console.log('📨 Tin nhắn mới qua WebSocket:', message);
            console.log('📨 Message details:', {
                id: message.id,
                senderId: message.senderId,
                receiverId: message.receiverId,
                content: message.content?.substring(0, 50),
                timestamp: message.timestamp
            });
            
            // Kiểm tra xem tin nhắn có liên quan đến cuộc trò chuyện hiện tại không
            const isRelevantMessage = 
                (message.senderId === currentUserId && message.receiverId === receiverId) ||
                (message.senderId === receiverId && message.receiverId === currentUserId);
            
            console.log('🔍 Message relevance check:', {
                currentUserId,
                receiverId,
                messageSenderId: message.senderId,
                messageReceiverId: message.receiverId,
                isRelevantMessage
            });
            
            if (isRelevantMessage) {
                // ⚡ FIX: Chỉ pass tin nhắn từ NGƯỜI KHÁC để tránh duplicate
                // Tin nhắn từ chính mình đã được xử lý bởi temporary message system
                if (message.senderId === receiverId) {
                    console.log('📨 Message from other user, passing to handleNewWebSocketMessage');
                    setLastMessage(message);
                    setIsOtherUserTyping(false);
                    
                    // Pass to message management hook
                    if (typeof handleNewWebSocketMessage === 'function') {
                        handleNewWebSocketMessage(message);
                    } else {
                        console.warn('⚠️ handleNewWebSocketMessage function not provided');
                    }
                } else {
                    console.log('📤 Message from current user, updating lastMessage but not passing to UI to avoid duplicate');
                    // Vẫn cập nhật lastMessage để theo dõi trạng thái, nhưng không pass vào UI
                    setLastMessage(message);
                }
            } else {
                console.log('📨 Message not relevant to current conversation, ignoring');
            }
        };

        // Hàm xử lý thông báo typing
        const handleTyping = (notification) => {
            console.log('⌨️ Typing notification:', notification);
            
            if (notification.senderId === receiverId) {
                setIsOtherUserTyping(notification.isTyping);
                
                // Auto clear typing after 3 seconds
                if (notification.isTyping) {
                            if (typingTimeoutRef.current) {
                                clearTimeout(typingTimeoutRef.current);
                            }
                            typingTimeoutRef.current = setTimeout(() => {
                        setIsOtherUserTyping(false);
                            }, 3000);
                        }
                    }
                };

        // Hàm xử lý kết nối thành công
        const handleConnection = () => {
            console.log('✅ WebSocket connected successfully');
            setIsConnected(true);
            setConnectionError(null);
        };

        // ⚡ FIX: Better connection status checking
        const checkConnectionStatus = () => {
            const actuallyConnected = webSocketService.isConnected();
            console.log('🔍 Connection status check:', {
                wsServiceConnected: actuallyConnected,
                currentState: isConnected
            });
            
            if (actuallyConnected !== isConnected) {
                console.log(`🔄 Updating connection state: ${isConnected} → ${actuallyConnected}`);
                setIsConnected(actuallyConnected);
                if (!actuallyConnected) {
                    setConnectionError(new Error('WebSocket connection lost'));
                } else {
                    setConnectionError(null);
                }
            }
            
            return actuallyConnected;
        };

        // Đăng ký event listeners với API mới
        const setupConnection = async () => {
            try {
                console.log('🔄 Setting up WebSocket connection...');
                
                // ⚡ FIX: Check connection status more thoroughly
                const actualConnectionStatus = checkConnectionStatus();
                console.log('WebSocket actualConnectionStatus:', actualConnectionStatus);

                eventKeys.current.newMessage = webSocketService.on('newMessage', handleNewMessage);
                eventKeys.current.typing = webSocketService.on('typing', handleTyping);
                eventKeys.current.error = webSocketService.on('error', handleError);
                
                // ⚡ FIX: Listen for connection status changes
                eventKeys.current.connectionStatus = webSocketService.on('connectionStatus', (status) => {
                    console.log('🔄 WebSocket connection status changed:', status);
                    if (status === 'connected') {
                        handleConnection();
                    } else if (status === 'disconnected' || status === 'error') {
                        setIsConnected(false);
                        setConnectionError(new Error(`Connection ${status}`));
                    }
                });
                
                console.log('✅ Event listeners registered');

                // If not connected, try to connect
                if (!actualConnectionStatus) {
                    console.log('🔄 WebSocket chưa kết nối, đang kết nối...');
                    try {
                        await webSocketService.connectWithStoredToken();
                        console.log('✅ WebSocket connection attempt completed');
                        
                        // ⚡ FIX: Double-check connection after connect attempt
                        const finalStatus = checkConnectionStatus();
                        if (!finalStatus) {
                            console.log('❌ WebSocket connection failed - service reports not connected');
                            setConnectionError(new Error('Failed to establish WebSocket connection'));
                        }
                    } catch (error) {
                        console.error('❌ WebSocket connection error:', error);
                        handleError(error);
                    }
                } else {
                    handleConnection();
                }

            } catch (error) {
                console.error('❌ Lỗi khi đăng ký WebSocket listeners:', error);
                setConnectionError(error);
            }
        };

        setupConnection();

        // Cleanup function
        return () => {
            console.log(`🧹 Cleaning up WebSocket listeners for ${connectionKey.current}`);
            
            // Clear typing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Unsubscribe from events
            Object.entries(eventKeys.current).forEach(([eventType, key]) => {
                try {
                    webSocketService.off(eventType, key);
                } catch (error) {
                    console.warn(`Warning: Could not unsubscribe from ${eventType}:`, error);
                }
            });

            // Reset state
            setIsConnected(false);
            setConnectionError(null);
            setIsTyping(false);
            setIsOtherUserTyping(false);
            setLastMessage(null);
        };
    }, [currentUserId, receiverId]);

    // Gửi tin nhắn
    const sendMessage = async (content, attachmentUrl = null) => {
        try {
            if (!webSocketService.isConnected()) {
                throw new Error('WebSocket not connected');
            }

            const messageData = {
                content,
                receiverId,
                attachmentUrl,
                timestamp: new Date().toISOString()
            };

            console.log('📤 Sending message via WebSocket:', messageData);
            
            // ⚡ FIX: Wait for WebSocket to be truly ready before sending
            await webSocketService._waitForStompReady(8000);
            
            const success = await webSocketService.sendMessage(messageData);
            if (success) {
                console.log('✅ WebSocket message sent successfully');
                // ⚡ FIX: Return format expected by useMessageHandlers
                return {
                    success: true,
                    method: 'websocket',
                    message: null // Real message will come via WebSocket subscription
                };
            } else {
                throw new Error('WebSocket sendMessage returned false');
            }
        } catch (error) {
            console.error('❌ Error sending message via WebSocket:', error);
            setConnectionError(error);
            // ⚡ FIX: Re-throw with more context
            throw new Error(`WebSocket send failed: ${error.message}`);
        }
    };

    // Gửi thông báo typing
    const sendTypingNotification = async (isTypingNow = true) => {
        try {
            if (!webSocketService.isConnected()) {
                console.warn('⚠️ WebSocket not connected, cannot send typing notification');
            return false;
        }

            const success = await webSocketService.sendTyping(receiverId, isTypingNow);
            if (success) {
                setIsTyping(isTypingNow);
                
                // Auto stop typing after 2 seconds
                if (isTypingNow) {
                    if (typingTimeoutRef.current) {
                        clearTimeout(typingTimeoutRef.current);
                    }
                    typingTimeoutRef.current = setTimeout(() => {
                        sendTypingNotification(false);
                    }, 2000);
                }
            }
            return success;
        } catch (error) {
            console.error('❌ Lỗi gửi typing notification:', error);
            return false;
        }
    };

    // Đánh dấu tin nhắn đã đọc
    const markMessageAsRead = async (messageId) => {
        try {
            if (!webSocketService.isConnected()) {
                throw new Error('WebSocket not connected');
            }

            const success = await webSocketService.markMessageAsRead(messageId);
            if (success) {
                console.log('✅ Đã đánh dấu tin nhắn đã đọc');
                return true;
            } else {
                throw new Error('Failed to mark message as read');
            }
        } catch (error) {
            console.error('❌ Lỗi đánh dấu tin nhắn đã đọc:', error);
            throw error;
        }
    };

    return {
        isConnected,
        connectionError,
        isTyping,
        isOtherUserTyping,
        lastMessage,
        sendMessage,
        sendTypingNotification,
        markMessageAsRead,
        
        // Utility functions
        clearError: () => setConnectionError(null),
        resetTyping: () => {
            setIsTyping(false);
            setIsOtherUserTyping(false);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        },
        
        // ⚡ FIX: Add debugging and reconnection utilities
        reconnect: async () => {
            try {
                console.log('🔄 Manual reconnect requested');
                setConnectionError(null);
                setIsConnected(false);
                
                if (webSocketService.isConnected()) {
                    console.log('🔌 Disconnecting existing connection...');
                    webSocketService.disconnect();
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
                console.log('🔌 Attempting reconnection...');
                await webSocketService.connectWithStoredToken();
                
                const finalStatus = webSocketService.isConnected();
                setIsConnected(finalStatus);
                
                if (finalStatus) {
                    console.log('✅ Manual reconnection successful');
                    return true;
                } else {
                    console.log('❌ Manual reconnection failed');
                    setConnectionError(new Error('Reconnection failed'));
                    return false;
                }
            } catch (error) {
                console.error('❌ Manual reconnection error:', error);
                setConnectionError(error);
                return false;
            }
        },
        
        getConnectionStatus: () => {
            return {
                hookState: isConnected,
                serviceState: webSocketService.isConnected(),
                serviceStatus: webSocketService.getConnectionStatus(),
                error: connectionError?.message,
                lastMessage: lastMessage?.id
            };
        }
    };
};

export default useChatWebSocket;