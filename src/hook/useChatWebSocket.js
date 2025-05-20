// src/hooks/useChatWebSocket.js
import { useState, useEffect, useRef, useCallback } from 'react';
import webSocketService from '../services/WebSocketService';

const useChatWebSocket = (currentUser, chatPartner, onNewMessage) => {
    const [isTyping, setIsTyping] = useState(false);
    const [wsConnected, setWsConnected] = useState(false);
    const typingTimeoutRef = useRef(null);

    // Kết nối và theo dõi các sự kiện WebSocket
    useEffect(() => {
        if (!currentUser?.id || !chatPartner?.id) return;

        // Kết nối WebSocket khi vào màn hình chat
        const connectSocket = async () => {
            try {
                await webSocketService.connect();
            } catch (error) {
                console.error('Lỗi khi kết nối WebSocket:', error);
            }
        };

        connectSocket();

        // Theo dõi trạng thái kết nối
        const connectionKey = `chat_${currentUser.id}_${chatPartner.id}`;
        webSocketService.onConnectionChange(connectionKey, (connected) => {
            setWsConnected(connected);
            console.log('WebSocket connection status:', connected);
        });

        // Đăng ký nhận tin nhắn mới
        webSocketService.onMessage(connectionKey, handleNewMessage);

        // Đăng ký nhận thông báo typing
        webSocketService.onTyping(connectionKey, handleTypingNotification);

        // Đăng ký nhận read receipt
        webSocketService.onReadReceipt(connectionKey, handleReadReceipt);

        // Cleanup khi unmount
        return () => {
            webSocketService.offMessage(connectionKey);
            webSocketService.offTyping(connectionKey);
            webSocketService.offReadReceipt(connectionKey);
            webSocketService.offConnectionChange(connectionKey);

            // Hủy timeout nếu có
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [currentUser?.id, chatPartner?.id]);

    // Xử lý khi nhận tin nhắn mới từ WebSocket
    const handleNewMessage = useCallback((newMessage) => {
        // Kiểm tra xem tin nhắn có liên quan đến cuộc trò chuyện hiện tại không
        if (
            (newMessage.senderId === chatPartner.id && newMessage.receiverId === currentUser.id) ||
            (newMessage.senderId === currentUser.id && newMessage.receiverId === chatPartner.id)
        ) {
            console.log('Received new message via WebSocket:', newMessage);

            // Gọi callback để cập nhật UI
            if (onNewMessage) {
                onNewMessage(newMessage);
            }

            // Đánh dấu là đã đọc nếu tin nhắn đến từ người trò chuyện
            if (newMessage.senderId === chatPartner.id) {
                markMessageAsRead(newMessage.id);
            }

            // Reset trạng thái typing
            setIsTyping(false);
        }
    }, [currentUser?.id, chatPartner?.id, onNewMessage]);

    // Xử lý thông báo typing từ WebSocket
    const handleTypingNotification = useCallback((notification) => {
        // Chỉ xử lý thông báo từ người trò chuyện hiện tại
        if (notification.senderId === chatPartner.id) {
            setIsTyping(notification.typing);
        }
    }, [chatPartner?.id]);

    // Xử lý khi nhận được read receipt
    const handleReadReceipt = useCallback((receipt) => {
        console.log('Received read receipt:', receipt);
        // Xử lý logic khi tin nhắn đã được đọc
        // Có thể thêm callback nếu cần
    }, []);

    // Gửi tin nhắn qua WebSocket
    const sendMessageViaWebSocket = useCallback((messageData) => {
        if (wsConnected) {
            console.log('Sending message via WebSocket:', messageData);
            return webSocketService.sendMessage(messageData);
        }
        return false;
    }, [wsConnected]);

    // Gửi thông báo đang nhập tin nhắn
    const sendTypingNotification = useCallback((isTyping = true) => {
        if (!wsConnected || !chatPartner?.id) return;

        // Hủy timeout cũ nếu có
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Gửi thông báo đang nhập
        webSocketService.sendTyping(chatPartner.id, isTyping);

        // Nếu đang nhập, đặt timeout để gửi thông báo dừng nhập sau 1.5s
        if (isTyping) {
            typingTimeoutRef.current = setTimeout(() => {
                webSocketService.sendTyping(chatPartner.id, false);
            }, 1500);
        }
    }, [wsConnected, chatPartner?.id]);

    // Đánh dấu tin nhắn đã đọc qua WebSocket
    const markMessageAsRead = useCallback((messageId) => {
        if (wsConnected && chatPartner?.id) {
            webSocketService.sendReadReceipt(messageId, chatPartner.id);
        }
    }, [wsConnected, chatPartner?.id]);

    return {
        isTyping,
        wsConnected,
        sendMessageViaWebSocket,
        sendTypingNotification,
        markMessageAsRead
    };
};

export default useChatWebSocket;