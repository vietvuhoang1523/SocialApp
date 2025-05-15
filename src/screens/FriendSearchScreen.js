import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    Image,
    StyleSheet,
    Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FriendService from '../services/FriendService';
import authService from "../services/AuthService";
import UserProfileService from "../services/UserProfileService";

const FriendSearchScreen = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const userProfileService = new UserProfileService();
    const friendService = new FriendService();

    // Lấy thông tin người dùng hiện tại
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userData = await authService.getUserData();
                if (userData) {
                    setCurrentUser(userData);
                }
            } catch (error) {
                console.error('Lỗi khi lấy thông tin người dùng:', error);
            }
        };

        fetchUserData();
    }, []);

    // Hàm tìm kiếm người dùng
    const searchUsers = useCallback(async (query) => {
        if (!query.trim()) {
            setUsers([]);
            return;
        }

        try {
            setLoading(true);
            const results = await userProfileService.searchUsers(query);
            console.log('Kết quả tìm kiếm:', results);
            setUsers(results?.content || []);
        } catch (error) {
            console.error('Lỗi tìm kiếm:', error);
            Alert.alert('Lỗi', 'Không thể tìm kiếm người dùng');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Gửi lời mời kết bạn
    const sendFriendRequest = async (receiverEmail) => {
        try {
            if (!receiverEmail) {
                Alert.alert('Lỗi', 'Email không hợp lệ');
                return;
            }

            setLoading(true);
            await friendService.sendFriendRequestByEmail(receiverEmail);

            Alert.alert('Thành công', 'Đã gửi lời mời kết bạn');

            // Cập nhật trạng thái trong UI
            setUsers(prev =>
                prev.map(user =>
                    user.email === receiverEmail
                        ? {...user, friendshipStatus: 'PENDING'}
                        : user
                )
            );
        } catch (error) {
            console.error('Lỗi gửi lời mời:', error);
            Alert.alert('Lỗi', 'Không thể gửi lời mời kết bạn. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    // Render từng người dùng
    const renderUserItem = ({ item }) => (
        <View style={styles.userItem}>
            <Image
                source={{ uri: item.profilePictureUrl || 'https://via.placeholder.com/50' }}
                style={styles.avatar}
            />
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.fullName}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
            </View>

            {/* Nút kết bạn */}
            {item.friendshipStatus === 'PENDING' ? (
                <Text style={styles.pendingText}>Đã gửi lời mời</Text>
            ) : item.friendshipStatus === 'ACCEPTED' ? (
                <Text style={styles.acceptedText}>Đã là bạn bè</Text>
            ) : (
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => sendFriendRequest(item.email)}
                    disabled={loading}
                >
                    <Text style={styles.addButtonText}>Kết bạn</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Thanh tìm kiếm */}
            <View style={styles.searchContainer}>
                <Icon name="magnify" size={20} color="gray" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm kiếm bạn bè theo tên"
                    value={searchQuery}
                    onChangeText={(text) => {
                        setSearchQuery(text);
                        searchUsers(text);
                    }}
                />
            </View>

            {/* Danh sách kết quả */}
            <FlatList
                data={users}
                renderItem={renderUserItem}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>
                        {loading ? 'Đang tìm kiếm...' : searchQuery ? 'Không có kết quả' : 'Nhập tên để tìm kiếm'}
                    </Text>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white'
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        margin: 10,
        paddingHorizontal: 10
    },
    searchInput: {
        flex: 1,
        height: 40,
        marginLeft: 10
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10
    },
    userInfo: {
        flex: 1
    },
    userName: {
        fontWeight: 'bold'
    },
    userEmail: {
        color: 'gray'
    },
    addButton: {
        backgroundColor: '#4CAF50',
        padding: 8,
        borderRadius: 5
    },
    addButtonText: {
        color: 'white',
        fontWeight: 'bold'
    },
    pendingText: {
        color: 'gray'
    },
    acceptedText: {
        color: 'blue'
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        color: 'gray'
    }
});

export default FriendSearchScreen;
