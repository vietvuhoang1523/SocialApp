import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Alert
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import createPostService from '../../services/CreatePostService';
import FastImage from 'react-native-fast-image';
import { createImageUrl } from '../../services/SimpleImageService';

const ProfileContent = ({ activeTab, onRefresh, isRefreshing }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [imageLoadErrors, setImageLoadErrors] = useState({});

    // Lấy bài viết từ API
    const fetchPosts = async (pageNumber = 0, shouldRefresh = false) => {
        if (shouldRefresh) {
            setPage(0);
            pageNumber = 0;
            setImageLoadErrors({});
        }

        setLoading(true);
        try {
            const response = await createPostService.api.get('/posts/me', {
                params: {
                    page: pageNumber,
                    limit: 10,
                    order: 'desc'
                }
            });

            const newPosts = response.data.content || [];
            console.log('Fetched posts:', newPosts.length);

            if (shouldRefresh || pageNumber === 0) {
                setPosts(newPosts);
            } else {
                setPosts(prevPosts => [...prevPosts, ...newPosts]);
            }

            setHasMore(!response.data.last);
            setPage(pageNumber);
        } catch (error) {
            console.log('Lỗi khi lấy bài đăng:', error);
            Alert.alert('Lỗi', 'Không thể tải bài viết');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [activeTab]);

    // Xử lý khi người dùng kéo xuống để tải thêm
    const handleLoadMore = () => {
        if (!loading && hasMore) {
            fetchPosts(page + 1);
        }
    };

    // Xử lý refresh
    const handleRefresh = () => {
        fetchPosts(0, true);
        onRefresh && onRefresh();
    };

    const renderCreatePostButton = () => (
        <TouchableOpacity style={styles.createPostButton}>
            <Ionicons name="add-circle" size={24} color="#1877F2" />
            <Text style={styles.createPostText}>Tạo bài viết</Text>
        </TouchableOpacity>
    );

    const renderPostItem = ({ item }) => {
        const [imageLoading, setImageLoading] = useState(true);
        const hasImageError = imageLoadErrors[item.id] || false;

        // Lấy fullName từ userRes
        const fullName = item.userRes && item.userRes.fullName ? item.userRes.fullName : 'Người dùng';

        // Lấy avatarUrl từ userRes
        const avatarUrl = item.userRes && item.userRes.avatarUrl ? createImageUrl(item.userRes.avatarUrl) : null;

        // Lấy postImageUrl từ item.imageUrl
        const postImageUrl = item.imageUrl ? createImageUrl(item.imageUrl) : null;

        return (
            <View style={styles.postItem}>
                <View style={styles.postHeader}>
                    {avatarUrl ? (
                        <FastImage
                            source={{ uri: avatarUrl }}
                            style={styles.avatar}
                        />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]} />
                    )}
                    <View style={styles.postHeaderInfo}>
                        <Text style={styles.username}>{fullName}</Text>
                        <Text style={styles.timestamp}>
                            {item.createdAt
                                ? new Date(item.createdAt).toLocaleDateString('vi-VN')
                                : 'Ngày không xác định'}
                        </Text>
                    </View>
                </View>

                <Text style={styles.postContent}>{item.content || 'Không có nội dung'}</Text>

                {/* Hiển thị hình ảnh bài đăng với FastImage */}
                {postImageUrl && !hasImageError && (
                    <View style={styles.imageContainer}>
                        {imageLoading && (
                            <ActivityIndicator
                                size="large"
                                color="#1877F2"
                                style={styles.imageLoader}
                            />
                        )}
                        <FastImage
                            source={{
                                uri: postImageUrl,
                                headers: { 'Cache-Control': 'no-cache' },
                                priority: FastImage.priority.high,
                                cache: FastImage.cacheControl.immutable
                            }}
                            style={styles.postImage}
                            resizeMode={FastImage.resizeMode.cover}
                            onLoadStart={() => setImageLoading(true)}
                            onLoad={() => setImageLoading(false)}
                            onError={() => {
                                setImageLoading(false);
                                setImageLoadErrors(prev => ({
                                    ...prev,
                                    [item.id]: true
                                }));
                            }}
                        />
                    </View>
                )}

                {/* Hiển thị thông báo khi hình ảnh lỗi */}
                {postImageUrl && hasImageError && (
                    <View style={styles.imageErrorContainer}>
                        <Ionicons name="image-outline" size={30} color="#999" />
                        <Text style={styles.imageErrorText}>Không thể tải hình ảnh</Text>
                    </View>
                )}

                {/* Footer */}
                <View style={styles.postFooter}>
                    <TouchableOpacity style={styles.footerItem}>
                        <Ionicons name={item.isLike ? "heart" : "heart-outline"} size={22} color={item.isLike ? "#E53935" : "#65676B"} />
                        <Text style={styles.footerText}>{item.lengthLike > 0 ? item.lengthLike : ''} Thích</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.footerItem}>
                        <Ionicons name="chatbubble-outline" size={20} color="#65676B" />
                        <Text style={styles.footerText}>{item.lengthCmt > 0 ? item.lengthCmt : ''} Bình luận</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderContent = () => {
        switch(activeTab) {
            case 'posts':
                return (
                    <FlatList
                        data={posts}
                        renderItem={renderPostItem}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.postsList}
                        ListHeaderComponent={renderCreatePostButton}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefreshing}
                                onRefresh={handleRefresh}
                                colors={['#1877F2']}
                            />
                        }
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.5}
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
                        data={[]}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefreshing}
                                onRefresh={handleRefresh}
                                colors={['#1877F2']}
                            />
                        }
                        contentContainerStyle={styles.centeredContainer}
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
                        data={[]}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefreshing}
                                onRefresh={handleRefresh}
                                colors={['#1877F2']}
                            />
                        }
                        contentContainerStyle={styles.centeredContainer}
                        ListEmptyComponent={
                            <View style={styles.centeredContent}>
                                <Text>Tính năng đang phát triển</Text>
                            </View>
                        }
                    />
                );
        }
    };

    return renderContent();
};

const styles = StyleSheet.create({
    postsList: {
        padding: 10,
    },
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
    postItem: {
        backgroundColor: 'white',
        borderRadius: 10,
        marginBottom: 10,
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
    avatarPlaceholder: {
        backgroundColor: '#f0f0f0',
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
    imageContainer: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 10,
        backgroundColor: '#f0f0f0',
        overflow: 'hidden',
        position: 'relative',
    },
    imageLoader: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -15,
        marginTop: -15,
        zIndex: 10,
    },
    postImage: {
        width: '100%',
        height: '100%',
    },
    imageErrorContainer: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        marginBottom: 10,
        backgroundColor: '#f9f9f9',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderStyle: 'dashed',
    },
    imageErrorText: {
        color: '#999',
        marginTop: 8,
        fontSize: 14,
    },
    postFooter: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
        paddingTop: 10,
        marginTop: 5,
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    centeredContent: {
        padding: 20,
        alignItems: 'center',
    }
});

export default ProfileContent;