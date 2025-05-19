import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    Image,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Animated,
    Platform,
    KeyboardAvoidingView,
    RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FriendService from '../../services/FriendService';
import authService from "../../services/AuthService";
import UserProfileService from "../../services/UserProfileService";
import { EmptyContent } from '../../components/UIComponents';

const DEFAULT_PROFILE_IMAGE = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

const FriendSearchScreen = ({ navigation }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [searchHistory, setSearchHistory] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [showClearButton, setShowClearButton] = useState(false);
    const [recentSearches, setRecentSearches] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    const searchInputRef = useRef(null);
    const searchAnimation = useRef(new Animated.Value(0)).current;

    const userProfileService = new UserProfileService();
    const friendService = new FriendService();

    // Lấy thông tin người dùng hiện tại và các mục đề xuất khi component mount
    useEffect(() => {
        fetchUserData();
        fetchSuggestions();
        loadRecentSearches();
    }, []);

    // Lấy thông tin người dùng hiện tại
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

    // Lấy gợi ý kết bạn
    const fetchSuggestions = async () => {
        try {
            setLoadingSuggestions(true);
            // Đây sẽ là API call thực tế tới friend suggestion service
            // Hiện tại chỉ giả lập dữ liệu

            // giả lập delay mạng
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Dữ liệu mẫu - thay thế bằng API call thực tế
            const suggestedUsers = [
                {
                    id: '101',
                    fullName: 'Nguyễn Thị Hương',
                    email: 'huong.nguyen@example.com',
                    profilePictureUrl: 'https://randomuser.me/api/portraits/women/22.jpg',
                    mutualFriends: 5
                },
                {
                    id: '102',
                    fullName: 'Trần Văn Nam',
                    email: 'nam.tran@example.com',
                    profilePictureUrl: 'https://randomuser.me/api/portraits/men/33.jpg',
                    mutualFriends: 3
                },
                {
                    id: '103',
                    fullName: 'Lê Minh Anh',
                    email: 'anh.le@example.com',
                    profilePictureUrl: 'https://randomuser.me/api/portraits/women/41.jpg',
                    mutualFriends: 7
                }
            ];

            setSuggestions(suggestedUsers);
        } catch (error) {
            console.error('Lỗi khi lấy gợi ý kết bạn:', error);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    // Lấy lịch sử tìm kiếm từ local storage
    const loadRecentSearches = async () => {
        try {
            // Thay thế bằng AsyncStorage trong app thực tế
            // const savedSearches = await AsyncStorage.getItem('recentFriendSearches');
            // if (savedSearches) {
            //     setRecentSearches(JSON.parse(savedSearches));
            // }

            // Dữ liệu mẫu
            setRecentSearches([
                'Nguyễn Văn',
                'Trần Thị',
                'Lê Minh'
            ]);
        } catch (error) {
            console.error('Lỗi khi tải lịch sử tìm kiếm:', error);
        }
    };

    // Lưu tìm kiếm mới vào lịch sử
    const saveSearchToHistory = async (query) => {
        if (!query.trim()) return;

        try {
            const updatedHistory = [
                query,
                ...recentSearches.filter(item => item !== query)
            ].slice(0, 5); // Giữ 5 tìm kiếm gần nhất

            setRecentSearches(updatedHistory);

            // Lưu vào AsyncStorage trong app thực tế
            // await AsyncStorage.setItem('recentFriendSearches', JSON.stringify(updatedHistory));
        } catch (error) {
            console.error('Lỗi khi lưu lịch sử tìm kiếm:', error);
        }
    };

    // Xử lý animation khi tìm kiếm
    useEffect(() => {
        Animated.timing(searchAnimation, {
            toValue: searchQuery ? 1 : 0,
            duration: 200,
            useNativeDriver: false
        }).start();

        setShowClearButton(searchQuery.length > 0);
    }, [searchQuery, searchAnimation]);

    // Hàm tìm kiếm người dùng với debounce
    const searchUsers = useCallback(async (query) => {
        if (!query.trim()) {
            setUsers([]);
            setFilteredUsers([]);
            return;
        }

        try {
            setLoading(true);
            const results = await userProfileService.searchUsers(query);
            console.log('Kết quả tìm kiếm:', results);

            const userList = results?.content || [];
            setUsers(userList);
            setFilteredUsers(userList);

            // Lưu tìm kiếm vào lịch sử
            if (userList.length > 0) {
                saveSearchToHistory(query);
            }
        } catch (error) {
            console.error('Lỗi tìm kiếm:', error);
            Alert.alert('Lỗi', 'Không thể tìm kiếm người dùng');
            setUsers([]);
            setFilteredUsers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Thêm debounce cho tìm kiếm
    useEffect(() => {
        const debounceTimeout = setTimeout(() => {
            if (searchQuery) {
                searchUsers(searchQuery);
            } else {
                setUsers([]);
                setFilteredUsers([]);
            }
        }, 500); // Đợi 500ms trước khi tìm kiếm

        return () => clearTimeout(debounceTimeout);
    }, [searchQuery, searchUsers]);

    // Xóa tìm kiếm
    const clearSearch = () => {
        setSearchQuery('');
        setUsers([]);
        setFilteredUsers([]);
        searchInputRef.current?.focus();
    };

    // Sử dụng tìm kiếm từ lịch sử
    const useHistorySearch = (query) => {
        setSearchQuery(query);
        searchUsers(query);
    };

    // Refresh dữ liệu
    const handleRefresh = async () => {
        setRefreshing(true);
        await Promise.all([
            fetchSuggestions(),
            searchQuery ? searchUsers(searchQuery) : Promise.resolve()
        ]);
        setRefreshing(false);
    };

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
    // Thêm hàm xử lý chấp nhận lời mời kết bạn
    const acceptFriendRequest = async (friendshipId) => {
        try {
            setLoading(true);
            await friendService.acceptFriendRequest(friendshipId);

            Alert.alert('Thành công', 'Đã chấp nhận lời mời kết bạn');

            // Cập nhật trạng thái trong UI
            const updateUserStatus = (userList) => {
                return userList.map(user =>
                    user.id === friendshipId
                        ? {...user, friendshipStatus: 'ACCEPTED', isFriend: true}
                        : user
                );
            };

            setUsers(updateUserStatus(users));
            setFilteredUsers(updateUserStatus(filteredUsers));
            setSuggestions(updateUserStatus(suggestions));
        } catch (error) {
            console.error('Lỗi chấp nhận lời mời:', error);
            Alert.alert('Lỗi', 'Không thể chấp nhận lời mời kết bạn. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };
    // Thêm hàm xử lý hủy/từ chối lời mời kết bạn
    const cancelFriendRequest = async (friendshipId) => {
        try {
            setLoading(true);
            await friendService.cancelFriendRequest(friendshipId);

            Alert.alert('Thành công', 'Đã hủy lời mời kết bạn');

            // Cập nhật trạng thái trong UI
            const updateUserStatus = (userList) => {
                return userList.map(user =>
                    user.id === friendshipId
                        ? {...user, friendshipStatus: 'NOT_FRIEND', isFriend: false}
                        : user
                );
            };

            setUsers(updateUserStatus(users));
            setFilteredUsers(updateUserStatus(filteredUsers));
            setSuggestions(updateUserStatus(suggestions));
        } catch (error) {
            console.error('Lỗi hủy lời mời:', error);
            Alert.alert('Lỗi', 'Không thể hủy lời mời kết bạn. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    // Xem profile người dùng
    const viewUserProfile = (user) => {
        navigation.navigate('UserProfile', { userId: user.id });
    };

    // Cập nhật renderUserItem để xử lý các trạng thái friendship khác nhau
    const renderUserItem = ({ item }) => (
        <TouchableOpacity
            style={styles.userItem}
            onPress={() => viewUserProfile(item)}
            activeOpacity={0.7}
        >
            <Image
                source={{ uri: item.profilePictureUrl || DEFAULT_PROFILE_IMAGE }}
                style={styles.avatar}
            />
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.fullName}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>

                {item.mutualFriends > 0 && (
                    <View style={styles.mutualFriendsContainer}>
                        <Ionicons name="people" size={14} color="#65676B" />
                        <Text style={styles.mutualFriendsText}>
                            {item.mutualFriends} bạn chung
                        </Text>
                    </View>
                )}
            </View>

            {/* Nút kết bạn với nhiều trạng thái */}
            {item.friendshipStatus === 'PENDING_SENT' ? (
                <TouchableOpacity
                    style={styles.pendingButton}
                    onPress={() => cancelFriendRequest(item.id)}
                >
                    <Text style={styles.pendingText}>Đã gửi lời mời</Text>
                </TouchableOpacity>
            ) : item.friendshipStatus === 'PENDING_RECEIVED' ? (
                <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => acceptFriendRequest(item.id)}
                >
                    <Text style={styles.acceptButtonText}>Chấp nhận</Text>
                </TouchableOpacity>
            ) : item.friendshipStatus === 'ACCEPTED' ? (
                <View style={styles.acceptedButton}>
                    <Ionicons name="checkmark-circle" size={16} color="#1877F2" />
                    <Text style={styles.acceptedText}>Bạn bè</Text>
                </View>
            ) : item.friendshipStatus !== 'SELF' ? (
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => sendFriendRequest(item.email)}
                    disabled={loading}
                >
                    <Text style={styles.addButtonText}>Kết bạn</Text>
                </TouchableOpacity>
            ) : null}
        </TouchableOpacity>
    );

    // Render mục lịch sử tìm kiếm
    const renderHistoryItem = ({ item }) => (
        <TouchableOpacity
            style={styles.historyItem}
            onPress={() => useHistorySearch(item)}
        >
            <Ionicons name="time-outline" size={18} color="#65676B" />
            <Text style={styles.historyText}>{item}</Text>
        </TouchableOpacity>
    );

    // Render phần header của danh sách
    const renderListHeader = () => {
        // Nếu đã có kết quả tìm kiếm, không hiển thị header
        if (filteredUsers.length > 0 || loading) {
            return null;
        }

        return (
            <View style={styles.listHeaderContainer}>
                {/* Lịch sử tìm kiếm */}
                {recentSearches.length > 0 && !searchQuery && (
                    <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Tìm kiếm gần đây</Text>
                            <TouchableOpacity onPress={() => setRecentSearches([])}>
                                <Text style={styles.clearText}>Xóa</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={recentSearches}
                            renderItem={renderHistoryItem}
                            keyExtractor={(item) => item}
                            scrollEnabled={false}
                        />
                    </View>
                )}

                {/* Gợi ý kết bạn */}
                {!searchQuery && (
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Gợi ý kết bạn</Text>

                        {loadingSuggestions ? (
                            <ActivityIndicator size="small" color="#1877F2" style={styles.loadingIndicator} />
                        ) : suggestions.length > 0 ? (
                            suggestions.map(user => renderUserItem({ item: user }))
                        ) : (
                            <EmptyContent message="Không có gợi ý kết bạn nào" />
                        )}
                    </View>
                )}
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={22} color="#000" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Tìm kiếm bạn bè</Text>

                <View style={{ width: 40 }} /> {/* Placeholder để giữ cân bằng layout */}
            </View>

            {/* Thanh tìm kiếm */}
            <View style={styles.searchContainer}>
                <Icon name="magnify" size={20} color="#65676B" />
                <TextInput
                    ref={searchInputRef}
                    style={styles.searchInput}
                    placeholder="Tìm kiếm theo tên hoặc email"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    returnKeyType="search"
                    autoCapitalize="none"
                    onSubmitEditing={() => searchUsers(searchQuery)}
                />
                {showClearButton && (
                    <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                        <Ionicons name="close-circle" size={16} color="#65676B" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Indicator khi đang tìm kiếm */}
            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#1877F2" />
                    <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
                </View>
            )}

            {/* Danh sách kết quả */}
            <FlatList
                data={filteredUsers}
                renderItem={renderUserItem}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                contentContainerStyle={styles.listContentContainer}
                ListHeaderComponent={renderListHeader}
                ListEmptyComponent={
                    !loading && searchQuery ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="search" size={50} color="#E4E6EB" />
                            <Text style={styles.emptyText}>
                                Không tìm thấy người dùng nào khớp với "{searchQuery}"
                            </Text>
                        </View>
                    ) : null
                }
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#1877F2']}
                    />
                }
            />
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E4E6EB',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F2F5',
        borderRadius: 10,
        margin: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    searchInput: {
        flex: 1,
        height: 40,
        marginLeft: 10,
        fontSize: 16,
    },
    clearButton: {
        padding: 5,
    },
    listContentContainer: {
        paddingBottom: 20,
        flexGrow: 1,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        backgroundColor: '#F0F2F5',
    },
    loadingText: {
        marginLeft: 10,
        color: '#65676B',
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F2F5'
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 12
    },
    userInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    userName: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 2,
    },
    userEmail: {
        fontSize: 14,
        color: '#65676B',
        marginBottom: 2,
    },
    mutualFriendsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mutualFriendsText: {
        fontSize: 12,
        color: '#65676B',
        marginLeft: 4,
    },
    addButton: {
        backgroundColor: '#E7F3FF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#1877F2',
    },
    addButtonText: {
        color: '#1877F2',
        fontWeight: 'bold',
        fontSize: 14,
    },
    pendingButton: {
        backgroundColor: '#F0F2F5',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    pendingText: {
        color: '#65676B',
        fontWeight: '500',
        fontSize: 14,
    },
    acceptedButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E7F3FF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
    },
    acceptedText: {
        color: '#1877F2',
        fontWeight: '500',
        fontSize: 14,
        marginLeft: 4,
    },
    emptyContainer: {
        padding: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#65676B',
        textAlign: 'center',
        marginTop: 10,
    },
    sectionContainer: {
        marginTop: 15,
        marginBottom: 5,
        padding: 10,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#050505',
        marginBottom: 10,
    },
    clearText: {
        color: '#1877F2',
        fontSize: 14,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F2F5',
    },
    historyText: {
        fontSize: 15,
        color: '#050505',
        marginLeft: 10,
    },
    loadingIndicator: {
        marginVertical: 20,
    },
    listHeaderContainer: {
        marginBottom: 10,
    },

    acceptButton: {
        backgroundColor: '#1877F2',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    acceptButtonText: {
        color: 'white',
        fontWeight: '500',
        fontSize: 14,
    },
});

export default FriendSearchScreen;