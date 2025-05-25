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

const MessageItem = ({
                         item,
                         currentUser,
                         chatPartner,
                         formatTime,
                         resendMessage,
                         navigation
                     }) => {
    const isOwn = item.senderId === currentUser?.id;

    const getAvatarSource = () => {
        if (chatPartner?.profilePicture) {
            return { uri: chatPartner.profilePicture };
        }
        return { uri: 'https://randomuser.me/api/portraits/men/1.jpg' };
    };

    const MessageStatus = () => {
        if (item.isSending) {
            return <ActivityIndicator size="small" color={isOwn ? "#FFF" : "#0084FF"} />;
        }

        if (item.isError) {
            return (
                <TouchableOpacity onPress={() => resendMessage(item)}>
                    <Icon name="refresh" size={16} color="#FF3B30" />
                </TouchableOpacity>
            );
        }

        return null;
    };

    return (
        <View style={[styles.container, isOwn ? styles.ownMessage : styles.otherMessage]}>
            {!isOwn && (
                <Image source={getAvatarSource()} style={styles.avatar} />
            )}

            <View style={[
                styles.bubble,
                isOwn ? styles.ownBubble : styles.otherBubble,
                item.isSending && styles.sendingBubble,
                item.isError && styles.errorBubble
            ]}>
                {item.attachmentUrl && (
                    <TouchableOpacity
                        onPress={() => navigation.navigate('ImageViewer', {
                            imageUrl: item.attachmentUrl
                        })}
                    >
                        <Image
                            source={{ uri: item.attachmentUrl }}
                            style={styles.attachment}
                            resizeMode="cover"
                        />
                    </TouchableOpacity>
                )}

                {item.content && (
                    <Text style={[styles.text, isOwn ? styles.ownText : styles.otherText]}>
                        {item.content}
                    </Text>
                )}

                <View style={styles.messageFooter}>
                    <Text style={[styles.time, isOwn ? styles.ownTime : styles.otherTime]}>
                        {formatTime(item.createdAt)}
                    </Text>
                    <MessageStatus />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginVertical: 2,
        paddingHorizontal: 12,
    },
    ownMessage: {
        justifyContent: 'flex-end',
    },
    otherMessage: {
        justifyContent: 'flex-start',
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        marginRight: 8,
        alignSelf: 'flex-end',
    },
    bubble: {
        maxWidth: '75%',
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    ownBubble: {
        backgroundColor: '#0084FF',
    },
    otherBubble: {
        backgroundColor: '#E5E5EA',
    },
    sendingBubble: {
        opacity: 0.7,
    },
    errorBubble: {
        borderWidth: 1,
        borderColor: '#FF3B30',
    },
    text: {
        fontSize: 16,
        lineHeight: 20,
    },
    ownText: {
        color: '#FFF',
    },
    otherText: {
        color: '#000',
    },
    attachment: {
        width: 200,
        height: 150,
        borderRadius: 12,
        marginBottom: 4,
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    time: {
        fontSize: 11,
        opacity: 0.7,
    },
    ownTime: {
        color: '#FFF',
    },
    otherTime: {
        color: '#666',
    },
});

export default memo(MessageItem);