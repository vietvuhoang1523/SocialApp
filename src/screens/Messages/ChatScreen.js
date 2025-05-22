// ChatScreen.js - Màn hình tin nhắn chi tiết (đã cải thiện và tách thành nhiều thành phần)
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    Alert,
    RefreshControl,
    KeyboardAvoidingView,
    Platform,
    FlatList,
    AppState,
    StyleSheet
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// Components
import ChatHeader from '../../components/chat/ChatHeader';
import MessageItem from '../../components/chat/MessageItem';
import MessageInput from '../../components/chat/MessageInput';
import AttachmentPreview from '../../components/chat/AttachmentPreview';

// Custom Hooks
import useChatWebSocket from '../../hook/useChatWebSocket';
import useMessageManagement from '../../hook/useMessageManagement';
import useMessageHandlers from '../../hook/useMessageHandlers';
import useConnection from '../../hook/useConnection';

// Utils
import ImageUtils from '../../utils/ImageUtils';

// Services
import webSocketService from '../../services/WebSocketService';

const ChatScreen = ({ route, navigation }) => {
    const { user, currentUser } = route.params;
    const [messageText, setMessageText] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [isTyping, setIsTyping] = useState(false);

    const flatListRef = useRef(null);
    const lastPollingTimeRef = useRef(Date.now());
    const messagePollingRef = useRef(null);
    const keyboardShowListener = useRef(null);
    const keyboardHideListener = useRef(null);

    // Tạo chat key một lần để tránh tạo lại trong các dependency
    const chatKey = useMemo(() =>
            `chat_${String(currentUser?.id || '')}_${String(user?.id || '')}`,
        [currentUser?.id, user?.id]
    );
    const sendMessage = async () => {
        if (messageText.trim() === '' && !attachment) return;

        try {
            // Tạo tin nhắn để hiển thị ngay
            const optimisticMessage = {
                id: `temp-${Date.now()}`,
                senderId: currentUser.id,
                receiverId: user.id,
                content: messageText,
                createdAt: new Date().toISOString(),
                isSending: true
            };

            // Thêm tin nhắn tạm vào danh sách
            setMessages(prevMessages => [optimisticMessage, ...prevMessages]);

            // Dữ liệu tin nhắn để gửi
            const messageData = {
                content: messageText,
                senderId: currentUser.id,
                receiverId: user.id
            };

            // Thêm file đính kèm nếu có
            if (attachment) {
                messageData.attachmentUrl = attachment.uri;
            }

            // Thử gửi tin nhắn qua WebSocket
            const sentViaWebSocket = await sendMessageViaWebSocket(messageData);

            if (!sentViaWebSocket) {
                // Nếu gửi qua WebSocket thất bại, dùng REST API
                const response = await messagesService.sendMessage(messageData);

                // Cập nhật tin nhắn với ID từ server
                setMessages(prevMessages =>
                    prevMessages.map(msg =>
                        msg.id === optimisticMessage.id
                            ? { ...response, isSending: false }
                            : msg
                    )
                );
            }

            // Reset form
            setMessageText('');
            setAttachment(null);
        } catch (error) {
            console.error('Lỗi khi gửi tin nhắn:', error);

            // Cập nhật trạng thái tin nhắn lỗi
            setMessages(prevMessages =>
                prevMessages.map(msg =>
                    msg.id === optimisticMessage.id
                        ? { ...msg, isSending: false, isError: true }
                        : msg
                )
            );
        }
    };
    // Quản lý tin nhắn (tải, phân trang, làm mới)
    const {
        messages,
        setMessages,
        loading,
        refreshing,
        hasMore,
        fetchMessages,
        loadMessages,
        fetchNewMessages,
        onRefresh,
        loadMoreMessages,
        handleNewWebSocketMessage,
        lastMessageTimeRef
    } = useMessageManagement(currentUser, user);

    // Xử lý kết nối WebSocket và tự động kết nối lại
    const handleReconnect = useCallback(() => {
        console.log("Kết nối lại thành công, đăng ký lại các callbacks");

        // Đăng ký lại các WebSocket listeners
        if (chatKey) {
            const messageCallback = (newMessage) => handleNewWebSocketMessage(newMessage);
            const typingCallback = (notification) => {
                if (notification.senderId === user?.id) {
                    setIsTyping(notification.typing);
                }
            };

            webSocketService.onMessage(chatKey, messageCallback);
            webSocketService.onTyping(chatKey, typingCallback);
        }

        // Làm mới tin nhắn để đồng bộ hóa
        fetchNewMessages();
    }, [chatKey, handleNewWebSocketMessage, fetchNewMessages, user?.id]);

    const {
        connectionStatus,
        reconnecting
    } = useConnection(currentUser, user, chatKey, handleReconnect);

    // Sử dụng hook WebSocket
    const {
        isTyping: wsIsTyping,
        wsConnected,
        sendMessageViaWebSocket,
        sendTypingNotification,
        markMessageAsRead
    } = useChatWebSocket(currentUser, user, handleNewWebSocketMessage);

    // Xử lý gửi tin nhắn, đánh dấu đã đọc...
    const {
        sending,
        formatTime,
        resendMessage,
        sendMessage: sendMessageHandler,
        markAllMessagesAsRead
    } = useMessageHandlers(
        currentUser,
        user,
        setMessages,
        setAttachment,
        setMessageText,
        wsConnected,
        sendMessageViaWebSocket,
        flatListRef
    );

    // Đồng bộ hóa trạng thái isTyping với wsIsTyping
    useEffect(() => {
        setIsTyping(wsIsTyping);
    }, [wsIsTyping]);

    // Thiết lập cơ bản và polling khi component được mount
    useEffect(() => {
        let isMounted = true;

        // Thiết lập ban đầu
        const setupInitial = async () => {
            // Tải tin nhắn
            await fetchMessages();

            if (!isMounted) return;

            // Đánh dấu tin nhắn đã đọc
            markAllMessagesAsRead();

            // Thiết lập kiểm tra tin nhắn định kỳ (fallback nếu WebSocket không hoạt động)
            startMessagePolling();
        };

        // Bắt đầu polling để kiểm tra tin nhắn mới (phương án dự phòng)
        const startMessagePolling = () => {
            // Kiểm tra tin nhắn mới mỗi 15 giây
            messagePollingRef.current = setInterval(() => {
                // Chỉ polling khi WebSocket không hoạt động và cách lần cuối cùng ít nhất 15 giây
                if (connectionStatus !== 'connected' && (Date.now() - lastPollingTimeRef.current > 15000)) {
                    console.log('WebSocket không hoạt động, kiểm tra tin nhắn mới qua API...');
                    fetchNewMessages();
                    lastPollingTimeRef.current = Date.now();
                }
            }, 15000);
        };

        // Thực hiện thiết lập ban đầu
        setupInitial();

        // Cleanup khi component unmount
        return () => {
            isMounted = false;

            // Hủy polling
            if (messagePollingRef.current) {
                clearInterval(messagePollingRef.current);
            }
        };
    }, [fetchMessages, markAllMessagesAsRead, fetchNewMessages, connectionStatus]);

    // Cập nhật hàm xử lý nhập text để gửi thông báo typing
    const handleMessageTextChange = useCallback((text) => {
        setMessageText(text);
        // Gửi thông báo typing nếu WebSocket đã kết nối
        if (wsConnected && text.trim().length > 0) {
            sendTypingNotification(true);
        }
    }, [wsConnected, sendTypingNotification]);

    // Chọn hình ảnh từ thư viện
    const pickImage = useCallback(async () => {
        const result = await ImageUtils.pickImageFromLibrary();
        if (result) {
            setAttachment(result);
        }
    }, []);

    // Gửi tin nhắn
    const sendMessageAction = useCallback(() => {
        sendMessageHandler(messageText, attachment);
    }, [sendMessageHandler, messageText, attachment]);

    // Render từng item tin nhắn
    const renderMessageItem = useCallback(({ item }) => (
        <MessageItem
            item={item}
            currentUser={currentUser}
            chatPartner={user}
            formatTime={formatTime}
            resendMessage={resendMessage}
            navigation={navigation}
        />
    ), [currentUser, user, formatTime, resendMessage, navigation]);

    // Memoize keyExtractor để tránh rerender không cần thiết
    const keyExtractor = useCallback((item) => String(item.id), []);

    // Empty component cho FlatList
    const ListEmptyComponent = useCallback(() => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
                Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
            </Text>
        </View>
    ), []);

    // Footer component cho FlatList
    const ListFooterComponent = useCallback(() => (
        hasMore && !loading ? (
            <View style={styles.footerLoading}>
                <ActivityIndicator size="small" color="#0095F6" />
            </View>
        ) : null
    ), [hasMore, loading]);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            {/* Header */}
            <ChatHeader
                navigation={navigation}
                user={user}
                isTyping={isTyping}
            />

            {/* Connection Status */}
            {connectionStatus === 'disconnected' && (
                <View style={styles.connectionStatus}>
                    <Text style={styles.connectionStatusText}>
                        {reconnecting ? 'Đang kết nối lại...' : 'Mất kết nối. Tin nhắn sẽ được gửi khi có kết nối.'}
                    </Text>
                </View>
            )}

            {/* Loading Indicator */}
            {loading && !refreshing && (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#0095F6" />
                </View>
            )}

            {/* Typing Indicator */}
            {isTyping && (
                <View style={styles.typingContainer}>
                    <Text style={styles.typingText}>{user.username} đang nhập tin nhắn...</Text>
                </View>
            )}

            {/* Messages List */}
            {!loading && (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessageItem}
                    keyExtractor={keyExtractor}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.chatListContainer}
                    inverted={true}
                    onEndReached={loadMoreMessages}
                    onEndReachedThreshold={0.5}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#0095F6']}
                        />
                    }
                    ListEmptyComponent={ListEmptyComponent}
                    ListFooterComponent={ListFooterComponent}
                    removeClippedSubviews={true}
                    initialNumToRender={15}
                    maxToRenderPerBatch={10}
                    windowSize={15}
                />
            )}

            {/* File Attachment Preview */}
            <AttachmentPreview
                attachment={attachment}
                setAttachment={setAttachment}
            />

            {/* Message Input */}
            <MessageInput
                messageText={messageText}
                handleMessageTextChange={handleMessageTextChange}
                sending={sending}
                attachment={attachment}
                pickImage={pickImage}
                sendMessage={sendMessageAction}
                setAttachment={setAttachment}
            />
        </KeyboardAvoidingView>
    );
};

// Styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chatListContainer: {
        paddingHorizontal: 10,
        paddingVertical: 10,
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        fontSize: 14,
        color: '#8E8E8E',
        textAlign: 'center',
    },
    footerLoading: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    typingContainer: {
        padding: 8,
        paddingHorizontal: 12,
        backgroundColor: '#f0f0f0',
        borderRadius: 16,
        marginHorizontal: 10,
        marginBottom: 8,
        alignSelf: 'flex-start',
    },
    typingText: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
    },
    connectionStatus: {
        backgroundColor: '#ffcc00',
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    connectionStatusText: {
        fontSize: 12,
        color: '#333',
        fontWeight: '500',
    },
    retryButton: {
        marginLeft: 8,
        paddingHorizontal: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0095F6',
        borderRadius: 12,
        height: 24,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default ChatScreen;