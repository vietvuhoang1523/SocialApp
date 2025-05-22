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

    // Gửi tin nhắn
    const sendMessage = useCallback(async (messageText, attachment) => {
        if (messageText.trim() === '' && !attachment) return;
        if (!currentUser?.id || !user?.id) {
            Alert.alert('Lỗi', 'Không thể gửi tin nhắn: thiếu thông tin người dùng');
            return;
        }

        try {
            setSending(true);
            console.log('Đang gửi tin nhắn...');

            // Tạo ID tạm thời cho tin nhắn
            const tempId = `temp-${Date.now()}`;

            // Lưu lại nội dung để tránh thay đổi trong quá trình gửi
            const messageContent = messageText.trim();

            // Tạo tin nhắn tạm để hiển thị ngay (optimistic UI)
            const optimisticMessage = {
                id: tempId,
                senderId: currentUser.id,
                receiverId: user.id,
                content: messageContent,
                createdAt: new Date().toISOString(),
                read: true,
                isSending: true
            };

            // Thêm vào state
            setMessages(prevMessages => [optimisticMessage, ...prevMessages]);
            setMessageText('');
            setAttachment(null);

            // Cuộn xuống tin nhắn mới nhất
            setTimeout(() => {
                flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
            }, 100);

            // Dữ liệu tin nhắn để gửi
            const messageData = {
                content: messageContent,
                senderId: currentUser.id,
                receiverId: user.id
            };

            // Nếu có file đính kèm, tải lên trước
            if (attachment) {
                try {
                    const attachmentUrl = await chatService.uploadAttachment(attachment);
                    messageData.attachmentUrl = attachmentUrl;
                } catch (attachmentError) {
                    console.error('Lỗi khi tải lên tệp đính kèm:', attachmentError);
                    Alert.alert('Cảnh báo', 'Không thể tải lên tệp đính kèm, tin nhắn sẽ được gửi không kèm hình ảnh');
                }
            }

            // Thử kết nối WebSocket nếu chưa kết nối
            let sentViaWebSocket = false;

            if (!wsConnected) {
                try {
                    console.log('WebSocket chưa kết nối, đang kết nối lại...');
                    await webSocketService.connect();
                    console.log('Đã kết nối lại WebSocket, đang thử gửi tin nhắn...');
                } catch (wsError) {
                    console.error('Không thể kết nối lại WebSocket:', wsError);
                }
            }

            // Thử gửi tin nhắn qua WebSocket
            try {
                if (wsConnected || webSocketService.isConnected()) {
                    sentViaWebSocket = await sendMessageViaWebSocket(messageData);
                    console.log('Kết quả gửi qua WebSocket:', sentViaWebSocket ? 'Thành công' : 'Thất bại');
                }
            } catch (wsError) {
                console.error('Lỗi khi gửi tin nhắn qua WebSocket:', wsError);
                sentViaWebSocket = false;
            }

            // Nếu gửi qua WebSocket thất bại, sử dụng REST API
            if (!sentViaWebSocket) {
                console.log('Gửi qua WebSocket thất bại, chuyển sang gửi qua REST API...');
                try {
                    const response = await messagesService.sendMessage(messageData);
                    console.log('Đã gửi tin nhắn qua REST API thành công');

                    // Cập nhật tin nhắn với ID thật từ server
                    setMessages(prevMessages =>
                        prevMessages.map(msg =>
                            msg.id === tempId
                                ? { ...response, isSending: false }
                                : msg
                        )
                    );

                    // Cập nhật thời gian tin nhắn mới nhất
                    lastMessageTimeRef.current = response.createdAt;
                } catch (restError) {
                    console.error('Lỗi khi gửi tin nhắn qua REST API:', restError);

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
                        'Không thể gửi tin nhắn. Bạn có thể thử lại sau hoặc kiểm tra kết nối mạng.',
                        [
                            { text: 'OK' }
                        ]
                    );
                }
            } else {
                console.log('Đã gửi tin nhắn qua WebSocket thành công');
            }
        } catch (error) {
            console.error('Lỗi khi gửi tin nhắn:', error);
            Alert.alert('Lỗi', 'Không thể gửi tin nhắn. Vui lòng thử lại sau.');
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