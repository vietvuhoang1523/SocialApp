// NewChatScreen.js - Enhanced messaging interface
// ⚡ UI IMPROVEMENT: Removed "Tải thêm tin nhắn" button for cleaner interface
// Load more functionality still works automatically via onEndReached when scrolling to top

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Dimensions,
    Animated,
    RefreshControl
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

// Hooks
import useMessageManagement from '../../hook/useMessageManagement';
import useMessageHandlers from '../../hook/useMessageHandlers';
import useChatWebSocket from '../../hook/useChatWebSocket';
import useConnection from '../../hook/useConnection';

// Components
import NewMessageInput from '../../components/chat/NewMessageInput';
import NewMessageItem from '../../components/chat/NewMessageItem';
import NewChatHeader from '../../components/chat/NewChatHeader';
import LoadingSpinner from '../../components/LoadingSpinner';

// Services
import messagesService from '../../services/messagesService';
import videoCallService from '../../services/videoCallService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const NewChatScreen = ({ route, navigation }) => {
    const { user, currentUser, conversationId } = route.params;

    // 📱 State
    const [messageText, setMessageText] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const [isAtBottom, setIsAtBottom] = useState(true);

    // 🎥 Video Call State
    const [callInProgress, setCallInProgress] = useState(false);

    // 📝 References
    const flatListRef = useRef(null);
    const scrollOffsetY = useRef(0);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // 🔑 Chat key for WebSocket
    const chatKey = useMemo(() =>
        `chat_${String(currentUser?.id || '')}_${String(user?.id || '')}`,
        [currentUser?.id, user?.id]
    );

    // 📨 Message Management Hook
    const {
        messages,
        setMessages,
        loading,
        refreshing,
        hasMore,
        fetchMessages,
        fetchNewMessages,
        onRefresh,
        loadMoreMessages,
        handleNewWebSocketMessage,
        error: messageError,
        loadMessages
    } = useMessageManagement(currentUser, user);

    // 🔌 WebSocket Connection Hook
    const handleReconnect = useCallback(() => {
        console.log("🔄 Chat reconnected, fetching new messages");
        fetchNewMessages();
    }, [fetchNewMessages]);

    const {
        connectionStatus,
        reconnecting
    } = useConnection(currentUser, user, chatKey, handleReconnect);

    // 🌐 WebSocket Chat Hook
    const {
        isConnected: wsConnected,
        isTyping,
        connectionError,
        sendMessage: sendMessageViaWebSocket,
        sendTypingNotification,
        markMessageAsRead,
        clearError: reconnectWS,
        resetTyping
    } = useChatWebSocket(currentUser?.id, user?.id, handleNewWebSocketMessage);

    // ✅ FIX: Enhanced WebSocket monitoring for better real-time updates
    const [wsStatus, setWsStatus] = useState('connecting');
    const [lastMessageTime, setLastMessageTime] = useState(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    // 📱 Enhanced WebSocket status monitoring
    useEffect(() => {
        const updateStatus = () => {
            if (wsConnected) {
                setWsStatus('connected');
                reconnectAttempts.current = 0;
                console.log('✅ WebSocket connected - real-time messaging enabled');
            } else if (connectionError) {
                setWsStatus('error');
                console.log('❌ WebSocket error:', connectionError.message);
                
                // ✅ FIX: Auto-reconnect for better reliability
                if (reconnectAttempts.current < maxReconnectAttempts) {
                    reconnectAttempts.current++;
                    console.log(`🔄 Auto-reconnecting... attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`);
                    setTimeout(() => {
                        reconnectWS();
                    }, Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000));
                }
            } else {
                setWsStatus('connecting');
            }
        };

        updateStatus();
    }, [wsConnected, connectionError, reconnectWS]);

    // ✅ FIX: Enhanced real-time message monitoring
    useEffect(() => {
        if (wsConnected && messages.length > 0) {
            const latestMessage = messages[0];
            if (latestMessage && latestMessage.timestamp !== lastMessageTime) {
                setLastMessageTime(latestMessage.timestamp);
                console.log('📨 Real-time message received:', {
                    id: latestMessage.id,
                    from: latestMessage.senderId,
                    time: latestMessage.timestamp,
                    method: 'websocket'
                });
            }
        }
    }, [wsConnected, messages, lastMessageTime]);

    // 📤 Message Handlers Hook
    const {
        sending,
        formatTime,
        resendMessage,
        sendMessage: sendMessageHandler
    } = useMessageHandlers(
        currentUser,
        user,
        setMessages,
        setAttachment,
        setMessageText,
        wsConnected,
        sendMessageViaWebSocket,
        flatListRef,
        fetchNewMessages
    );

    // 🚀 Initial setup
    useEffect(() => {
        let isMounted = true;

        const setupChat = async () => {
            try {
                console.log('🚀 Setting up chat...');
                
                // ✅ FIX: Wait for WebSocket connection before proceeding
                const waitForWebSocket = () => {
                    let hasLogged = false;
                    return new Promise((resolve) => {
                        const checkConnection = () => {
                            if (wsConnected) {
                                console.log('✅ WebSocket ready for chat setup');
                                resolve();
                            } else {
                                if (!hasLogged) {
                                    console.log('⏳ Waiting for WebSocket connection...');
                                    hasLogged = true;
                                }
                                setTimeout(checkConnection, 500);
                            }
                        };
                        checkConnection();
                        
                        // Timeout after 10 seconds
                        setTimeout(() => {
                            console.log('⚠️ WebSocket timeout - proceeding anyway');
                            resolve();
                        }, 10000);
                    });
                };

                // Wait for WebSocket or timeout
                await waitForWebSocket();
                
                // Load messages - use loadMessages instead of fetchMessages
                await loadMessages();
                
                if (!isMounted) return;

                // ✅ FIX: Enhanced message read handling with WebSocket sync
                if (currentUser?.id && user?.id) {
                    console.log('✅ Marking messages as read on chat setup...');
                    try {
                        await messagesService.markAllMessagesAsRead(currentUser.id, user.id);
                        console.log('✅ Messages marked as read successfully');
                        
                        // ✅ FIX: Notify WebSocket about read status for real-time sync
                        if (wsConnected && messages.length > 0) {
                            const latestMessage = messages[0];
                            if (latestMessage && latestMessage.senderId !== currentUser.id) {
                                await markMessageAsRead(latestMessage.id);
                                console.log('📨 Synced read status via WebSocket');
                            }
                        }
                    } catch (error) {
                        console.error('❌ Error marking messages as read:', error);
                    }
                }

                console.log('✅ Chat setup complete');
            } catch (error) {
                console.error('❌ Chat setup error:', error);
            }
        };

        setupChat();

        return () => {
            isMounted = false;
            resetTyping();
        };
    }, [currentUser?.id, user?.id]); // ✅ Remove wsConnected dependency to prevent loops

    // ✅ FIX: Enhanced periodic refresh with smarter timing
    useEffect(() => {
        let refreshInterval;
        
        if (!wsConnected) {
            // More frequent refresh when disconnected
            refreshInterval = setInterval(() => {
                console.log('💓 WebSocket disconnected, refreshing messages...');
                fetchNewMessages();
            }, 5000); // Every 5 seconds when disconnected
        } else {
            // Less frequent refresh when connected (backup only)
            refreshInterval = setInterval(() => {
                console.log('🔄 Periodic message sync (WebSocket backup)...');
                fetchNewMessages();
            }, 30000); // Every 30 seconds when connected
        }

        return () => {
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
        };
    }, [wsConnected, fetchNewMessages]);

    // 💬 Send message action
    const sendMessageAction = useCallback(() => {
        if ((messageText.trim().length === 0 && !attachment) || sending) {
            return;
        }

        // ✅ FIX: Enhanced message sending with better real-time handling
        console.log('📤 Sending message via NewChatScreen:', {
            hasWebSocket: wsConnected,
            messageLength: messageText.length,
            hasAttachment: !!attachment,
            wsStatus: wsStatus
        });

        sendMessageHandler(messageText, attachment);
        
        // ✅ FIX: Immediate optimistic update for better UX
        if (wsConnected) {
            console.log('✅ Message sent via WebSocket - expecting real-time delivery');
        } else {
            console.log('⚠️ WebSocket disconnected - message sent via API, triggering refresh');
            // Trigger immediate refresh for API-sent messages
            setTimeout(() => {
                fetchNewMessages();
            }, 1000);
        }
    }, [messageText, attachment, sending, sendMessageHandler, wsConnected, wsStatus, fetchNewMessages]);

    // ⌨️ Handle typing
    const handleMessageTextChange = useCallback((text) => {
        setMessageText(text);

        if (wsConnected) {
            if (text.trim().length > 0) {
                sendTypingNotification(true);
            } else {
                sendTypingNotification(false);
            }
        }
    }, [wsConnected, sendTypingNotification]);

    // 📱 Scroll handling
    const handleScroll = useCallback((event) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        scrollOffsetY.current = contentOffset.y;
        
        const isNearBottom = contentOffset.y < 100;
        setIsAtBottom(isNearBottom);
        
        const shouldShowButton = contentOffset.y > 200;
        if (shouldShowButton !== showScrollToBottom) {
            setShowScrollToBottom(shouldShowButton);
            
            Animated.timing(fadeAnim, {
                toValue: shouldShowButton ? 1 : 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [showScrollToBottom, fadeAnim]);

    // 📱 Scroll to bottom
    const scrollToBottom = useCallback(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, []);

    // 📱 Load more messages
    const handleLoadMore = useCallback(() => {
        if (hasMore && !loading) {
            console.log('📄 Loading more messages...');
            loadMoreMessages();
        }
    }, [hasMore, loading, loadMoreMessages]);

    // 📱 Render message item
    const renderMessageItem = useCallback(({ item, index }) => (
        <NewMessageItem
            message={item}
            currentUser={currentUser}
            chatPartner={user}
            formatTime={formatTime}
            resendMessage={resendMessage}
            isLastMessage={index === 0}
            onPress={() => {
                if (item.isError) {
                    Alert.alert(
                        'Gửi lại tin nhắn?',
                        'Tin nhắn này gửi không thành công. Bạn có muốn gửi lại không?',
                        [
                            { text: 'Hủy', style: 'cancel' },
                            { text: 'Gửi lại', onPress: () => resendMessage(item) }
                        ]
                    );
                }
            }}
        />
    ), [currentUser, user, formatTime, resendMessage]);

    // 🔑 Key extractor
    const keyExtractor = useCallback((item, index) => 
        `${item.id || 'unknown'}-${item.timestamp || Date.now()}-${index}`,
        []
    );

    // 📱 Empty component
    const ListEmptyComponent = useCallback(() => null, []);

    // 📱 Footer component
    const ListFooterComponent = useCallback(() => (
        hasMore && !loading ? (
            <View style={styles.footerLoading}>
                <ActivityIndicator size="small" color="#667eea" />
                <Text style={styles.loadingText}>Đang tải tin nhắn cũ...</Text>
            </View>
        ) : null
    ), [hasMore, loading]);

    // 📱 Header component
    const ListHeaderComponent = useCallback(() => null, []);

    // 🎥 Video Call Handlers
    const handleVideoCallStart = useCallback(async (callResponse) => {
        try {
            console.log('🎥 Video call started:', callResponse);
            setCallInProgress(true);
            
            // Navigate to video call screen with all needed data
            navigation.navigate('VideoCallScreen', {
                roomId: callResponse.roomId,
                callType: 'VIDEO',
                isOutgoing: true,
                callee: user,
                caller: currentUser,
                callData: callResponse,
                // Pass chat context for seamless integration
                chatUser: user,
                chatCurrentUser: currentUser,
                conversationId: conversationId
            });
            
        } catch (error) {
            console.error('❌ Error handling video call start:', error);
            setCallInProgress(false);
            Alert.alert('Lỗi', 'Không thể khởi tạo cuộc gọi video');
        }
    }, [navigation, user, currentUser, conversationId]);

    const handleAudioCallStart = useCallback(async (callResponse) => {
        try {
            console.log('📞 Audio call started:', callResponse);
            setCallInProgress(true);
            
            // Navigate to audio call screen with all needed data
            navigation.navigate('AudioCallScreen', {
                roomId: callResponse.roomId,
                callType: 'AUDIO',
                isOutgoing: true,
                callee: user,
                caller: currentUser,
                callData: callResponse,
                // Pass chat context for seamless integration
                chatUser: user,
                chatCurrentUser: currentUser,
                conversationId: conversationId
            });
            
        } catch (error) {
            console.error('❌ Error handling audio call start:', error);
            setCallInProgress(false);
            Alert.alert('Lỗi', 'Không thể khởi tạo cuộc gọi thoại');
        }
    }, [navigation, user, currentUser, conversationId]);

    // Clean up call state when component unmounts or navigation changes
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            // Reset call state when returning to chat
            setCallInProgress(false);
        });

        return unsubscribe;
    }, [navigation]);

    if (loading && messages.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#667eea" />
                <NewChatHeader
                    navigation={navigation}
                    user={user}
                    currentUser={currentUser}
                    isTyping={isTyping}
                    isConnected={wsConnected}
                    connectionStatus={connectionStatus}
                    onVideoCallStart={handleVideoCallStart}
                    onAudioCallStart={handleAudioCallStart}
                />
                <LoadingSpinner />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#667eea" />
            
            <KeyboardAvoidingView 
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {/* Header */}
                <NewChatHeader
                    navigation={navigation}
                    user={user}
                    currentUser={currentUser}
                    isTyping={isTyping}
                    isConnected={wsConnected}
                    connectionStatus={connectionStatus}
                    onReconnect={reconnectWS}
                    onVideoCallStart={handleVideoCallStart}
                    onAudioCallStart={handleAudioCallStart}
                />

                {/* Connection Status */}
                {!wsConnected && (
                    <View style={styles.connectionStatus}>
                        <Ionicons name="warning-outline" size={16} color="#ff9800" />
                        <Text style={styles.connectionStatusText}>
                            {connectionError
                                ? `Lỗi kết nối: ${connectionError.message || 'Unknown error'}`
                                : reconnecting
                                    ? 'Đang kết nối lại...'
                                    : 'Mất kết nối. Tin nhắn có thể bị chậm.'
                            }
                        </Text>
                        {connectionError && (
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={reconnectWS}
                            >
                                <Text style={styles.retryText}>Thử lại</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Call In Progress Indicator */}
                {callInProgress && (
                    <View style={styles.callInProgressBanner}>
                        <Ionicons name="call" size={16} color="#4CAF50" />
                        <Text style={styles.callInProgressText}>
                            Cuộc gọi đang diễn ra...
                        </Text>
                        <TouchableOpacity
                            style={styles.returnToCallButton}
                            onPress={() => {
                                // Return to active call - implement based on your call screen logic
                                console.log('Return to active call');
                            }}
                        >
                            <Text style={styles.returnToCallText}>Quay lại</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Messages List */}
                <View style={styles.messagesContainer}>
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessageItem}
                        keyExtractor={keyExtractor}
                        inverted
                        showsVerticalScrollIndicator={false}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={['#667eea']}
                                tintColor="#667eea"
                            />
                        }
                        ListEmptyComponent={ListEmptyComponent}
                        ListFooterComponent={ListFooterComponent}
                        ListHeaderComponent={ListHeaderComponent}
                        contentContainerStyle={
                            messages.length === 0 
                                ? styles.emptyList 
                                : styles.messagesList
                        }
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.1}
                    />

                    {/* Scroll to Bottom Button */}
                    {showScrollToBottom && (
                        <Animated.View 
                            style={[
                                styles.scrollToBottomButton,
                                { opacity: fadeAnim }
                            ]}
                        >
                            <TouchableOpacity
                                style={styles.scrollButton}
                                onPress={scrollToBottom}
                            >
                                <Ionicons name="chevron-down" size={24} color="#fff" />
                            </TouchableOpacity>
                        </Animated.View>
                    )}
                </View>

                {/* Message Input */}
                <NewMessageInput
                    messageText={messageText}
                    onChangeText={handleMessageTextChange}
                    onSend={sendMessageAction}
                    attachment={attachment}
                    setAttachment={setAttachment}
                    sending={sending}
                    disabled={!wsConnected && !connectionStatus}
                />

                {/* Error Message */}
                {messageError && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{messageError}</Text>
                        <TouchableOpacity
                            style={styles.errorRetryButton}
                            onPress={fetchNewMessages}
                        >
                            <Text style={styles.errorRetryText}>Thử lại</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    messagesContainer: {
        flex: 1,
        position: 'relative',
    },
    messagesList: {
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    emptyList: {
        flex: 1,
        justifyContent: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    emptyContent: {
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginTop: 20,
        marginBottom: 10,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
    footerLoading: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    loadingText: {
        marginLeft: 10,
        color: '#666',
        fontSize: 14,
    },
    chatStart: {
        alignItems: 'center',
        paddingVertical: 30,
        paddingHorizontal: 20,
    },
    chatStartAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    chatStartAvatarText: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
    },
    chatStartName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    chatStartMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
    connectionStatus: {
        backgroundColor: '#fff3cd',
        paddingHorizontal: 15,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#ffeaa7',
    },
    connectionStatusText: {
        flex: 1,
        marginLeft: 8,
        color: '#856404',
        fontSize: 14,
    },
    retryButton: {
        backgroundColor: '#ff9800',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    retryText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    scrollToBottomButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        zIndex: 1000,
    },
    scrollButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    errorContainer: {
        backgroundColor: '#ffebee',
        padding: 12,
        marginHorizontal: 10,
        marginBottom: 10,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    errorText: {
        flex: 1,
        color: '#c62828',
        fontSize: 14,
    },
    errorRetryButton: {
        backgroundColor: '#c62828',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 5,
    },
    errorRetryText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    callInProgressBanner: {
        backgroundColor: '#fff3cd',
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#ffeaa7',
    },
    callInProgressText: {
        flex: 1,
        marginLeft: 10,
        color: '#856404',
        fontSize: 14,
    },
    returnToCallButton: {
        backgroundColor: '#ff9800',
        padding: 10,
        borderRadius: 5,
    },
    returnToCallText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
});

export default NewChatScreen; 