import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserProfileService from '../services/UserProfileService';
import sportsProfileService from '../services/sportsProfileService';

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
    const [sportsProfile, setSportsProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sportsLoading, setSportsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Directly use the exported instance
    const userProfileService = UserProfileService;

    // Hàm fetch data từ API
    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load từ AsyncStorage trước (có data ngay lập tức)
            const userProfileString = await AsyncStorage.getItem('userProfile');
            if (userProfileString) {
                const parsedProfile = JSON.parse(userProfileString);
                setUserProfile(parsedProfile);
            }

            const sportsProfileString = await AsyncStorage.getItem('sportsProfile');
            if (sportsProfileString) {
                const parsedSportsProfile = JSON.parse(sportsProfileString);
                setSportsProfile(parsedSportsProfile);
            }

            // Fetch từ API để có data mới nhất
            const [userDataResult, sportsDataResult] = await Promise.allSettled([
                userProfileService.getCurrentUserProfile(),
                sportsProfileService.getMyProfile()
            ]);

            // Process user profile
            if (userDataResult.status === 'fulfilled' && userDataResult.value) {
                setUserProfile(userDataResult.value);
                await AsyncStorage.setItem('userProfile', JSON.stringify(userDataResult.value));
            }

            // Process sports profile
            if (sportsDataResult.status === 'fulfilled' && sportsDataResult.value) {
                setSportsProfile(sportsDataResult.value);
                await AsyncStorage.setItem('sportsProfile', JSON.stringify(sportsDataResult.value));
            } else if (sportsDataResult.status === 'rejected') {
                console.log('🏃‍♂️ No sports profile found - user may not have created one yet');
                setSportsProfile(null);
                await AsyncStorage.removeItem('sportsProfile');
            }

        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu profile:', error);
            setError(error.message || 'Không thể tải thông tin profile');
            // Nếu API lỗi, vẫn giữ data từ AsyncStorage
        } finally {
            setLoading(false);
        }
    };

    // 🏃‍♂️ SPORTS PROFILE FUNCTIONS
    
    // Hàm tạo hoặc cập nhật sports profile
    const createOrUpdateSportsProfile = async (profileData) => {
        try {
            setSportsLoading(true);
            setError(null);

            let result;
            if (sportsProfile?.id) {
                // Update existing profile
                result = await sportsProfileService.updateProfile(sportsProfile.id, profileData);
            } else {
                // Create new profile
                result = await sportsProfileService.createOrUpdateProfile(profileData);
            }

            // Update state and AsyncStorage
            setSportsProfile(result);
            await AsyncStorage.setItem('sportsProfile', JSON.stringify(result));
            
            console.log('✅ Sports profile saved successfully');
            return result;
        } catch (error) {
            console.error('❌ Error saving sports profile:', error);
            setError(error.message || 'Không thể lưu hồ sơ thể thao');
            throw error;
        } finally {
            setSportsLoading(false);
        }
    };

    // Hàm refresh sports profile
    const refreshSportsProfile = async () => {
        try {
            setSportsLoading(true);
            setError(null);

            const result = await sportsProfileService.getMyProfile();
            if (result) {
                setSportsProfile(result);
                await AsyncStorage.setItem('sportsProfile', JSON.stringify(result));
            } else {
                setSportsProfile(null);
                await AsyncStorage.removeItem('sportsProfile');
            }
            
            return result;
        } catch (error) {
            console.error('❌ Error refreshing sports profile:', error);
            setError(error.message || 'Không thể tải lại hồ sơ thể thao');
            throw error;
        } finally {
            setSportsLoading(false);
        }
    };

    // Hàm xóa sports profile
    const deleteSportsProfile = async () => {
        try {
            setSportsLoading(true);
            setError(null);

            if (sportsProfile?.id) {
                await sportsProfileService.deleteProfileById(sportsProfile.id);
            }

            // Clear state and AsyncStorage
            setSportsProfile(null);
            await AsyncStorage.removeItem('sportsProfile');
            
            console.log('✅ Sports profile deleted successfully');
            return true;
        } catch (error) {
            console.error('❌ Error deleting sports profile:', error);
            setError(error.message || 'Không thể xóa hồ sơ thể thao');
            throw error;
        } finally {
            setSportsLoading(false);
        }
    };

    // Hàm tìm kiếm đối tác thể thao
    const findSportsPartners = async (filters = {}) => {
        try {
            setSportsLoading(true);
            setError(null);

            const result = await sportsProfileService.searchProfiles(filters);
            return result;
        } catch (error) {
            console.error('❌ Error finding sports partners:', error);
            setError(error.message || 'Không thể tìm kiếm đối tác thể thao');
            throw error;
        } finally {
            setSportsLoading(false);
        }
    };

    // Hàm tìm người dùng tương thích
    const findCompatibleUsers = async () => {
        try {
            setSportsLoading(true);
            setError(null);

            const result = await sportsProfileService.findCompatibleUsers();
            return result;
        } catch (error) {
            console.error('❌ Error finding compatible users:', error);
            setError(error.message || 'Không thể tìm người dùng tương thích');
            throw error;
        } finally {
            setSportsLoading(false);
        }
    };

    // Hàm kiểm tra xem có sports profile hay không
    const hasSportsProfile = () => {
        return sportsProfile !== null && sportsProfile !== undefined;
    };

    // Hàm lấy thống kê sports profile
    const getSportsStats = () => {
        if (!sportsProfile) return null;

        return {
            favoriteSportsCount: sportsProfile.favoriteSports?.length || 0,
            skillLevel: sportsProfile.skillLevel || 'Chưa xác định',
            activityLevel: sportsProfile.activityLevel || 'Chưa xác định',
            yearsOfExperience: sportsProfile.yearsOfExperience || 0,
            isLookingForPartner: sportsProfile.lookingForPartner || false,
            isLookingForTeam: sportsProfile.lookingForTeam || false,
            isAvailableForTraining: sportsProfile.availableForTraining || false,
            isOpenToCoaching: sportsProfile.openToCoaching || false
        };
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
            setError(error.message || 'Không thể cập nhật profile');
            return false;
        }
    };

    // Hàm refresh data (để component khác có thể gọi)
    const refreshProfile = async () => {
        await fetchUserProfile();
    };

    // Hàm clear error
    const clearError = () => {
        setError(null);
    };

    // Context value
    const value = {
        // User Profile
        userProfile,
        loading,
        error,
        updateProfile,
        refreshProfile,
        fetchUserProfile,
        clearError,
        
        // Sports Profile
        sportsProfile,
        sportsLoading,
        createOrUpdateSportsProfile,
        refreshSportsProfile,
        deleteSportsProfile,
        findSportsPartners,
        findCompatibleUsers,
        hasSportsProfile,
        getSportsStats
    };

    return (
        <ProfileContext.Provider value={value}>
            {children}
        </ProfileContext.Provider>
    );
};

export default ProfileContext;
