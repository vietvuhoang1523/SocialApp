// src/components/chat/ChatHeader.js
import React from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ImageService from '../../services/ImageService';

const ChatHeader = ({ navigation, user, isTyping }) => {
    return (
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
                        <Text style={styles.chatUserStatus}>
                            {isTyping ? 'Đang nhập...' : 'Hoạt động gần đây'}
                        </Text>
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
    );
};

const styles = StyleSheet.create({
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
});

export default ChatHeader;