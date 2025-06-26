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
    
    // ✅ ENHANCED: Better duplicate prevention system
    const sentMessageIds = useRef(new Set());
    const pendingSends = useRef(new Map()); // Changed to Map for better tracking
    const lastSendTime = useRef(0);
    const globalSendLock = useRef(false); // 🔒 CRITICAL: Global lock để chặn hoàn toàn
    const lastSentContent = useRef(''); // 🔒 Track last sent content

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

    // 📤 ENHANCED: Send message handler with better duplicate prevention
    const sendMessage = useCallback(async (messageText, attachment) => {
        console.log('📤 [useMessageHandlers] sendMessage called:', {
            messageText: messageText?.substring(0, 50),
            hasAttachment: !!attachment,
            sending,
            wsConnected
        });

        // ✅ ENHANCED: Strict validation
        if (!currentUser?.id || !user?.id) {
            console.error('❌ Cannot send message: missing user IDs', {
                currentUserId: currentUser?.id,
                userId: user?.id
            });
            return { success: false, error: 'Missing user information' };
        }

        if ((!messageText || messageText.trim().length === 0) && !attachment) {
            console.log('⚠️ No content to send');
            return { success: false, error: 'No content' };
        }

        // ✅ ENHANCED: Prevent rapid successive sends (debounce)
        const now = Date.now();
        if (now - lastSendTime.current < 500) { // 500ms minimum with global lock
            console.log('⚠️ Send blocked: too rapid (< 1 second)');
            return { success: false, error: 'Too rapid sends' };
        }

        // 🔒 CRITICAL: Check global lock first
        if (globalSendLock.current) {
            console.log('🔒 Send blocked: GLOBAL LOCK active');
            return { success: false, error: 'Global lock active' };
        }

        // ✅ ENHANCED: Global sending lock
        if (sending) {
            console.log('⚠️ Send blocked: already sending');
            return { success: false, error: 'Already sending' };
        }

        const messageContent = messageText?.trim() || '';
        
        // 🔒 CRITICAL: Check exact same content recently sent
        if (messageContent === lastSentContent.current && (now - lastSendTime.current) < 3000) {
            console.log('🔒 Send blocked: IDENTICAL CONTENT recently sent');
            return { success: false, error: 'Identical content recently sent' };
        }
        
                 // ✅ ENHANCED: Better fingerprint with user context (3-second window for more protection)
         const messageFingerprint = `${currentUser.id}->${user.id}:${messageContent}:${Math.floor(now / 3000)}`; // 3-second window
        
        // ✅ ENHANCED: Check for pending identical messages
        if (pendingSends.current.has(messageFingerprint)) {
            const pendingInfo = pendingSends.current.get(messageFingerprint);
            console.log('⚠️ Duplicate message send prevented:', {
                fingerprint: messageFingerprint,
                pendingSince: now - pendingInfo.timestamp
            });
            return { success: false, error: 'Duplicate message' };
        }
        
        // ✅ ENHANCED: Mark as pending with metadata
        pendingSends.current.set(messageFingerprint, {
            timestamp: now,
            content: messageContent,
            userId: currentUser.id,
            receiverId: user.id
        });
        
                 // ✅ ENHANCED: Auto-cleanup with longer timeout
         setTimeout(() => {
             if (pendingSends.current.has(messageFingerprint)) {
                 pendingSends.current.delete(messageFingerprint);
                 console.log('🧹 Cleaned up pending message fingerprint:', messageFingerprint);
             }
         }, 15000); // 15 seconds for extra safety
        
        lastSendTime.current = now;
        lastSentContent.current = messageContent; // 🔒 Track sent content
        const tempId = `temp_${now}_${Math.random().toString(36).substr(2, 9)}`;

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
            _fingerprint: messageFingerprint,
            _tempId: tempId
        };

        try {
            // 🔒 CRITICAL: Set global lock IMMEDIATELY
            globalSendLock.current = true;
            setSending(true);
            console.log(`📤 [useMessageHandlers] Starting send process: "${messageContent.substring(0, 50)}${messageContent.length > 50 ? '...' : ''}"`);

            // ✅ ENHANCED: Add to UI with better duplicate checking
            setMessages(prev => {
                // Check for exact content duplicates in recent messages (last 10)
                const recentMessages = prev.slice(0, 10);
                const isDuplicate = recentMessages.some(msg => 
                    msg.content === messageContent && 
                    msg.senderId === currentUser.id &&
                    Math.abs(new Date().getTime() - new Date(msg.timestamp || msg.createdAt).getTime()) < 15000 // 15 seconds
                );
                
                if (isDuplicate) {
                    console.log('⚠️ [useMessageHandlers] Duplicate message detected in UI, skipping add');
                    return prev;
                }
                
                console.log('✅ [useMessageHandlers] Adding temp message to UI');
                return [tempMessage, ...prev];
            });

            // Clear input immediately to prevent re-sends
            setMessageText('');
            setAttachment(null);

            // Scroll to bottom
            setTimeout(() => {
                flatListRef?.current?.scrollToOffset({ offset: 0, animated: true });
            }, 100);

            let success = false;
            let realMessage = null;
            let sendMethod = 'none';
                    
            // ✅ ENHANCED: Try WebSocket first with better error handling
            if (wsConnected && sendMessageViaWebSocket) {
                try {
                    console.log('🔌 [useMessageHandlers] Attempting WebSocket send...');
                    const wsResult = await sendMessageViaWebSocket(messageContent, attachment);
                    console.log('🔌 [useMessageHandlers] WebSocket result:', wsResult);
                    
                    if (wsResult && (wsResult.success === true || wsResult.id)) {
                        console.log('✅ [useMessageHandlers] WebSocket send successful');
                        realMessage = wsResult.message || wsResult;
                        sendMethod = 'websocket';
                        
                        // Track successful message ID
                        if (realMessage && realMessage.id) {
                            sentMessageIds.current.add(realMessage.id);
                        }
                        
                        success = true;
                        // 🚫 CRITICAL: WebSocket success means NO FALLBACK NEEDED
                        console.log('🚫 [useMessageHandlers] WebSocket success - SKIPPING API fallback');
                    } else {
                        console.log('⚠️ [useMessageHandlers] WebSocket send failed or returned non-success:', wsResult);
                        throw new Error('WebSocket send did not return success');
                    }
                } catch (wsError) {
                    console.log('⚠️ [useMessageHandlers] WebSocket send error:', wsError.message);
                    success = false;
                }
            } else {
                console.log('⚠️ [useMessageHandlers] WebSocket not available:', { wsConnected, hasSendMethod: !!sendMessageViaWebSocket });
            }

            // ✅ ENHANCED: Fallback to messagesService ONLY if WebSocket completely failed
            if (!success) {
                console.log('🌐 [useMessageHandlers] WebSocket failed, trying API fallback...');
                try {
                    console.log('🌐 [useMessageHandlers] Using messagesService fallback...');
                    
                    const messageData = {
                        receiverId: user.id,
                        content: messageContent,
                        messageType: attachment ? (attachment.type || 'image') : 'text'
                    };
                    
                    if (attachment) {
                        messageData.attachmentUrl = attachment.uri || attachment.url;
                    }
                    
                    console.log('🌐 [useMessageHandlers] Sending via messagesService:', messageData);
                    const response = await messagesService.sendMessage(messageData);
                    console.log('🌐 [useMessageHandlers] messagesService response:', response);
                    
                    if (response && (response.success || response.id)) {
                        console.log('✅ [useMessageHandlers] messagesService send successful');
                        realMessage = response.message || response;
                        sendMethod = 'api';
                        success = true;
                        
                        // Track successful message ID
                        if (realMessage && realMessage.id) {
                            sentMessageIds.current.add(realMessage.id);
                        }
                    } else {
                        throw new Error('messagesService send failed: ' + JSON.stringify(response));
                    }
                } catch (apiError) {
                    console.error('❌ [useMessageHandlers] messagesService fallback failed:', apiError);
                    success = false;
                }
            }

            // ✅ ENHANCED: Update UI based on send result
            if (success) {
                console.log(`✅ [useMessageHandlers] Message sent successfully via ${sendMethod}`);
                console.log(`🔍 [DEBUG] Final success status: ${success}, method: ${sendMethod}, realMessage: ${!!realMessage}`);
                
                // 🔥 CRITICAL FIX: Remove temp message immediately and DO NOT add real message
                // Real message will come via WebSocket subscription (avoid duplicates)
                setMessages(prev => {
                    const filteredPrev = prev.filter(msg => msg.id !== tempId);
                    console.log('🔥 [useMessageHandlers] Removed temp message, waiting for WebSocket delivery');
                    console.log(`🔍 [DEBUG] Temp ID: ${tempId}, Real message ID: ${realMessage?.id || 'none'}`);
                    
                    // 🚫 DO NOT ADD REAL MESSAGE HERE - WebSocket will deliver it
                    // This prevents the duplicate issue completely
                    return filteredPrev;
                });

                // 🔒 SAFE FALLBACK: Handle WebSocket vs API different scenarios
                if (sendMethod === 'websocket') {
                    console.log('✅ [useMessageHandlers] WebSocket send - message will arrive via subscription');
                } else if (sendMethod === 'api') {
                    console.log('🌐 [useMessageHandlers] API send - adding message manually since no WebSocket');
                    // For API sends, we need to add the message since WebSocket won't deliver
                    if (realMessage && realMessage.id) {
                        setMessages(prev => {
                            const exists = prev.some(msg => msg.id === realMessage.id);
                            if (!exists) {
                                console.log('📝 [useMessageHandlers] Adding API message to UI');
                                return [realMessage, ...prev];
                            }
                            return prev;
                        });
                    }
                }
                
                // 🔄 Backup fetch for disconnected scenarios
                setTimeout(() => {
                    if (!wsConnected && sendMethod === 'api') {
                        console.log('🔄 [useMessageHandlers] API send completed, fetching for sync');
                        fetchNewMessages?.(true);
                    }
                }, 1000);

            } else {
                console.error('❌ [useMessageHandlers] All send methods failed');
                
                // Mark temp message as error
                setMessages(prev => prev.map(msg => 
                    msg.id === tempId 
                        ? { ...msg, isSending: false, isError: true }
                        : msg
                ));
            }

            return { 
                success, 
                message: realMessage,
                method: sendMethod,
                tempId 
            };

        } catch (error) {
            console.error('❌ [useMessageHandlers] Send message error:', error);
            
            // Mark temp message as error
            setMessages(prev => prev.map(msg => 
                msg.id === tempId 
                    ? { ...msg, isSending: false, isError: true }
                    : msg
            ));

            return { 
                success: false, 
                error: error.message,
                tempId 
            };

        } finally {
            // 🔒 CRITICAL: Release global lock
            globalSendLock.current = false;
            setSending(false);
            console.log('🔓 [useMessageHandlers] Message send process completed - locks released');
            
            // Clean up fingerprint after send attempt
            setTimeout(() => {
                pendingSends.current.delete(messageFingerprint);
            }, 5000);
        }
         }, [currentUser, user, setMessages, setAttachment, setMessageText, wsConnected, sendMessageViaWebSocket, flatListRef, fetchNewMessages, sending]);

    // 🔄 Resend message handler
    const resendMessage = useCallback(async (message) => {
        console.log('🔄 Resending message:', message.id);
        
        // Remove error message first
        setMessages(prev => prev.filter(msg => msg.id !== message.id));
        
        // Send again
        return await sendMessage(message.content, message.attachment);
    }, [sendMessage, setMessages]);

    return {
        sending,
        formatTime,
        resendMessage,
        sendMessage
    };
};

export default useMessageHandlers; 