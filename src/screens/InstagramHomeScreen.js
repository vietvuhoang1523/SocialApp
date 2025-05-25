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
    Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CreatePostService from '../services/CreatePostService';
import authService from '../services/AuthService';
import Config from '../../src/services/config';

const { width } = Dimensions.get('window');

// Hàm tạo URL hình ảnh (di chuyển ra ngoài component để có thể tái sử dụng)
// const createImageUrl = (path) => {
//     if (!path) return null;
//
//     try {
//         const cleanPath = path.replace(/^\//, '');
//         const apiUrl = Config.extra.apiUrl;
//         return `${apiUrl}/files/view?bucketName=thanh&path=${encodeURIComponent(cleanPath)}`;
//     } catch (error) {
//         console.error('Lỗi khi tạo URL hình ảnh:', error);
//         return null;
//     }
// };
const createImageUrl = (path) => {
    if (!path) return null;

    try {
        // Xử lý cả path avatar và post
        const cleanPath = path
            .replace(/^thanh\//, '') // Xóa prefix thanh/ nếu có
            .replace(/^\//, ''); // Xóa slash đầu tiên nếu có

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


    useEffect(() => {
        const loadInitialData = async () => {
            await fetchCurrentUser();
            fetchPosts();
            setStories([]);
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            onRefresh();
        });
        return unsubscribe;
    }, [navigation, onRefresh]);

    const renderPost = ({ item }) => {
        const imageUrl = item.fullImageUrl || (item.imageUrl ? createImageUrl(item.imageUrl) : null);
        return (
            <View style={styles.postContainer}>
                <View style={styles.postHeader}>
                    <TouchableOpacity
                        style={styles.postHeaderLeft}
                        onPress={() => navigation.navigate('Profile', { userId: item.userRes?.id })}
                    >
                        <Image
                            source={{
                                uri: currentUser?.profilePictureUrl
                                    ? createImageUrl(currentUser.profilePictureUrl)
                                    : 'https://randomuser.me/api/portraits/men/1.jpg'
                            }}
                            style={styles.profileThumb}
                        />
                        <Text style={styles.postUsername}>{item.userRes?.fullName || item.userRes?.username || 'User'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Icon name="dots-horizontal" size={24} color="black" />
                    </TouchableOpacity>
                </View>
                {imageUrl && (
                    <View style={styles.postImageContainer}>
                        <Image
                            source={{ uri: imageUrl }}
                            style={styles.postImage}
                            resizeMode="cover"
                            onError={(e) => console.error('Lỗi tải hình ảnh:', e.nativeEvent.error)}
                        />
                    </View>
                )}
                <View style={styles.postActions}>
                    <View style={styles.postActionsLeft}>
                        <TouchableOpacity style={styles.actionIcon} onPress={() => handleLikePress(item.id)}>
                            <Icon
                                name={item.isLike ? "heart" : "heart-outline"}
                                size={24}
                                color={item.isLike ? "red" : "black"}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionIcon} onPress={() => navigation.navigate('Comments', { postId: item.id })}>
                            <Icon name="comment-outline" size={24} color="black" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionIcon}>
                            <Icon name="send" size={24} color="black" />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity>
                        <Icon name="bookmark-outline" size={24} color="black" />
                    </TouchableOpacity>
                </View>
                <View style={styles.postDetailsContainer}>
                    <Text style={styles.postLikes}>{item.lengthLike || 0} likes</Text>
                    <Text style={styles.postCaption}>
                        <Text style={styles.postUsername}>{item.userRes?.fullName || item.userRes?.username || 'User'} </Text>
                        {item.content}
                    </Text>
                    {item.lengthCmt > 0 && (
                        <TouchableOpacity onPress={() => navigation.navigate('Comments', { postId: item.id })}>
                            <Text style={styles.postComments}>
                                View all {item.lengthCmt} comments
                            </Text>
                        </TouchableOpacity>
                    )}
                    <Text style={styles.postTime}>{formatTimeAgo(item.createdAt)}</Text>
                </View>
            </View>
        );
    };

    const formatTimeAgo = (dateString) => {
        if (!dateString) return '';
        const now = new Date();
        const date = new Date(dateString);
        const diffInSeconds = Math.floor((now - date) / 1000);
        if (diffInSeconds < 60) return 'vừa xong';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    };

    if (loading && !refreshing && posts.length === 0) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color="#0095F6" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity>
                    <Icon name="camera" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Social Matching</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Messages')}>
                    <Icon name="message-outline" size={24} color="black" />
                </TouchableOpacity>
            </View>
            <FlatList
                data={posts}
                renderItem={renderPost}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0095F6']} />}
                onEndReached={onEndReached}
                onEndReachedThreshold={0.5}
                ListFooterComponent={loadingMore ? (
                    <View style={styles.loadingMore}>
                        <ActivityIndicator size="small" color="#0095F6" />
                    </View>
                ) : null}
                ListEmptyComponent={!loading && (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            Chưa có bài viết nào. Hãy theo dõi bạn bè để xem bài viết của họ.
                        </Text>
                    </View>
                )}
            />
            <View style={styles.bottomNavigation}>
                <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                    <Icon name="home" size={24} color="black" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('FriendSearch')}>
                    <Icon name="magnify" size={24} color="black" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('CreatePost')}>
                    <Icon name="plus-box-outline" size={24} color="black" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('FriendRequests')}>
                    <Icon name="heart-outline" size={24} color="black" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Profile', { userId: currentUser?.id })}>
                    <Image
                        source={{ uri: currentUser?.profilePictureUrl || 'https://randomuser.me/api/portraits/men/1.jpg' }}
                        style={styles.profileThumb}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: '#DEDEDE',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    storiesContainer: {
        paddingHorizontal: 10,
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: '#DEDEDE',
    },
    storyContainer: {
        alignItems: 'center',
        marginRight: 15,
    },
    storyImageWrapper: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 2,
        borderColor: '#FF4500',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
    },
    storyImage: {
        width: 64,
        height: 64,
        borderRadius: 32,
    },
    addStoryIcon: {
        position: 'absolute',
        bottom: -3,
        right: -3,
        backgroundColor: '#0095F6',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    storyUsername: {
        fontSize: 12,
        maxWidth: 70,
        textAlign: 'center',
    },
    postContainer: {
        marginBottom: 20,
    },
    postHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    postHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    postUserImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    postUsername: {
        fontWeight: 'bold',
    },
    postImageContainer: {
        width: width,
        height: width,
        backgroundColor: '#f0f0f0',
    },
    postImage: {
        width: '100%',
        height: '100%',
    },
    postActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    postActionsLeft: {
        flexDirection: 'row',
    },
    actionIcon: {
        marginRight: 15,
    },
    postDetailsContainer: {
        paddingHorizontal: 15,
        paddingBottom: 10,
    },
    postLikes: {
        fontWeight: 'bold',
        marginBottom: 5,
    },
    postCaption: {
        marginBottom: 5,
    },
    postComments: {
        color: 'gray',
        marginBottom: 5,
    },
    postTime: {
        color: 'gray',
        fontSize: 12,
    },
    bottomNavigation: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderTopWidth: 0.5,
        borderTopColor: '#DEDEDE',
    },
    profileThumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    loadingMore: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        textAlign: 'center',
        color: '#8e8e8e',
        fontSize: 16,
    },
});

export default InstagramHomeScreen;
