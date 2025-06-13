import React, { useState, useCallback, useRef } from 'react';
import {
    SafeAreaView,
    View,
    StyleSheet,
    Animated,
    StatusBar,
    Platform,
    Alert
} from 'react-native';
import ProfileHeader from './ProfileHeader';
import AuthService from '../../services/AuthService';
import { ProfileProvider, useProfileContext } from '../../components/ProfileContext';

// Import các component đã xây dựng
import ProfileContent from './ProfileContent';

const ProfileScreen = ({ navigation }) => {
    // States
    const [activeTab, setActiveTab] = useState('posts');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Animated values
    const scrollY = useRef(new Animated.Value(0)).current;

    // Tính toán chiều cao của StatusBar
    const statusBarHeight = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight || 0;

    // Xử lý refresh
    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        // Thêm các logic refresh khác nếu cần
        setTimeout(() => setIsRefreshing(false), 1000); // Đặt timeout để đảm bảo UX tốt
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

    // Navigate đến màn hình danh sách bạn bè
    const handleViewAllFriends = useCallback(() => {
        navigation.navigate('Messages');
    }, [navigation]);

    // View profile intro/bio đầy đủ
    const handleViewIntro = useCallback(() => {
        navigation.navigate('ProfileIntroScreen');
    }, [navigation]);

    // Thay đổi active tab
    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    // Wrap everything with ProfileProvider for context
    return (
        <ProfileProvider>
            <ProfileScreenContent 
                navigation={navigation}
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
            />
        </ProfileProvider>
    );
};

// Component sử dụng ProfileContext
const ProfileScreenContent = ({ 
    navigation, 
    activeTab, 
    isRefreshing, 
    scrollY, 
    onTabChange, 
    onRefresh, 
    onLogout, 
    onEditProfile, 
    onFindFriends, 
    onViewAllFriends, 
    onViewIntro 
}) => {
    // Get current user from context
    const { userProfile } = useProfileContext();

    // Navigate đến màn hình danh sách bạn bè với currentUser
    const handleViewAllFriends = useCallback(() => {
        navigation.navigate('Messages', { currentUser: userProfile });
    }, [navigation, userProfile]);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar
                backgroundColor="#E91E63"
                barStyle="light-content"
                translucent={false}
            />

            <ProfileHeader
                navigation={navigation}
                onMoreOptionsPress={onLogout}
                scrollY={scrollY}
            />

            {/* Thay đổi cấu trúc: Đưa tất cả nội dung vào ProfileContent để quản lý */}
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
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    }
});

export default ProfileScreen;