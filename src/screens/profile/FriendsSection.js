import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Dimensions,
    Modal,
    ActivityIndicator,
    FlatList,
    TextInput
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FriendService from '../../services/FriendService';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useProfileContext } from '../../components/ProfileContext';

const { width } = Dimensions.get('window');
const DEFAULT_PROFILE_IMAGE = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

// Khởi tạo service
const friendService = new FriendService();

// Component Card bạn bè
const FriendCard = ({ friend, onPress, currentUserId }) => {
    // Xác định thông tin người dùng là bạn bè
    const friendData = friend.sender && friend.sender.id === currentUserId ? friend.receiver : friend.sender;

    return (
        <TouchableOpacity
            style={styles.friendCardContainer}
            onPress={() => onPress(friend)}
        >
            <View style={styles.friendImageContainer}>
                <Image
                    source={{ uri: friendData && friendData.avatarUrl ? friendData.avatarUrl : DEFAULT_PROFILE_IMAGE }}
                    style={styles.friendImage}
                />
                {friendData && friendData.online && <View style={styles.onlineIndicator} />}
            </View>
            <Text style={styles.friendName} numberOfLines={2}>
                {friendData && friendData.fullName ? friendData.fullName : "Người dùng"}
            </Text>
        </TouchableOpacity>
    );
};

// Modal hiển thị chi tiết bạn bè
const FriendDetailModal = ({ friend, visible, onClose, currentUserId }) => {
    if (!friend) return null;

    // Lấy thông tin người dùng là bạn bè
    const friendData = friend.sender && friend.sender.id === currentUserId ? friend.receiver : friend.sender;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalBackground}>
                <View style={styles.modalContainer}>
                    <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
                        <Ionicons name="close" size={24} color="#000" />
                    </TouchableOpacity>

                    <Image
                        source={{ uri: friendData && friendData.avatarUrl ? friendData.avatarUrl : DEFAULT_PROFILE_IMAGE }}
                        style={styles.modalFriendImage}
                    />

                    <Text style={styles.modalFriendName}>
                        {friendData && friendData.fullName ? friendData.fullName : "Người dùng"}
                    </Text>
                    <Text style={styles.modalFriendEmail}>
                        {friendData && friendData.email ? friendData.email : ""}
                    </Text>

                    <View style={styles.modalActionButtons}>
                        <TouchableOpacity style={styles.modalActionButton}>
                            <Ionicons name="chatbubble" size={20} color="#1877F2" />
                            <Text style={styles.modalActionButtonText}>Nhắn tin</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalActionButton}>
                            <Ionicons name="person" size={20} color="#1877F2" />
                            <Text style={styles.modalActionButtonText}>Trang cá nhân</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// Component hiển thị không có kết quả trong FlatList
const EmptyListComponent = ({ searchQuery }) => (
    <View style={styles.emptySearchContainer}>
        <Text style={styles.emptySearchText}>
            {searchQuery && searchQuery.trim()
                ? "Không tìm thấy bạn bè khớp với tìm kiếm"
                : "Bạn chưa có bạn bè nào"}
        </Text>
    </View>
);

// Modal hiển thị tất cả bạn bè
const AllFriendsModal = ({ visible, friends, onClose, onFriendPress, currentUserId }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredFriends, setFilteredFriends] = useState([]);

    useEffect(() => {
        if (friends) {
            setFilteredFriends(friends);
        }
    }, [friends]);

    // Xử lý tìm kiếm
    const handleSearch = (text) => {
        setSearchQuery(text);
        if (!text || !text.trim()) {
            setFilteredFriends(friends || []);
        } else {
            const lowercasedQuery = text.toLowerCase();
            const filtered = (friends || []).filter(friend => {
                if (!friend || (!friend.sender && !friend.receiver)) return false;

                const friendData = friend.sender && friend.sender.id === currentUserId ? friend.receiver : friend.sender;
                if (!friendData) return false;

                const friendName = friendData.fullName ? friendData.fullName.toLowerCase() : '';
                const friendEmail = friendData.email ? friendData.email.toLowerCase() : '';

                return friendName.includes(lowercasedQuery) || friendEmail.includes(lowercasedQuery);
            });
            setFilteredFriends(filtered);
        }
    };

    // Render từng item bạn bè
    const renderFriendItem = ({ item }) => {
        if (!item || (!item.sender && !item.receiver)) return null;

        const friendData = item.sender && item.sender.id === currentUserId ? item.receiver : item.sender;
        if (!friendData) return null;

        return (
            <TouchableOpacity
                style={styles.allFriendItem}
                onPress={() => onFriendPress(item)}
            >
                <Image
                    source={{ uri: friendData.avatarUrl || DEFAULT_PROFILE_IMAGE }}
                    style={styles.allFriendImage}
                />
                <View style={styles.allFriendInfo}>
                    <Text style={styles.allFriendName}>
                        {friendData.fullName || "Người dùng"}
                    </Text>
                    <Text style={styles.allFriendEmail}>
                        {friendData.email || ""}
                    </Text>
                </View>
                <TouchableOpacity style={styles.messageButton}>
                    <Ionicons name="chatbubble-outline" size={22} color="#1877F2" />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.allFriendsContainer}>
                {/* Header */}
                <View style={styles.allFriendsHeader}>
                    <TouchableOpacity onPress={onClose} style={styles.allFriendsBackButton}>
                        <Ionicons name="arrow-back" size={24} color="#1877F2" />
                    </TouchableOpacity>
                    <Text style={styles.allFriendsTitle}>Tất cả bạn bè</Text>
                    <View style={{width: 24}} /> {/* Để giữ cân bằng layout */}
                </View>

                {/* Thanh tìm kiếm */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm bạn bè..."
                        value={searchQuery}
                        onChangeText={handleSearch}
                        clearButtonMode="while-editing"
                    />
                </View>

                {/* Số lượng bạn bè */}
                <View style={styles.friendCountContainer}>
                    <Text style={styles.friendCountText}>
                        {filteredFriends ? filteredFriends.length : 0} bạn bè
                    </Text>
                </View>

                {/* Danh sách bạn bè */}
                <FlatList
                    data={filteredFriends}
                    renderItem={renderFriendItem}
                    keyExtractor={(item) => (item && item.id ? item.id.toString() : Math.random().toString())}
                    contentContainerStyle={styles.allFriendsList}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={() => <EmptyListComponent searchQuery={searchQuery} />}
                />
            </View>
        </Modal>
    );
};

// Component chính
const FriendsSection = ({
                            onFindFriends,
                            onViewAllFriends
                        }) => {
    // Sử dụng ProfileContext để lấy userId
    const { userProfile } = useProfileContext();

    const [currentUserId, setCurrentUserId] = useState(null);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isAllFriendsModalVisible, setIsAllFriendsModalVisible] = useState(false);
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Tải danh sách bạn bè khi component được render
    useEffect(() => {
        // Nếu có userProfile từ context, sử dụng id từ đó
        if (userProfile && userProfile.id) {
            setCurrentUserId(userProfile.id);
        } else {
            // Backup plan: đọc từ AsyncStorage nếu không có userProfile từ context
            const getUserId = async () => {
                try {
                    const userProfileString = await AsyncStorage.getItem('userProfile');
                    if (userProfileString) {
                        const profile = JSON.parse(userProfileString);
                        setCurrentUserId(profile.id);
                    }
                } catch (error) {
                    console.error('Lỗi khi lấy userId:', error);
                }
            };
            getUserId();
        }
    }, [userProfile]);

    useEffect(() => {
        loadFriends();
    }, []);

    // Hàm tải danh sách bạn bè
    const loadFriends = async () => {
        try {
            setLoading(true);
            const data = await friendService.getFriends();
            console.log('Dữ liệu bạn bè từ API:', data);
            setFriends(data || []);
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
    const friendCount = friends ? friends.length : 0;

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
    // Styles cho Modal chi tiết bạn bè
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    modalCloseButton: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    modalFriendImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 15,
    },
    modalFriendName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    modalFriendEmail: {
        fontSize: 14,
        color: '#65676B',
        marginBottom: 15,
    },
    modalActionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    modalActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0F2F5',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 6,
        flex: 1,
        marginHorizontal: 5,
    },
    modalActionButtonText: {
        marginLeft: 5,
        color: '#1877F2',
        fontWeight: '600',
    },
    // Styles cho All Friends Modal
    allFriendsContainer: {
        flex: 1,
        backgroundColor: 'white',
    },
    allFriendsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E4E6EB',
    },
    allFriendsBackButton: {
        padding: 5,
    },
    allFriendsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#050505',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F2F5',
        borderRadius: 20,
        marginHorizontal: 15,
        marginVertical: 10,
        paddingHorizontal: 15,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: 40,
        color: '#1C1E21',
    },
    friendCountContainer: {
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    friendCountText: {
        fontSize: 16,
        color: '#65676B',
    },
    allFriendsList: {
        paddingHorizontal: 15,
        paddingBottom: 20,
    },
    allFriendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#E4E6EB',
    },
    allFriendImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    allFriendInfo: {
        marginLeft: 15,
        flex: 1,
    },
    allFriendName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1C1E21',
        marginBottom: 2,
    },
    allFriendEmail: {
        fontSize: 14,
        color: '#65676B',
    },
    messageButton: {
        padding: 10,
    },
    emptySearchContainer: {
        paddingVertical: 30,
        alignItems: 'center',
    },
    emptySearchText: {
        color: '#65676B',
        fontSize: 16,
    },
});

export default FriendsSection;