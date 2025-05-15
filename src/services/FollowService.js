import axios from 'axios';
import { BASE_URL, DEFAULT_TIMEOUT, DEFAULT_HEADERS } from './api';
import authService from './AuthService';

class FollowService {
    constructor() {
        this.api = axios.create({
            baseURL: `${BASE_URL}/follows`,
            timeout: DEFAULT_TIMEOUT,
            headers: DEFAULT_HEADERS,
        });

        // Thêm interceptor để tự động thêm token vào mỗi request
        this.api.interceptors.request.use(async (config) => {
            const token = await authService.getBearerToken();
            if (token) {
                config.headers.Authorization = token;
            }
            return config;
        });
    }

    async followUser(userId) {
        try {
            const response = await this.api.post(`/${userId}`);
            return response.data.success;
        } catch (error) {
            console.error('Error following user:', error);
            throw error;
        }
    }

    async unfollowUser(userId) {
        try {
            const response = await this.api.delete(`/${userId}`);
            return response.data.success;
        } catch (error) {
            console.error('Error unfollowing user:', error);
            throw error;
        }
    }

    async removeFollower(followerId) {
        try {
            const response = await this.api.delete(`/followers/${followerId}`);
            return response.data.success;
        } catch (error) {
            console.error('Error removing follower:', error);
            throw error;
        }
    }

    async isFollowing(userId) {
        try {
            const response = await this.api.get(`/${userId}/check`);
            return response.data.following;
        } catch (error) {
            console.error('Error checking follow status:', error);
            return false;
        }
    }

    async getFollowers(userId) {
        try {
            const response = await this.api.get(`/${userId}/followers`);
            return response.data;
        } catch (error) {
            console.error('Error getting followers:', error);
            throw error;
        }
    }

    async getFollowing(userId) {
        try {
            const response = await this.api.get(`/${userId}/following`);
            return response.data;
        } catch (error) {
            console.error('Error getting following:', error);
            throw error;
        }
    }

    async getFollowerCount(userId) {
        try {
            const response = await this.api.get(`/${userId}/followers/count`);
            return response.data.count;
        } catch (error) {
            console.error('Error getting follower count:', error);
            return 0;
        }
    }

    async getFollowingCount(userId) {
        try {
            const response = await this.api.get(`/${userId}/following/count`);
            return response.data.count;
        } catch (error) {
            console.error('Error getting following count:', error);
            return 0;
        }
    }
}

export default FollowService;
