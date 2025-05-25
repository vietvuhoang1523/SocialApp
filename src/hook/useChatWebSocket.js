import { useState, useEffect, useCallback, useRef } from 'react';
import webSocketService from '../services/WebSocketService';

const useChatWebSocket = (currentUser, chatPartner, onNewMessage) => {
    const [wsConnected, setWsConnected] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [connectionError, setConnectionError] = useState(null);
    const [connectionAttempts, setConnectionAttempts] = useState(0);
    const typingTimeoutRef = useRef(null);
    const connectionKey = useRef(`chat_${currentUser?.id}_${chatPartner?.id}`);
    const pendingMessagesRef = useRef(new Map());
    // Mới: Ref để theo dõi xem đã đăng ký callback chưa
    const registeredCallbacks = useRef(false);

    useEffect(() => {
        // Hàm kết nối WebSocket
        const connectWebSocket = async () => {
            try {
                // Giới hạn số lần thử kết nối
                if (connectionAttempts >= 3) {
                    const error = new Error('Đã vượt quá số lần thử kết nối');
                    setConnectionError(error);
                    console.error(error);
                    return;
                }

                // Nếu chưa có user hoặc chat partner
                if (!currentUser?.id || !chatPartner?.id) {
                    console.warn('Thiếu thông tin người dùng để kết nối WebSocket');
                    return;
                }

                // Cập nhật key kết nối mỗi khi user hoặc partner thay đổi
                connectionKey.current = `chat_${currentUser.id}_${chatPartner.id}`;

                // Hủy đăng ký callback cũ trước khi đăng ký mới
                if (registeredCallbacks.current) {
                    console.log('Hủy đăng ký callback cũ');
                    webSocketService.offMessage(connectionKey.current);
                    webSocketService.offTyping(connectionKey.current);
                    registeredCallbacks.current = false;
                }

                // Kết nối WebSocket
                await webSocketService.connect();
                setConnectionError(null);

                // Thiết lập message callback
                const messageCallback = (newMessage) => {
                    console.log('Nhận tin nhắn mới qua WebSocket trong useChatWebSocket:', newMessage);
                    if (
                        (newMessage.senderId === chatPartner.id && newMessage.receiverId === currentUser.id) ||
                        (newMessage.senderId === currentUser.id && newMessage.receiverId === chatPartner.id)
                    ) {
                        onNewMessage(newMessage);
                    }
                };


                // Thiết lập typing callback
                const typingCallback = (notification) => {
                    if (notification.senderId === chatPartner.id) {
                        console.log('Đối phương đang nhập tin nhắn:', notification.typing);
                        setIsTyping(notification.typing);

                        // Nếu người dùng ngừng nhập, đặt thời gian để tắt thông báo
                        if (notification.typing) {
                            // Xóa timeout cũ nếu có
                            if (typingTimeoutRef.current) {
                                clearTimeout(typingTimeoutRef.current);
                            }

                            // Tạo timeout mới để tắt trạng thái typing sau 3 giây
                            typingTimeoutRef.current = setTimeout(() => {
                                setIsTyping(false);
                            }, 3000);
                        }
                    }
                };

                // Đăng ký các listener và đánh dấu đã đăng ký
                webSocketService.onMessage(connectionKey.current, messageCallback);
                webSocketService.onTyping(connectionKey.current, typingCallback);
                registeredCallbacks.current = true;

                // Đặt trạng thái kết nối
                setWsConnected(true);
                setConnectionAttempts(0);

            } catch (error) {
                console.error('Lỗi kết nối WebSocket:', error);
                setConnectionError(error);

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
            // Hủy đăng ký listener khi component unmount
            if (registeredCallbacks.current) {
                webSocketService.offMessage(connectionKey.current);
                webSocketService.offTyping(connectionKey.current);
                registeredCallbacks.current = false;
            }

            // Xóa timeout typing
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [currentUser?.id, chatPartner?.id, onNewMessage, connectionAttempts]);

    // Gửi tin nhắn qua WebSocket
    const sendMessageViaWebSocket = useCallback(async (message) => {
        if (!wsConnected) {
            console.log('WebSocket không kết nối, không thể gửi tin nhắn');
            return false;
        }

        try {
            // Thêm một ID duy nhất cho mỗi request để theo dõi
            const messageWithId = {
                ...message,
                _requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };

            console.log('Gửi tin nhắn qua WebSocket:', messageWithId);
            // Gửi tin nhắn qua WebSocket
            const success = webSocketService.sendMessage(messageWithId);

            if (success) {
                console.log('Gửi tin nhắn qua WebSocket thành công');
                return true;
            } else {
                console.log('Gửi tin nhắn qua WebSocket thất bại');
                return false;
            }
        } catch (error) {
            console.error('Lỗi khi gửi tin nhắn qua WebSocket:', error);
            return false;
        }
    }, [wsConnected]);

    // Gửi thông báo typing
    const sendTypingNotification = useCallback((isTyping = true) => {
        if (!wsConnected || !chatPartner?.id) {
            console.log('Không thể gửi thông báo typing: không kết nối hoặc không có chat partner');
            return false;
        }

        try {
            const success = webSocketService.sendTyping(chatPartner.id, isTyping);
            console.log(`Đã gửi thông báo typing: ${isTyping}`, success);
            return success;
        } catch (error) {
            console.error('Lỗi khi gửi thông báo typing:', error);
            return false;
        }
    }, [wsConnected, chatPartner?.id]);

    // Gửi read receipt
    const markMessageAsRead = useCallback((messageId, senderId) => {
        if (!wsConnected) {
            console.log('Không thể gửi read receipt: không kết nối');
            return false;
        }

        try {
            const success = webSocketService.sendReadReceipt(messageId, senderId);
            console.log(`Đã gửi read receipt cho tin nhắn ${messageId}:`, success);
            return success;
        } catch (error) {
            console.error('Lỗi khi gửi read receipt:', error);
            return false;
        }
    }, [wsConnected]);


    // Thêm hàm reconnect
    const reconnect = useCallback(() => {
        // Reset lại các trạng thái
        setConnectionAttempts(0);
        setConnectionError(null);

        // Hủy đăng ký callback cũ
        if (registeredCallbacks.current) {
            webSocketService.offMessage(connectionKey.current);
            webSocketService.offTyping(connectionKey.current);
            registeredCallbacks.current = false;
        }

        // Yêu cầu WebSocketService kết nối lại
        return webSocketService.forceReconnect();
    }, []);

    // Debug connection status
    const getConnectionStatus = useCallback(() => {
        return webSocketService.getConnectionStatus();
    }, []);

    return {
        wsConnected,
        isTyping,
        connectionError,
        sendMessageViaWebSocket,
        sendTypingNotification,
        markMessageAsRead,
        reconnect,
        getConnectionStatus
    };
};

export default useChatWebSocket;