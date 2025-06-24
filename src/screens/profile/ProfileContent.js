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
    TouchableOpacity,
    Image
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

    const handleNavigateToSportsAvailability = () => {
        navigation.navigate('SportsAvailability');
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
                
                <TouchableOpacity 
                    style={styles.sportsButton}
                    onPress={handleNavigateToSportsAvailability}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#4CAF50', '#388E3C']}
                        style={styles.sportsButtonGradient}
                    >
                        <Ionicons name="calendar" size={20} color="#fff" />
                        <Text style={styles.sportsButtonText}>Lịch chơi thể thao</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Quick Access Section */}
            <View style={styles.quickAccessSection}>
                <Text style={styles.quickAccessTitle}>📊 Quản lý hoạt động</Text>
                
                <View style={styles.quickAccessGrid}>
                    <TouchableOpacity 
                        style={styles.quickAccessCard}
                        onPress={() => navigation.navigate('MyJoinedPosts')}
                    >
                        <View style={[styles.quickAccessIcon, { backgroundColor: '#E8F5E8' }]}>
                            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                        </View>
                        <Text style={styles.quickAccessLabel}>Đã tham gia</Text>
                        <Text style={styles.quickAccessDesc}>Xem bài đăng đã tham gia</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.quickAccessCard}
                        onPress={() => navigation.navigate('MyCreatedPosts')}
                    >
                        <View style={[styles.quickAccessIcon, { backgroundColor: '#FFF3E0' }]}>
                            <Ionicons name="create" size={24} color="#FF9800" />
                        </View>
                        <Text style={styles.quickAccessLabel}>Đã tạo</Text>
                        <Text style={styles.quickAccessDesc}>Quản lý bài đăng của bạn</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.quickAccessCard}
                        onPress={() => navigation.navigate('AllPendingRequests')}
                    >
                        <View style={[styles.quickAccessIcon, { backgroundColor: '#FFF8E1' }]}>
                            <Ionicons name="time" size={24} color="#FFC107" />
                        </View>
                        <Text style={styles.quickAccessLabel}>Chờ duyệt</Text>
                        <Text style={styles.quickAccessDesc}>Yêu cầu cần xử lý</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

// Sports Tab Component
const SportsTab = ({ navigation, userProfile, onRefresh, isRefreshing, scrollY }) => {
    // Dummy sports data - in a real app, this would come from an API or context
    const sportsData = [
        { id: 1, name: 'Bóng đá', level: 'Trung bình', frequency: '2-3 lần/tuần', icon: 'football-outline' },
        { id: 2, name: 'Bơi lội', level: 'Nâng cao', frequency: '3-4 lần/tuần', icon: 'water-outline' },
        { id: 3, name: 'Tennis', level: 'Sơ cấp', frequency: '1-2 lần/tuần', icon: 'tennisball-outline' },
    ];

    const renderSportItem = ({ item }) => (
        <View style={styles.sportItemContainer}>
            <View style={styles.sportIconContainer}>
                <Ionicons name={item.icon} size={28} color="#E91E63" />
            </View>
            <View style={styles.sportInfoContainer}>
                <Text style={styles.sportName}>{item.name}</Text>
                <View style={styles.sportDetailsRow}>
                    <View style={styles.sportDetail}>
                        <Text style={styles.sportDetailLabel}>Trình độ:</Text>
                        <Text style={styles.sportDetailValue}>{item.level}</Text>
                    </View>
                    <View style={styles.sportDetail}>
                        <Text style={styles.sportDetailLabel}>Tần suất:</Text>
                        <Text style={styles.sportDetailValue}>{item.frequency}</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    return (
        <FlatList
            data={sportsData}
            renderItem={renderSportItem}
            keyExtractor={(item) => item.id.toString()}
            ListHeaderComponent={
                <View style={styles.sportsTabHeader}>
                    <Text style={styles.sportsTabTitle}>Thông tin thể thao của bạn</Text>
                    <Text style={styles.sportsTabSubtitle}>
                        Quản lý các môn thể thao yêu thích và tìm đối tác phù hợp
                    </Text>
                    
                    <TouchableOpacity 
                        style={styles.editSportsProfileButton}
                        onPress={() => navigation.navigate('SportsProfileScreen', {
                            currentUser: userProfile,
                            isViewMode: false
                        })}
                    >
                        <LinearGradient
                            colors={['#E91E63', '#C2185B']}
                            style={styles.editButtonGradient}
                        >
                            <Ionicons name="create-outline" size={18} color="#fff" />
                            <Text style={styles.editButtonText}>Chỉnh sửa hồ sơ thể thao</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            }
            ListEmptyComponent={
                <View style={styles.emptySportsContainer}>
                    <Ionicons name="fitness-outline" size={60} color="#ccc" />
                    <Text style={styles.emptySportsText}>
                        Bạn chưa có thông tin thể thao nào
                    </Text>
                    <TouchableOpacity 
                        style={styles.createSportsProfileButton}
                        onPress={() => navigation.navigate('SportsProfileScreen', {
                            currentUser: userProfile,
                            isViewMode: false
                        })}
                    >
                        <LinearGradient
                            colors={['#E91E63', '#C2185B']}
                            style={styles.createButtonGradient}
                        >
                            <Text style={styles.createButtonText}>Tạo hồ sơ thể thao</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            }
            contentContainerStyle={styles.sportsTabContainer}
            refreshControl={
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={onRefresh}
                    colors={['#1877F2']}
                />
            }
            onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
        />
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
        updatePost,
        currentUserId: postsCurrentUserId
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
            currentUserId={postsCurrentUserId}
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
            case 'sports':
                return (
                    <View style={styles.tabContentContainer}>
                        <View style={styles.tabHeaderContainer}>
                            {renderListHeader()}
                        </View>
                        <SportsTab 
                            navigation={navigation}
                            userProfile={userProfile}
                            onRefresh={handleUserRefresh}
                            isRefreshing={isRefreshing}
                            scrollY={scrollY}
                        />
                    </View>
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
    // Styles for Sports Tab
    tabContentContainer: {
        flex: 1,
    },
    sportsTabContainer: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    sportsTabHeader: {
        backgroundColor: '#fff',
        padding: 20,
        marginHorizontal: 15,
        marginVertical: 10,
        borderRadius: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        alignItems: 'center',
    },
    sportsTabTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    sportsTabSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 15,
    },
    editSportsProfileButton: {
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 10,
    },
    editButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
    },
    editButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    sportItemContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginVertical: 8,
        padding: 15,
        borderRadius: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    sportIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(233, 30, 99, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    sportInfoContainer: {
        flex: 1,
    },
    sportName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    sportDetailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    sportDetail: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sportDetailLabel: {
        fontSize: 13,
        color: '#666',
        marginRight: 4,
    },
    sportDetailValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
    },
    emptySportsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
        marginTop: 20,
    },
    emptySportsText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginVertical: 15,
    },
    createSportsProfileButton: {
        width: '80%',
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 15,
    },
    createButtonGradient: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    createButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    // Quick Access Styles
    quickAccessSection: {
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    quickAccessTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
        textAlign: 'left',
    },
    quickAccessGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    quickAccessCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    quickAccessIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    quickAccessLabel: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
        textAlign: 'center',
    },
    quickAccessDesc: {
        fontSize: 10,
        color: '#666',
        textAlign: 'center',
        lineHeight: 12,
    },
});

export default ProfileContent;
