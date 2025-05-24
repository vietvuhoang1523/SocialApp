// useChatWebSocket.js - Updated
import { useState, useEffect, useCallback, useRef } from 'react';
import webSocketService from '../services/WebSocketService';

const useChatWebSocket = (currentUser, chatPartner, onNewMessage) => {
    const [wsConnected, setWsConnected] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [connectionAttempts, setConnectionAttempts] = useState(0);
    const typingTimeoutRef = useRef(null);
    const connectionKey = useRef(`chat_${currentUser?.id}_${chatPartner?.id}`);

    useEffect(() => {
        // Hàm kết nối WebSocket
        const connectWebSocket = async () => {
            try {
                // Giới hạn số lần thử kết nối
                if (connectionAttempts >= 3) {
                    console.error('Đã vượt quá số lần thử kết nối');
                    return;
                }

                // Nếu chưa có user hoặc chat partner
                if (!currentUser?.id || !chatPartner?.id) {
                    console.warn('Thiếu thông tin người dùng để kết nối WebSocket');
                    return;
                }

                // Kết nối WebSocket
                await webSocketService.connect();

                // Thiết lập listeners
                const messageCallback = (newMessage) => {
                    if (
                        (newMessage.senderId === chatPartner.id && newMessage.receiverId === currentUser.id) ||
                        (newMessage.senderId === currentUser.id && newMessage.receiverId === chatPartner.id)
                    ) {
                        onNewMessage(newMessage);
                    }
                };

                // Đăng ký các listener
                const connectionKey = `chat_${currentUser.id}_${chatPartner.id}`;
                webSocketService.onMessage(connectionKey, messageCallback);

                // Đặt trạng thái kết nối
                setWsConnected(true);
                setConnectionAttempts(0);

            } catch (error) {
                console.error('Lỗi kết nối WebSocket:', error);

                // Tăng số lần thử kết nối
                setConnectionAttempts(prev => prev + 1);

                // Thử lại sau 5 giây
                setTimeout(connectWebSocket, 5000);
            }
        };

        // Gọi kết nối
        connectWebSocket();

        // Cleanup
        return () => {
            // Hủy đăng ký listener nếu cần
            const connectionKey = `chat_${currentUser?.id}_${chatPartner?.id}`;
            webSocketService.offMessage(connectionKey);
        };
    }, [currentUser?.id, chatPartner?.id, onNewMessage, connectionAttempts]);

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