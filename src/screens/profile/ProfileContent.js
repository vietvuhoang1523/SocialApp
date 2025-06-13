import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    StyleSheet,
    Text,
    Animated,
    ScrollView,
    TouchableOpacity
} from 'react-native';
import PostItem from '../../hook/PostItem';
import { CreatePostButton, EmptyContent } from '../../components/UIComponents';
import usePosts from '../../hook/usePosts';
import { useProfileContext } from '../../components/ProfileContext';
import authService from '../../services/AuthService';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Import các thành phần UI khác
import ProfileInfo from './ProfileInfo';
import FriendsSection from '../../components/friends/FriendsSection';
import ProfileTabs from './ProfileTabs';
import UserLocationController from './UserLocationController';

// Sports Profile Section Component
const SportsProfileSection = ({ navigation, userProfile }) => {
    const handleNavigateToSportsProfile = () => {
        navigation.navigate('SportsProfileScreen', {
            currentUser: userProfile,
            isViewMode: false
        });
    };

    const handleNavigateToSportsMatching = () => {
        navigation.navigate('SportsMatchingScreen', {
            currentUser: userProfile
        });
    };

    return (
        <View style={styles.sportsProfileSection}>
            <View style={styles.sportsProfileHeader}>
                <Text style={styles.sportsProfileTitle}>🏃‍♂️ Thể thao</Text>
                <Text style={styles.sportsProfileSubtitle}>Quản lý hồ sơ thể thao và tìm đối tác</Text>
            </View>
            
            <View style={styles.sportsButtonsContainer}>
                <TouchableOpacity 
                    style={styles.sportsButton}
                    onPress={handleNavigateToSportsProfile}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#E91E63', '#C2185B']}
                        style={styles.sportsButtonGradient}
                    >
                        <Ionicons name="person-circle" size={20} color="#fff" />
                        <Text style={styles.sportsButtonText}>Sports Profile</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.sportsButton}
                    onPress={handleNavigateToSportsMatching}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#2196F3', '#1976D2']}
                        style={styles.sportsButtonGradient}
                    >
                        <Ionicons name="search" size={20} color="#fff" />
                        <Text style={styles.sportsButtonText}>Tìm đối tác</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
};

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
    const { refreshProfile, userProfile } = useProfileContext();

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

            <SportsProfileSection 
                navigation={navigation}
                userProfile={userProfile}
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
            case 'location':
                return (
                    <ScrollView 
                        style={styles.locationContainer}
                        contentContainerStyle={{flexGrow: 1}}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefreshing}
                                onRefresh={handleUserRefresh}
                                colors={['#1877F2']}
                            />
                        }
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.tabHeaderContainer}>
                            {renderListHeader()}
                        </View>
                        <View style={styles.locationControllerContainer}>
                            <UserLocationController 
                                navigation={navigation} 
                                key="locationController"
                            />
                        </View>
                    </ScrollView>
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
    },
    sportsProfileSection: {
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginVertical: 10,
        padding: 20,
        borderRadius: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    sportsProfileHeader: {
        marginBottom: 15,
        alignItems: 'center',
    },
    sportsProfileTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    sportsProfileSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    sportsButtonsContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    sportsButton: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    sportsButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        gap: 8,
    },
    sportsButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    // Styles cho tab vị trí
    locationContainer: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    tabHeaderContainer: {
        backgroundColor: '#f8f9fa',
    },
    locationControllerContainer: {
        flex: 1,
        marginTop: 10,
        marginBottom: 30,
        paddingBottom: 20,
    },
});

export default ProfileContent;
