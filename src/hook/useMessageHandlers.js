// useMessageHandlers.js - Hook xử lý gửi tin nhắn và các hành động liên quan
import { useState, useCallback, useRef } from 'react';
import messagesService from '../services/messagesService';

const useMessageHandlers = (
    currentUser,
    user,
    setMessages,
    setAttachment,
    setMessageText,
    wsConnected,
    sendMessageViaWebSocket,
    flatListRef,
    fetchNewMessages
) => {
    // 📱 State
    const [sending, setSending] = useState(false);
    
    // ✅ FIX: Theo dõi ID tin nhắn đã gửi để tránh gửi lại
    const sentMessageIds = useRef(new Set());
    const pendingSends = useRef(new Set());

    // 🕒 Format time helper
    const formatTime = useCallback((timestamp) => {
        if (!timestamp) return '';
        
        const messageDate = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - messageDate) / (1000 * 60 * 60);
        
        if (diffInHours < 24) {
            // Same day - show time only
            return messageDate.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } else if (diffInHours < 7 * 24) {
            // This week - show day and time
            return messageDate.toLocaleDateString('vi-VN', {
                weekday: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
        } else {
            // Older - show date and time
            return messageDate.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }, []);

    // 📤 Send message handler
    const sendMessage = useCallback(async (messageText, attachment) => {
        if (!currentUser?.id || !user?.id) {
            console.log('⚠️ Missing user IDs for sending message');
            return;
        }

        if ((!messageText || messageText.trim().length === 0) && !attachment) {
            console.log('⚠️ No content to send');
            return;
        }

        if (sending) {
            console.log('⚠️ Already sending a message');
            return;
        }

        const messageContent = messageText?.trim() || '';
        
        // ✅ CRITICAL FIX: Check for required user data
        if (!currentUser?.id || !user?.id) {
            console.error('❌ Cannot send message: missing user IDs', {
                currentUserId: currentUser?.id,
                userId: user?.id
            });
            return;
        }

        // ✅ FIX: Tạo message fingerprint để kiểm tra trùng lặp
        const messageFingerprint = `${currentUser.id}_${user.id}_${messageContent}_${Date.now()}`;
        
        // ✅ FIX: Kiểm tra xem tin nhắn đã được gửi gần đây chưa
        if (pendingSends.current.has(messageFingerprint)) {
            console.log('⚠️ Duplicate message send prevented:', messageFingerprint);
            return;
        }
        
        // ✅ FIX: Đánh dấu tin nhắn đang được gửi
        pendingSends.current.add(messageFingerprint);
        
        const tempId = `temp_${Date.now()}_${Math.random()}`;

        // 📝 Create temporary message
        const tempMessage = {
            id: tempId,
            content: messageContent,
            senderId: currentUser.id,
            receiverId: user.id,
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            isSending: true,
            isError: false,
            attachment: attachment || null,
            // ✅ FIX: Thêm fingerprint để theo dõi
            _fingerprint: messageFingerprint
        };

        try {
            setSending(true);
            console.log(`📤 Sending message: "${messageContent.substring(0, 50)}${messageContent.length > 50 ? '...' : ''}"`);

            // Add temporary message to UI immediately
            setMessages(prev => {
                // ✅ FIX: Kiểm tra xem tin nhắn tương tự đã tồn tại chưa
                const isDuplicate = prev.some(msg => 
                    msg.content === messageContent && 
                    msg.senderId === currentUser.id &&
                    Date.now() - new Date(msg.timestamp).getTime() < 10000 // Trong vòng 10 giây
                );
                
                if (isDuplicate) {
                    console.log('⚠️ Phát hiện tin nhắn trùng lặp, không thêm vào UI');
                    return prev;
                }
                
                return [tempMessage, ...prev];
            });

            // Clear input
            setMessageText('');
            setAttachment(null);

            // Scroll to bottom
            setTimeout(() => {
                flatListRef?.current?.scrollToOffset({ offset: 0, animated: true });
            }, 100);

            let success = false;
            let realMessage = null;
                    
            // Try WebSocket first if connected
            if (wsConnected && sendMessageViaWebSocket) {
                try {
                    console.log('🔌 Sending via WebSocket...');
                    const wsResult = await sendMessageViaWebSocket(messageContent, attachment);
                    if (wsResult && wsResult.success === true) {
                        console.log('✅ WebSocket send successful');
                        realMessage = wsResult.message;
                        
                        // ✅ FIX: Đánh dấu ID tin nhắn đã gửi thành công
                        if (realMessage && realMessage.id) {
                            sentMessageIds.current.add(realMessage.id);
                        }
                        
                        success = true;
                    } else {
                        console.log('⚠️ WebSocket send returned unexpected result:', wsResult);
                        throw new Error('WebSocket send did not return success');
                    }
                } catch (wsError) {
                    console.log('⚠️ WebSocket send failed, trying messagesService fallback:', wsError.message);
                    success = false; // Explicitly set to ensure fallback
                }
            }

            // ⚡ FIX: Use messagesService fallback when WebSocket fails OR not connected
            if (!success) {
                try {
                    console.log('🌐 Using messagesService fallback...');
                    
                    // Use correct API format for messagesService
                    const messageData = {
                        receiverId: user.id,
                        content: messageContent,
                        messageType: 'text'
                    };
                    
                    // Add attachment if present
                    if (attachment) {
                        messageData.attachmentUrl = attachment.uri || attachment.url;
                        messageData.messageType = attachment.type || 'image';
                    }
                    
                    const response = await messagesService.sendMessage(messageData);
                    
                    if (response && response.success) {
                        console.log('✅ messagesService fallback successful');
                        success = true;
                        
                        // ✅ FIX: Đánh dấu ID tin nhắn đã gửi thành công nếu có
                        if (response.message && response.message.id) {
                            sentMessageIds.current.add(response.message.id);
                            realMessage = response.message;
                        }
                    } else {
                        console.log('❌ messagesService fallback returned false');
                        throw new Error('messagesService returned unsuccessful result');
                    }
                } catch (httpError) {
                    console.error('❌ messagesService fallback failed:', httpError);
                    success = false;
                }
            }

            if (success) {
                if (realMessage) {
                    // Replace temporary message with real message
                    setMessages(prev => {
                        // ✅ FIX: Kiểm tra xem tin nhắn thật đã tồn tại trong danh sách chưa
                        const realMessageExists = prev.some(msg => msg.id === realMessage.id && msg.id !== tempId);
                        
                        if (realMessageExists) {
                            console.log('⚠️ Real message already exists, removing temp message');
                            return prev.filter(msg => msg.id !== tempId);
                        }
                        
                        return prev.map(msg => 
                            msg.id === tempId
                                ? { ...realMessage, isSending: false, isError: false }
                                : msg
                        );
                    });
                    console.log('✅ Message sent successfully with ID:', realMessage.id);
                } else {
                    // ⚡ FIX: Mark temp message as sent but keep it as permanent message
                    console.log('✅ Message sent successfully, converting temp to permanent');
                    setMessages(prev => prev.map(msg => 
                        msg.id === tempId 
                            ? { 
                                ...msg, 
                                id: `sent_${Date.now()}_${Math.random()}`, // Tạo ID mới cho tin nhắn đã gửi
                                isSending: false, 
                                isError: false, 
                                isSent: true,
                                isPermanent: true // Đánh dấu là tin nhắn vĩnh viễn
                            }
                            : msg
                    ));
                }
            } else {
                // Mark as error
                setMessages(prev => prev.map(msg => 
                    msg.id === tempId 
                        ? { ...msg, isSending: false, isError: true }
                        : msg
                ));
                console.log('❌ Message send failed');
            }

            // ❌ REMOVED: Don't fetch new messages after sending to avoid duplicates
            // The message will arrive via WebSocket automatically

        } catch (error) {
            console.error('❌ Error in sendMessage:', error);
            
            // Mark temporary message as error
            setMessages(prev => prev.map(msg => 
                msg.id === tempId 
                    ? { ...msg, isSending: false, isError: true }
                    : msg
            ));
        } finally {
            setSending(false);
            
            // ✅ FIX: Xóa khỏi danh sách đang gửi sau một khoảng thời gian
            setTimeout(() => {
                pendingSends.current.delete(messageFingerprint);
            }, 10000); // 10 giây
        }
    }, [
        currentUser?.id,
        user?.id,
        sending,
        setMessages,
        setMessageText,
        setAttachment,
        wsConnected,
        sendMessageViaWebSocket,
        flatListRef,
        fetchNewMessages
    ]);

    // 🔄 Resend message handler
    const resendMessage = useCallback(async (failedMessage) => {
        if (!failedMessage) {
            console.log('⚠️ No message to resend');
            return;
        }

        console.log('🔄 Resending message:', failedMessage.id);

        // Remove the failed message
        setMessages(prev => prev.filter(msg => msg.id !== failedMessage.id));

        // Resend using the normal send flow
        await sendMessage(failedMessage.content, failedMessage.attachment);
    }, [sendMessage, setMessages]);

    return {
        sending,
        formatTime,
        resendMessage,
        sendMessage
    };
};

export default useMessageHandlers; 