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
    StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Services
import UserProfileService from '../../services/UserProfileService';
import FriendService from '../../services/FriendService';

const { width } = Dimensions.get('window');
const DEFAULT_PROFILE_IMAGE = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

const UserProfileScreen = ({ navigation, route }) => {
    // Get userId from navigation params
    const { userId } = route.params;
    
    // State
    const [userProfile, setUserProfile] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [friendshipStatus, setFriendshipStatus] = useState('NOT_FRIEND');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Load current user
    useEffect(() => {
        const loadCurrentUser = async () => {
            try {
                const userData = await AsyncStorage.getItem('userData');
                const userProfileData = await AsyncStorage.getItem('userProfile');
                
                if (userData) {
                    setCurrentUser(JSON.parse(userData));
                } else if (userProfileData) {
                    setCurrentUser(JSON.parse(userProfileData));
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
            loadUserProfile();
            loadFriendshipStatus();
        }
    }, [userId, currentUser]);

    // Load user profile
    const loadUserProfile = async () => {
        try {
            setLoading(true);
            const profile = await UserProfileService.getUserProfile(userId);
            setUserProfile(profile);
        } catch (error) {
            console.error('Error loading user profile:', error);
            Alert.alert('Lỗi', 'Không thể tải thông tin người dùng');
        } finally {
            setLoading(false);
        }
    };

    // Load friendship status
    const loadFriendshipStatus = async () => {
        try {
            const status = await FriendService.checkFriendStatus(userId);
            setFriendshipStatus(status);
        } catch (error) {
            console.error('Error loading friendship status:', error);
        }
    };

    // Send friend request
    const sendFriendRequest = async () => {
        try {
            setActionLoading(true);
            await FriendService.sendFriendRequestById(userId);
            setFriendshipStatus('PENDING_SENT');
            Alert.alert('Thành công', 'Đã gửi lời mời kết bạn');
        } catch (error) {
            console.error('Error sending friend request:', error);
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

        navigation.navigate('NewChatScreen', {
            user: chatUser,
            currentUser: currentUser
        });
    };

    // Get profile image URL
    const profileImageUrl = userProfile?.profilePictureUrl || DEFAULT_PROFILE_IMAGE;
    
    // Get cover image URL
    const coverImageUrl = userProfile?.coverImageUrl || require('../../assets/h1.png');

    // Get full name
    const fullName = userProfile?.fullName || 
                    `${userProfile?.firstname || ''} ${userProfile?.lastname || ''}`.trim() || 
                    'Người dùng';

    // Get friendship button
    const renderFriendshipButton = () => {
        if (actionLoading) {
            return (
                <View style={styles.actionButton}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.actionButtonText}>Đang xử lý...</Text>
                </View>
            );
        }

        switch (friendshipStatus) {
            case 'ACCEPTED':
                return (
                    <View style={[styles.actionButton, styles.friendButton]}>
                        <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                        <Text style={[styles.actionButtonText, { color: '#4CAF50' }]}>Bạn bè</Text>
                    </View>
                );
            case 'PENDING_SENT':
                return (
                    <View style={[styles.actionButton, styles.pendingButton]}>
                        <Ionicons name="time" size={20} color="#FF9800" />
                        <Text style={[styles.actionButtonText, { color: '#FF9800' }]}>Đã gửi</Text>
                    </View>
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
                        style={styles.actionButton}
                        onPress={sendFriendRequest}
                    >
                        <Ionicons name="person-add" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Kết bạn</Text>
                    </TouchableOpacity>
                );
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Đang tải thông tin...</Text>
            </View>
        );
    }

    if (!userProfile) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="person-outline" size={64} color="#ccc" />
                <Text style={styles.errorTitle}>Không tìm thấy người dùng</Text>
                <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={loadUserProfile}
                >
                    <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
            
            {/* Header */}
            <LinearGradient colors={['#007AFF', '#0056D3']} style={styles.header}>
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

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Cover & Profile Image */}
                <View style={styles.profileSection}>
                    <Image
                        source={typeof coverImageUrl === 'string' ? { uri: coverImageUrl } : coverImageUrl}
                        style={styles.coverImage}
                        resizeMode="cover"
                    />
                    
                    <View style={styles.profileImageContainer}>
                        <Image
                            source={{ uri: profileImageUrl }}
                            style={styles.profileImage}
                            defaultSource={{ uri: DEFAULT_PROFILE_IMAGE }}
                        />
                    </View>
                </View>

                {/* User Info */}
                <View style={styles.userInfoContainer}>
                    <Text style={styles.userName}>{fullName}</Text>
                    {userProfile.email && (
                        <Text style={styles.userEmail}>{userProfile.email}</Text>
                    )}
                    {userProfile.bio && (
                        <Text style={styles.userBio}>{userProfile.bio}</Text>
                    )}
                    
                    {/* User Details */}
                    <View style={styles.detailsContainer}>
                        {userProfile.occupation && (
                            <View style={styles.detailItem}>
                                <Ionicons name="briefcase-outline" size={16} color="#666" />
                                <Text style={styles.detailText}>{userProfile.occupation}</Text>
                            </View>
                        )}
                        {userProfile.address && (
                            <View style={styles.detailItem}>
                                <Ionicons name="location-outline" size={16} color="#666" />
                                <Text style={styles.detailText}>{userProfile.address}</Text>
                            </View>
                        )}
                        {userProfile.education && (
                            <View style={styles.detailItem}>
                                <Ionicons name="school-outline" size={16} color="#666" />
                                <Text style={styles.detailText}>{userProfile.education}</Text>
                            </View>
                        )}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtonsContainer}>
                        {renderFriendshipButton()}
                        
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.messageButton]}
                            onPress={startConversation}
                        >
                            <Ionicons name="chatbubble-outline" size={20} color="#007AFF" />
                            <Text style={[styles.actionButtonText, { color: '#007AFF' }]}>Nhắn tin</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Posts/Photos Section */}
                {userProfile.postImages && userProfile.postImages.length > 0 && (
                    <View style={styles.postsSection}>
                        <Text style={styles.sectionTitle}>Bài viết</Text>
                        <View style={styles.postsGrid}>
                            {userProfile.postImages.slice(0, 6).map((image, index) => (
                                <Image
                                    key={index}
                                    source={{ uri: image }}
                                    style={styles.postImage}
                                />
                            ))}
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
        backgroundColor: '#f8f9fa',
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
        backgroundColor: '#fff',
        marginBottom: 10,
    },
    coverImage: {
        width: '100%',
        height: 200,
        backgroundColor: '#007AFF',
    },
    profileImageContainer: {
        position: 'absolute',
        bottom: -60,
        alignSelf: 'center',
        padding: 4,
        backgroundColor: '#fff',
        borderRadius: 64,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    userInfoContainer: {
        backgroundColor: '#fff',
        paddingTop: 70,
        paddingHorizontal: 20,
        paddingBottom: 20,
        alignItems: 'center',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
        textAlign: 'center',
    },
    userEmail: {
        fontSize: 16,
        color: '#666',
        marginBottom: 10,
    },
    userBio: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 15,
    },
    detailsContainer: {
        width: '100%',
        marginBottom: 20,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        justifyContent: 'center',
    },
    detailText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        width: '100%',
        gap: 10,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        borderRadius: 25,
        gap: 5,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    friendButton: {
        backgroundColor: '#E8F5E8',
    },
    pendingButton: {
        backgroundColor: '#FFF3E0',
    },
    acceptButton: {
        backgroundColor: '#4CAF50',
    },
    messageButton: {
        backgroundColor: '#E7F3FF',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    postsSection: {
        backgroundColor: '#fff',
        padding: 15,
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    postsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
    },
    postImage: {
        width: (width - 38) / 3,
        height: (width - 38) / 3,
        borderRadius: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 40,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginTop: 15,
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default UserProfileScreen; 