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



    // Context value
    const value = {
        userProfile,
        loading,
        updateProfile
    };

    return (
        <ProfileContext.Provider value={value}>
            {children}
        </ProfileContext.Provider>
    );
};

export default ProfileContext;
