import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Image
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FriendService from '../../services/FriendService';
import AsyncStorage from "@react-native-async-storage/async-storage";
import FriendCard from './FriendCard';
import FriendDetailModal from './FriendDetailModal';
import AllFriendsModal from './AllFriendsModal';

// Khởi tạo service
const friendService = new FriendService();

const FriendsSection = ({
                            onFindFriends,
                            onViewAllFriends,
                            userProfile = null
                        }) => {
    const [currentUserId, setCurrentUserId] = useState(null);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isAllFriendsModalVisible, setIsAllFriendsModalVisible] = useState(false);
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Lấy ID người dùng hiện tại
    useEffect(() => {
        const getUserId = async () => {
            try {
                if (userProfile && userProfile.id) {
                    console.log('Setting currentUserId from userProfile:', userProfile.id);
                    setCurrentUserId(userProfile.id);
                } else {
                    const userProfileString = await AsyncStorage.getItem('userProfile');
                    console.log('userProfile from AsyncStorage:', userProfileString);
                    if (userProfileString) {
                        const profile = JSON.parse(userProfileString);
                        console.log('Setting currentUserId from AsyncStorage:', profile.id);
                        setCurrentUserId(profile.id);
                    } else {
                        console.warn('Không tìm thấy userProfile trong AsyncStorage');
                        // Thiết lập một ID người dùng mặc định
                        console.log('Thiết lập currentUserId mặc định: 2'); // Giả sử ID của người dùng hiện tại là 2
                        setCurrentUserId(2); // Giả sử người dùng hiện tại có ID là 2 (từ dữ liệu JSON bạn cung cấp trước đó)
                    }
                }
            } catch (error) {
                console.error('Lỗi khi lấy userId:', error);
                setCurrentUserId(2); // ID mặc định nếu có lỗi
            }
        };
        getUserId();
    }, [userProfile]);

    // Tải danh sách bạn bè mỗi khi currentUserId thay đổi
    useEffect(() => {
        if (currentUserId) {
            loadFriends();
        }
    }, [currentUserId]);

    // Hàm tải danh sách bạn bè
    const loadFriends = async () => {
        try {
            setLoading(true);
            const data = await friendService.getFriends();
            console.log('Dữ liệu bạn bè từ API:', JSON.stringify(data, null, 2));

            // Kiểm tra xem data có phải là mảng không
            if (Array.isArray(data)) {
                console.log('Dữ liệu là mảng với', data.length, 'phần tử');
                // Lọc ra các bản ghi hợp lệ
                const validFriends = data.filter(item => item && item.sender && item.receiver);
                console.log('Số lượng bạn bè hợp lệ:', validFriends.length);
                if (validFriends.length > 0) {
                    // Log một vài mẫu để kiểm tra cấu trúc
                    console.log('Mẫu bạn bè:', JSON.stringify(validFriends[0], null, 2));
                }
                setFriends(validFriends);
            } else {
                // Nếu không phải mảng, kiểm tra các cấu trúc phổ biến
                if (data && data.content && Array.isArray(data.content)) {
                    console.log('Dữ liệu nằm trong data.content');
                    setFriends(data.content);
                } else if (data && data.data && Array.isArray(data.data)) {
                    console.log('Dữ liệu nằm trong data.data');
                    setFriends(data.data);
                } else if (data && typeof data === 'object') {
                    // Chuyển đổi object thành array nếu cần
                    const friendsArray = Object.values(data);
                    console.log('Chuyển đổi object thành array:', friendsArray.length);
                    setFriends(friendsArray);
                } else {
                    console.warn('Định dạng dữ liệu không xác định:', typeof data);
                    setFriends([]);
                }
            }
            setError(null);
        } catch (err) {
            console.error('Lỗi khi tải danh sách bạn bè:', err);
            setError('Không thể tải danh sách bạn bè. Vui lòng thử lại sau.');
            setFriends([]);
        } finally {
            setLoading(false);
        }
    };

    // Xử lý khi nhấn vào một người bạn
    const handleFriendPress = (friend) => {
        setSelectedFriend(friend);
        setIsModalVisible(true);
    };

    // Đóng modal chi tiết bạn bè
    const handleCloseModal = () => {
        setIsModalVisible(false);
        setSelectedFriend(null);
    };

    // Mở modal xem tất cả bạn bè
    const handleViewAllFriends = () => {
        if (onViewAllFriends) {
            onViewAllFriends();
        } else {
            setIsAllFriendsModalVisible(true);
        }
    };

    // Đóng modal xem tất cả bạn bè
    const handleCloseAllFriendsModal = () => {
        setIsAllFriendsModalVisible(false);
    };

    // Đếm số bạn bè
    const friendCount = Array.isArray(friends) ? friends.length : 0;

    return (
        <View style={styles.container}>
            {/* Phần Header */}
            <View style={styles.headerContainer}>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.titleText}>Bạn bè</Text>
                    <Text style={styles.subtitleText}>
                        {friendCount} bạn bè
                    </Text>
                </View>

                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={styles.findFriendsButton}
                        onPress={onFindFriends}
                    >
                        <Ionicons name="person-add" size={20} color="#1877F2" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.searchFriendsButton}
                        onPress={() => setIsAllFriendsModalVisible(true)}
                    >
                        <Ionicons name="search" size={20} color="#1877F2" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Hiển thị trạng thái tải */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1877F2" />
                    <Text style={styles.loadingText}>Đang tải danh sách bạn bè...</Text>
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={loadFriends}
                    >
                        <Text style={styles.retryButtonText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            ) : friends.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Bạn chưa có bạn bè nào</Text>
                    <TouchableOpacity
                        style={styles.findFriendsButtonLarge}
                        onPress={onFindFriends}
                    >
                        <Text style={styles.findFriendsButtonText}>Tìm bạn bè</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    {/* Danh sách bạn bè */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.friendsScrollContainer}
                    >
                        {friends.map((friend, index) => (
                            <FriendCard
                                key={friend.id || index}
                                friend={friend}
                                onPress={handleFriendPress}
                                currentUserId={currentUserId}
                            />
                        ))}
                    </ScrollView>

                    {/* Nút Xem tất cả bạn bè */}
                    <TouchableOpacity
                        style={styles.viewAllButton}
                        onPress={handleViewAllFriends}
                    >
                        <Text style={styles.viewAllButtonText}>
                            Xem tất cả bạn bè
                        </Text>
                    </TouchableOpacity>
                </>
            )}

            {/* Modal chi tiết bạn bè */}
            <FriendDetailModal
                friend={selectedFriend}
                visible={isModalVisible}
                onClose={handleCloseModal}
                currentUserId={currentUserId}
            />

            {/* Modal xem tất cả bạn bè */}
            <AllFriendsModal
                visible={isAllFriendsModalVisible}
                friends={friends}
                onClose={handleCloseAllFriendsModal}
                onFriendPress={handleFriendPress}
                currentUserId={currentUserId}
            />
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        paddingVertical: 15,
        marginBottom: 10,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        marginBottom: 15,
    },
    headerTitleContainer: {
        flexDirection: 'column',
    },
    titleText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#050505',
    },
    subtitleText: {
        fontSize: 14,
        color: '#65676B',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    findFriendsButton: {
        marginRight: 15,
        padding: 5,
    },
    searchFriendsButton: {
        padding: 5,
    },
    friendsScrollContainer: {
        paddingHorizontal: 15,
    },
    viewAllButton: {
        marginTop: 15,
        marginHorizontal: 15,
        backgroundColor: '#F0F2F5',
        paddingVertical: 10,
        borderRadius: 6,
        alignItems: 'center',
    },
    viewAllButtonText: {
        color: '#1877F2',
        fontWeight: '600',
    },
    // Styles cho loading
    loadingContainer: {
        paddingVertical: 30,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#65676B',
    },
    // Styles cho lỗi
    errorContainer: {
        paddingVertical: 30,
        alignItems: 'center',
    },
    errorText: {
        color: 'red',
        marginBottom: 10,
    },
    retryButton: {
        backgroundColor: '#1877F2',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 5,
    },
    retryButtonText: {
        color: 'white',
        fontWeight: '600',
    },
    // Styles cho trường hợp không có bạn bè
    emptyContainer: {
        paddingVertical: 30,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#65676B',
        marginBottom: 15,
    },
    findFriendsButtonLarge: {
        backgroundColor: '#1877F2',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 5,
    },
    findFriendsButtonText: {
        color: 'white',
        fontWeight: '600',
    },
});

export default FriendsSection;