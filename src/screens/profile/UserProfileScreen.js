import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Alert,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Services
import UserProfileService from '../../services/UserProfileService';
import FriendService from '../../services/FriendService';
import { useTheme } from '../../hook/ThemeContext';

const { width } = Dimensions.get('window');
const DEFAULT_PROFILE_IMAGE = 'https://ui-avatars.com/api/?background=E91E63&color=fff&size=200';
const DEFAULT_COVER_IMAGE = require('../../assets/h1.png');

const UserProfileScreen = ({ navigation, route }) => {
    const { colors } = useTheme();
    
    // Get userId from navigation params
    const { userId } = route.params || {};
    
    // State
    const [userProfile, setUserProfile] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [friendshipStatus, setFriendshipStatus] = useState('NOT_FRIEND');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    console.log('🔍 UserProfileScreen initialized with userId:', userId);

    // Load current user
    useEffect(() => {
        const loadCurrentUser = async () => {
            try {
                const userData = await AsyncStorage.getItem('userData');
                const userProfileData = await AsyncStorage.getItem('userProfile');
                
                if (userData) {
                    const parsedUser = JSON.parse(userData);
                    setCurrentUser(parsedUser);
                    console.log('👤 Current user loaded:', { id: parsedUser.id, name: parsedUser.fullName });
                } else if (userProfileData) {
                    const parsedProfile = JSON.parse(userProfileData);
                    setCurrentUser(parsedProfile);
                    console.log('👤 Current user from profile:', { id: parsedProfile.id, name: parsedProfile.fullName });
                }
            } catch (error) {
                console.error('Error loading current user:', error);
            }
        };
        
        loadCurrentUser();
    }, []);

    // Load user profile and friendship status
    useEffect(() => {
        if (userId && currentUser) {
            loadData();
        }
    }, [userId, currentUser]);

    // Load all data
    const loadData = useCallback(async () => {
        if (!userId) {
            console.error('❌ No userId provided');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            console.log(`🚀 Loading data for userId: ${userId}`);
            
            // Load user profile and friendship status in parallel
            const [profileResult, friendshipResult] = await Promise.allSettled([
                loadUserProfile(),
                loadFriendshipStatus()
            ]);

            if (profileResult.status === 'rejected') {
                console.error('Failed to load user profile:', profileResult.reason);
            }
            
            if (friendshipResult.status === 'rejected') {
                console.error('Failed to load friendship status:', friendshipResult.reason);
            }
        } catch (error) {
            console.error('Error in loadData:', error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // Load user profile
    const loadUserProfile = async () => {
        try {
            console.log(`📡 Fetching profile for userId: ${userId}`);
            const profile = await UserProfileService.getUserProfile(userId);
            console.log('✅ User profile loaded:', profile);
            setUserProfile(profile);
            return profile;
        } catch (error) {
            console.error('❌ Error loading user profile:', error);
            throw error;
        }
    };

    // Load friendship status
    const loadFriendshipStatus = async () => {
        try {
            console.log(`🤝 Checking friendship status with userId: ${userId}`);
            const status = await FriendService.checkFriendStatus(userId);
            console.log('✅ Friendship status:', status);
            setFriendshipStatus(status);
            return status;
        } catch (error) {
            console.error('❌ Error loading friendship status:', error);
            setFriendshipStatus('NOT_FRIEND'); // Default fallback
            throw error;
        }
    };

    // Handle refresh
    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [loadData]);

    // Send friend request
    const sendFriendRequest = async () => {
        try {
            setActionLoading(true);
            console.log(`📤 Sending friend request to userId: ${userId}`);
            await FriendService.sendFriendRequestById(userId);
            setFriendshipStatus('PENDING_SENT');
            Alert.alert('Thành công', 'Đã gửi lời mời kết bạn');
        } catch (error) {
            console.error('❌ Error sending friend request:', error);
            Alert.alert('Lỗi', 'Không thể gửi lời mời kết bạn');
        } finally {
            setActionLoading(false);
        }
    };

    // Start conversation
    const startConversation = () => {
        if (!userProfile) return;
        
        const chatUser = {
            id: userProfile.id,
            username: userProfile.fullName || userProfile.firstname || 'Người dùng',
            fullName: userProfile.fullName || `${userProfile.firstname || ''} ${userProfile.lastname || ''}`.trim(),
            profilePicture: userProfile.profilePictureUrl,
            email: userProfile.email
        };

        console.log('💬 Starting conversation with:', chatUser);
        navigation.navigate('NewChatScreen', {
            user: chatUser,
            currentUser: currentUser
        });
    };

    // Get profile image URL
    const getProfileImageUrl = () => {
        if (userProfile?.profilePictureUrl) {
            return { uri: userProfile.profilePictureUrl };
        }
        return { uri: `${DEFAULT_PROFILE_IMAGE}&name=${encodeURIComponent(getFullName())}` };
    };
    
    // Get cover image URL
    const getCoverImageUrl = () => {
        if (userProfile?.coverImageUrl) {
            return { uri: userProfile.coverImageUrl };
        }
        return DEFAULT_COVER_IMAGE;
    };

    // Get full name
    const getFullName = () => {
        return userProfile?.fullName || 
               `${userProfile?.firstname || ''} ${userProfile?.lastname || ''}`.trim() || 
               'Người dùng';
    };

    // Get user info text
    const getUserInfo = () => {
        const info = [];
        if (userProfile?.email) info.push(userProfile.email);
        if (userProfile?.occupation) info.push(userProfile.occupation);
        if (userProfile?.education) info.push(userProfile.education);
        if (userProfile?.address) info.push(userProfile.address);
        return info;
    };

    // Get friendship button
    const renderFriendshipButton = () => {
        if (actionLoading) {
            return (
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} disabled>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.actionButtonText}>Đang xử lý...</Text>
                </TouchableOpacity>
            );
        }

        switch (friendshipStatus) {
            case 'ACCEPTED':
                return (
                    <TouchableOpacity style={[styles.actionButton, styles.friendButton]}>
                        <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                        <Text style={[styles.actionButtonText, { color: '#4CAF50' }]}>Bạn bè</Text>
                    </TouchableOpacity>
                );
            case 'PENDING_SENT':
                return (
                    <TouchableOpacity style={[styles.actionButton, styles.pendingButton]}>
                        <Ionicons name="time" size={20} color="#FF9800" />
                        <Text style={[styles.actionButtonText, { color: '#FF9800' }]}>Đã gửi yêu cầu</Text>
                    </TouchableOpacity>
                );
            case 'PENDING_RECEIVED':
                return (
                    <TouchableOpacity style={[styles.actionButton, styles.acceptButton]}>
                        <Ionicons name="person-add" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Chấp nhận</Text>
                    </TouchableOpacity>
                );
            default:
                return (
                    <TouchableOpacity 
                        style={[styles.actionButton, { backgroundColor: colors.primary }]}
                        onPress={sendFriendRequest}
                    >
                        <Ionicons name="person-add" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Kết bạn</Text>
                    </TouchableOpacity>
                );
        }
    };

    // Loading screen
    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text }]}>Đang tải thông tin...</Text>
            </View>
        );
    }

    // Error screen
    if (!userProfile && !loading) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
                <Ionicons name="person-outline" size={64} color={colors.textLight} />
                <Text style={[styles.errorTitle, { color: colors.text }]}>Không tìm thấy người dùng</Text>
                <Text style={[styles.errorSubtitle, { color: colors.textLight }]}>
                    Người dùng có thể đã xóa tài khoản hoặc thay đổi quyền riêng tư
                </Text>
                <TouchableOpacity 
                    style={[styles.retryButton, { backgroundColor: colors.primary }]}
                    onPress={loadData}
                >
                    <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
            
            {/* Header */}
            <LinearGradient colors={[colors.primary, colors.primary + 'DD']} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    
                    <Text style={styles.headerTitle}>Trang cá nhân</Text>
                    
                    <TouchableOpacity style={styles.moreButton}>
                        <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView 
                style={styles.content} 
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                    />
                }
            >
                {/* Cover & Profile Image */}
                <View style={styles.profileSection}>
                    <Image
                        source={getCoverImageUrl()}
                        style={styles.coverImage}
                        resizeMode="cover"
                    />
                    
                    <View style={styles.profileImageContainer}>
                        <Image
                            source={getProfileImageUrl()}
                            style={styles.profileImage}
                            resizeMode="cover"
                        />
                    </View>
                </View>

                {/* User Info */}
                <View style={[styles.userInfoContainer, { backgroundColor: colors.cardBackground }]}>
                    <Text style={[styles.userName, { color: colors.text }]}>{getFullName()}</Text>
                    
                    {getUserInfo().map((info, index) => (
                        <Text key={index} style={[styles.userDetail, { color: colors.textLight }]}>
                            {info}
                        </Text>
                    ))}
                    
                    {userProfile?.bio && (
                        <Text style={[styles.userBio, { color: colors.text }]}>{userProfile.bio}</Text>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.actionsContainer}>
                        {renderFriendshipButton()}
                        
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.messageButton, { backgroundColor: colors.secondary }]}
                            onPress={startConversation}
                        >
                            <Ionicons name="chatbubble" size={20} color="#fff" />
                            <Text style={styles.actionButtonText}>Nhắn tin</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* User Details */}
                <View style={[styles.detailsSection, { backgroundColor: colors.cardBackground }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Thông tin chi tiết</Text>
                    
                    <View style={styles.detailsContainer}>
                        {userProfile?.occupation && (
                            <View style={styles.detailItem}>
                                <MaterialIcons name="work" size={20} color={colors.primary} />
                                <Text style={[styles.detailText, { color: colors.text }]}>
                                    {userProfile.occupation}
                                </Text>
                            </View>
                        )}
                        
                        {userProfile?.education && (
                            <View style={styles.detailItem}>
                                <Ionicons name="school" size={20} color={colors.primary} />
                                <Text style={[styles.detailText, { color: colors.text }]}>
                                    {userProfile.education}
                                </Text>
                            </View>
                        )}
                        
                        {userProfile?.address && (
                            <View style={styles.detailItem}>
                                <Ionicons name="location" size={20} color={colors.primary} />
                                <Text style={[styles.detailText, { color: colors.text }]}>
                                    {userProfile.address}
                                </Text>
                            </View>
                        )}
                        
                        {userProfile?.email && (
                            <View style={styles.detailItem}>
                                <Ionicons name="mail" size={20} color={colors.primary} />
                                <Text style={[styles.detailText, { color: colors.text }]}>
                                    {userProfile.email}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Sports Profile Section - nếu có */}
                {userProfile?.sportsProfile && (
                    <View style={[styles.detailsSection, { backgroundColor: colors.cardBackground }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Thông tin thể thao</Text>
                        
                        <View style={styles.detailsContainer}>
                            {userProfile.sportsProfile.favoriteeSports && (
                                <View style={styles.detailItem}>
                                    <Ionicons name="basketball" size={20} color={colors.primary} />
                                    <Text style={[styles.detailText, { color: colors.text }]}>
                                        Môn thể thao yêu thích: {userProfile.sportsProfile.favoriteeSports}
                                    </Text>
                                </View>
                            )}
                            
                            {userProfile.sportsProfile.skillLevel && (
                                <View style={styles.detailItem}>
                                    <Ionicons name="trophy" size={20} color={colors.primary} />
                                    <Text style={[styles.detailText, { color: colors.text }]}>
                                        Trình độ: {userProfile.sportsProfile.skillLevel}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    errorSubtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    header: {
        paddingTop: 10,
        paddingBottom: 15,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
        textAlign: 'center',
    },
    moreButton: {
        padding: 5,
    },
    content: {
        flex: 1,
    },
    profileSection: {
        position: 'relative',
        marginBottom: 10,
    },
    coverImage: {
        width: '100%',
        height: 200,
    },
    profileImageContainer: {
        position: 'absolute',
        bottom: -60,
        alignSelf: 'center',
        padding: 4,
        backgroundColor: '#fff',
        borderRadius: 64,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    userInfoContainer: {
        paddingTop: 70,
        paddingHorizontal: 20,
        paddingBottom: 20,
        alignItems: 'center',
        marginBottom: 10,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    userDetail: {
        fontSize: 16,
        marginBottom: 4,
        textAlign: 'center',
    },
    userBio: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
        marginTop: 10,
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    actionsContainer: {
        flexDirection: 'row',
        marginTop: 20,
        gap: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        flex: 1,
        justifyContent: 'center',
        gap: 8,
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    friendButton: {
        backgroundColor: '#E8F5E8',
        borderWidth: 1,
        borderColor: '#4CAF50',
    },
    pendingButton: {
        backgroundColor: '#FFF3E0',
        borderWidth: 1,
        borderColor: '#FF9800',
    },
    acceptButton: {
        backgroundColor: '#4CAF50',
    },
    messageButton: {
        backgroundColor: '#2196F3',
    },
    detailsSection: {
        marginBottom: 10,
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    detailsContainer: {
        gap: 12,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    detailText: {
        fontSize: 16,
        flex: 1,
    },
});

export default UserProfileScreen; 