import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    SafeAreaView,
    View,
    StyleSheet,
    Animated,
    StatusBar,
    Platform,
    Alert,
    RefreshControl
} from 'react-native';
import ProfileHeader from './ProfileHeader';
import ProfileInfo from './ProfileInfo';
import FriendsSection from './FriendsSection';
import ProfileTabs from './ProfileTabs';
import ProfileContent from './ProfileContent';
import AuthService from '../../services/AuthService';
import { ProfileProvider } from '../../components/ProfileContext';

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
        navigation.navigate('EditProfileScreen', {
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

                <View style={styles.contentContainer}>
                    {/* Profile Info Section */}
                    <ProfileInfo
                        onEditProfile={handleEditProfile}
                        onViewIntro={handleViewIntro}
                    />

                    {/* Friends Section */}
                    <FriendsSection
                        onFindFriends={handleFindFriends}
                        onViewAllFriends={handleViewAllFriends}
                    />

                    {/* Profile Tabs */}
                    <ProfileTabs
                        activeTab={activeTab}
                        onTabChange={(tab) => {
                            setActiveTab(tab);
                        }}
                    />

                    {/* Profile Content (Posts, Photos, etc.) */}
                    <ProfileContent
                        activeTab={activeTab}
                        onRefresh={handleRefresh}
                        isRefreshing={isRefreshing}
                        navigation={navigation}
                    />
                </View>
            </SafeAreaView>
        </ProfileProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F2F5',
    },
    contentContainer: {
        flex: 1,
    }
});

export default ProfileScreen;