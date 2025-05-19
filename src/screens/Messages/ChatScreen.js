// ChatScreen.js - Màn hình tin nhắn chi tiết
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import messagesService from '../../services/messagesService';
import chatService from '../../services/chatService';
import ImageService from '../../services/ImageService';
import * as ImagePicker from 'expo-image-picker';

const ChatScreen = ({ route, navigation }) => {
    const { user, currentUser } = route.params;
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [attachment, setAttachment] = useState(null);
    const flatListRef = useRef(null);

    // Lấy tin nhắn khi màn hình được mount
    useEffect(() => {
        if (currentUser?.id && user?.id) {
            loadMessages();
            markAllMessagesAsRead();
        }
    }, [currentUser, user]);

    // Thiết lập interval để tự động làm mới tin nhắn
    useEffect(() => {
        const interval = setInterval(() => {
            if (currentUser?.id && user?.id) {
                fetchNewMessages();
            }
        }, 10000); // Cập nhật mỗi 10 giây

        return () => clearInterval(interval);
    }, [currentUser, user, messages]);

    // Lấy tất cả tin nhắn
    const loadMessages = async (refresh = false) => {
        try {
            setLoading(true);
            const currentPage = refresh ? 0 : page;
            console.log(`Đang lấy tin nhắn trang ${currentPage}...`);

            // Sử dụng service để lấy tin nhắn
            const response = await messagesService.getMessagesBetweenUsersPaginated(
                currentUser.id,
                user.id,
                {
                    page: currentPage,
                    size: 20
                }
            );

            // Xử lý phân trang
            const newMessages = response.content || [];
            if (refresh) {
                setMessages(newMessages);
                setPage(1);
            } else {
                setMessages(prevMessages => [...prevMessages, ...newMessages]);
                setPage(currentPage + 1);
            }

            // Kiểm tra xem còn tin nhắn để tải không
            setHasMore(!response.last);

            // Nếu là làm mới, cuộn xuống tin nhắn mới nhất
            if (refresh && newMessages.length > 0) {
                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: false });
                }, 100);
            }
        } catch (error) {
            console.error('Lỗi khi tải tin nhắn:', error);
            Alert.alert('Lỗi', 'Không thể tải tin nhắn. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Lấy tin nhắn mới
    const fetchNewMessages = async () => {
        if (messages.length === 0) return;

        try {
            // Lấy thời điểm tin nhắn mới nhất hiện tại
            const latestMessage = messages[0];
            const latestTimestamp = latestMessage?.createdAt || new Date().toISOString();

            // Lấy tất cả tin nhắn và lọc những tin nhắn mới hơn
            const allMessages = await messagesService.getMessagesBetweenUsers(
                currentUser.id,
                user.id
            );

            const newMessages = allMessages.filter(msg =>
                new Date(msg.createdAt) > new Date(latestTimestamp)
            );

            if (newMessages.length > 0) {
                setMessages(prevMessages => [...newMessages, ...prevMessages]);
                markAllMessagesAsRead();
            }
        } catch (error) {
            console.error('Lỗi khi làm mới tin nhắn:', error);
        }
    };

    // Đánh dấu tất cả tin nhắn là đã đọc
    const markAllMessagesAsRead = async () => {
        try {
            await messagesService.markAllMessagesAsRead(user.id, currentUser.id);
        } catch (error) {
            console.error('Lỗi khi đánh dấu tin nhắn đã đọc:', error);
        }
    };

    // Xử lý khi làm mới danh sách tin nhắn
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadMessages(true);
    }, [currentUser, user]);

    // Xử lý khi tải thêm tin nhắn cũ
    const loadMoreMessages = () => {
        if (!loading && hasMore) {
            loadMessages();
        }
    };

    // Gửi tin nhắn
    const sendMessage = async () => {
        if (messageText.trim() === '' && !attachment) return;

        try {
            setSending(true);
            console.log('Đang gửi tin nhắn...');

            // Tạo ID tạm thời cho tin nhắn
            const tempId = `temp-${Date.now()}`;

            // Tạo tin nhắn tạm để hiển thị ngay (optimistic UI)
            const optimisticMessage = {
                id: tempId,
                senderId: currentUser.id,
                receiverId: user.id,
                content: messageText,
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
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);

            // Dữ liệu tin nhắn để gửi lên server
            const messageData = {
                content: messageText,
                senderId: currentUser.id,
                receiverId: user.id
            };

            // Nếu có file đính kèm, tải lên trước
            let attachmentUrl = null;
            if (attachment) {
                try {
                    attachmentUrl = await chatService.uploadAttachment(attachment);
                    messageData.attachmentUrl = attachmentUrl;
                } catch (attachmentError) {
                    console.error('Lỗi khi tải lên tệp đính kèm:', attachmentError);
                }
            }

            // Gửi tin nhắn lên server
            const response = await messagesService.sendMessage(messageData);

            // Cập nhật tin nhắn với ID thật từ server
            setMessages(prevMessages =>
                prevMessages.map(msg =>
                    msg.id === tempId
                        ? { ...response, isSending: false }
                        : msg
                )
            );

            console.log('Tin nhắn đã được gửi thành công:', response);
        } catch (error) {
            console.error('Lỗi khi gửi tin nhắn:', error);

            // Cập nhật trạng thái tin nhắn thành lỗi
            setMessages(prevMessages =>
                prevMessages.map(msg =>
                    msg.id.startsWith('temp-')
                        ? { ...msg, isSending: false, isError: true }
                        : msg
                )
            );

            Alert.alert('Lỗi', 'Không thể gửi tin nhắn. Vui lòng thử lại sau.');
        } finally {
            setSending(false);
        }
    };

    // Gửi lại tin nhắn bị lỗi
    const resendMessage = (failedMessage) => {
        // Xóa tin nhắn lỗi
        setMessages(prevMessages => prevMessages.filter(msg => msg.id !== failedMessage.id));

        // Đặt lại nội dung tin nhắn
        setMessageText(failedMessage.content);

        // Nếu có tệp đính kèm
        if (failedMessage.attachmentUrl) {
            setAttachment({
                uri: failedMessage.attachmentUrl,
                type: 'image/jpeg',
                fileName: 'attachment.jpg'
            });
        }
    };

    // Chọn hình ảnh từ thư viện
    const pickImage = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (permissionResult.granted === false) {
                Alert.alert('Quyền truy cập', 'Bạn cần cấp quyền truy cập thư viện ảnh để sử dụng tính năng này.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled) {
                setAttachment({
                    uri: result.assets[0].uri,
                    type: 'image/jpeg',
                    fileName: `attachment_${Date.now()}.jpg`
                });
            }
        } catch (error) {
            console.error('Lỗi khi chọn ảnh:', error);
            Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại sau.');
        }
    };

    // Định dạng thời gian tin nhắn
    const formatTime = (dateTimeStr) => {
        try {
            const date = new Date(dateTimeStr);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (error) {
            return '';
        }
    };

    // Render item cho FlatList
    const renderMessageItem = ({ item }) => {
        const isCurrentUser = item.senderId === currentUser.id;

        return (
            <View style={[
                styles.messageContainer,
                isCurrentUser ? styles.sentMessageContainer : styles.receivedMessageContainer
            ]}>
                {!isCurrentUser && (
                    <Image
                        source={
                            user.profilePicture
                                ? ImageService.getProfileImageSource(user.profilePicture)
                                : { uri: 'https://randomuser.me/api/portraits/men/1.jpg' }
                        }
                        style={styles.messageBubbleAvatar}
                    />
                )}
                <View style={[
                    styles.messageBubble,
                    isCurrentUser ? styles.sentMessageBubble : styles.receivedMessageBubble,
                    item.isSending && styles.sendingMessageBubble,
                    item.isError && styles.errorMessageBubble
                ]}>
                    {/* Hiển thị hình ảnh đính kèm nếu có */}
                    {item.attachmentUrl && (
                        <Image
                            source={{ uri: item.attachmentUrl }}
                            style={styles.attachmentImage}
                            resizeMode="cover"
                        />
                    )}

                    {/* Nội dung tin nhắn */}
                    {item.content && (
                        <Text style={[
                            styles.messageText,
                            isCurrentUser ? styles.sentMessageText : styles.receivedMessageText
                        ]}>
                            {item.content}
                        </Text>
                    )}

                    {/* Chỉ báo đang gửi */}
                    {item.isSending && (
                        <View style={styles.sendingIndicator}>
                            <ActivityIndicator size="small" color={isCurrentUser ? "white" : "#0095F6"} />
                        </View>
                    )}

                    {/* Nút thử lại khi gửi lỗi */}
                    {item.isError && (
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() => resendMessage(item)}
                        >
                            <Icon name="refresh" size={16} color="red" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Thời gian gửi */}
                <Text style={[
                    styles.messageTime,
                    isCurrentUser ? styles.sentMessageTime : styles.receivedMessageTime
                ]}>
                    {formatTime(item.createdAt)}
                </Text>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            {/* Header */}
            <View style={styles.chatHeader}>
                <View style={styles.chatHeaderLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Icon name="arrow-left" size={24} color="black" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.chatUserInfo}
                        onPress={() => navigation.navigate('Profile', { userId: user.id })}
                    >
                        <Image
                            source={
                                user.profilePicture
                                    ? ImageService.getProfileImageSource(user.profilePicture)
                                    : { uri: 'https://randomuser.me/api/portraits/men/1.jpg' }
                            }
                            style={styles.chatUserAvatar}
                        />
                        <View>
                            <Text style={styles.chatUsername}>{user.username}</Text>
                            <Text style={styles.chatUserStatus}>Hoạt động gần đây</Text>
                        </View>
                    </TouchableOpacity>
                </View>
                <View style={styles.chatHeaderRight}>
                    <TouchableOpacity style={styles.chatHeaderButton}>
                        <Icon name="phone-outline" size={24} color="black" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.chatHeaderButton}>
                        <Icon name="video-outline" size={24} color="black" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.chatHeaderButton}>
                        <Icon name="information-outline" size={24} color="black" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Loading Indicator */}
            {loading && !refreshing && (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#0095F6" />
                </View>
            )}

            {/* Messages List */}
            {!loading && (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessageItem}
                    keyExtractor={(item) => item.id.toString()}
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
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>
                                Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
                            </Text>
                        </View>
                    }
                    ListFooterComponent={
                        hasMore && !loading ? (
                            <View style={styles.footerLoading}>
                                <ActivityIndicator size="small" color="#0095F6" />
                            </View>
                        ) : null
                    }
                />
            )}

            {/* File Attachment Preview */}
            {attachment && (
                <View style={styles.attachmentPreview}>
                    <Image
                        source={{ uri: attachment.uri }}
                        style={styles.attachmentPreviewImage}
                    />
                    <TouchableOpacity
                        style={styles.attachmentRemoveButton}
                        onPress={() => setAttachment(null)}
                    >
                        <Icon name="close-circle" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Message Input */}
            <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                    <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
                        <Icon name="camera-outline" size={24} color="#0095F6" />
                    </TouchableOpacity>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Tin nhắn..."
                        value={messageText}
                        onChangeText={setMessageText}
                        multiline
                        editable={!sending}
                    />
                    {messageText.trim() === '' && !attachment ? (
                        <View style={styles.inputActions}>
                            <TouchableOpacity style={styles.inputActionButton}>
                                <Icon name="microphone-outline" size={24} color="#0095F6" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.inputActionButton}
                                onPress={pickImage}
                            >
                                <Icon name="image-outline" size={24} color="#0095F6" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.inputActionButton}>
                                <Icon name="sticker-emoji" size={24} color="#0095F6" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.sendButton}
                            onPress={sendMessage}
                            disabled={sending}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color="#0095F6" />
                            ) : (
                                <Text style={styles.sendButtonText}>Gửi</Text>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: '#DEDEDE',
    },
    chatHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    chatUserInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
    },
    chatUserAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 10,
    },
    chatUsername: {
        fontSize: 16,
        fontWeight: '500',
    },
    chatUserStatus: {
        fontSize: 12,
        color: '#8E8E8E',
    },
    chatHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    chatHeaderButton: {
        marginLeft: 15,
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
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 10,
    },
    sentMessageContainer: {
        justifyContent: 'flex-end',
        marginLeft: 50,
    },
    receivedMessageContainer: {
        justifyContent: 'flex-start',
        marginRight: 50,
    },
    messageBubbleAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        marginRight: 8,
    },
    messageBubble: {
        maxWidth: '70%',
        borderRadius: 18,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    sentMessageBubble: {
        backgroundColor: '#0095F6',
    },
    receivedMessageBubble: {
        backgroundColor: '#F2F2F2',
    },
    sendingMessageBubble: {
        opacity: 0.7,
    },
    errorMessageBubble: {
        borderWidth: 1,
        borderColor: 'red',
    },
    messageText: {
        fontSize: 14,
        lineHeight: 20,
    },
    sentMessageText: {
        color: 'white',
    },
    receivedMessageText: {
        color: 'black',
    },
    messageTime: {
        fontSize: 10,
        color: '#8E8E8E',
        marginTop: 2,
    },
    sentMessageTime: {
        marginLeft: 8,
        alignSelf: 'flex-end',
    },
    receivedMessageTime: {
        marginRight: 8,
        alignSelf: 'flex-start',
    },
    inputContainer: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderTopWidth: 0.5,
        borderTopColor: '#DEDEDE',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F2',
        borderRadius: 22,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    textInput: {
        flex: 1,
        maxHeight: 100,
        fontSize: 16,
        marginHorizontal: 8,
    },
    inputActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputActionButton: {
        marginLeft: 8,
    },
    sendButton: {
        marginLeft: 8,
        paddingHorizontal: 10,
        justifyContent: 'center',
        alignItems: 'center',
        height: 32,
    },
    sendButtonText: {
        color: '#0095F6',
        fontWeight: 'bold',
        fontSize: 14,
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
    attachmentPreview: {
        margin: 10,
        width: 100,
        height: 100,
        borderRadius: 10,
        position: 'relative',
    },
    attachmentPreviewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    attachmentRemoveButton: {
        position: 'absolute',
        top: -10,
        right: -10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 12,
    },
    attachmentImage: {
        width: '100%',
        height: 150,
        borderRadius: 10,
        marginBottom: 8,
    },
    sendingIndicator: {
        position: 'absolute',
        right: -20,
        bottom: 0,
    },
    retryButton: {
        position: 'absolute',
        right: -20,
        bottom: 0,
    },
    cameraButton: {
        paddingHorizontal: 5,
    },
});

export default ChatScreen;