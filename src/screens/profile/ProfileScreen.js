import React, { useState, useCallback } from 'react';
import {
    SafeAreaView,
    ScrollView,
    RefreshControl,
    StyleSheet
} from 'react-native';
import { ProfileProvider } from '../../components/ProfileContext';
import ProfileHeader from './ProfileHeader';
import ProfileInfo from './ProfileInfo';
import FriendsSection from './FriendsSection';
import ProfileTabs from './ProfileTabs';
import ProfileContent from './ProfileContent';
import AuthService from '../../services/AuthService';

const ProfileScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('posts');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleLogout = useCallback(async () => {
        try {
            await AuthService.logout();
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }]
            });
        } catch (error) {
            console.error('Logout error:', error);
            // Xử lý lỗi đăng xuất
        }
    }, [navigation]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        // Thêm logic refresh dữ liệu ở đây
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1000);
    }, []);

    const handleEditProfile = useCallback(() => {
        navigation.navigate('EditProfile');
    }, [navigation]);

    const handleTabChange = useCallback((tab) => {
        setActiveTab(tab);
    }, []);

    return (
        <ProfileProvider>
            <SafeAreaView style={styles.container}>
                <ScrollView
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            colors={['#1877F2']}
                        />
                    }
                >
                    <ProfileHeader
                        navigation={navigation}
                        onMoreOptionsPress={handleLogout}
                    />

                    <ProfileInfo
                        onEditProfile={handleEditProfile}
                    />

                    <FriendsSection
                        onFindFriends={() => {/* Điều hướng đến màn hình tìm bạn bè */}}
                        onViewAllFriends={() => {/* Điều hướng đến danh sách bạn bè */}}
                    />

                    <ProfileTabs onTabChange={handleTabChange} />

                    <ProfileContent activeTab={activeTab} />
                </ScrollView>
            </SafeAreaView>
        </ProfileProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F2F5',
    },
});

export default ProfileScreen;