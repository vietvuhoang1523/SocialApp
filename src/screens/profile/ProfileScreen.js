import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    SafeAreaView,
    View,
    StyleSheet,
    Animated,
    StatusBar,
    Platform,
    Alert,
    Modal,
    TouchableOpacity,
    Text,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ProfileHeader from './ProfileHeader';
import AuthService from '../../services/AuthService';
import { ProfileProvider, useProfileContext } from '../../components/ProfileContext';

// Import các component đã xây dựng
import ProfileContent from './ProfileContent';

// Menu Component
const ProfileMenu = ({ visible, onClose, navigation, onLogout }) => {
    const menuSections = [
        {
            title: '👤 Hồ sơ cá nhân',
            items: [
                {
                    id: 'edit_profile',
                    title: 'Chỉnh sửa hồ sơ',
                    icon: 'person-circle-outline',
                    color: '#E91E63',
                    action: () => {
                        onClose();
                        navigation.navigate('EditProfile');
                    }
                },
                {
                    id: 'update_avatar',
                    title: 'Cập nhật ảnh đại diện',
                    icon: 'camera-outline',
                    color: '#9C27B0',
                    action: () => {
                        onClose();
                        navigation.navigate('EditProfile', { focusSection: 'avatar' });
                    }
                },
                {
                    id: 'update_cover',
                    title: 'Cập nhật ảnh bìa',
                    icon: 'image-outline',
                    color: '#673AB7',
                    action: () => {
                        onClose();
                        navigation.navigate('EditProfile', { focusSection: 'cover' });
                    }
                },
                {
                    id: 'view_profile',
                    title: 'Xem hồ sơ của tôi',
                    icon: 'eye-outline',
                    color: '#3F51B5',
                    action: () => {
                        onClose();
                        Alert.alert('Xem hồ sơ', 'Bạn đang xem hồ sơ của chính mình');
                    }
                }
            ]
        },
        {
            title: '📍 Vị trí & Địa điểm',
            items: [
                {
                    id: 'location_management',
                    title: 'Quản lý vị trí',
                    icon: 'location-outline',
                    color: '#607D8B',
                    action: () => {
                        onClose();
                        navigation.navigate('ProfileScreen', { initialTab: 'location' });
                    }
                },
                {
                    id: 'nearby_users',
                    title: 'Người dùng gần đây',
                    icon: 'people-outline',
                    color: '#795548',
                    action: () => {
                        onClose();
                        navigation.navigate('ProfileScreen', { initialTab: 'location', locationTab: 'nearby' });
                    }
                },
                {
                    id: 'location_settings',
                    title: 'Cài đặt vị trí',
                    icon: 'settings-outline',
                    color: '#546E7A',
                    action: () => {
                        onClose();
                        navigation.navigate('ProfileScreen', { initialTab: 'location', locationTab: 'settings' });
                    }
                },
                {
                    id: 'location_history',
                    title: 'Lịch sử vị trí',
                    icon: 'time-outline',
                    color: '#78909C',
                    action: () => {
                        onClose();
                        Alert.alert('Lịch sử vị trí', 'Chức năng lịch sử vị trí đang được phát triển');
                    }
                }
            ]
        },
        {
            title: '🏃‍♂️ Thể thao & Hoạt động',
            items: [
                {
                    id: 'view_sports_profile',
                    title: 'Xem hồ sơ thể thao',
                    icon: 'fitness-outline',
                    color: '#4CAF50',
                    action: () => {
                        onClose();
                        navigation.navigate('ViewSportsProfileScreen', { 
                            isMyProfile: true,
                            userName: 'tôi'
                        });
                    }
                },
                {
                    id: 'edit_sports_profile',
                    title: 'Chỉnh sửa hồ sơ thể thao',
                    icon: 'create-outline',
                    color: '#2196F3',
                    action: () => {
                        onClose();
                        navigation.navigate('SportsProfileScreen');
                    }
                },
                {
                    id: 'sports_activity',
                    title: 'Tạo hoạt động thể thao',
                    icon: 'add-circle-outline',
                    color: '#8BC34A',
                    action: () => {
                        onClose();
                        navigation.navigate('CreateSportsPost');
                    }
                },
                {
                    id: 'sports_matching',
                    title: 'Tìm đối tác thể thao',
                    icon: 'people-circle-outline',
                    color: '#E91E63',
                    action: () => {
                        onClose();
                        navigation.navigate('SportsMatchingScreen');
                    }
                },
                {
                    id: 'match_requests',
                    title: 'Yêu cầu ghép đôi',
                    icon: 'heart-circle-outline',
                    color: '#FF6B6B',
                    action: () => {
                        onClose();
                        navigation.navigate('MatchRequestsScreen');
                    }
                },
                {
                    id: 'sports_availability',
                    title: 'Khả năng tham gia',
                    icon: 'calendar-outline',
                    color: '#4ECDC4',
                    action: () => {
                        onClose();
                        navigation.navigate('SportsAvailabilityScreen');
                    }
                },
                {
                    id: 'sports_requests',
                    title: 'Yêu cầu tham gia',
                    icon: 'mail-outline',
                    color: '#FF9800',
                    action: () => {
                        onClose();
                        navigation.navigate('AllPendingRequests');
                    }
                },
                {
                    id: 'workout_tracking',
                    title: 'Theo dõi luyện tập',
                    icon: 'stats-chart-outline',
                    color: '#00BCD4',
                    action: () => {
                        onClose();
                        navigation.navigate('WorkoutTrackingScreen');
                    }
                },
                {
                    id: 'workout_history',
                    title: 'Lịch sử luyện tập',
                    icon: 'library-outline',
                    color: '#009688',
                    action: () => {
                        onClose();
                        navigation.navigate('WorkoutHistoryScreen');
                    }
                }
            ]
        },
        {
            title: '👥 Kết bạn & Tin nhắn',
            items: [
                {
                    id: 'find_friends',
                    title: 'Tìm bạn bè',
                    icon: 'person-add-outline',
                    color: '#2196F3',
                    action: () => {
                        onClose();
                        navigation.navigate('FriendSearch');
                    }
                },
                {
                    id: 'friend_requests',
                    title: 'Lời mời kết bạn',
                    icon: 'people-outline',
                    color: '#FF9800',
                    action: () => {
                        onClose();
                        navigation.navigate('FriendRequestsScreen');
                    }
                },
                {
                    id: 'messages',
                    title: 'Tin nhắn',
                    icon: 'chatbubbles-outline',
                    color: '#E91E63',
                    action: () => {
                        onClose();
                        navigation.navigate('NewMessages');
                    }
                },
                {
                    id: 'notifications',
                    title: 'Thông báo',
                    icon: 'notifications-outline',
                    color: '#9C27B0',
                    action: () => {
                        onClose();
                        navigation.navigate('NotificationsScreen');
                    }
                },
                {
                    id: 'blocked_users',
                    title: 'Người dùng bị chặn',
                    icon: 'ban-outline',
                    color: '#F44336',
                    action: () => {
                        onClose();
                        Alert.alert('Người dùng bị chặn', 'Chức năng quản lý người dùng bị chặn đang được phát triển');
                    }
                }
            ]
        },
        {
            title: '📊 Hoạt động & Thống kê',
            items: [
                {
                    id: 'activity_tracking',
                    title: 'Theo dõi hoạt động',
                    icon: 'pulse-outline',
                    color: '#FF5722',
                    action: () => {
                        onClose();
                        navigation.navigate('ActivityTrackingScreen');
                    }
                },
                {
                    id: 'my_posts',
                    title: 'Bài viết của tôi',
                    icon: 'document-text-outline',
                    color: '#607D8B',
                    action: () => {
                        onClose();
                        navigation.navigate('ProfileScreen', { initialTab: 'posts' });
                    }
                },
                {
                    id: 'saved_posts',
                    title: 'Bài viết đã lưu',
                    icon: 'bookmark-outline',
                    color: '#795548',
                    action: () => {
                        onClose();
                        Alert.alert('Bài viết đã lưu', 'Chức năng bài viết đã lưu đang được phát triển');
                    }
                },
                {
                    id: 'analytics',
                    title: 'Thống kê cá nhân',
                    icon: 'analytics-outline',
                    color: '#3F51B5',
                    action: () => {
                        onClose();
                        Alert.alert('Thống kê', 'Chức năng thống kê cá nhân đang được phát triển');
                    }
                }
            ]
        },
        {
            title: '🛡️ Bảo mật & Báo cáo',
            items: [
                {
                    id: 'security_settings',
                    title: 'Cài đặt bảo mật',
                    icon: 'shield-checkmark-outline',
                    color: '#4CAF50',
                    action: () => {
                        onClose();
                        Alert.alert('Bảo mật', 'Chức năng cài đặt bảo mật đang được phát triển');
                    }
                },
                {
                    id: 'privacy_settings',
                    title: 'Quyền riêng tư',
                    icon: 'lock-closed-outline',
                    color: '#607D8B',
                    action: () => {
                        onClose();
                        Alert.alert('Quyền riêng tư', 'Chức năng quyền riêng tư đang được phát triển');
                    }
                },
                {
                    id: 'report_problem',
                    title: 'Báo cáo sự cố',
                    icon: 'flag-outline',
                    color: '#F44336',
                    action: () => {
                        onClose();
                        navigation.navigate('ReportScreen');
                    }
                },
                {
                    id: 'report_management',
                    title: 'Quản lý báo cáo',
                    icon: 'document-outline',
                    color: '#FF5722',
                    action: () => {
                        onClose();
                        navigation.navigate('ReportManagementScreen');
                    }
                }
            ]
        },
        {
            title: '⚙️ Cài đặt & Hỗ trợ',
            items: [
                {
                    id: 'general_settings',
                    title: 'Cài đặt chung',
                    icon: 'cog-outline',
                    color: '#795548',
                    action: () => {
                        onClose();
                        Alert.alert('Cài đặt chung', 'Chức năng cài đặt chung đang được phát triển');
                    }
                },
                {
                    id: 'language_settings',
                    title: 'Ngôn ngữ',
                    icon: 'language-outline',
                    color: '#9C27B0',
                    action: () => {
                        onClose();
                        Alert.alert('Ngôn ngữ', 'Chức năng thay đổi ngôn ngữ đang được phát triển');
                    }
                },
                {
                    id: 'help_support',
                    title: 'Trợ giúp & Hỗ trợ',
                    icon: 'help-circle-outline',
                    color: '#2196F3',
                    action: () => {
                        onClose();
                        Alert.alert('Trợ giúp', 'Liên hệ hỗ trợ: support@socialapp.com\nPhone: 1900-xxx-xxx');
                    }
                },
                {
                    id: 'about_app',
                    title: 'Về ứng dụng',
                    icon: 'information-circle-outline',
                    color: '#607D8B',
                    action: () => {
                        onClose();
                        Alert.alert('Về ứng dụng', 'Social Matching App\nPhiên bản: 1.0.0\nĐược phát triển bởi Nguyễn Tiến Thành');
                    }
                },
                {
                    id: 'terms_privacy',
                    title: 'Điều khoản & Chính sách',
                    icon: 'document-text-outline',
                    color: '#546E7A',
                    action: () => {
                        onClose();
                        Alert.alert('Điều khoản', 'Chức năng xem điều khoản và chính sách đang được phát triển');
                    }
                },
                {
                    id: 'logout',
                    title: 'Đăng xuất',
                    icon: 'log-out-outline',
                    color: '#F44336',
                    action: () => {
                        onClose();
                        onLogout();
                    }
                }
            ]
        }
    ];

    console.log('🔧 Menu rendering, sections:', menuSections.length);
    console.log('🔧 First section items:', menuSections[0]?.items?.length);

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <TouchableOpacity 
                style={styles.menuOverlay} 
                activeOpacity={1} 
                onPress={onClose}
            >
                <View style={styles.menuContainer}>
                    <View style={styles.menuHeader}>
                        <Text style={styles.menuTitle}>🔧 Menu Quản lý</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>
                    
                    {/* Add ScrollView back for scrolling */}
                    <ScrollView 
                        style={styles.menuContent} 
                        showsVerticalScrollIndicator={false}
                        bounces={true}
                    >
                        {menuSections.map((section, sectionIndex) => {
                            console.log('🔧 Rendering section:', section.title);
                            return (
                                <View key={sectionIndex} style={styles.menuSection}>
                                    <Text style={styles.sectionTitle}>{section.title}</Text>
                                    {section.items.map((item, itemIndex) => {
                                        console.log('🔧 Rendering item:', item.title);
                                        return (
                                            <TouchableOpacity
                                                key={item.id}
                                                style={styles.menuItem}
                                                onPress={() => {
                                                    console.log('🔧 Item pressed:', item.title);
                                                    item.action();
                                                }}
                                                activeOpacity={0.7}
                                            >
                                                <View style={[styles.menuItemIcon, { backgroundColor: item.color + '20' }]}>
                                                    <Ionicons name={item.icon} size={22} color={item.color} />
                                                </View>
                                                <Text style={styles.menuItemText}>{item.title}</Text>
                                                <Ionicons name="chevron-forward" size={18} color="#ccc" />
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            );
                        })}
                        
                        <View style={styles.menuFooter}>
                            <Text style={styles.footerText}>
                                Tất cả chức năng quản lý hồ sơ, vị trí và thể thao trong một nơi
                            </Text>
                        </View>
                    </ScrollView>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const ProfileScreen = ({ navigation, route }) => {
    // States
    const [activeTab, setActiveTab] = useState('posts');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    // Animated values
    const scrollY = useRef(new Animated.Value(0)).current;

    // Check if we need to switch to a specific tab from route params
    useEffect(() => {
        if (route?.params?.initialTab) {
            setActiveTab(route.params.initialTab);
        }
    }, [route?.params?.initialTab]);

    // Tính toán chiều cao của StatusBar
    const statusBarHeight = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight || 0;

    // Xử lý refresh
    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            // Add any refresh logic here
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error('Refresh error:', error);
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    // Confirm dialog khi logout
    const confirmLogout = useCallback(() => {
        Alert.alert(
            'Đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất?',
            [
                {
                    text: 'Hủy',
                    style: 'cancel'
                },
                {
                    text: 'Đăng xuất',
                    onPress: handleLogout,
                    style: 'destructive'
                }
            ],
            { cancelable: true }
        );
    }, []);

    // Xử lý đăng xuất
    const handleLogout = useCallback(async () => {
        try {
            await AuthService.logout();
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }]
            });
        } catch (error) {
            console.error('Logout error:', error);
            Alert.alert(
                'Lỗi đăng xuất',
                'Không thể đăng xuất. Vui lòng thử lại sau.',
                [{ text: 'OK' }]
            );
        }
    }, [navigation]);

    // Navigate đến màn hình chỉnh sửa profile
    const handleEditProfile = useCallback(() => {
        navigation.navigate('EditProfile', {
            onProfileUpdated: handleRefresh
        });
    }, [navigation, handleRefresh]);

    // Navigate đến màn hình tìm bạn bè
    const handleFindFriends = useCallback(() => {
        navigation.navigate('FriendSearch');
    }, [navigation]);

    // Navigate đến màn hình danh sách bạn bè - PLACEHOLDER (real function is in ProfileScreenContent)
    const handleViewAllFriends = useCallback(() => {
        console.warn('⚠️ This function should not be called - use the one in ProfileScreenContent instead');
    }, []);

    // View profile intro/bio đầy đủ
    const handleViewIntro = useCallback(() => {
        Alert.alert(
            'Giới thiệu chi tiết', 
            'Chức năng xem giới thiệu chi tiết đang được phát triển',
            [{ text: 'OK' }]
        );
    }, []);

    // Thay đổi active tab với logging
    const handleTabChange = useCallback((tab) => {
        console.log('🔄 Tab changing from', activeTab, 'to', tab);
        setActiveTab(tab);
    }, [activeTab]);

    // Handle menu open
    const handleMenuOpen = useCallback(() => {
        setShowMenu(true);
    }, []);

    // Handle menu close
    const handleMenuClose = useCallback(() => {
        setShowMenu(false);
    }, []);

    // Wrap everything with ProfileProvider for context
    return (
        <ProfileProvider>
            <ProfileScreenContent 
                navigation={navigation}
                route={route}
                activeTab={activeTab}
                isRefreshing={isRefreshing}
                scrollY={scrollY}
                onTabChange={handleTabChange}
                onRefresh={handleRefresh}
                onLogout={confirmLogout}
                onEditProfile={handleEditProfile}
                onFindFriends={handleFindFriends}
                onViewAllFriends={handleViewAllFriends}
                onViewIntro={handleViewIntro}
                onMenuOpen={handleMenuOpen}
            />
            
            {/* Menu Modal */}
            <ProfileMenu 
                visible={showMenu}
                onClose={handleMenuClose}
                navigation={navigation}
                onLogout={confirmLogout}
            />
        </ProfileProvider>
    );
};

// Component sử dụng ProfileContext
const ProfileScreenContent = ({ 
    navigation, 
    route,
    activeTab, 
    isRefreshing, 
    scrollY, 
    onTabChange, 
    onRefresh, 
    onLogout, 
    onEditProfile, 
    onFindFriends, 
    onViewIntro,
    onMenuOpen
}) => {
    // Get current user from context
    const { userProfile } = useProfileContext();

    // Navigate đến màn hình danh sách bạn bè với currentUser
    const handleViewAllFriends = useCallback(() => {
        if (userProfile) {
            navigation.navigate('NewMessages', { currentUser: userProfile });
        } else {
            Alert.alert('Thông báo', 'Đang tải thông tin người dùng...');
        }
    }, [navigation, userProfile]);

    console.log('📱 ProfileScreenContent render - activeTab:', activeTab);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar
                backgroundColor="#E91E63"
                barStyle="light-content"
                translucent={false}
            />

            <ProfileHeader
                navigation={navigation}
                onMoreOptionsPress={onMenuOpen}
                scrollY={scrollY}
            />

            <ProfileContent
                activeTab={activeTab}
                onTabChange={onTabChange}
                onRefresh={onRefresh}
                isRefreshing={isRefreshing}
                navigation={navigation}
                scrollY={scrollY}
                onEditProfile={onEditProfile}
                onViewIntro={onViewIntro}
                onFindFriends={onFindFriends}
                onViewAllFriends={handleViewAllFriends}
                locationTab={route?.params?.locationTab}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    // Menu Styles
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    menuContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        width: '90%',
        height: '70%',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    menuHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fafafa',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    menuTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        padding: 5,
    },
    menuContent: {
        flex: 1,
        backgroundColor: '#fff',
    },
    
    menuSection: {
        marginBottom: 5,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#f8f9fa',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
        backgroundColor: '#fff',
    },
    menuItemIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    menuItemText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    menuFooter: {
        padding: 15,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        backgroundColor: '#fafafa',
    },
    footerText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        fontStyle: 'italic',
    },
});

export default ProfileScreen;