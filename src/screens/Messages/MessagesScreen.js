// Updated MessagesScreen.js để tích hợp danh sách bạn bè
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
    StatusBar,
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    SectionList
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import chatService from '../../services/chatService';
import FriendService from '../../services/FriendService';
import ImageService from '../../services/ImageService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { determineFriendData } from '../../utils/friendUtils';

const DEFAULT_PROFILE_IMAGE = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

const MessagesScreen = ({ navigation }) => {
    const [messages, setMessages] = useState([]);
    const [friends, setFriends] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [loading, setLoading] = useState(true);
    const [friendsLoading, setFriendsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [activeTab, setActiveTab] = useState('messages'); // 'messages' hoặc 'friends'

    // Khởi tạo services
    const friendService = new FriendService();

    // Lấy thông tin người dùng hiện tại khi màn hình được mount
    useEffect(() => {
        loadCurrentUser();
    }, []);

    // Lấy danh sách tin nhắn và bạn bè khi có thông tin người dùng
    useEffect(() => {
        if (currentUser?.id) {
            fetchMessages();
            loadFriends();
        }
    }, [currentUser]);

    // Thực hiện tìm kiếm khi searchQuery thay đổi
    useEffect(() => {
        if (searchQuery.trim()) {
            handleSearch();
            setIsSearching(true);
        } else {
            setIsSearching(false);
            setSearchResults([]);
        }
    }, [searchQuery]);

    // Đăng ký sự kiện focus để làm mới danh sách khi quay lại màn hình
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            if (currentUser?.id) {
                fetchMessages();
                if (activeTab === 'friends') {
                    loadFriends();
                }
            }
        });

        return unsubscribe;
    }, [navigation, currentUser, activeTab]);

    // Lấy thông tin người dùng hiện tại từ AsyncStorage
    const loadCurrentUser = async () => {
        try {
            const userData = await AsyncStorage.getItem('userData');
            const userProfileString = await AsyncStorage.getItem('userProfile');

            if (userData) {
                const parsedUser = JSON.parse(userData);
                console.log('Thông tin người dùng hiện tại:', parsedUser);
                setCurrentUser(parsedUser);
                setCurrentUserId(parsedUser.id);
            } else if (userProfileString) {
                const profile = JSON.parse(userProfileString);
                console.log('Thông tin người dùng từ userProfile:', profile);
                setCurrentUser(profile);
                setCurrentUserId(profile.id);
            } else {
                console.log('Không có thông tin người dùng trong AsyncStorage');
                Alert.alert('Lỗi', 'Không thể lấy thông tin người dùng. Vui lòng đăng nhập lại.');
                // Xử lý khi không có thông tin người dùng
                setCurrentUserId(2); // ID mặc định để test
            }
        } catch (error) {
            console.error('Lỗi khi lấy thông tin người dùng từ AsyncStorage:', error);
            Alert.alert('Lỗi', 'Không thể lấy thông tin người dùng. Vui lòng thử lại sau.');
        }
    };

    // Lấy danh sách tin nhắn
    const fetchMessages = async () => {
        try {
            setLoading(true);
            console.log('Đang lấy danh sách tin nhắn...');

            // Sử dụng ChatService để lấy danh sách cuộc trò chuyện
            const conversations = await chatService.getConversations();
            console.log('Danh sách cuộc trò chuyện:', conversations);

            setMessages(conversations);
        } catch (error) {
            console.error('Lỗi khi lấy danh sách tin nhắn:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách tin nhắn. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Tải danh sách bạn bè
    const loadFriends = async () => {
        if (!currentUserId) return;

        try {
            setFriendsLoading(true);
            const data = await friendService.getFriends();
            console.log('Dữ liệu bạn bè từ API:', JSON.stringify(data).substring(0, 200) + '...');

            // Kiểm tra xem data có phải là mảng không
            if (Array.isArray(data)) {
                console.log('Dữ liệu là mảng với', data.length, 'phần tử');
                // Lọc ra các bản ghi hợp lệ
                const validFriends = data.filter(item => item && item.sender && item.receiver);
                console.log('Số lượng bạn bè hợp lệ:', validFriends.length);
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
        } catch (err) {
            console.error('Lỗi khi tải danh sách bạn bè:', err);
            Alert.alert('Lỗi', 'Không thể tải danh sách bạn bè. Vui lòng thử lại sau.');
            setFriends([]);
        } finally {
            setFriendsLoading(false);
        }
    };

    // Xử lý làm mới danh sách khi người dùng kéo xuống
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        if (activeTab === 'messages') {
            fetchMessages();
        } else {
            loadFriends();
        }
    }, [currentUser, activeTab]);

    // Xử lý tìm kiếm người dùng
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        try {
            setLoading(true);
            console.log('Đang tìm kiếm:', searchQuery);

            if (activeTab === 'messages') {
                // Tìm kiếm người dùng để nhắn tin
                const response = await chatService.searchUsers(searchQuery);

                // Chuyển đổi kết quả tìm kiếm thành định dạng phù hợp cho UI
                const formattedResults = (response.content || []).map(user => ({
                    id: user.id.toString(),
                    user: {
                        id: user.id.toString(),
                        username: user.username || user.displayName || `User ${user.id}`,
                        profilePicture: user.profilePicture
                    },
                    lastMessage: 'Nhấn để bắt đầu cuộc trò chuyện',
                    time: '',
                    unread: false
                }));

                setSearchResults(formattedResults);
            } else {
                // Tìm kiếm trong danh sách bạn bè
                const lowercasedQuery = searchQuery.toLowerCase();
                const results = friends.filter(friend => {
                    if (!friend) return false;

                    const friendData = determineFriendData(friend, currentUserId);
                    if (!friendData) return false;

                    const friendName = friendData.fullName ? friendData.fullName.toLowerCase() : '';
                    const friendEmail = friendData.email ? friendData.email.toLowerCase() : '';

                    return friendName.includes(lowercasedQuery) || friendEmail.includes(lowercasedQuery);
                });

                setSearchResults(results);
            }
        } catch (error) {
            console.error('Lỗi khi tìm kiếm:', error);
            Alert.alert('Lỗi', 'Không thể tìm kiếm. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    // Định dạng thời gian thành chuỗi "x phút/giờ/ngày trước"
    const formatTimeAgo = (timeStr) => {
        // Nếu đã được định dạng sẵn, trả về luôn
        if (typeof timeStr === 'string' && (timeStr.endsWith('p') || timeStr.endsWith('h') || timeStr.endsWith('d'))) {
            return timeStr;
        }

        const now = new Date();
        const time = new Date(timeStr);
        const diffInSeconds = Math.floor((now - time) / 1000);

        if (diffInSeconds < 60) return 'Vừa xong';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}p`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;

        // Nếu quá 7 ngày, hiển thị ngày tháng
        return time.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });
    };

    // Xử lý khi người dùng nhấn vào một cuộc trò chuyện
    const handleChatPress = (item) => {
        navigation.navigate('Chat', {
            user: item.user,
            currentUser: currentUser
        });
    };

    // Xử lý khi người dùng nhấn vào một người bạn để bắt đầu trò chuyện
    const handleFriendChatPress = (friend) => {
        if (!friend) return;

        const friendData = determineFriendData(friend, currentUserId);
        if (!friendData) return;

        // Tạo đối tượng user để truyền vào ChatScreen
        const friendForChat = {
            id: friendData.id,
            username: friendData.fullName || "Người dùng",
            profilePicture: friendData.avatarUrl,
            email: friendData.email
        };

        // Chuyển đến màn hình ChatScreen
        navigation.navigate('Chat', {
            user: friendForChat,
            currentUser: currentUser
        });
    };

    // Render item cho danh sách tin nhắn
    const renderMessageItem = ({ item }) => (
        <TouchableOpacity
            style={styles.messageItem}
            onPress={() => handleChatPress(item)}
        >
            <Image
                source={
                    item.user.profilePicture
                        ? ImageService.getProfileImageSource(item.user.profilePicture)
                        : { uri: DEFAULT_PROFILE_IMAGE }
                }
                style={styles.userAvatar}
            />
            {item.unread && <View style={styles.unreadIndicator} />}
            <View style={styles.messageContent}>
                <View style={styles.messageHeader}>
                    <Text style={styles.username}>{item.user.username}</Text>
                    <Text style={styles.messageTime}>{typeof item.time === 'string' ? item.time : formatTimeAgo(item.time)}</Text>
                </View>
                <Text
                    style={[styles.lastMessage, item.unread && styles.unreadMessage]}
                    numberOfLines={1}
                >
                    {item.lastMessage}
                </Text>
            </View>
            <TouchableOpacity style={styles.cameraButton}>
                <Icon name="camera-outline" size={22} color="#0095F6" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    // Render item cho danh sách bạn bè
    const renderFriendItem = ({ item }) => {
        if (!item) return null;

        const friendData = determineFriendData(item, currentUserId);
        if (!friendData) return null;

        return (
            <TouchableOpacity
                style={styles.friendItem}
                onPress={() => handleFriendChatPress(item)}
            >
                <Image
                    source={{ uri: friendData.avatarUrl || DEFAULT_PROFILE_IMAGE }}
                    style={styles.userAvatar}
                />
                <View style={styles.messageContent}>
                    <View style={styles.messageHeader}>
                        <Text style={styles.username}>{friendData.fullName || "Người dùng"}</Text>
                    </View>
                    <Text
                        style={styles.friendEmail}
                        numberOfLines={1}
                    >
                        {friendData.email || ""}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.chatIconButton}
                    onPress={() => handleFriendChatPress(item)}
                >
                    <Ionicons name="chatbubble-outline" size={22} color="#1877F2" />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    // Component hiển thị khi không có dữ liệu
    const EmptyListComponent = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
                {isSearching
                    ? activeTab === 'messages'
                        ? 'Không tìm thấy người dùng nào phù hợp'
                        : 'Không tìm thấy bạn bè nào phù hợp'
                    : activeTab === 'messages'
                        ? 'Chưa có cuộc trò chuyện nào'
                        : 'Bạn chưa có bạn bè nào'
                }
            </Text>
            {!isSearching && activeTab === 'messages' && (
                <TouchableOpacity
                    style={styles.startChatButton}
                    onPress={() => setSearchQuery('a')} // Khởi tạo tìm kiếm với 'a' để hiển thị tất cả người dùng
                >
                    <Text style={styles.startChatButtonText}>Bắt đầu cuộc trò chuyện mới</Text>
                </TouchableOpacity>
            )}
            {!isSearching && activeTab === 'friends' && (
                <TouchableOpacity
                    style={styles.startChatButton}
                    onPress={() => navigation.navigate('FindFriends')} // Điều hướng đến màn hình tìm bạn bè
                >
                    <Text style={styles.startChatButtonText}>Tìm bạn bè</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderContent = () => {
        // Hiển thị loading
        if ((activeTab === 'messages' && loading && !refreshing) ||
            (activeTab === 'friends' && friendsLoading && !refreshing)) {
            return (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#0095F6" />
                </View>
            );
        }

        // Chọn dữ liệu để hiển thị dựa trên tab và trạng thái tìm kiếm
        let data = [];
        if (activeTab === 'messages') {
            data = isSearching ? searchResults : messages;
        } else {
            data = isSearching ? searchResults : friends;
        }

        // Rendering cho mỗi tab
        return (
            <FlatList
                data={data}
                renderItem={activeTab === 'messages' ? renderMessageItem : renderFriendItem}
                keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.listContainer,
                    data.length === 0 ? styles.emptyListContainer : {}
                ]}
                ListEmptyComponent={EmptyListComponent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#0095F6']}
                    />
                }
            />
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="black" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>
                        {currentUser?.username || 'Tin nhắn'}
                    </Text>
                    <Icon name="chevron-down" size={20} color="black" />
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.headerButton}>
                        <Icon name="video-outline" size={24} color="black" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerButton}>
                        <Icon name="pencil-outline" size={24} color="black" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tab Buttons */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[
                        styles.tabButton,
                        activeTab === 'messages' && styles.activeTabButton
                    ]}
                    onPress={() => setActiveTab('messages')}
                >
                    <Text style={[
                        styles.tabText,
                        activeTab === 'messages' && styles.activeTabText
                    ]}>
                        Tin nhắn
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.tabButton,
                        activeTab === 'friends' && styles.activeTabButton
                    ]}
                    onPress={() => setActiveTab('friends')}
                >
                    <Text style={[
                        styles.tabText,
                        activeTab === 'friends' && styles.activeTabText
                    ]}>
                        Bạn bè
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Icon name="magnify" size={20} color="#8E8E8E" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={activeTab === 'messages' ? "Tìm kiếm tin nhắn" : "Tìm kiếm bạn bè"}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Icon name="close-circle" size={18} color="#8E8E8E" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Content: Messages/Friends List */}
            {renderContent()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#DEDEDE',
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 5,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerButton: {
        marginLeft: 15,
    },
    // Tab styles
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#DEDEDE',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    activeTabButton: {
        borderBottomWidth: 2,
        borderBottomColor: '#1877F2',
    },
    tabText: {
        fontSize: 14,
        color: '#65676B',
    },
    activeTabText: {
        color: '#1877F2',
        fontWeight: '600',
    },
    searchContainer: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: '#DEDEDE',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 10,
        paddingHorizontal: 10,
        height: 36,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
    },
    listContainer: {
        paddingVertical: 5,
    },
    emptyListContainer: {
        flexGrow: 1,
    },
    // Message item
    messageItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
    },
    userAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        marginRight: 12,
    },
    unreadIndicator: {
        position: 'absolute',
        left: 55,
        top: 45,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#0095F6',
        borderWidth: 2,
        borderColor: 'white',
    },
    messageContent: {
        flex: 1,
    },
    messageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    username: {
        fontSize: 14,
        fontWeight: '500',
    },
    messageTime: {
        fontSize: 12,
        color: '#8E8E8E',
    },
    lastMessage: {
        fontSize: 14,
        color: '#8E8E8E',
    },
    unreadMessage: {
        color: 'black',
        fontWeight: '500',
    },
    // Friend item
    friendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#DEDEDE',
    },
    friendEmail: {
        fontSize: 14,
        color: '#65676B',
    },
    chatIconButton: {
        padding: 8,
    },
    cameraButton: {
        marginLeft: 10,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 50,
    },
    emptyText: {
        fontSize: 14,
        color: '#8E8E8E',
        textAlign: 'center',
        marginBottom: 20,
    },
    startChatButton: {
        backgroundColor: '#0095F6',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 5,
    },
    startChatButtonText: {
        color: 'white',
        fontWeight: '500',
    },
});

export default MessagesScreen;