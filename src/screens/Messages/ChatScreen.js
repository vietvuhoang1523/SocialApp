// ChatScreen.js - Màn hình tin nhắn chi tiết (đã cải thiện và tách thành nhiều thành phần)
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    RefreshControl,
    KeyboardAvoidingView,
    Platform,
    FlatList,
    StyleSheet,
    TouchableOpacity
} from 'react-native';

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

    const flatListRef = useRef(null);
    const lastPollingTimeRef = useRef(Date.now());
    const messagePollingRef = useRef(null);

    // Tạo chat key một lần để tránh tạo lại trong các dependency
    const chatKey = useMemo(() =>
            `chat_${String(currentUser?.id || '')}_${String(user?.id || '')}`,
        [currentUser?.id, user?.id]
    );

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
        handleNewWebSocketMessage
    } = useMessageManagement(currentUser, user);

    // Xử lý kết nối WebSocket và tự động kết nối lại
    const handleReconnect = useCallback(() => {
        console.log("Kết nối lại thành công, đăng ký lại các callbacks");

        // Đăng ký lại các WebSocket listeners
        if (chatKey) {
            const messageCallback = (newMessage) => handleNewWebSocketMessage(newMessage);
            const typingCallback = (notification) => {
                if (notification.senderId === user?.id) {
                    // setIsTyping sẽ được handle trong useChatWebSocket
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

    // Sử dụng hook WebSocket với error handling
    const {
        wsConnected,
        isTyping,
        connectionError,
        sendMessageViaWebSocket,
        sendTypingNotification,
        markMessageAsRead,
        reconnect,
        getConnectionStatus
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

    // Debug effect để theo dõi WebSocket
    useEffect(() => {
        // Thiết lập interval để làm mới tin nhắn định kỳ
        const refreshInterval = setInterval(() => {
            // Kiểm tra trạng thái kết nối WebSocket
            if (!wsConnected) {
                console.log('WebSocket không kết nối, đang làm mới tin nhắn...');
                fetchNewMessages();
            }
        }, 5000); // Làm mới mỗi 5 giây
        return () => {
            clearInterval(refreshInterval);
        };
        console.log('=== ChatScreen WebSocket Debug ===');
        console.log('Current User:', currentUser?.id, currentUser?.username);
        console.log('Chat Partner:', user?.id, user?.username);
        console.log('WebSocket Connected:', wsConnected);
        console.log('Connection Error:', connectionError);
        console.log('Connection Status:', getConnectionStatus());
        console.log('=====================================');
    }, [wsConnected, fetchNewMessages]);

    // Thiết lập cơ bản và polling khi component được mount
    // Trong ChatScreen.js

// Thêm useEffect để tự động làm mới tin nhắn
    useEffect(() => {
        // Thiết lập interval để làm mới tin nhắn định kỳ
        const refreshInterval = setInterval(() => {
            // Kiểm tra trạng thái kết nối WebSocket
            if (!wsConnected) {
                console.log('WebSocket không kết nối, đang làm mới tin nhắn...');
                fetchNewMessages();
            }
        }, 5000); // Làm mới mỗi 5 giây

        // Cleanup interval khi component unmount
        return () => {
            clearInterval(refreshInterval);
        };
    }, [wsConnected, fetchNewMessages]);

// Hoặc tích hợp vào useEffect đã có
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
            const startMessagePolling = () => {
                // Kiểm tra tin nhắn mới mỗi 15 giây
                messagePollingRef.current = setInterval(() => {
                    // Chỉ polling khi WebSocket không hoạt động và cách lần cuối cùng ít nhất 15 giây
                    if (!wsConnected && (Date.now() - lastPollingTimeRef.current > 15000)) {
                        console.log('WebSocket không hoạt động, kiểm tra tin nhắn mới qua API...');
                        fetchNewMessages();
                        lastPollingTimeRef.current = Date.now();
                    }
                }, 15000);
            };

            // Bắt đầu polling
            startMessagePolling();
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
    }, [fetchMessages, markAllMessagesAsRead, fetchNewMessages, wsConnected]);

// Tùy chọn: Thêm debug để theo dõi việc nhận tin nhắn
    useEffect(() => {
        console.log('=== Danh sách tin nhắn hiện tại ===');
        console.log(messages.map(msg => ({
            id: msg.id,
            content: msg.content,
            senderId: msg.senderId,
            createdAt: msg.createdAt,
            isSending: msg.isSending
        })));
    }, [messages]);

    // Cập nhật hàm xử lý nhập text để gửi thông báo typing
    const handleMessageTextChange = useCallback((text) => {
        setMessageText(text);

        // Gửi thông báo typing nếu WebSocket đã kết nối
        if (wsConnected && text.trim().length > 0) {
            console.log('Sending typing notification: true');
            sendTypingNotification(true);
        } else if (wsConnected && text.trim().length === 0) {
            console.log('Sending typing notification: false');
            sendTypingNotification(false);
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
        // Kiểm tra kết nối WebSocket trước khi gửi
        if (!wsConnected) {
            // Thử kết nối lại
            webSocketService.connect()
                .then(() => {
                    // Sau khi kết nối lại, gửi tin nhắn
                    sendMessageHandler(messageText, attachment);
                })
                .catch(error => {
                    console.error('Không thể kết nối WebSocket:', error);
                    // Fallback gửi qua REST API
                    sendMessageHandler(messageText, attachment);
                });
        } else {
            // Nếu đã kết nối, gửi bình thường
            sendMessageHandler(messageText, attachment);
        }
    }, [wsConnected, sendMessageHandler, messageText, attachment]);

    // Test WebSocket function
    const testWebSocket = useCallback(() => {
        console.log('=== WebSocket Test ===');
        console.log('Connected:', wsConnected);
        console.log('Status:', getConnectionStatus());

        if (connectionError) {
            console.log('Connection Error:', connectionError);
        }

        // Test gửi tin nhắn
        const testMessage = {
            content: `Test message at ${new Date().toLocaleTimeString()}`,
            senderId: currentUser.id,
            receiverId: user.id
        };

        console.log('Sending test message:', testMessage);
        sendMessageViaWebSocket(testMessage);
    }, [wsConnected, connectionError, getConnectionStatus, sendMessageViaWebSocket, currentUser, user]);

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
    const keyExtractor = useCallback((item, index) => {
        // Sử dụng kết hợp id, timestamp và index
        return `${item.id || 'unknown'}-${item.timestamp || Date.now()}-${index}`;
    }, []);

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
            {!wsConnected && (
                <View style={styles.connectionStatus}>
                    <Text style={styles.connectionStatusText}>
                        {connectionError
                            ? `Lỗi kết nối: ${connectionError.message || 'Unknown error'}`
                            : reconnecting
                                ? 'Đang kết nối lại...'
                                : 'Mất kết nối. Tin nhắn sẽ được gửi khi có kết nối.'
                        }
                    </Text>
                    {connectionError && (
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={reconnect}
                        >
                            <Text style={styles.retryButtonText}>Thử lại</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Debug Panel - Chỉ hiển thị trong development */}
            {__DEV__ && (
                <View style={styles.debugPanel}>
                    <TouchableOpacity
                        style={styles.debugButton}
                        onPress={testWebSocket}
                    >
                        <Text style={styles.debugButtonText}>
                            Test WS ({wsConnected ? 'Connected' : 'Disconnected'})
                        </Text>
                    </TouchableOpacity>
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
        flexDirection: 'row',
    },
    connectionStatusText: {
        fontSize: 12,
        color: '#333',
        fontWeight: '500',
        flex: 1,
    },
    retryButton: {
        marginLeft: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: '#0095F6',
        borderRadius: 12,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    // Debug styles - chỉ cho development
    debugPanel: {
        backgroundColor: '#f0f0f0',
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    debugButton: {
        backgroundColor: '#007AFF',
        padding: 8,
        borderRadius: 4,
        alignItems: 'center',
    },
    debugButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default ChatScreen;