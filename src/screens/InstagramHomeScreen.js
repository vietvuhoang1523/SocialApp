import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Dimensions,
    RefreshControl,
    ActivityIndicator,
    Alert,
    StatusBar,
    SafeAreaView,
    TextInput,
    ScrollView
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import PostItem from '../hook/PostItem';
import CreatePostService from '../services/CreatePostService';
import authService from '../services/AuthService';
import Config from '../../src/services/config';
import StoryItem from '../components/StoryItem';
import LoadingSpinner from '../components/LoadingSpinner';

const { width, height } = Dimensions.get('window');

// Keeping the legacy createImageUrl function for backward compatibility
const createImageUrl = (path) => {
    if (!path) return null;

    try {
        const cleanPath = path
            .replace(/^thanh\//, '') // Remove prefix thanh/ if present
            .replace(/^\//, ''); // Remove first slash if present

        const apiUrl = Config.extra.apiUrl;
        return `${apiUrl}/files/image?bucketName=thanh&path=${encodeURIComponent(cleanPath)}`;
    } catch (error) {
        console.error('Lỗi khi tạo URL:', error);
        return null;
    }
};

const InstagramHomeScreen = ({ navigation }) => {
    const [stories, setStories] = useState([]);
    const [posts, setPosts] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(0);
    const [isLastPage, setIsLastPage] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [showSearch, setShowSearch] = useState(false);

    const fetchCurrentUser = async () => {
        try {
            const userData = await authService.getUserData();
            setCurrentUser(userData);
            return userData;
        } catch (error) {
            console.error('Lỗi khi lấy thông tin người dùng:', error);
            return null;
        }
    };

    // Mock stories data - you can replace with real API call
    const generateMockStories = () => {
        const mockStories = [
            {
                id: 'add_story',
                username: 'Tạo story',
                imageUrl: currentUser?.profilePictureUrl || 'https://randomuser.me/api/portraits/men/1.jpg',
                isAddStory: true
            },
            ...Array.from({ length: 8 }, (_, i) => ({
                id: `story_${i}`,
                username: `User ${i + 1}`,
                imageUrl: `https://randomuser.me/api/portraits/${i % 2 === 0 ? 'men' : 'women'}/${i + 2}.jpg`,
                hasNewStory: Math.random() > 0.5
            }))
        ];
        setStories(mockStories);
    };

    const fetchPosts = async (pageNumber = 0, shouldRefresh = false) => {
        try {
            if (shouldRefresh) {
                setRefreshing(true);
                setPage(0);
                pageNumber = 0;
            } else if (pageNumber > 0) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }

            const response = await CreatePostService.getFeedPosts(pageNumber, 10);
            const newPosts = response?.content || [];

            if (shouldRefresh || pageNumber === 0) {
                setPosts(newPosts);
            } else {
                setPosts(prevPosts => [...prevPosts, ...newPosts]);
            }

            setIsLastPage(response?.last || newPosts.length < 10);
            setPage(pageNumber);
        } catch (error) {
            console.error('Lỗi khi tải bài đăng:', error);
            Alert.alert('Lỗi', 'Không thể tải bài đăng. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    };

    const onRefresh = useCallback(() => {
        fetchPosts(0, true);
        generateMockStories();
    }, []);

    const onEndReached = () => {
        if (!isLastPage && !loadingMore && !refreshing) {
            fetchPosts(page + 1);
        }
    };

    const handleLikePress = async (postId) => {
        try {
            await CreatePostService.toggleLike(postId);
            setPosts(prevPosts =>
                prevPosts.map(post => {
                    if (post.id === postId) {
                        const isCurrentlyLiked = post.isLike;
                        const newLikeCount = isCurrentlyLiked ? post.lengthLike - 1 : post.lengthLike + 1;
                        return {
                            ...post,
                            isLike: !isCurrentlyLiked,
                            lengthLike: newLikeCount
                        };
                    }
                    return post;
                })
            );
        } catch (error) {
            console.error('Lỗi khi thích/bỏ thích bài đăng:', error);
            Alert.alert('Lỗi', 'Không thể thích/bỏ thích bài đăng. Vui lòng thử lại sau.');
        }
    };

    const handleCommentPress = (postId) => {
        navigation.navigate('Comments', { postId });
    };

    const handleFabPress = () => {
        navigation.navigate('CreatePost');
    };

    useEffect(() => {
        const loadInitialData = async () => {
            await fetchCurrentUser();
            fetchPosts();
            generateMockStories();
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            onRefresh();
        });
        return unsubscribe;
    }, [navigation, onRefresh]);

    const renderPost = ({ item, index }) => {
        return (
            <View style={styles.postWrapper}>
            <PostItem
                item={item}
                onLikePress={handleLikePress}
                onCommentPress={handleCommentPress}
                    navigation={navigation}
                    currentUserId={currentUser?.id}
                />
            </View>
        );
    };

    const renderStoryItem = ({ item }) => (
        <StoryItem
            story={item}
            onPress={(story) => {
                console.log('Story pressed:', story);
                // Handle story press - navigate to story viewer
            }}
            createImageUrl={createImageUrl}
            currentUser={currentUser}
        />
    );

    if (loading && !refreshing && posts.length === 0) {
        return (
            <SafeAreaView style={[styles.container, styles.centerContent]}>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />
                <View style={styles.loadingContainer}>
                    <LoadingSpinner size={50} />
                    <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
            </SafeAreaView>
        );
    }

    const getAvatarUrl = () => {
        if (currentUser?.profilePictureUrl) {
            if (currentUser.profilePictureUrl.startsWith('http')) {
                return currentUser.profilePictureUrl;
            }
            return createImageUrl(currentUser.profilePictureUrl);
        }
        return 'https://randomuser.me/api/portraits/men/1.jpg';
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            
            {/* Simple Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => setShowSearch(!showSearch)}>
                        <Ionicons name="search" size={26} color="#333" />
                    </TouchableOpacity>
                    
                <Text style={styles.headerTitle}>Social Matching</Text>
                    
                    <View style={styles.headerActions}>
                        <TouchableOpacity 
                            style={styles.headerButton}
                            onPress={() => navigation.navigate('Messages')}
                        >
                            <Ionicons name="chatbubble-outline" size={26} color="#333" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {showSearch && (
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm bài viết, bạn bè..."
                        value={searchText}
                        onChangeText={setSearchText}
                        placeholderTextColor="#999"
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchText('')}>
                            <Ionicons name="close-circle" size={20} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>
            )}

            <FlatList
                data={posts}
                renderItem={renderPost}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh} 
                        colors={['#E91E63']}
                        tintColor="#E91E63"
                        title="Đang tải..."
                        titleColor="#E91E63"
                    />
                }
                onEndReached={onEndReached}
                onEndReachedThreshold={0.5}
                ListHeaderComponent={
                    <View>
                        <View style={styles.storiesSection}>
                            <Text style={styles.storiesTitle}>Stories</Text>
                            <FlatList
                                data={stories}
                                renderItem={renderStoryItem}
                                keyExtractor={(item) => item.id}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.storiesContainer}
                            />
                        </View>
                    </View>
                }
                ListFooterComponent={loadingMore ? (
                    <View style={styles.loadingMore}>
                        <ActivityIndicator size="small" color="#E91E63" />
                        <Text style={styles.loadingMoreText}>Đang tải thêm...</Text>
                    </View>
                ) : null}
                ListEmptyComponent={!loading && (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="newspaper-outline" size={60} color="#ddd" />
                        <Text style={styles.emptyTitle}>Chưa có bài viết nào</Text>
                        <Text style={styles.emptyText}>
                            Hãy theo dõi bạn bè để xem bài viết của họ
                        </Text>
                        <TouchableOpacity 
                            style={styles.exploreButton}
                            onPress={() => navigation.navigate('FriendSearch')}
                        >
                            <Text style={styles.exploreButtonText}>Khám phá bạn bè</Text>
                        </TouchableOpacity>
                    </View>
                )}
                contentContainerStyle={posts.length === 0 ? styles.emptyFlatList : null}
            />

            {/* Floating Action Button */}
            <TouchableOpacity style={styles.fab} onPress={handleFabPress}>
                <LinearGradient
                    colors={['#E91E63', '#F06292']}
                    style={styles.fabGradient}
                >
                    <Ionicons name="add" size={28} color="white" />
                </LinearGradient>
            </TouchableOpacity>

            {/* Bottom Navigation */}
            <View style={styles.bottomNavigation}>
                <TouchableOpacity 
                    style={styles.navItem}
                    onPress={() => navigation.navigate('Home')}
                >
                    <Ionicons name="home" size={26} color="#E91E63" />
                    <View style={styles.activeIndicator} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={styles.navItem}
                    onPress={() => navigation.navigate('FriendSearch')}
                >
                    <Ionicons name="search" size={26} color="#666" />
                </TouchableOpacity>
                
                <View style={styles.navItem}>
                    <View style={styles.navPlaceholder} />
                </View>
                
                <TouchableOpacity 
                    style={styles.navItem}
                    onPress={() => navigation.navigate('FriendRequests')}
                >
                    <Ionicons name="heart-outline" size={26} color="#666" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={styles.navItem}
                    onPress={() => navigation.navigate('Profile', { userId: currentUser?.id })}
                >
                    <View style={styles.profileContainer}>
                    <Image
                        source={{ uri: getAvatarUrl() }}
                        style={styles.profileThumb}
                    />
                    </View>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    header: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        paddingTop: 10,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        letterSpacing: 0.5,
    },
    headerButton: {
        padding: 4,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 25,
        marginHorizontal: 20,
        marginBottom: 12,
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    storiesSection: {
        backgroundColor: '#fff',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    storiesTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 20,
        marginBottom: 12,
    },
    storiesContainer: {
        paddingHorizontal: 15,
        paddingVertical: 5,
    },
    postWrapper: {
        marginBottom: 1,
        backgroundColor: '#fff',
    },
    loadingMore: {
        paddingVertical: 20,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    loadingMoreText: {
        marginLeft: 10,
        color: '#666',
        fontSize: 14,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 60,
    },
    emptyFlatList: {
        flexGrow: 1,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
        marginBottom: 10,
    },
    emptyText: {
        textAlign: 'center',
        color: '#666',
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 30,
    },
    exploreButton: {
        backgroundColor: '#E91E63',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
    },
    exploreButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        bottom: 90,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    fabGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomNavigation: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        backgroundColor: '#fff',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: 8,
    },
    navPlaceholder: {
        width: 26,
        height: 26,
    },
    activeIndicator: {
        position: 'absolute',
        bottom: -8,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#E91E63',
    },
    profileContainer: {
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#E91E63',
        padding: 2,
    },
    profileThumb: {
        width: 26,
        height: 26,
        borderRadius: 13,
    },
});

export default InstagramHomeScreen;
