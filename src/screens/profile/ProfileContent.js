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
    Image,
    Alert
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
        // Navigate to sports profile creation/editing
        navigation.navigate('CreateSportsPost');
    };

    const handleNavigateToSportsMatching = () => {
        // Navigate to sports availability screen which exists
        navigation.navigate('SportsAvailabilityScreen');
    };

    const handleNavigateToSportsAvailability = () => {
        navigation.navigate('CreateSportsPost');
    };

    return (
        <View style={styles.sportsProfileSection}>
            <View style={styles.sportsProfileHeader}>
                <Text style={styles.sportsProfileTitle}>🏃‍♂️ Thể thao</Text>
                <Text style={styles.sportsProfileSubtitle}>Quản lý hoạt động thể thao của bạn</Text>
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
                        <Text style={styles.sportsButtonText}>Hồ sơ</Text>
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
                        <Ionicons name="add" size={20} color="#fff" />
                        <Text style={styles.sportsButtonText}>Tạo bài đăng</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// Sports Tab Component - Simplified version
const SportsTab = ({ navigation, userProfile, onRefresh, isRefreshing, scrollY }) => {
    console.log('🏃‍♂️ SportsTab component rendering...', { 
        navigation: !!navigation, 
        userProfile: !!userProfile,
        sportsInterestsLength: 3
    });

    // Sample sports interests - this would normally come from user profile
    const sportsInterests = [
        { 
            id: 1, 
            name: 'Bóng đá', 
            level: 'Trung bình', 
            frequency: '2-3 lần/tuần', 
            icon: 'football-outline',
            description: 'Thích chơi bóng đá với bạn bè'
        },
        { 
            id: 2, 
            name: 'Bơi lội', 
            level: 'Nâng cao', 
            frequency: '3-4 lần/tuần', 
            icon: 'water-outline',
            description: 'Bơi lội để rèn luyện sức khỏe'
        },
        { 
            id: 3, 
            name: 'Tennis', 
            level: 'Sơ cấp', 
            frequency: '1-2 lần/tuần', 
            icon: 'tennisball-outline',
            description: 'Muốn học và cải thiện kỹ năng tennis'
        },
    ];

    const renderSportItem = ({ item }) => (
        <View style={styles.sportItemContainer}>
            <View style={styles.sportIconContainer}>
                <Ionicons name={item.icon} size={28} color="#E91E63" />
            </View>
            <View style={styles.sportInfoContainer}>
                <Text style={styles.sportName}>{item.name}</Text>
                <Text style={styles.sportDescription}>{item.description}</Text>
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

    const handleCreateSportsProfile = () => {
        Alert.alert(
            'Tạo hồ sơ thể thao',
            'Bạn muốn tạo hồ sơ thể thao mới?',
            [
                { text: 'Hủy', style: 'cancel' },
                { 
                    text: 'Tạo', 
                    onPress: () => {
                        Alert.alert('Thông báo', 'Chức năng đang được phát triển');
                    }
                }
            ]
        );
    };

    const handleEditSportsProfile = () => {
        Alert.alert(
            'Chỉnh sửa hồ sơ thể thao',
            'Chức năng chỉnh sửa hồ sơ thể thao đang được phát triển',
            [{ text: 'OK' }]
        );
    };

    // Render sports tab header with profile info included
    const renderSportsHeader = () => (
        <>
            <ProfileInfo 
                onEditProfile={() => {
                    Alert.alert('Chỉnh sửa profile', 'Chức năng đang được phát triển');
                }}
                onViewIntro={() => {
                    Alert.alert('Xem giới thiệu', 'Chức năng đang được phát triển');
                }}
            />
            
            <FriendsSection 
                onFindFriends={() => {
                    navigation.navigate('FriendSearch');
                }}
                onViewAllFriends={() => {
                    navigation.navigate('NewMessages', { currentUser: userProfile });
                }}
            />

            <SportsProfileSection 
                navigation={navigation}
                userProfile={userProfile}
            />

            <ProfileTabs
                activeTab="sports"
                onTabChange={() => {}} // Không cần onChange ở đây
            />

            <View style={styles.sportsTabHeader}>
                <Text style={styles.sportsTabTitle}>🏃‍♂️ Sở thích thể thao</Text>
                <Text style={styles.sportsTabSubtitle}>
                    Những môn thể thao bạn yêu thích và muốn tìm đối tác
                </Text>
                
                <TouchableOpacity 
                    style={styles.editSportsProfileButton}
                    onPress={handleEditSportsProfile}
                >
                    <LinearGradient
                        colors={['#E91E63', '#C2185B']}
                        style={styles.editButtonGradient}
                    >
                        <Ionicons name="create-outline" size={18} color="#fff" />
                        <Text style={styles.editButtonText}>Chỉnh sửa sở thích</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
            <FlatList
                data={sportsInterests}
                renderItem={renderSportItem}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={renderSportsHeader}
                ListEmptyComponent={
                    <View style={styles.emptySportsContainer}>
                        <Ionicons name="fitness-outline" size={60} color="#ccc" />
                        <Text style={styles.emptySportsText}>
                            Bạn chưa có thông tin thể thao nào
                        </Text>
                        <Text style={styles.emptySportsSubText}>
                            Hãy thêm các môn thể thao yêu thích để tìm đối tác phù hợp
                        </Text>
                        <TouchableOpacity 
                            style={styles.createSportsProfileButton}
                            onPress={handleCreateSportsProfile}
                        >
                            <LinearGradient
                                colors={['#E91E63', '#C2185B']}
                                style={styles.createButtonGradient}
                            >
                                <Ionicons name="add" size={18} color="#fff" />
                                <Text style={styles.createButtonText}>Thêm sở thích thể thao</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                }
                contentContainerStyle={styles.sportsTabContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        colors={['#E91E63']}
                        tintColor="#E91E63"
                    />
                }
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
            />
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
                            onViewAllFriends,
                            locationTab
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
            case 'sports':
                console.log('🏃‍♂️ Rendering Sports Tab');
                return (
                    <SportsTab 
                        navigation={navigation}
                        userProfile={userProfile}
                        onRefresh={handleUserRefresh}
                        isRefreshing={isRefreshing}
                        scrollY={scrollY}
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
                                initialTab={locationTab || 'location'}
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
        backgroundColor: '#f8f9fa',
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
    sportDescription: {
        fontSize: 12,
        color: '#666',
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
        padding: 30,
        marginHorizontal: 15,
        marginVertical: 20,
        backgroundColor: '#fff',
        borderRadius: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    emptySportsText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginVertical: 15,
    },
    emptySportsSubText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginVertical: 10,
    },
    createSportsProfileButton: {
        width: '80%',
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 15,
    },
    createButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        gap: 8,
    },
    createButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
});

export default ProfileContent;
