import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Tạo context cho profile
const ProfileContext = createContext();

// Hook để sử dụng ProfileContext
export const useProfileContext = () => {
    const context = useContext(ProfileContext);
    if (!context) {
        throw new Error('useProfileContext phải được sử dụng trong ProfileProvider');
    }
    return context;
};

// Provider component
export const ProfileProvider = ({ children }) => {
    const [userProfile, setUserProfile] = useState(null);
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Lấy thông tin profile từ AsyncStorage khi component được mount
    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setLoading(true);

                // Lấy userProfile từ AsyncStorage
                const userProfileString = await AsyncStorage.getItem('userProfile');
                if (userProfileString) {
                    const parsedProfile = JSON.parse(userProfileString);
                    setUserProfile(parsedProfile);
                }

                // Có thể lấy thêm followerCount và followingCount từ storage hoặc API
                const followerCountString = await AsyncStorage.getItem('followerCount');
                const followingCountString = await AsyncStorage.getItem('followingCount');

                if (followerCountString) setFollowerCount(parseInt(followerCountString, 10));
                if (followingCountString) setFollowingCount(parseInt(followingCountString, 10));

            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, []);

    // Hàm cập nhật profile
    const updateProfile = async (newProfileData) => {
        try {
            // Cập nhật state
            setUserProfile(prevProfile => ({
                ...prevProfile,
                ...newProfileData
            }));

            // Lưu vào AsyncStorage
            const currentProfileString = await AsyncStorage.getItem('userProfile');
            let currentProfile = {};

            if (currentProfileString) {
                currentProfile = JSON.parse(currentProfileString);
            }

            const updatedProfile = {
                ...currentProfile,
                ...newProfileData
            };

            await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));

            return true;
        } catch (error) {
            console.error('Lỗi khi cập nhật profile:', error);
            return false;
        }
    };

    // Cập nhật số lượng follower
    const updateFollowerCount = async (count) => {
        setFollowerCount(count);
        await AsyncStorage.setItem('followerCount', count.toString());
    };

    // Cập nhật số lượng following
    const updateFollowingCount = async (count) => {
        setFollowingCount(count);
        await AsyncStorage.setItem('followingCount', count.toString());
    };

    // Context value
    const value = {
        userProfile,
        followerCount,
        followingCount,
        loading,
        updateProfile,
        updateFollowerCount,
        updateFollowingCount
    };

    return (
        <ProfileContext.Provider value={value}>
            {children}
        </ProfileContext.Provider>
    );
};

export default ProfileContext;