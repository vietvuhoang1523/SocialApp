import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ChatHeader = ({ navigation, user, isTyping }) => {
    const getAvatarSource = () => {
        if (user.profilePicture) {
            return { uri: user.profilePicture };
        }
        return { uri: 'https://randomuser.me/api/portraits/men/1.jpg' };
    };

    return (
        <View style={styles.container}>
            <View style={styles.leftSection}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                >
                    <Icon name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.userInfo}
                    onPress={() => navigation.navigate('Profile', { userId: user.id })}
                >
                    <Image source={getAvatarSource()} style={styles.avatar} />
                    <View>
                        <Text style={styles.username}>{user.username}</Text>
                        <Text style={styles.status}>
                            {isTyping ? 'Đang nhập...' : 'Hoạt động gần đây'}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>

            <View style={styles.rightSection}>
                {['phone-outline', 'video-outline', 'information-outline'].map((icon, index) => (
                    <TouchableOpacity key={index} style={styles.actionBtn}>
                        <Icon name={icon} size={24} color="#000" />
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    backBtn: {
        padding: 8,
        marginRight: 8,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 12,
    },
    username: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    status: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionBtn: {
        padding: 8,
        marginLeft: 8,
    },
});

export default ChatHeader;
