import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Alert,
    RefreshControl,
    FlatList,
    SafeAreaView,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import UserProfileService from '../services/UserProfileService';
import AuthService from '../services/AuthService';

// Import components
import {
    LoadingComponent,
    ErrorComponent,
} from '../components/ProfileComponents';
import {useProfileContext} from "./ProfileContext";

const { width } = Dimensions.get('window');

// Hình ảnh mặc định cho avatar
const DEFAULT_PROFILE_IMAGE = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

const ProfileScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('posts'); // Thay đổi từ 'grid' thành 'posts' cho Facebook style
    const { userProfile, loading, updateProfile } = useProfileContext();
    const [refreshing, setRefreshing] = useState(false);
    // State cho thông tin follow
    const [isOwnProfile, setIsOwnProfile] = useState(true);

    const userProfileService = UserProfileService;
    const isFocused = useIsFocused();

    // Tải thông tin người dùng
    const fetchUserProfile = useCallback(async () => {
        if (refreshing) return;

        try {
            const userData = await userProfileService.getCurrentUserProfile();
            // Cập nhật vào context thay vì state local
            await updateProfile(userData);
            setIsOwnProfile(true);
        } catch (error) {
            console.error('Error fetching user profile:', error);
            Alert.alert('Lỗi', 'Không thể tải thông tin người dùng');
        }
    }, [refreshing, userProfileService, updateProfile]);

    // Tải thông tin người dùng khi màn hình được mở
    useEffect(() => {
        if (isFocused) {
            fetchUserProfile();
        }
    }, [isFocused, fetchUserProfile]);

    // Xử lý khi pull-to-refresh
    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchUserProfile();
        setRefreshing(false);
    }, [fetchUserProfile]);

    // Xử lý khi nhấn vào bài đăng
    const handlePostPress = useCallback((imageUrl, postIndex) => {
        console.log('Mở bài đăng:', imageUrl, 'Index:', postIndex);
        // navigation.navigate('PostDetail', { imageUrl, postIndex });
    }, []);

    // Xử lý đăng xuất
    const handleLogout = useCallback(() => {
        Alert.alert(
            'Đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Đăng xuất',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await AuthService.logout();
                            // Điều hướng đến màn hình đăng nhập
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }]
                            });
                        } catch (error) {
                            console.error('Error logging out:', error);
                            Alert.alert('Lỗi', 'Không thể đăng xuất');
                        }
                    }
                }
            ]
        );
    }, [navigation]);

    // Xử lý chỉnh sửa profile
    const handleEditProfile = useCallback(() => {
        navigation.navigate('EditProfile', { profile: userProfile });
    }, [navigation, userProfile]);


    // Lấy tên đầy đủ của người dùng
    const getFullName = useMemo(() => {
        if (!userProfile) return '';


        if (userProfile.fullName) {
            return userProfile.fullName;
        }  else {
            return 'Người dùng';
        }
    }, [userProfile]);

    // Lấy URL ảnh đại diện
    const profileImageUrl = useMemo(() => {
        if (!userProfile) return DEFAULT_PROFILE_IMAGE;

        return userProfileService.getFileUrl(
            userProfile.profilePictureBucket || 'default',
            userProfile.profilePicturePath || ''
        ) || DEFAULT_PROFILE_IMAGE;
    }, [userProfile, userProfileService]);

    // Lấy URL ảnh bìa
    const coverImageUrl = useMemo(() => {
        if (!userProfile?.coverImagePath) return require('../assets/h1.png');

        return {
            uri: userProfileService.getFileUrl(
                userProfile.coverImageBucket || 'default',
                userProfile.coverImagePath
            )
        };
    }, [userProfile, userProfileService]);



    // Nếu đang tải
    if (loading) {
        return <LoadingComponent />;
    }

    // Nếu không có dữ liệu người dùng
    if (!userProfile) {
        return <ErrorComponent onRetry={fetchUserProfile} />;
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Facebook-style Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color="#000" />
                </TouchableOpacity>

                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>{getFullName}</Text>
                    <Ionicons name="chevron-down" size={16} color="#000" />
                </View>

                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.headerIcon} onPress={handleEditProfile}>
                        <Ionicons name="pencil" size={22} color="#000" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerIcon}>
                        <Ionicons name="search" size={22} color="#000" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.contentContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={["#1877F2"]}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Cover Image */}
                <View style={styles.coverImageContainer}>
                    <Image
                        source={coverImageUrl}
                        style={styles.coverImage}
                        resizeMode="cover"
                    />
                </View>

                {/* Profile Info Section */}
                <View style={styles.profileInfoContainer}>
                    {/* Profile Image */}
                    <View style={styles.profileImageOuterContainer}>
                        <Image
                            source={{ uri: profileImageUrl }}
                            style={styles.profileImage}
                        />
                    </View>

                    {/* Name and Friends */}
                    <Text style={styles.fullName}>{getFullName}</Text>
                    <TouchableOpacity style={styles.friendsCountButton} onPress={handleViewFollowers}>
                        <Text style={styles.friendsCountText}>{followerCount} người bạn</Text>
                    </TouchableOpacity>

                    {/* Action Buttons */}
                    <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.primaryButton]}
                            onPress={handleEditProfile}
                        >
                            <Text style={styles.primaryButtonText}>
                                Chỉnh sửa chi tiết công khai
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Friends Section */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Bạn bè</Text>
                        <TouchableOpacity>
                            <Text style={styles.sectionAction}>Tìm bạn bè</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.friendsCount}>{followerCount} người bạn</Text>

                    <View style={styles.friendsGrid}>
                        {friendsData.map(friend => (
                            <View key={friend.id} style={styles.friendItem}>
                                <Image source={{ uri: friend.avatar }} style={styles.friendAvatar} />
                                <Text style={styles.friendName} numberOfLines={2}>{friend.name}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Tabs - Posts, Photos, Videos */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'posts' && styles.activeTabButton]}
                        onPress={() => setActiveTab('posts')}
                    >
                        <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
                            Bài viết
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'photos' && styles.activeTabButton]}
                        onPress={() => setActiveTab('photos')}
                    >
                        <Text style={[styles.tabText, activeTab === 'photos' && styles.activeTabText]}>
                            Ảnh
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'videos' && styles.activeTabButton]}
                        onPress={() => setActiveTab('videos')}
                    >
                        <Text style={[styles.tabText, activeTab === 'videos' && styles.activeTabText]}>
                            Video
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Add Post and Albums Sections */}
                <View style={styles.quickActionsContainer}>
                    <TouchableOpacity style={styles.quickActionItem}>
                        <Ionicons name="add-circle-outline" size={32} color="#666" />
                        <Text style={styles.quickActionText}>Mới</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickActionItem}>
                        <Image
                            source={require('../assets/h1.png')}
                            style={styles.albumThumbnail}
                        />
                        <Text style={styles.quickActionText}>Bộ sưu tập</Text>
                    </TouchableOpacity>
                </View>

                {/* Posts Content - hiển thị posts nếu có */}
                {userProfile?.postImages?.length > 0 && activeTab === 'posts' && (
                    <View style={styles.postsContainer}>
                        {userProfile.postImages.map((image, index) => (
                            <View key={index} style={styles.postItem}>
                                <View style={styles.postHeader}>
                                    <Image source={{ uri: profileImageUrl }} style={styles.postAvatar} />
                                    <View style={styles.postHeaderInfo}>
                                        <Text style={styles.postAuthor}>{getFullName}</Text>
                                        <Text style={styles.postDate}>{new Date().toLocaleDateString('vi-VN')}</Text>
                                    </View>
                                </View>
                                <Image source={{ uri: image }} style={styles.postImage} />
                                <View style={styles.postActions}>
                                    <TouchableOpacity style={styles.postActionButton}>
                                        <Ionicons name="thumbs-up-outline" size={22} color="#65676B" />
                                        <Text style={styles.postActionText}>Thích</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.postActionButton}>
                                        <Ionicons name="chatbubble-outline" size={22} color="#65676B" />
                                        <Text style={styles.postActionText}>Bình luận</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.postActionButton}>
                                        <Ionicons name="share-social-outline" size={22} color="#65676B" />
                                        <Text style={styles.postActionText}>Chia sẻ</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Photo Grid - hiển thị khi tab Photos được chọn */}
                {userProfile?.postImages?.length > 0 && activeTab === 'photos' && (
                    <View style={styles.photoGridContainer}>
                        {userProfile.postImages.map((image, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.photoGridItem}
                                onPress={() => handlePostPress(image, index)}
                            >
                                <Image source={{ uri: image }} style={styles.photoGridImage} />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Bottom Tab Bar */}
            <View style={styles.bottomTabBar}>
                <TouchableOpacity style={styles.bottomTabItem}>
                    <Ionicons name="home-outline" size={26} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.bottomTabItem}>
                    <Ionicons name="play-outline" size={26} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.bottomTabItem}>
                    <Ionicons name="people-outline" size={26} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.bottomTabItem}>
                    <Ionicons name="storefront-outline" size={26} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.bottomTabItem}>
                    <Ionicons name="notifications-outline" size={26} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.bottomTabItem}>
                    <Ionicons name="menu-outline" size={26} color="#1877F2" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f2f5', // Facebook background color
    },
    // Header styles
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingVertical: 10,
        backgroundColor: 'white',
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 5,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIcon: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#f0f2f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    contentContainer: {
        flex: 1,
    },
    // Cover image
    coverImageContainer: {
        height: 200,
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    // Profile info
    profileInfoContainer: {
        backgroundColor: 'white',
        paddingHorizontal: 15,
        paddingTop: 0,
        paddingBottom: 15,
        alignItems: 'center',
        marginBottom: 10,
    },
    profileImageOuterContainer: {
        marginTop: -80,
        padding: 5,
        backgroundColor: 'white',
        borderRadius: 85,
    },
    profileImage: {
        width: 150,
        height: 150,
        borderRadius: 75,
        borderWidth: 5,
        borderColor: 'white',
    },
    fullName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 10,
        textAlign: 'center',
    },
    friendsCountButton: {
        marginTop: 5,
        marginBottom: 15,
    },
    friendsCountText: {
        color: '#65676B',
        fontSize: 16,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 6,
        marginHorizontal: 5,
    },
    primaryButton: {
        backgroundColor: '#E7F3FF',
        flex: 1,
    },
    primaryButtonText: {
        color: '#1877F2',
        fontWeight: 'bold',
        fontSize: 14,
    },
    // Friends section
    sectionContainer: {
        backgroundColor: 'white',
        padding: 15,
        marginBottom: 10,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    sectionAction: {
        color: '#1877F2',
        fontSize: 16,
    },
    friendsCount: {
        color: '#65676B',
        marginBottom: 15,
    },
    friendsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    friendItem: {
        width: width / 3 - 15,
        marginBottom: 15,
    },
    friendAvatar: {
        width: '100%',
        height: width / 3 - 15,
        borderRadius: 8,
        marginBottom: 5,
    },
    friendName: {
        fontSize: 14,
    },
    // Tabs
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#E4E6EB',
        padding: 0,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 15,
        alignItems: 'center',
    },
    activeTabButton: {
        borderBottomWidth: 3,
        borderBottomColor: '#1877F2',
    },
    tabText: {
        color: '#65676B',
        fontWeight: 'bold',
    },
    activeTabText: {
        color: '#1877F2',
    },
    // Quick actions
    quickActionsContainer: {
        flexDirection: 'row',
        padding: 15,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#E4E6EB',
    },
    quickActionItem: {
        alignItems: 'center',
        marginRight: 20,
    },
    albumThumbnail: {
        width: 34,
        height: 34,
        borderRadius: 5,
    },
    quickActionText: {
        fontSize: 12,
        marginTop: 5,
        color: '#65676B',
    },
    // Posts styles
    postsContainer: {
        marginTop: 10,
    },
    postItem: {
        backgroundColor: 'white',
        marginBottom: 10,
    },
    postHeader: {
        flexDirection: 'row',
        padding: 12,
        alignItems: 'center',
    },
    postAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    postHeaderInfo: {
        marginLeft: 10,
    },
    postAuthor: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    postDate: {
        color: '#65676B',
        fontSize: 12,
    },
    postImage: {
        width: '100%',
        height: 300,
    },
    postActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#E4E6EB',
    },
    postActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    postActionText: {
        color: '#65676B',
        marginLeft: 5,
    },
    // Photo grid
    photoGridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: 'white',
        padding: 2,
    },
    photoGridItem: {
        width: width / 3 - 4,
        height: width / 3 - 4,
        margin: 2,
    },
    photoGridImage: {
        width: '100%',
        height: '100%',
    },
    // Bottom tab bar
    bottomTabBar: {
        flexDirection: 'row',
        backgroundColor: 'white',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#E4E6EB',
    },
    bottomTabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default ProfileScreen;
