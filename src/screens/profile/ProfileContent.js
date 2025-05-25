import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    StyleSheet,
    Text,
    Animated,
    ScrollView
} from 'react-native';
import PostItem from '../../hook/PostItem';
import { CreatePostButton, EmptyContent } from '../../components/UIComponents';
import usePosts from '../../hook/usePosts';
import { useProfileContext } from '../../components/ProfileContext';
import authService from '../../services/AuthService';

// Import các thành phần UI khác
import ProfileInfo from './ProfileInfo';
import FriendsSection from '../../components/friends/FriendsSection';
import ProfileTabs from './ProfileTabs';

const ProfileContent = ({
                            activeTab,
                            onTabChange,
                            onRefresh,
                            isRefreshing,
                            navigation,
                            scrollY,
                            onEditProfile,
                            onViewIntro,
                            onFindFriends,
                            onViewAllFriends
                        }) => {
    // State để lưu userId hiện tại
    const [currentUserId, setCurrentUserId] = useState(null);

    // Sử dụng ProfileContext để có data đồng bộ
    const { refreshProfile } = useProfileContext();

    // Sử dụng custom hook để quản lý posts
    const {
        posts,
        loading,
        hasMore,
        handleLoadMore,
        handleRefresh,
        handleImageError,
        removePost,
        updatePost
    } = usePosts();

    // Tham chiếu tới FlatList để kiểm soát scroll
    const flatListRef = useRef(null);

    // Lấy userId hiện tại khi component mount
    // useEffect(() => {
    //     const getCurrentUser = async () => {
    //         try {
    //             const userData = await authService.getCurrentUser();
    //             if (userData && userData.id) {
    //                 setCurrentUserId(userData.id);
    //             }
    //         } catch (error) {
    //             console.error('Lỗi khi lấy thông tin người dùng hiện tại:', error);
    //         }
    //     };
    //
    //     getCurrentUser();
    // }, []);

    // Gọi API khi component mount hoặc activeTab thay đổi
    useEffect(() => {
        if (activeTab === 'posts') {
            handleRefresh();
        }
    }, [activeTab, handleRefresh]);

    // Xử lý khi người dùng refresh
    const handleUserRefresh = async () => {
        await handleRefresh();

        // Refresh profile data từ context
        await refreshProfile();

        // Gọi callback onRefresh từ props nếu có
        onRefresh && onRefresh();
    };

    // Xử lý thích bài viết
    const handleLikePost = (postId) => {
        console.log('Like post:', postId);
        // Thêm logic thích bài viết tại đây
    };

    // Xử lý bình luận bài viết
    const handleCommentPost = (postId) => {
        console.log('Comment post:', postId);
        // Thêm logic bình luận tại đây hoặc điều hướng đến màn hình bình luận
        // navigation.navigate('CommentScreen', { postId });
    };

    // Xử lý chia sẻ bài viết
    const handleSharePost = (postId) => {
        console.log('Share post:', postId);
        // Thêm logic chia sẻ tại đây
    };

    // Xử lý xóa bài viết
    const handleDeleteSuccess = (postId) => {
        console.log('Đã xóa bài viết:', postId);
        // Cập nhật danh sách bài viết sau khi xóa
        removePost(postId);
    };

    // Xử lý sửa bài viết thành công
    const handleEditSuccess = (postId) => {
        console.log('Đã cập nhật bài viết:', postId);
        // Refresh danh sách bài viết để lấy dữ liệu mới nhất
        handleRefresh();
    };

    // Render nút tạo bài viết
    const renderCreatePostButton = () => (
        <CreatePostButton
            onPress={() => navigation && navigation.navigate('CreatePost')}
        />
    );

    // Render một bài viết
    const renderPostItem = ({ item }) => (
        <PostItem
            item={item}
            onLikePress={handleLikePost}
            onCommentPress={handleCommentPost}
            onSharePress={handleSharePost}
            navigation={navigation}
            currentUserId={currentUserId}
            onDeleteSuccess={handleDeleteSuccess}
            onEditSuccess={handleEditSuccess}
        />
    );

    // Render header cho FlatList - đây là các thành phần nằm cố định ở đầu trang
    const renderListHeader = () => (
        <>
            <ProfileInfo
                onEditProfile={onEditProfile}
                onViewIntro={onViewIntro}
            />

            <FriendsSection
                onFindFriends={onFindFriends}
                onViewAllFriends={onViewAllFriends}
            />

            <ProfileTabs
                activeTab={activeTab}
                onTabChange={onTabChange}
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
                                onRefresh={handleUserRefresh}
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
                                <EmptyContent message="Không có bài viết nào" />
                            ) : null
                        }
                    />
                );
            case 'photos':
                return (
                    <FlatList
                        ref={flatListRef}
                        data={[]} // Không có dữ liệu ảnh
                        ListHeaderComponent={renderListHeader}
                        contentContainerStyle={styles.centeredContainer}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefreshing}
                                onRefresh={handleUserRefresh}
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
                                <EmptyContent message="Không có ảnh nào" />
                            </View>
                        }
                    />
                );
            default:
                return (
                    <FlatList
                        ref={flatListRef}
                        data={[]} // Không có dữ liệu
                        ListHeaderComponent={renderListHeader}
                        contentContainerStyle={styles.centeredContainer}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefreshing}
                                onRefresh={handleUserRefresh}
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

    return renderContent();
};

const styles = StyleSheet.create({
    postsList: {
        paddingBottom: 20,
    },
    loader: {
        marginVertical: 20,
    },
    centeredContainer: {
        paddingBottom: 20,
    },
    centeredContent: {
        padding: 20,
        alignItems: 'center',
    }
});

export default ProfileContent;
