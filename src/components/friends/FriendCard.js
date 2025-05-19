// components/friends/FriendCard.js
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { determineFriendData } from '../../utils/friendUtils';

const DEFAULT_PROFILE_IMAGE = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

const FriendCard = ({ friend, onPress, currentUserId }) => {
    console.log('Rendering FriendCard for friend:', friend?.id, 'currentUserId:', currentUserId);

    if (!friend) {
        console.log('Friend is null');
        return null;
    }

    // Nếu có currentUserId, sử dụng determineFriendData
    let friendData;
    if (currentUserId) {
        friendData = determineFriendData(friend, currentUserId);
    } else {
        // Nếu không có currentUserId, giả định người dùng hiện tại là receiver
        // Và hiển thị sender làm bạn bè
        friendData = friend.sender;
    }

    if (!friendData) {
        console.log('FriendData is null, fallback to receiver');
        friendData = friend.receiver; // Fallback
    }

    return (
        <TouchableOpacity
            style={styles.friendCardContainer}
            onPress={() => onPress(friend)}
        >
            <View style={styles.friendImageContainer}>
                <Image
                    source={{ uri: friendData.avatarUrl || DEFAULT_PROFILE_IMAGE }}
                    style={styles.friendImage}
                />
                {friendData.online && <View style={styles.onlineIndicator} />}
            </View>
            <Text style={styles.friendName} numberOfLines={2}>
                {friendData.fullName || "Người dùng"}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    friendCardContainer: {
        marginRight: 15,
        alignItems: 'center',
        width: 90,
    },
    friendImageContainer: {
        position: 'relative',
        marginBottom: 5,
    },
    friendImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#31A24C',
        borderWidth: 2,
        borderColor: 'white',
    },
    friendName: {
        fontSize: 13,
        textAlign: 'center',
        color: '#050505',
    },
});

export default FriendCard;