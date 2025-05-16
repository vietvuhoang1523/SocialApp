import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    SafeAreaView,
    View,
    RefreshControl,
    StyleSheet,
    Animated,
    StatusBar,
    Platform,
    Alert,
    Text,
    TouchableOpacity,
    FlatList,
    Image,
    ActivityIndicator
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ProfileHeader from './ProfileHeader';
import ProfileInfo from './ProfileInfo';
import FriendsSection from './FriendsSection';
import ProfileTabs from './ProfileTabs';
import AuthService from '../../services/AuthService';
import createPostService from '../../services/CreatePostService';
import { ProfileProvider } from '../../components/ProfileContext';

const ProfileScreen = ({ navigation }) => {
    // States
    const [activeTab, setActiveTab] = useState('posts');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [posts, setPosts] = useState([]); // Quản lý posts
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    // Animated values
    const scrollY = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef(null);

    // Tính toán chiều cao của StatusBar
    const statusBarHeight = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight || 0;

    // Lấy bài viết từ API
    const fetchPosts = async (pageNumber = 0, shouldRefresh = false) => {
        if (shouldRefresh) {
            setPage(0);
            pageNumber = 0;
        }

        setLoading(true);
        try {
            // Sử dụng phương thức mới từ CreatePostService
            const {
                posts: newPosts,
                isLastPage,
                totalElements
            } = await createPostService.fetchUserPosts(pageNumber);

            console.log(`Tải thành công ${newPosts.length} bài đăng`);

            if (shouldRefresh || pageNumber === 0) {
                setPosts(newPosts);
            } else {
                setPosts(prevPosts => [...prevPosts, ...newPosts]);
            }

            setHasMore(!isLastPage);
            setPage(pageNumber);
        } catch (error) {
            console.error('Lỗi khi lấy bài đăng:', error);
            Alert.alert('Lỗi', 'Không thể tải bài viết');
        } finally {
            setLoading(false);
        }
    };

    // Fetch posts khi component mount hoặc tab thay đổi
    useEffect(() => {
        if (activeTab === 'posts') {
            fetchPosts();
        }
    }, [activeTab]);

    // Xử lý khi người dùng kéo xuống để tải thêm
    const handleLoadMore = () => {
        if (!loading && hasMore) {
            fetchPosts(page + 1);
        }
    };

    // Xử lý refresh
    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await fetchPosts(0, true);
    }, []);

    // Confirm dialog khi logout
    const confirmLogout = useCallback(() => {
        Alert.alert(
            'Đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất?',
            [
                {
                    text: 'Hủy',
                    style: 'cancel'
                },
                {
                    text: 'Đăng xuất',
                    onPress: handleLogout,
                    style: 'destructive'
                }
            ],
            { cancelable: true }
        );
    }, []);

    // Xử lý đăng xuất
    const handleLogout = useCallback(async () => {
        try {
            await AuthService.logout();
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }]
            });
        } catch (error) {
            console.error('Logout error:', error);
            Alert.alert(
                'Lỗi đăng xuất',
                'Không thể đăng xuất. Vui lòng thử lại sau.',
                [{ text: 'OK' }]
            );
        }
    }, [navigation]);

    // Navigate đến màn hình chỉnh sửa profile
    const handleEditProfile = useCallback(() => {
        navigation.navigate('EditProfileScreen', {
            onProfileUpdated: handleRefresh
        });
    }, [navigation, handleRefresh]);

    // Navigate đến màn hình tìm bạn bè
    const handleFindFriends = useCallback(() => {
        navigation.navigate('FindFriendsScreen');
    }, [navigation]);

    // Navigate đến màn hình danh sách bạn bè
    const handleViewAllFriends = useCallback(() => {
        navigation.navigate('FriendsListScreen');
    }, [navigation]);

    // View profile intro/bio đầy đủ
    const handleViewIntro = useCallback(() => {
        navigation.navigate('ProfileIntroScreen');
    }, [navigation]);

    // Render một bài đăng
    const renderPostItem = ({ item }) => (
        <View style={styles.postItem}>
            <View style={styles.postHeader}>
                <Image
                    source={{
                        uri: item.user?.avatarUrl || 'https://via.placeholder.com/50'
                    }}
                    style={styles.avatar}
                />
                <View style={styles.postHeaderInfo}>
                    <Text style={styles.username}>{item.user?.name || 'Người dùng'}</Text>
                    <Text style={styles.timestamp}>
                        {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    </Text>
                </View>
            </View>

            <Text style={styles.postContent}>{item.content}</Text>

            {item.imageUrl && (
                <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.postImage}
                    resizeMode="cover"
                />
            )}

            <View style={styles.postFooter}>
                <TouchableOpacity
                    style={styles.footerItem}
                    onPress={() => console.log('Like post', item.id)}
                >
                    <Ionicons name="heart-outline" size={24} color="#65676B" />
                    <Text style={styles.footerText}>{item.likeCount || 0}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.footerItem}
                    onPress={() => console.log('Comment post', item.id)}
                >
                    <Ionicons name="chatbubble-outline" size={22} color="#65676B" />
                    <Text style={styles.footerText}>{item.commentCount || 0}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.footerItem}
                    onPress={() => console.log('Share post', item.id)}
                >
                    <Ionicons name="share-outline" size={24} color="#65676B" />
                    <Text style={styles.footerText}>{item.shareCount || 0}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // Render nút "Tạo bài viết"
    const renderCreatePostButton = () => (
        <TouchableOpacity
            style={styles.createPostButton}
            onPress={() => navigation.navigate('CreatePostScreen')}
        >
            <Ionicons name="add-circle" size={24} color="#1877F2" />
            <Text style={styles.createPostText}>Tạo bài viết</Text>
        </TouchableOpacity>
    );

    // Render Header cho FlatList
    const renderListHeader = () => (
        <>
            <ProfileInfo
                onEditProfile={handleEditProfile}
                onViewIntro={handleViewIntro}
            />

            <FriendsSection
                onFindFriends={handleFindFriends}
                onViewAllFriends={handleViewAllFriends}
            />

            <ProfileTabs
                activeTab={activeTab}
                onTabChange={(tab) => {
                    setActiveTab(tab);
                }}
            />

            {activeTab === 'posts' && renderCreatePostButton()}
        </>
    );

    // Render nội dung theo tab
    const renderContent = () => {
        switch(activeTab) {
            case 'posts':
                return (
                    <FlatList
                        ref={flatListRef}
                        data={posts}
                        renderItem={renderPostItem}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.postsList}
                        ListHeaderComponent={renderListHeader}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefreshing}
                                onRefresh={handleRefresh}
                                colors={['#1877F2']}
                            />
                        }
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.5}
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                            { useNativeDriver: false }
                        )}
                        scrollEventThrottle={16}
                        ListFooterComponent={
                            loading && !isRefreshing ? (
                                <ActivityIndicator size="small" color="#1877F2" style={styles.loader} />
                            ) : null
                        }
                        ListEmptyComponent={
                            !loading ? (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>Không có bài viết nào</Text>
                                </View>
                            ) : null
                        }
                    />
                );
            case 'photos':
                return (
                    <FlatList
                        data={[]} // Không có dữ liệu ảnh
                        ListHeaderComponent={renderListHeader}
                        contentContainerStyle={styles.centeredContainer}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefreshing}
                                onRefresh={handleRefresh}
                                colors={['#1877F2']}
                            />
                        }
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                            { useNativeDriver: false }
                        )}
                        scrollEventThrottle={16}
                        ListEmptyComponent={
                            <View style={styles.centeredContent}>
                                <Text style={styles.emptyText}>Không có ảnh nào</Text>
                            </View>
                        }
                    />
                );
            default:
                return (
                    <FlatList
                        data={[]} // Không có dữ liệu
                        ListHeaderComponent={renderListHeader}
                        contentContainerStyle={styles.centeredContainer}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefreshing}
                                onRefresh={handleRefresh}
                                colors={['#1877F2']}
                            />
                        }
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                            { useNativeDriver: false }
                        )}
                        scrollEventThrottle={16}
                        ListEmptyComponent={
                            <View style={styles.centeredContent}>
                                <Text>Tính năng đang phát triển</Text>
                            </View>
                        }
                    />
                );
        }
    };

    // Wrap the main content with ProfileProvider
    return (
        <ProfileProvider>
            <SafeAreaView style={styles.container}>
                <StatusBar
                    backgroundColor="transparent"
                    barStyle="dark-content"
                    translucent
                />

                <ProfileHeader
                    navigation={navigation}
                    onMoreOptionsPress={confirmLogout}
                    scrollY={scrollY}
                />

                {renderContent()}
            </SafeAreaView>
        </ProfileProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F2F5',
    },
    // Styles cho posts
    postsList: {
        paddingBottom: 20,
    },
    postItem: {
        backgroundColor: 'white',
        borderRadius: 10,
        margin: 10,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        elevation: 2,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    postHeaderInfo: {
        flex: 1,
    },
    username: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    timestamp: {
        fontSize: 12,
        color: '#65676B',
    },
    postContent: {
        fontSize: 14,
        marginBottom: 10,
        lineHeight: 20,
    },
    postImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 10,
    },
    postFooter: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
        paddingTop: 10,
    },
    footerItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerText: {
        marginLeft: 5,
        color: '#65676B',
    },
    // Styles cho nút tạo bài viết
    createPostButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0F2F5',
        marginHorizontal: 15,
        marginBottom: 10,
        paddingVertical: 10,
        borderRadius: 8,
    },
    createPostText: {
        marginLeft: 10,
        color: '#1877F2',
        fontWeight: '600',
    },
    // Styles cho trạng thái trống và loading
    loader: {
        marginVertical: 20,
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        color: '#65676B',
        fontSize: 16,
    },
    centeredContainer: {
        flexGrow: 1,
    },
    centeredContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    }
});

export default ProfileScreen;