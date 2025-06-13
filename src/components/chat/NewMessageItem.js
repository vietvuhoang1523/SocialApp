// NewMessageItem.js - Component tin nhắn mới với UI hiện đại
import React, { memo, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    Dimensions,
    Animated,
    Alert
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');
const maxBubbleWidth = screenWidth * 0.75;

const NewMessageItem = memo(({
    message,
    currentUser,
    chatPartner,
    formatTime,
    resendMessage,
    isLastMessage = false,
    onPress
}) => {
    const [imageError, setImageError] = useState(false);
    const isMyMessage = message.senderId === currentUser?.id;
    const scaleAnim = new Animated.Value(1);

    // 🎨 Animation on press
    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    // 📱 Handle message press
    const handlePress = () => {
        if (onPress) {
            onPress();
        } else if (message.isError) {
            Alert.alert(
                'Tin nhắn gửi thất bại',
                'Bạn có muốn gửi lại tin nhắn này không?',
                [
                    { text: 'Hủy', style: 'cancel' },
                    { text: 'Gửi lại', onPress: () => resendMessage?.(message) }
                ]
            );
        }
    };

    // 📷 Handle image press
    const handleImagePress = () => {
        // TODO: Implement image viewer
        console.log('Image pressed:', message.attachment);
    };

    // 🎨 Get message status icon
    const getStatusIcon = () => {
        if (message.isSending) {
            return <Ionicons name="time-outline" size={14} color="#999" />;
        } else if (message.isError) {
            return <Ionicons name="warning" size={14} color="#F44336" />;
        } else if (message.isRead) {
            return <Ionicons name="checkmark-done" size={14} color="#4CAF50" />;
        } else {
            return <Ionicons name="checkmark" size={14} color="#999" />;
        }
    };

    // 🎨 Get bubble colors
    const getBubbleColors = () => {
        if (message.isError) {
            return ['#ffebee', '#ffcdd2'];
        } else if (isMyMessage) {
            return ['#667eea', '#764ba2'];
        } else {
            return ['#ffffff', '#f8f9fa'];
        }
    };

    // 📝 Format message content
    const renderMessageContent = () => {
        const hasText = message.content && message.content.trim().length > 0;
        const hasAttachment = message.attachment;

        return (
            <View style={styles.messageContent}>
                {/* Attachment */}
                {hasAttachment && (
                    <TouchableOpacity
                        style={styles.attachmentContainer}
                        onPress={handleImagePress}
                        activeOpacity={0.8}
                    >
                        {message.attachment.type === 'image' ? (
                            <View style={styles.imageContainer}>
                                {!imageError ? (
                                    <Image
                                        source={{ uri: message.attachment.uri || message.attachment.url }}
                                        style={styles.attachmentImage}
                                        onError={() => setImageError(true)}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={styles.imageError}>
                                        <Ionicons name="image-outline" size={40} color="#999" />
                                        <Text style={styles.imageErrorText}>
                                            Không thể tải ảnh
                                        </Text>
                                    </View>
                                )}
                                
                                {/* Image overlay */}
                                <View style={styles.imageOverlay}>
                                    <Ionicons name="expand-outline" size={20} color="#fff" />
                                </View>
                            </View>
                        ) : (
                            <View style={styles.fileContainer}>
                                <Ionicons name="document-outline" size={24} color="#667eea" />
                                <Text style={styles.fileName} numberOfLines={1}>
                                    {message.attachment.name || 'File'}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                )}

                {/* Text Content */}
                {hasText && (
                    <Text
                        style={[
                            styles.messageText,
                            isMyMessage ? styles.myMessageText : styles.otherMessageText,
                            message.isError && styles.errorMessageText
                        ]}
                        selectable
                    >
                        {message.content}
                    </Text>
                )}
            </View>
        );
    };

    return (
        <Animated.View
            style={[
                styles.messageContainer,
                isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
                { transform: [{ scale: scaleAnim }] }
            ]}
        >
            {/* Avatar for other messages */}
            {!isMyMessage && (
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {chatPartner?.fullName?.charAt(0)?.toUpperCase() || '?'}
                        </Text>
                    </View>
                </View>
            )}

            <TouchableOpacity
                style={[
                    styles.messageBubble,
                    isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
                    message.isError && styles.errorBubble
                ]}
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.8}
                disabled={message.isSending}
            >
                <LinearGradient
                    colors={getBubbleColors()}
                    style={styles.bubbleGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    {/* Message Content */}
                    {renderMessageContent()}

                    {/* Message Info */}
                    <View style={styles.messageInfo}>
                        <Text
                            style={[
                                styles.timeText,
                                isMyMessage ? styles.myTimeText : styles.otherTimeText
                            ]}
                        >
                            {formatTime(message.timestamp || message.createdAt)}
                        </Text>
                        
                        {/* Status for my messages */}
                        {isMyMessage && (
                            <View style={styles.statusContainer}>
                                {getStatusIcon()}
                            </View>
                        )}
                    </View>

                    {/* Loading indicator for sending messages */}
                    {message.isSending && (
                        <View style={styles.loadingContainer}>
                            <Animated.View style={styles.loadingDot} />
                        </View>
                    )}
                </LinearGradient>
            </TouchableOpacity>

            {/* Error retry button */}
            {message.isError && (
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => resendMessage?.(message)}
                >
                    <Ionicons name="refresh" size={16} color="#F44336" />
                </TouchableOpacity>
            )}
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    messageContainer: {
        flexDirection: 'row',
        marginVertical: 2,
        paddingHorizontal: 15,
        alignItems: 'flex-end',
    },
    myMessageContainer: {
        justifyContent: 'flex-end',
    },
    otherMessageContainer: {
        justifyContent: 'flex-start',
    },
    avatarContainer: {
        marginRight: 8,
        marginBottom: 5,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    messageBubble: {
        maxWidth: maxBubbleWidth,
        borderRadius: 20,
        overflow: 'hidden',
        marginVertical: 2,
    },
    myMessageBubble: {
        borderBottomRightRadius: 5,
    },
    otherMessageBubble: {
        borderBottomLeftRadius: 5,
    },
    errorBubble: {
        borderWidth: 1,
        borderColor: '#F44336',
    },
    bubbleGradient: {
        padding: 12,
        minWidth: 60,
    },
    messageContent: {
        flex: 1,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    myMessageText: {
        color: '#fff',
    },
    otherMessageText: {
        color: '#333',
    },
    errorMessageText: {
        color: '#c62828',
    },
    attachmentContainer: {
        marginBottom: 8,
    },
    imageContainer: {
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
    },
    attachmentImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
    },
    imageOverlay: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageError: {
        width: '100%',
        height: 200,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    imageErrorText: {
        marginTop: 8,
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    fileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        padding: 12,
        borderRadius: 8,
    },
    fileName: {
        marginLeft: 8,
        fontSize: 14,
        color: '#667eea',
        fontWeight: '500',
        flex: 1,
    },
    messageInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    timeText: {
        fontSize: 12,
        opacity: 0.7,
    },
    myTimeText: {
        color: '#fff',
    },
    otherTimeText: {
        color: '#666',
    },
    statusContainer: {
        marginLeft: 5,
    },
    loadingContainer: {
        position: 'absolute',
        bottom: 8,
        right: 8,
    },
    loadingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
    },
    retryButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#ffebee',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        marginBottom: 5,
    },
});

export default NewMessageItem; 