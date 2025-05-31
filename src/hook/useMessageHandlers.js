// useMessageHandlers.js - Hook xử lý gửi tin nhắn và các hành động liên quan
import { useState, useCallback } from 'react';
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
            attachment: attachment || null
        };

        try {
            setSending(true);
            console.log(`📤 Sending message: "${messageContent.substring(0, 50)}${messageContent.length > 50 ? '...' : ''}"`);

            // Add temporary message to UI immediately
            setMessages(prev => [tempMessage, ...prev]);

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
                        // messagesService doesn't return the message directly, 
                        // we'll get it via WebSocket or next refresh
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
                    setMessages(prev => prev.map(msg => 
                                msg.id === tempId
                            ? { ...realMessage, isSending: false, isError: false }
                                    : msg
                    ));
                    console.log('✅ Message sent successfully with ID:', realMessage.id);
                } else {
                    // ⚡ FIX: Keep temporary message visible instead of removing it
                    // Mark as sent but keep visible until real message arrives via WebSocket
                    console.log('✅ Message sent successfully, keeping temp message visible until real message arrives');
                    setMessages(prev => prev.map(msg => 
                        msg.id === tempId 
                            ? { ...msg, isSending: false, isError: false, isSent: true }
                            : msg
                    ));
                    
                    // ⚡ FIX: Add fallback to fetch new messages after delay if WebSocket doesn't deliver
                    setTimeout(() => {
                        console.log('🔄 Fetching new messages as fallback in case WebSocket didn\'t deliver');
                        fetchNewMessages?.();
                    }, 3000); // Wait 3 seconds for WebSocket, then fallback
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
            // setTimeout(() => {
            //     fetchNewMessages?.();
            // }, 1000);

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