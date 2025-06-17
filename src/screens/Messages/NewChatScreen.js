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
import ConnectionStatusIndicator from '../../components/chat/ConnectionStatusIndicator';

// Services
import messagesService from '../../services/messagesService';
import videoCallService from '../../services/videoCallService';
import webSocketReconnectionManager from '../../services/WebSocketReconnectionManager';

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

    // 🔌 WebSocket Connection Hook - Enhanced with reconnection manager
    const handleReconnect = useCallback(() => {
        console.log("🔄 Chat reconnected, fetching new messages");
        fetchNewMessages();
    }, [fetchNewMessages]);

    const {
        connectionStatus,
        reconnecting,
        reconnectAttempt,
        maxAttempts,
        manualReconnect
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
                
                // Load initial messages
                await fetchMessages();
                
                console.log('✅ Chat setup complete');
            } catch (error) {
                console.error('❌ Error setting up chat:', error);
            }
        };

        setupChat();

        return () => {
            isMounted = false;
            resetTyping();
        };
    }, []);

    // Handle connection status changes
    useEffect(() => {
        console.log(`🔌 Connection status: ${connectionStatus}, reconnecting: ${reconnecting}`);
    }, [connectionStatus, reconnecting]);

    // Handle scroll events
    const handleScroll = (event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        scrollOffsetY.current = offsetY;
        
        // Show/hide scroll to bottom button based on scroll position
        const shouldShowButton = offsetY > 200;
        if (shouldShowButton !== showScrollToBottom) {
            setShowScrollToBottom(shouldShowButton);
        }
        
        // Check if at bottom
        const layoutHeight = event.nativeEvent.layoutMeasurement.height;
        const contentHeight = event.nativeEvent.contentSize.height;
        const isBottom = layoutHeight + offsetY >= contentHeight - 20;
        setIsAtBottom(isBottom);
    };

    // Scroll to bottom of chat
    const scrollToBottom = () => {
        if (flatListRef.current && messages.length > 0) {
            flatListRef.current.scrollToOffset({ offset: 0, animated: true });
        }
    };

    // Handle retry connection
    const handleRetryConnection = () => {
        console.log('🔄 Manually retrying connection...');
        manualReconnect();
    };

    // 🎨 Render functions
    const renderHeader = () => {
        if (loading && messages.length === 0) {
            return <LoadingSpinner size="large" style={styles.loadingSpinner} />;
        }
        
        if (hasMore) {
            return (
                <View style={styles.loadMoreContainer}>
                    {refreshing ? (
                        <ActivityIndicator size="small" color="#0084ff" />
                    ) : (
                        <TouchableOpacity
                            style={styles.loadMoreButton}
                            onPress={loadMoreMessages}
                        >
                            <Text style={styles.loadMoreText}>Xem tin nhắn cũ hơn</Text>
                        </TouchableOpacity>
                    )}
                </View>
            );
        }
        
        return null;
    };

    // 🎨 Render message list
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <NewChatHeader user={user} navigation={navigation} />
            
            {/* Connection Status Indicator */}
            <ConnectionStatusIndicator 
                status={connectionStatus} 
                reconnecting={reconnecting} 
                onRetry={handleRetryConnection}
            />
            
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : null}
                style={styles.keyboardAvoidingView}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <NewMessageItem
                            message={item}
                            currentUser={currentUser}
                            chatPartner={user}
                            formatTime={formatTime}
                            onResend={resendMessage}
                            markAsRead={markMessageAsRead}
                        />
                    )}
                    inverted
                    contentContainerStyle={styles.messageList}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    ListHeaderComponent={renderHeader}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#0084ff']}
                            tintColor="#0084ff"
                        />
                    }
                />

                {showScrollToBottom && (
                    <TouchableOpacity
                        style={styles.scrollToBottomButton}
                        onPress={scrollToBottom}
                    >
                        <Ionicons name="chevron-down" size={24} color="#fff" />
                    </TouchableOpacity>
                )}

                {isTyping && (
                    <View style={styles.typingContainer}>
                        <Text style={styles.typingText}>{user.fullName || user.username} đang nhập...</Text>
                    </View>
                )}

                <NewMessageInput
                    text={messageText}
                    setText={setMessageText}
                    onSend={sendMessageHandler}
                    sending={sending}
                    attachment={attachment}
                    setAttachment={setAttachment}
                    onTyping={(isTyping) => sendTypingNotification(isTyping)}
                    connectionStatus={connectionStatus}
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    messageList: {
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    loadingSpinner: {
        marginVertical: 20,
    },
    loadMoreContainer: {
        padding: 10,
        alignItems: 'center',
    },
    loadMoreButton: {
        padding: 8,
        backgroundColor: '#f0f2f5',
        borderRadius: 20,
    },
    loadMoreText: {
        color: '#0084ff',
        fontWeight: '500',
    },
    scrollToBottomButton: {
        position: 'absolute',
        right: 16,
        bottom: 80,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#0084ff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
    typingContainer: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        backgroundColor: '#f0f2f5',
    },
    typingText: {
        color: '#65676b',
        fontStyle: 'italic',
        fontSize: 12,
    },
});

export default NewChatScreen; 