import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserProfileService from '../services/UserProfileService';

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
    const [loading, setLoading] = useState(true);

    // Directly use the exported instance
    const userProfileService = UserProfileService;

    // Hàm fetch data từ API
    const fetchUserProfile = async () => {
        try {
            setLoading(true);

            // Lấy userProfile từ AsyncStorage trước (để có data ngay lập tức)
            const userProfileString = await AsyncStorage.getItem('userProfile');
            if (userProfileString) {
                const parsedProfile = JSON.parse(userProfileString);
                setUserProfile(parsedProfile);
            }

            // Sau đó fetch từ API để có data mới nhất
            const userData = await userProfileService.getCurrentUserProfile();
            if (userData) {
                setUserProfile(userData);
                // Lưu data mới vào AsyncStorage
                await AsyncStorage.setItem('userProfile', JSON.stringify(userData));
            }

        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu profile:', error);
            // Nếu API lỗi, vẫn giữ data từ AsyncStorage
        } finally {
            setLoading(false);
        }
    };

    // Lấy thông tin profile từ AsyncStorage và API khi component được mount
    useEffect(() => {
        fetchUserProfile();
    }, []);

    // Hàm cập nhật profile
    const updateProfile = async (newProfileData) => {
        try {
            // Cập nhật state ngay lập tức
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

    // Hàm refresh data (để component khác có thể gọi)
    const refreshProfile = async () => {
        await fetchUserProfile();
    };

    // Context value
    const value = {
        userProfile,
        loading,
        updateProfile,
        refreshProfile,
        fetchUserProfile
    };

    return (
        <ProfileContext.Provider value={value}>
            {children}
        </ProfileContext.Provider>
    );
};

export default ProfileContext;
