// src/hooks/useMessageHandlers.js
import { useState, useCallback, useRef } from 'react';
import { Alert, Keyboard } from 'react-native';
import messagesService from '../services/messagesService';
import chatService from '../services/chatService';
import webSocketService from '../services/WebSocketService';

const useMessageHandlers = (
    currentUser,
    user,
    setMessages,
    setAttachment,
    setMessageText,
    wsConnected,
    sendMessageViaWebSocket,
    flatListRef
) => {
    const [sending, setSending] = useState(false);
    const lastMessageTimeRef = useRef(null);

    // Định dạng thời gian tin nhắn
    const formatTime = useCallback((dateTimeStr) => {
        try {
            const date = new Date(dateTimeStr);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (error) {
            return '';
        }
    }, []);

    // Gửi lại tin nhắn bị lỗi
    const resendMessage = useCallback((failedMessage) => {
        // Xóa tin nhắn lỗi
        setMessages(prevMessages => prevMessages.filter(msg => msg.id !== failedMessage.id));

        // Đặt lại nội dung tin nhắn
        setMessageText(failedMessage.content || '');

        // Nếu có tệp đính kèm
        if (failedMessage.attachmentUrl) {
            setAttachment({
                uri: failedMessage.attachmentUrl,
                type: 'image/jpeg',
                fileName: 'attachment.jpg'
            });
        }

        // Tự động focus vào input
        setTimeout(() => {
            Keyboard.dismiss();
            setTimeout(() => Keyboard.openKeyboard(), 100);
        }, 300);
    }, [setMessages, setMessageText, setAttachment]);

    // Gửi tin nhắn (đã tối ưu)
    const sendMessage = useCallback(async (messageText, attachment) => {
        // Kiểm tra nếu không có nội dung hoặc đang trong quá trình gửi thì bỏ qua
        if ((messageText.trim() === '' && !attachment) || sending) {
            return;
        }

        if (!currentUser?.id || !user?.id) {
            Alert.alert('Lỗi', 'Không thể gửi tin nhắn: thiếu thông tin người dùng');
            return;
        }

        // Tạo ID duy nhất để theo dõi tin nhắn này
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Lưu lại nội dung để tránh thay đổi trong quá trình gửi
        const messageContent = messageText.trim();

        try {
            setSending(true);

            // Tạo tin nhắn tạm thời để hiển thị ngay (optimistic UI)
            const optimisticMessage = {
                id: tempId,
                senderId: currentUser.id,
                receiverId: user.id,
                content: messageContent,
                createdAt: new Date().toISOString(),
                read: false,
                isSending: true
            };

            // Cập nhật UI ngay lập tức
            setMessages(prevMessages => [optimisticMessage, ...prevMessages]);
            setMessageText('');
            setAttachment(null);

            // Cuộn xuống tin nhắn mới nhất
            if (flatListRef.current) {
                flatListRef.current.scrollToOffset({ offset: 0, animated: true });
            }

            // Dữ liệu tin nhắn để gửi
            const messageData = {
                content: messageContent,
                senderId: currentUser.id,
                receiverId: user.id
            };

            // Xử lý file đính kèm nếu có
            if (attachment) {
                try {
                    const attachmentUrl = await chatService.uploadAttachment(attachment);
                    messageData.attachmentUrl = attachmentUrl;
                    optimisticMessage.attachmentUrl = attachmentUrl;
                } catch (error) {
                    console.error('Lỗi khi tải lên tệp đính kèm:', error);
                }
            }

            // Biến để theo dõi trạng thái gửi
            let messageSent = false;

            // Thử gửi qua WebSocket nếu đã kết nối
            if (wsConnected) {
                try {
                    console.log('Thử gửi tin nhắn qua WebSocket');
                    const success = await sendMessageViaWebSocket(messageData);
                    messageSent = success;

                    if (success) {
                        console.log('Đã gửi tin nhắn thành công qua WebSocket');
                    }
                } catch (wsError) {
                    console.error('Lỗi khi gửi qua WebSocket:', wsError);
                    messageSent = false;
                }
            }

            // Nếu WebSocket thất bại hoặc không kết nối, sử dụng REST API
            if (!messageSent) {
                try {
                    console.log('Gửi tin nhắn qua REST API...');
                    const response = await messagesService.sendMessage(messageData);
                    messageSent = true;

                    if (response) {
                        // Cập nhật tin nhắn với ID thật từ server
                        setMessages(prevMessages =>
                            prevMessages.map(msg =>
                                msg.id === tempId
                                    ? { ...response, isSending: false }
                                    : msg
                            )
                        );
                    }
                } catch (apiError) {
                    console.error('Lỗi khi gửi qua REST API:', apiError);

                    // Đánh dấu tin nhắn là lỗi
                    setMessages(prevMessages =>
                        prevMessages.map(msg =>
                            msg.id === tempId
                                ? { ...msg, isSending: false, isError: true }
                                : msg
                        )
                    );

                    Alert.alert(
                        'Lỗi gửi tin nhắn',
                        'Không thể gửi tin nhắn. Vui lòng thử lại sau.',
                        [{ text: 'OK' }]
                    );
                }
            }
        } catch (error) {
            console.error('Lỗi khi gửi tin nhắn:', error);
        } finally {
            setSending(false);
        }
    }, [currentUser, user, setMessages, setMessageText, setAttachment, wsConnected, sendMessageViaWebSocket]);

    // Đánh dấu tất cả tin nhắn là đã đọc
    const markAllMessagesAsRead = useCallback(async () => {
        if (!currentUser?.id || !user?.id) return;

        try {
            await messagesService.markAllMessagesAsRead(user.id, currentUser.id);
            console.log('Đã đánh dấu tất cả tin nhắn đã đọc');
        } catch (error) {
            console.error('Lỗi khi đánh dấu tin nhắn đã đọc:', error);
        }
    }, [currentUser?.id, user?.id]);

    return {
        sending,
        formatTime,
        resendMessage,
        sendMessage,
        markAllMessagesAsRead,
        lastMessageTimeRef
    };
};

export default useMessageHandlers;