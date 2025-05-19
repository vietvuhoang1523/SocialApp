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
import { ProfileProvider } from '../../components/ProfileContext';

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
        navigation.navigate('FindFriendsScreen');
    }, [navigation]);

    // Navigate đến màn hình danh sách bạn bè
    const handleViewAllFriends = useCallback(() => {
        navigation.navigate('FriendsListScreen');
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
            <SafeAreaView style={styles.container}>
                <StatusBar
                    backgroundColor="transparent"
                    barStyle="dark-content"
                    translucent
                />

                <ProfileHeader
                    navigation={navigation}
                    onMoreOptionsPress={confirmLogout}
                    scrollY={scrollY}
                />

                {/* Thay đổi cấu trúc: Đưa tất cả nội dung vào ProfileContent để quản lý */}
                <ProfileContent
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    onRefresh={handleRefresh}
                    isRefreshing={isRefreshing}
                    navigation={navigation}
                    scrollY={scrollY}
                    onEditProfile={handleEditProfile}
                    onViewIntro={handleViewIntro}
                    onFindFriends={handleFindFriends}
                    onViewAllFriends={handleViewAllFriends}
                />
            </SafeAreaView>
        </ProfileProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F2F5',
    }
});

export default ProfileScreen;