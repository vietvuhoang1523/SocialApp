// MessagesScreen.js - Màn hình danh sách tin nhắn
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
    RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import messagesService from '../../services/messagesService';
import chatService from '../../services/chatService';
import ImageService from '../../services/ImageService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MessagesScreen = ({ navigation }) => {
    const [messages, setMessages] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // Lấy thông tin người dùng hiện tại khi màn hình được mount
    useEffect(() => {
        loadCurrentUser();
    }, []);

    // Lấy danh sách tin nhắn khi có thông tin người dùng
    useEffect(() => {
        if (currentUser?.id) {
            fetchMessages();
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
            }
        });

        return unsubscribe;
    }, [navigation, currentUser]);

    // Lấy thông tin người dùng hiện tại từ AsyncStorage
    const loadCurrentUser = async () => {
        try {
            const userData = await AsyncStorage.getItem('userData');
            if (userData) {
                const parsedUser = JSON.parse(userData);
                console.log('Thông tin người dùng hiện tại:', parsedUser);
                setCurrentUser(parsedUser);
            } else {
                console.log('Không có thông tin người dùng trong AsyncStorage');
                Alert.alert('Lỗi', 'Không thể lấy thông tin người dùng. Vui lòng đăng nhập lại.');
                // Xử lý khi không có thông tin người dùng
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

    // Xử lý làm mới danh sách khi người dùng kéo xuống
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchMessages();
    }, [currentUser]);

    // Xử lý tìm kiếm người dùng
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        try {
            setLoading(true);
            console.log('Đang tìm kiếm người dùng:', searchQuery);

            // Sử dụng ChatService để tìm kiếm người dùng
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
        } catch (error) {
            console.error('Lỗi khi tìm kiếm người dùng:', error);
            Alert.alert('Lỗi', 'Không thể tìm kiếm người dùng. Vui lòng thử lại sau.');
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

    // Render item cho FlatList
    const renderMessageItem = ({ item }) => (
        <TouchableOpacity
            style={styles.messageItem}
            onPress={() => handleChatPress(item)}
        >
            <Image
                source={
                    item.user.profilePicture
                        ? ImageService.getProfileImageSource(item.user.profilePicture)
                        : { uri: 'https://randomuser.me/api/portraits/men/1.jpg' }
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

    // Component hiển thị khi không có tin nhắn
    const EmptyListComponent = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
                {isSearching
                    ? 'Không tìm thấy người dùng nào phù hợp'
                    : 'Chưa có cuộc trò chuyện nào'
                }
            </Text>
            {!isSearching && (
                <TouchableOpacity
                    style={styles.startChatButton}
                    onPress={() => setSearchQuery('a')} // Khởi tạo tìm kiếm với 'a' để hiển thị tất cả người dùng
                >
                    <Text style={styles.startChatButtonText}>Bắt đầu cuộc trò chuyện mới</Text>
                </TouchableOpacity>
            )}
        </View>
    );

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

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Icon name="magnify" size={20} color="#8E8E8E" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm"
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

            {/* Loading Indicator */}
            {loading && !refreshing && (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#0095F6" />
                </View>
            )}

            {/* Messages or Search Results List */}
            {!loading && (
                <FlatList
                    data={isSearching ? searchResults : messages}
                    renderItem={renderMessageItem}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[
                        styles.listContainer,
                        (!isSearching && messages.length === 0) || (isSearching && searchResults.length === 0)
                            ? styles.emptyListContainer
                            : {}
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
            )}
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