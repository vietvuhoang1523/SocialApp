// useChatWebSocket.js - Updated
import { useState, useEffect, useCallback, useRef } from 'react';
import webSocketService from '../services/WebSocketService';

const useChatWebSocket = (currentUser, chatPartner, onNewMessage) => {
    const [wsConnected, setWsConnected] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef(null);
    const connectionKey = useRef(`chat_${currentUser?.id}_${chatPartner?.id}`);

    useEffect(() => {
        if (!currentUser?.id || !chatPartner?.id) {
            console.warn('Missing currentUser or chatPartner IDs for WebSocket');
            return;
        }

        console.log('Setting up WebSocket for chat between:', currentUser.id, 'and', chatPartner.id);

        const handleConnectionChange = (connected) => {
            console.log('WebSocket connection status changed:', connected);
            setWsConnected(connected);
        };

        const handleMessage = (message) => {
            console.log('Received message via WebSocket:', message);

            // Kiểm tra xem tin nhắn có thuộc cuộc trò chuyện hiện tại không
            const isMessageForCurrentChat =
                (message.senderId === chatPartner.id && message.receiverId === currentUser.id) ||
                (message.senderId === currentUser.id && message.receiverId === chatPartner.id);

            if (isMessageForCurrentChat) {
                console.log('Message belongs to current chat, processing...');
                onNewMessage(message);
            } else {
                console.log('Message not for current chat, ignoring');
            }
        };

        const handleTyping = (typingData) => {
            console.log('Received typing notification:', typingData);

            // Chỉ xử lý typing notification từ người đang chat
            if (typingData.senderId === chatPartner.id) {
                setIsTyping(typingData.typing);

                // Tự động tắt typing indicator sau 3 giây
                if (typingData.typing) {
                    if (typingTimeoutRef.current) {
                        clearTimeout(typingTimeoutRef.current);
                    }
                    typingTimeoutRef.current = setTimeout(() => {
                        setIsTyping(false);
                    }, 3000);
                }
            }
        };

        const handleReadReceipt = (receipt) => {
            console.log('Received read receipt:', receipt);
            // Có thể cập nhật UI để hiển thị tin nhắn đã được đọc
        };

        // Setup listeners với key duy nhất cho cuộc trò chuyện này
        webSocketService.onConnectionChange(handleConnectionChange);
        webSocketService.onMessage(connectionKey.current, handleMessage);
        webSocketService.onTyping(connectionKey.current, handleTyping);
        webSocketService.onReadReceipt(connectionKey.current, handleReadReceipt);

        // Kết nối WebSocket nếu chưa kết nối
        const initializeConnection = async () => {
            try {
                if (!webSocketService.isConnected()) {
                    console.log('WebSocket not connected, connecting...');
                    await webSocketService.connect();
                } else {
                    console.log('WebSocket already connected');
                    setWsConnected(true);
                }
            } catch (error) {
                console.error('Failed to initialize WebSocket connection:', error);
                // Thử kết nối lại sau 5 giây
                setTimeout(() => {
                    initializeConnection();
                }, 5000);
            }
        };

        initializeConnection();

        // Cleanup function
        return () => {
            console.log('Cleaning up WebSocket listeners for chat');

            // Clear typing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Remove listeners
            webSocketService.offConnectionChange(handleConnectionChange);
            webSocketService.offMessage(connectionKey.current);
            webSocketService.offTyping(connectionKey.current);
            webSocketService.offReadReceipt(connectionKey.current);
        };
    }, [currentUser?.id, chatPartner?.id, onNewMessage]);

    // Gửi tin nhắn qua WebSocket
    const sendMessageViaWebSocket = useCallback(async (message) => {
        try {
            if (!wsConnected) {
                console.log('WebSocket not connected, attempting to connect...');
                await webSocketService.connect();
            }

            console.log('Sending message via WebSocket:', message);

            // Sử dụng WebSocketService để gửi tin nhắn
            const success = webSocketService.sendMessage(message);

            if (success) {
                console.log('Message sent successfully via WebSocket');
                return true;
            } else {
                console.error('Failed to send message via WebSocket');
                return false;
            }
        } catch (error) {
            console.error('Error sending message via WebSocket:', error);
            return false;
        }
    }, [wsConnected]);

    // Gửi thông báo typing
    const sendTypingNotification = useCallback((isTyping = true) => {
        if (!wsConnected || !chatPartner?.id) {
            console.log('Cannot send typing notification: not connected or no chat partner');
            return false;
        }

        try {
            const success = webSocketService.sendTyping(chatPartner.id, isTyping);
            console.log(`Typing notification sent: ${isTyping}`, success);
            return success;
        } catch (error) {
            console.error('Error sending typing notification:', error);
            return false;
        }
    }, [wsConnected, chatPartner?.id]);

    // Gửi read receipt
    const markMessageAsRead = useCallback((messageId, senderId) => {
        if (!wsConnected) {
            console.log('Cannot send read receipt: not connected');
            return false;
        }

        try {
            const success = webSocketService.sendReadReceipt(messageId, senderId);
            console.log(`Read receipt sent for message ${messageId}:`, success);
            return success;
        } catch (error) {
            console.error('Error sending read receipt:', error);
            return false;
        }
    }, [wsConnected]);

    // Debug connection status
    const getConnectionStatus = useCallback(() => {
        return webSocketService.getConnectionStatus();
    }, []);

    return {
        wsConnected,
        isTyping,
        sendMessageViaWebSocket,
        sendTypingNotification,
        markMessageAsRead,
        getConnectionStatus
    };
};

export default useChatWebSocket;