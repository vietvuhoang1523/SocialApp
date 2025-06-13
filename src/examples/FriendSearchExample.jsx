import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import FriendService from '../services/FriendService';
import UserProfileService from '../services/UserProfileService';

const FriendSearchExample = () => {
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const friendService = new FriendService();
    const userProfileService = new UserProfileService();

    // Demo function: Tìm kiếm người dùng
    const searchUsers = async (query) => {
        setLoading(true);
        try {
            const results = await userProfileService.searchUsers(query, 0, 20);
            setSearchResults(results.content || []);
            console.log('Search results:', results);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Demo function: Gửi lời mời kết bạn
    const sendFriendRequest = async (userId) => {
        try {
            await friendService.sendFriendRequestById(userId);
            console.log('Friend request sent successfully');
            
            // Cập nhật trạng thái trong kết quả tìm kiếm
            setSearchResults(prev => prev.map(user => 
                user.id === userId 
                    ? { ...user, friendshipStatus: 'PENDING_SENT' }
                    : user
            ));
        } catch (error) {
            console.error('Error sending friend request:', error);
        }
    };

    // Demo function: Chấp nhận lời mời kết bạn
    const acceptFriendRequest = async (friendshipId) => {
        try {
            await friendService.acceptFriendRequest(friendshipId);
            console.log('Friend request accepted successfully');
            
            // Cập nhật trạng thái trong kết quả tìm kiếm
            setSearchResults(prev => prev.map(user => 
                user.friendshipId === friendshipId 
                    ? { ...user, friendshipStatus: 'ACCEPTED', isFriend: true }
                    : user
            ));
        } catch (error) {
            console.error('Error accepting friend request:', error);
        }
    };

    // Demo function: Hủy lời mời đã gửi
    const cancelFriendRequest = async (friendshipId) => {
        try {
            await friendService.cancelFriendRequest(friendshipId);
            console.log('Friend request cancelled successfully');
            
            // Cập nhật trạng thái trong kết quả tìm kiếm
            setSearchResults(prev => prev.map(user => 
                user.friendshipId === friendshipId 
                    ? { ...user, friendshipStatus: 'NOT_FRIEND' }
                    : user
            ));
        } catch (error) {
            console.error('Error cancelling friend request:', error);
        }
    };

    // Render action button dựa trên trạng thái
    const renderActionButton = (user) => {
        switch (user.friendshipStatus) {
            case 'ACCEPTED':
                return (
                    <View style={styles.friendButton}>
                        <Text style={styles.friendText}>Bạn bè</Text>
                    </View>
                );

            case 'PENDING_SENT':
                return (
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => cancelFriendRequest(user.friendshipId)}
                    >
                        <Text style={styles.cancelText}>Hủy lời mời</Text>
                    </TouchableOpacity>
                );

            case 'PENDING_RECEIVED':
                return (
                    <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={() => acceptFriendRequest(user.friendshipId)}
                    >
                        <Text style={styles.acceptText}>Chấp nhận</Text>
                    </TouchableOpacity>
                );

            case 'BLOCKED':
                return (
                    <View style={styles.blockedButton}>
                        <Text style={styles.blockedText}>Đã chặn</Text>
                    </View>
                );

            case 'SELF':
                return null;

            case 'NOT_FRIEND':
            default:
                return (
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => sendFriendRequest(user.id)}
                    >
                        <Text style={styles.addText}>Kết bạn</Text>
                    </TouchableOpacity>
                );
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Friend Search Demo</Text>
            
            {/* Demo buttons */}
            <View style={styles.demoButtons}>
                <TouchableOpacity 
                    style={styles.demoButton}
                    onPress={() => searchUsers('nguyen')}
                >
                    <Text style={styles.demoButtonText}>Tìm "nguyen"</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={styles.demoButton}
                    onPress={() => searchUsers('tran')}
                >
                    <Text style={styles.demoButtonText}>Tìm "tran"</Text>
                </TouchableOpacity>
            </View>

            {/* Search results */}
            {loading && <Text style={styles.loadingText}>Đang tìm kiếm...</Text>}
            
            {searchResults.map(user => (
                <View key={user.id} style={styles.userCard}>
                    <Image 
                        source={{ uri: user.profilePictureUrl || 'https://via.placeholder.com/50' }} 
                        style={styles.avatar}
                    />
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user.fullName}</Text>
                        <Text style={styles.userEmail}>{user.email}</Text>
                        <Text style={styles.statusText}>
                            Trạng thái: {user.friendshipStatus || 'NOT_FRIEND'}
                        </Text>
                    </View>
                    {renderActionButton(user)}
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    demoButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    demoButton: {
        backgroundColor: '#007BFF',
        padding: 10,
        borderRadius: 5,
    },
    demoButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    loadingText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 15,
        marginBottom: 10,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    statusText: {
        fontSize: 12,
        color: '#999',
    },
    addButton: {
        backgroundColor: '#28a745',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 5,
    },
    addText: {
        color: 'white',
        fontWeight: 'bold',
    },
    friendButton: {
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#28a745',
    },
    friendText: {
        color: '#28a745',
        fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: '#6c757d',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 5,
    },
    cancelText: {
        color: 'white',
        fontWeight: 'bold',
    },
    acceptButton: {
        backgroundColor: '#007bff',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 5,
    },
    acceptText: {
        color: 'white',
        fontWeight: 'bold',
    },
    blockedButton: {
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#dc3545',
    },
    blockedText: {
        color: '#dc3545',
        fontWeight: 'bold',
    },
});

export default FriendSearchExample; 