import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import UserProfileService from '../services/UserProfileService';
import AuthService from '../services/AuthService';
import { useIsFocused } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const PROFILE_IMAGE_SIZE = 90;
const POSTS_PER_ROW = 3;

const ProfileScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('grid');
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const userProfileService = new UserProfileService();
    const isFocused = useIsFocused();

    // Fetch user profile data
    const fetchProfileData = async () => {
        if (refreshing) return;

        setLoading(true);
        try {
            // Kiểm tra xem người dùng đã đăng nhập chưa
            const isLoggedIn = await AuthService.isAuthenticated();
            if (!isLoggedIn) {
                // Nếu chưa đăng nhập, chuyển hướng đến màn hình đăng nhập
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                });
                return;
            }

            // Lấy thông tin hồ sơ người dùng hiện tại
            const userData = await userProfileService.getCurrentUserProfile();
            setProfile(userData);
        } catch (error) {
            console.error('Error fetching profile data:', error);

            // Kiểm tra xem lỗi có phải do token hết hạn không
            if (global.authExpired) {
                // Nếu token hết hạn, chuyển hướng đến màn hình đăng nhập
                Alert.alert(
                    'Phiên đăng nhập hết hạn',
                    'Vui lòng đăng nhập lại để tiếp tục',
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            })
                        }
                    ]
                );
                // Reset biến global
                global.authExpired = false;
                return;
            }

            Alert.alert('Lỗi', error.message || 'Không thể tải thông tin hồ sơ');
        } finally {
            setLoading(false);
        }
    };

    // Xử lý pull-to-refresh
    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchProfileData();
        setRefreshing(false);
    };

    // Load profile data when component mounts or when returning to this screen
    useEffect(() => {
        if (isFocused) {
            fetchProfileData();
        }
    }, [isFocused]);

    // Handle navigation to edit profile screen
    const handleEditProfile = () => {
        if (!profile) return;
        navigation.navigate('EditProfile', { profile });
    };

    // Xử lý đăng xuất
    const handleLogout = async () => {
        try {
            await AuthService.logout();
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
        } catch (error) {
            console.error('Lỗi đăng xuất:', error);
            Alert.alert('Lỗi', 'Không thể đăng xuất. Vui lòng thử lại sau.');
        }
    };

    const renderPostGrid = () => {
        if (!profile || !profile.postImages || profile.postImages.length === 0) {
            return (
                <View style={styles.emptyPostsContainer}>
                    <Icon name="image-off" size={50} color="#ccc" />
                    <Text style={styles.emptyPostsText}>Chưa có bài viết nào</Text>
                </View>
            );
        }

        // Create rows of posts
        const rows = [];
        for (let i = 0; i < profile.postImages.length; i += POSTS_PER_ROW) {
            const rowImages = profile.postImages.slice(i, i + POSTS_PER_ROW);
            rows.push(
                <View key={`row-${i}`} style={styles.postRow}>
                    {rowImages.map((image, index) => (
                        <Image
                            key={`post-${i}-${index}`}
                            source={{ uri: image }}
                            style={styles.postGridImage}
                        />
                    ))}
                    {/* Fill empty spots in the row */}
                    {rowImages.length < POSTS_PER_ROW &&
                        Array(POSTS_PER_ROW - rowImages.length).fill().map((_, index) => (
                            <View
                                key={`empty-${index}`}
                                style={styles.postGridImage}
                            />
                        ))
                    }
                </View>
            );
        }
        return rows;
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Đang tải thông tin...</Text>
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Không có dữ liệu hồ sơ</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={fetchProfileData}
                >
                    <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    colors={["#4CAF50"]}
                />
            }
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity>
                    <Text style={styles.username}>{profile.username || 'Người dùng'}</Text>
                </TouchableOpacity>
                <View style={styles.headerIcons}>
                    <TouchableOpacity style={styles.headerIcon} onPress={handleLogout}>
                        <Icon name="logout" size={24} color="#f44336" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Profile Info */}
            <View style={styles.profileInfoContainer}>
                <View style={styles.profileImageContainer}>
                    <Image
                        source={{
                            uri: profile.profilePictureUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
                        }}
                        style={styles.profileImage}
                    />
                </View>

                <View style={styles.profileStatsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{profile.posts || 0}</Text>
                        <Text style={styles.statLabel}>Bài viết</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{profile.followers || 0}</Text>
                        <Text style={styles.statLabel}>Người theo dõi</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{profile.following || 0}</Text>
                        <Text style={styles.statLabel}>Đang theo dõi</Text>
                    </View>
                </View>
            </View>

            {/* Profile Details */}
            <View style={styles.profileDetailsContainer}>
                <Text style={styles.fullName}>
                    {`${profile.firstname || ''} ${profile.lastname || ''}`}
                </Text>
                <Text style={styles.bio}>{profile.bio || 'Chưa có tiểu sử'}</Text>
                {profile.website && (
                    <TouchableOpacity>
                        <Text style={styles.website}>{profile.website}</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
                <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
                    <Text style={styles.editProfileButtonText}>Chỉnh sửa hồ sơ</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareProfileButton}>
                    <Text style={styles.shareProfileButtonText}>Chia sẻ hồ sơ</Text>
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[
                        styles.tabButton,
                        activeTab === 'grid' && styles.activeTabButton
                    ]}
                    onPress={() => setActiveTab('grid')}
                >
                    <Icon
                        name="grid"
                        size={24}
                        color={activeTab === 'grid' ? '#4CAF50' : 'gray'}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.tabButton,
                        activeTab === 'list' && styles.activeTabButton
                    ]}
                    onPress={() => setActiveTab('list')}
                >
                    <Icon
                        name="format-list-bulleted"
                        size={24}
                        color={activeTab === 'list' ? '#4CAF50' : 'gray'}
                    />
                </TouchableOpacity>
            </View>

            {/* Post Grid */}
            <View style={styles.postGridContainer}>
                {renderPostGrid()}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
    },
    retryButton: {
        marginTop: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#4CAF50',
        borderRadius: 5,
    },
    retryButtonText: {
        color: 'white',
        fontWeight: 'bold',
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
    username: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerIcons: {
        flexDirection: 'row',
    },
    headerIcon: {
        marginLeft: 15,
    },
    profileInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        marginTop: 20,
    },
    profileImageContainer: {
        marginRight: 30,
    },
    profileImage: {
        width: PROFILE_IMAGE_SIZE,
        height: PROFILE_IMAGE_SIZE,
        borderRadius: PROFILE_IMAGE_SIZE / 2,
        borderWidth: 2,
        borderColor: '#E0E0E0',
    },
    profileStatsContainer: {
        flexDirection: 'row',
        flex: 1,
        justifyContent: 'space-between',
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
        color: 'gray',
    },
    profileDetailsContainer: {
        paddingHorizontal: 15,
        marginTop: 15,
    },
    fullName: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    bio: {
        marginTop: 5,
        color: '#333',
    },
    website: {
        color: '#00376B',
        marginTop: 5,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        marginTop: 15,
    },
    editProfileButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#DEDEDE',
        paddingVertical: 8,
        marginRight: 10,
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: '#4CAF50',
    },
    editProfileButtonText: {
        fontWeight: 'bold',
        color: 'white',
    },
    shareProfileButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#DEDEDE',
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    shareProfileButtonText: {
        fontWeight: 'bold',
    },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderTopWidth: 0.5,
        borderBottomWidth: 0.5,
        borderColor: '#DEDEDE',
        paddingVertical: 10,
        marginTop: 20,
    },
    tabButton: {
        padding: 10,
    },
    activeTabButton: {
        borderBottomWidth: 2,
        borderBottomColor: '#4CAF50',
    },
    postGridContainer: {
        paddingTop: 2,
        minHeight: 200,
    },
    postRow: {
        flexDirection: 'row',
    },
    postGridImage: {
        width: width / POSTS_PER_ROW,
        height: width / POSTS_PER_ROW,
        borderWidth: 1,
        borderColor: 'white',
    },
    emptyPostsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
    },
    emptyPostsText: {
        marginTop: 10,
        color: '#666',
    },
});

export default ProfileScreen;
