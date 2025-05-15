import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo
} from 'react';
import UserProfileService from '../services/UserProfileService';
import FollowService from '../services/FollowService';

// Hằng số mặc định
const DEFAULT_PROFILE_IMAGE = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

// Tạo context
const ProfileContext = createContext();

// Provider component
export const ProfileProvider = ({ children, initialProfile = null }) => {
    // State quản lý profile
    const [userProfile, setUserProfile] = useState(initialProfile);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);

    // Khởi tạo các service
    const userProfileService = useMemo(() => new UserProfileService(), []);
    const followService = useMemo(() => new FollowService(), []);

    // Lấy tên đầy đủ
    const getFullName = useMemo(() => {
        if (!userProfile) return 'Người dùng';

        const firstName = userProfile.firstname || '';
        const lastName = userProfile.lastname || '';

        if (userProfile.fullName) {
            return userProfile.fullName;
        } else if (firstName && lastName) {
            return `${firstName} ${lastName}`;
        } else if (firstName) {
            return firstName;
        } else if (lastName) {
            return lastName;
        } else {
            return 'Người dùng';
        }
    }, [userProfile]);

    // Lấy URL ảnh đại diện
    const profileImageUrl = useMemo(() => {
        if (!userProfile) return DEFAULT_PROFILE_IMAGE;

        return userProfileService.getFileUrl(
            userProfile.profilePictureBucket || 'default',
            userProfile.profilePicturePath || ''
        ) || DEFAULT_PROFILE_IMAGE;
    }, [userProfile, userProfileService]);

    // Lấy URL ảnh bìa
    const coverImageUrl = useMemo(() => {
        if (!userProfile?.coverImagePath) return require('../assets/h1.png');

        return {
            uri: userProfileService.getFileUrl(
                userProfile.coverImageBucket || 'default',
                userProfile.coverImagePath
            )
        };
    }, [userProfile, userProfileService]);

    // Hàm tải thông tin người dùng
    const fetchUserProfile = useCallback(async () => {
        if (refreshing) return;

        setLoading(true);
        try {
            // Lấy thông tin profile của người dùng hiện tại
            const userData = await userProfileService.getCurrentUserProfile();
            setUserProfile(userData);

            // Lấy số lượng followers và following
            const followers = await followService.getFollowerCount(userData.id);
            const following = await followService.getFollowingCount(userData.id);

            setFollowerCount(followers);
            setFollowingCount(following);
        } catch (error) {
            console.error('Error fetching user profile:', error);
            // Có thể thêm xử lý lỗi ở đây
        } finally {
            setLoading(false);
        }
    }, [refreshing, userProfileService, followService]);

    // Hàm refresh profile
    const refreshProfile = useCallback(async () => {
        setRefreshing(true);
        await fetchUserProfile();
        setRefreshing(false);
    }, [fetchUserProfile]);

    // Hàm cập nhật profile
    const updateProfile = useCallback(async (updatedData) => {
        try {
            const updatedProfile = await userProfileService.updateProfile(updatedData);
            setUserProfile(prevProfile => ({
                ...prevProfile,
                ...updatedProfile
            }));
            return updatedProfile;
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    }, [userProfileService]);

    // Effect để tải profile khi component mount
    useEffect(() => {
        fetchUserProfile();
    }, []);

    // Giá trị context
    const contextValue = {
        // Thông tin profile
        userProfile,
        loading,
        refreshing,
        followerCount,
        followingCount,

        // Các hàm xử lý
        fetchUserProfile,
        refreshProfile,
        updateProfile,

        // Các computed values
        getFullName,
        profileImageUrl,
        coverImageUrl,
    };

    return (
        <ProfileContext.Provider value={contextValue}>
            {children}
        </ProfileContext.Provider>
    );
};

// Custom hook để sử dụng context
export const useProfileContext = () => {
    const context = useContext(ProfileContext);
    if (!context) {
        throw new Error('useProfileContext must be used within a ProfileProvider');
    }
    return context;
};