// src/components/chat/MessageItem.js
import React, { memo } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ImageService from '../../services/ImageService';

const MessageItem = ({
                         item,
                         currentUser,
                         chatPartner,
                         formatTime,
                         resendMessage,
                         navigation
                     }) => {
    const isCurrentUser = item.senderId === currentUser?.id;

    return (
        <View style={[
            styles.messageContainer,
            isCurrentUser ? styles.sentMessageContainer : styles.receivedMessageContainer
        ]}>
            {!isCurrentUser && (
                <Image
                    source={
                        chatPartner?.profilePicture
                            ? ImageService.getProfileImageSource(chatPartner.profilePicture)
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
                    <TouchableOpacity
                        onPress={() => {
                            // Phóng to hình ảnh hoặc mở trong trình xem hình ảnh
                            navigation.navigate('ImageViewer', { imageUrl: item.attachmentUrl });
                        }}
                    >
                        <Image
                            source={{ uri: item.attachmentUrl }}
                            style={styles.attachmentImage}
                            resizeMode="cover"
                        />
                    </TouchableOpacity>
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

const styles = StyleSheet.create({
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
});

// Tối ưu với memo để tránh render lại không cần thiết
export default memo(MessageItem);