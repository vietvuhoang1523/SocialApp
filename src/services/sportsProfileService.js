import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, DEFAULT_TIMEOUT, DEFAULT_HEADERS, FORM_DATA_HEADERS } from './api';

class SportsProfileService {
    constructor() {
        this.api = axios.create({
            baseURL: `${BASE_URL}/v1/sports-profiles`,
            timeout: DEFAULT_TIMEOUT,
            headers: DEFAULT_HEADERS,
        });

        // Thêm interceptor để gắn token vào mỗi request
        this.api.interceptors.request.use(
            async (config) => {
                const token = await AsyncStorage.getItem('accessToken');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Interceptor để xử lý lỗi 401 và refresh token nếu cần
        this.api.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                // Kiểm tra lỗi 401 (Unauthorized) và chưa thử refresh token
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;
                    try {
                        global.authExpired = true;
                        return Promise.reject(error);
                    } catch (refreshError) {
                        global.authExpired = true;
                        return Promise.reject(error);
                    }
                }
                return Promise.reject(error);
            }
        );
    }

    // ===== CRUD OPERATIONS =====

    /**
     * Create or update sports profile
     * POST /api/v1/sports-profiles
     */
    async createOrUpdateProfile(profileData) {
        try {
            console.log('🏃‍♂️ Creating/updating sports profile:', profileData);
            const response = await this.api.post('/', profileData);
            console.log('✅ Sports profile created/updated successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error creating/updating sports profile:', error);
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Get my sports profile
     * GET /api/v1/sports-profiles/me
     */
    async getMyProfile() {
        try {
            console.log('🔍 Fetching my sports profile...');
            const response = await this.api.get('/me');
            console.log('✅ Sports profile fetched successfully:', response.data);
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('📝 No sports profile found for current user');
                return null;
            }
            console.error('❌ Error fetching sports profile:', error);
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Get sports profile by user ID
     * GET /api/v1/sports-profiles/user/{userId}
     */
    async getProfileByUserId(userId) {
        try {
            console.log('🔍 Fetching sports profile for user:', userId);
            const response = await this.api.get(`/user/${userId}`);
            console.log('✅ User sports profile fetched successfully:', response.data);
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('📝 No sports profile found for user:', userId);
                return null;
            }
            console.error('❌ Error fetching user sports profile:', error);
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Update sports profile
     * PUT /api/v1/sports-profiles/{id}
     */
    async updateProfile(profileId, profileData) {
        try {
            console.log('🔄 Updating sports profile:', profileId, profileData);
            const response = await this.api.put(`/${profileId}`, profileData);
            console.log('✅ Sports profile updated successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error updating sports profile:', error);
            this.handleError(error);
            throw error;
        }
    }

    // ===== SEARCH & FILTER OPERATIONS =====

    /**
     * Search sports profiles by filters
     * GET /api/v1/sports-profiles/search
     */
    async searchProfiles(filters = {}) {
        try {
            console.log('🔍 Searching sports profiles with filters:', filters);
            const response = await this.api.get('/search', { params: filters });
            console.log('✅ Sports profiles search completed:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error searching sports profiles:', error);
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Search sports profiles by sport, skill level, and activity level
     * GET /api/v1/sports-profiles/search?sport=X&skillLevel=Y&activityLevel=Z
     */
    async searchBySportAndLevels(sport, skillLevel, activityLevel) {
        try {
            console.log('🔍 Searching sports profiles with specific filters:', { sport, skillLevel, activityLevel });
            const params = {};
            if (sport) params.sport = sport;
            if (skillLevel) params.skillLevel = skillLevel;
            if (activityLevel) params.activityLevel = activityLevel;
            
            const response = await this.api.get('/search', { params });
            console.log('✅ Filtered sports profiles found:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error searching sports profiles with filters:', error);
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Find compatible users
     * GET /api/v1/sports-profiles/compatible
     */
    async findCompatibleUsers() {
        try {
            console.log('🤝 Finding compatible users...');
            const response = await this.api.get('/compatible');
            console.log('✅ Compatible users found:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error finding compatible users:', error);
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Get users looking for partner
     * GET /api/v1/sports-profiles/looking-for-partner
     */
    async getUsersLookingForPartner() {
        try {
            console.log('👥 Finding users looking for partner...');
            const response = await this.api.get('/looking-for-partner');
            console.log('✅ Users looking for partner found:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error finding users looking for partner:', error);
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Get users looking for team
     * GET /api/v1/sports-profiles/looking-for-team
     */
    async getUsersLookingForTeam() {
        try {
            console.log('👥 Finding users looking for team...');
            const response = await this.api.get('/looking-for-team');
            console.log('✅ Users looking for team found:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error finding users looking for team:', error);
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Get users available for training
     * GET /api/v1/sports-profiles/available-for-training
     */
    async getUsersAvailableForTraining() {
        try {
            console.log('🏋️‍♂️ Finding users available for training...');
            const response = await this.api.get('/available-for-training');
            console.log('✅ Users available for training found:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error finding users available for training:', error);
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Get users open to coaching
     * GET /api/v1/sports-profiles/open-to-coaching
     */
    async getUsersOpenToCoaching() {
        try {
            console.log('🎯 Finding users open to coaching...');
            const response = await this.api.get('/open-to-coaching');
            console.log('✅ Users open to coaching found:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error finding users open to coaching:', error);
            this.handleError(error);
            throw error;
        }
    }

    // ===== PREFERENCE UPDATES =====

    /**
     * Update contact preferences
     * PATCH /api/v1/sports-profiles/preferences
     */
    async updateContactPreferences(preferences) {
        try {
            console.log('⚙️ Updating contact preferences:', preferences);
            const response = await this.api.patch('/preferences', preferences);
            console.log('✅ Contact preferences updated successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error updating contact preferences:', error);
            this.handleError(error);
            throw error;
        }
    }

    // ===== COMPATIBILITY CALCULATIONS =====

    /**
     * Calculate compatibility with another user
     * GET /api/v1/sports-profiles/compatibility/{userId}
     */
    async calculateCompatibility(userId) {
        try {
            console.log('🔢 Calculating compatibility with user:', userId);
            const response = await this.api.get(`/compatibility/${userId}`);
            console.log('✅ Compatibility calculated:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error calculating compatibility:', error);
            this.handleError(error);
            throw error;
        }
    }

    // ===== VALIDATION HELPERS =====

    /**
     * Validate sports profile data before sending to backend
     */
    validateProfileData(profileData) {
        const errors = [];

        // Required fields
        if (!profileData.favoriteSports || profileData.favoriteSports.length === 0) {
            errors.push('Phải chọn ít nhất một môn thể thao yêu thích');
        }

        if (!profileData.skillLevel) {
            errors.push('Phải chọn trình độ kỹ năng');
        }

        if (!profileData.activityLevel) {
            errors.push('Phải chọn mức độ hoạt động');
        }

        // Numeric validations
        if (profileData.yearsOfExperience && (
            isNaN(profileData.yearsOfExperience) ||
            profileData.yearsOfExperience < 0 ||
            profileData.yearsOfExperience > 100
        )) {
            errors.push('Số năm kinh nghiệm phải là số từ 0 đến 100');
        }

        if (profileData.height && (
            isNaN(profileData.height) ||
            profileData.height < 50 ||
            profileData.height > 300
        )) {
            errors.push('Chiều cao phải là số từ 50cm đến 300cm');
        }

        if (profileData.weight && (
            isNaN(profileData.weight) ||
            profileData.weight < 20 ||
            profileData.weight > 500
        )) {
            errors.push('Cân nặng phải là số từ 20kg đến 500kg');
        }

        if (profileData.maxTravelDistance && (
            isNaN(profileData.maxTravelDistance) ||
            profileData.maxTravelDistance < 0 ||
            profileData.maxTravelDistance > 1000
        )) {
            errors.push('Khoảng cách di chuyển tối đa phải là số từ 0 đến 1000km');
        }

        return errors;
    }

    /**
     * Get or create profile ID for a user
     * Helper method to handle profile IDs properly
     */
    async getOrCreateProfileId(userId) {
        try {
            // Try to get existing profile
            const profile = await this.getProfileByUserId(userId);
            
            if (profile && profile.id) {
                return profile.id;
            }
            
            // If no profile exists, create a basic one
            const newProfile = await this.createOrUpdateProfile({
                favoriteSports: ['FOOTBALL'], // Default sport
                skillLevel: 'BEGINNER',
                activityLevel: 'MODERATE'
            });
            
            return newProfile.id;
        } catch (error) {
            console.error('❌ Error getting or creating profile ID:', error);
            throw error;
        }
    }

    /**
     * Format profile data for backend
     */
    formatProfileDataForBackend(profileData) {
        const formatted = { ...profileData };

        // Convert string numbers to actual numbers
        if (formatted.yearsOfExperience) {
            formatted.yearsOfExperience = parseInt(formatted.yearsOfExperience, 10);
        }
        if (formatted.height) {
            formatted.height = parseFloat(formatted.height);
        }
        if (formatted.weight) {
            formatted.weight = parseFloat(formatted.weight);
        }
        if (formatted.maxTravelDistance) {
            formatted.maxTravelDistance = parseFloat(formatted.maxTravelDistance);
        }

        // Handle enum values
        const validSkillLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL'];
        const validActivityLevels = ['LOW', 'MODERATE', 'HIGH', 'VERY_HIGH'];
        const validSportTypes = [
            'FOOTBALL', 'BASKETBALL', 'TENNIS', 'BADMINTON', 'VOLLEYBALL',
            'SWIMMING', 'RUNNING', 'GYM', 'CYCLING', 'YOGA'
        ];

        if (formatted.skillLevel && !validSkillLevels.includes(formatted.skillLevel)) {
            console.warn('Invalid skill level:', formatted.skillLevel);
        }

        if (formatted.activityLevel && !validActivityLevels.includes(formatted.activityLevel)) {
            console.warn('Invalid activity level:', formatted.activityLevel);
        }

        if (formatted.favoriteSports) {
            formatted.favoriteSports = formatted.favoriteSports.filter(sport =>
                validSportTypes.includes(sport)
            );
        }

        // Convert dominant hand display value back to enum
        const dominantHandMap = {
            'Tay trái': 'LEFT',
            'Tay phải': 'RIGHT',
            'Cả hai tay': 'BOTH'
        };

        if (formatted.dominantHand && dominantHandMap[formatted.dominantHand]) {
            formatted.dominantHand = dominantHandMap[formatted.dominantHand];
        }

        // Convert playing time display value back to enum
        const playingTimeMap = {
            'Buổi sáng (6-12h)': 'MORNING',
            'Buổi chiều (12-18h)': 'AFTERNOON',
            'Buổi tối (18-22h)': 'EVENING',
            'Buổi khuya (22-6h)': 'NIGHT'
        };

        if (formatted.preferredPlayingTime && playingTimeMap[formatted.preferredPlayingTime]) {
            formatted.preferredPlayingTime = playingTimeMap[formatted.preferredPlayingTime];
        }

        return formatted;
    }

    // ===== DELETE OPERATION =====

    /**
     * Delete sports profile
     * DELETE /api/v1/sports-profiles/me
     */
    async deleteMyProfile() {
        try {
            console.log('🗑️ Deleting my sports profile...');
            const response = await this.api.delete('/me');
            console.log('✅ Sports profile deleted successfully');
            return true;
        } catch (error) {
            console.error('❌ Error deleting sports profile:', error);
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Delete sports profile by ID
     * DELETE /api/v1/sports-profiles/{id}
     */
    async deleteProfileById(profileId) {
        try {
            console.log('🗑️ Deleting sports profile with ID:', profileId);
            const response = await this.api.delete(`/${profileId}`);
            console.log('✅ Sports profile deleted successfully');
            return true;
        } catch (error) {
            console.error('❌ Error deleting sports profile:', error);
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Get sports profile by ID
     * GET /api/v1/sports-profiles/{id}
     */
    async getProfileById(profileId) {
        try {
            console.log('🔍 Fetching sports profile with ID:', profileId);
            const response = await this.api.get(`/${profileId}`);
            console.log('✅ Sports profile fetched successfully:', response.data);
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('📝 No sports profile found with ID:', profileId);
                return null;
            }
            console.error('❌ Error fetching sports profile:', error);
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Get all sports profiles
     * GET /api/v1/sports-profiles
     */
    async getAllProfiles() {
        try {
            console.log('🔍 Fetching all sports profiles...');
            const response = await this.api.get('/');
            console.log('✅ All sports profiles fetched successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching all sports profiles:', error);
            this.handleError(error);
            throw error;
        }
    }

    handleError(error) {
        console.error('API Error:', error.response?.data || error.message);
    }
}

export default new SportsProfileService();
