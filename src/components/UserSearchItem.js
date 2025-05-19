import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

const UserSearchItem = ({ user, onSendRequest, onAcceptRequest, onCancelRequest }) => {
    // Xác định trạng thái friendship và hiển thị button tương ứng
    const renderFriendshipButton = () => {
        switch (user.friendshipStatus) {
            case 'ACCEPTED':
                return (
                    <View style={[styles.statusButton, styles.friendButton]}>
                        <Text style={styles.friendButtonText}>Bạn bè</Text>
                    </View>
                );

            case 'PENDING_SENT':
                return (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.pendingSentButton]}
                        onPress={() => onCancelRequest(user.id)}
                    >
                        <Text style={styles.pendingButtonText}>Đã gửi lời mời</Text>
                    </TouchableOpacity>
                );

            case 'PENDING_RECEIVED':
                return (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.pendingReceivedButton]}
                        onPress={() => onAcceptRequest(user.id)}
                    >
                        <Text style={styles.actionButtonText}>Chấp nhận</Text>
                    </TouchableOpacity>
                );

            case 'NOT_FRIEND':
                return (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.addButton]}
                        onPress={() => onSendRequest(user.id)}
                    >
                        <Text style={styles.actionButtonText}>Kết bạn</Text>
                    </TouchableOpacity>
                );

            case 'SELF':
                return null; // Không hiển thị nút nào cho chính mình

            default:
                return (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.addButton]}
                        onPress={() => onSendRequest(user.id)}
                    >
                        <Text style={styles.actionButtonText}>Kết bạn</Text>
                    </TouchableOpacity>
                );
        }
    };

    // Nếu là chính mình, không hiển thị
    if (user.friendshipStatus === 'SELF') {
        return null;
    }

    return (
        <View style={styles.container}>
            <Image
                source={user.profilePictureUrl ? { uri: user.profilePictureUrl } : require('../assets/default-avatar.png')}
                style={styles.avatar}
            />

            <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.fullName}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
            </View>

            {renderFriendshipButton()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 12,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E1E1E1',
    },
    userInfo: {
        flex: 1,
        marginLeft: 12,
    },
    userName: {
        fontSize: 16,
        fontWeight: '500',
    },
    userEmail: {
        fontSize: 14,
        color: '#757575',
        marginTop: 2,
    },
    actionButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButton: {
        backgroundColor: '#1877F2',
    },
    pendingSentButton: {
        backgroundColor: '#E8F1FB',
        borderWidth: 1,
        borderColor: '#1877F2',
    },
    pendingReceivedButton: {
        backgroundColor: '#1877F2',
    },
    friendButton: {
        backgroundColor: '#E8F1FB',
    },
    actionButtonText: {
        color: 'white',
        fontWeight: '500',
    },
    pendingButtonText: {
        color: '#1877F2',
        fontWeight: '500',
    },
    friendButtonText: {
        color: '#1877F2',
        fontWeight: '500',
    },
});

export default UserSearchItem;