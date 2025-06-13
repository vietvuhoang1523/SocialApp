import axios from 'axios';
import {BASE_URL, DEFAULT_HEADERS, FORM_DATA_HEADERS, ERROR_MESSAGES, DEFAULT_TIMEOUT} from './api';
import authService from './AuthService';

class SportsAvailabilityService {
    constructor() {
        let apiBaseUrl = BASE_URL;
        
        console.log('API URL for sports availability:', apiBaseUrl);
        
        this.api = axios.create({
            baseURL: apiBaseUrl,
            timeout: DEFAULT_TIMEOUT,
            headers: DEFAULT_HEADERS,
        });
        
        // Add interceptor to automatically add token to each request
        this.api.interceptors.request.use(async (config) => {
            try {
                const token = await authService.getBearerToken();
                if (token) {
                    config.headers.Authorization = token;
                }
                return config;
            } catch (error) {
                console.error('Error getting token:', error);
                return config;
            }
        });
    }
    
    // Helper to handle errors
    handleError(error) {
        console.error('API Error:', error);
        
        if (error.response) {
            // Error with response from server
            const status = error.response.status;
            const message = error.response.data?.message || ERROR_MESSAGES[status] || ERROR_MESSAGES.default;
            
            throw new Error(message);
        } else if (error.request) {
            // Error with no response from server
            throw new Error(ERROR_MESSAGES.default);
        } else {
            // Other error
            throw new Error(error.message || ERROR_MESSAGES.default);
        }
    }
    
    // Get sports availabilities for feed
    async getSportsAvailabilities(page = 0, size = 10, filters = {}) {
        try {
            console.log(`🏀 Fetching sports availabilities with page=${page} and size=${size}`);
            
            const response = await this.api.post('/api/sports-availability/search', {
                page,
                size,
                ...filters
            });
            
            console.log('📄 Raw Response from getSportsAvailabilities:', JSON.stringify(response.data, null, 2));
            
            // Process response structure
            let availabilities = [];
            let isLastPage = true;
            let totalElements = 0;
            let totalPages = 0;
            let currentPage = page;
            
            if (response.data) {
                if (response.data.content && Array.isArray(response.data.content)) {
                    availabilities = response.data.content;
                    isLastPage = response.data.last || false;
                    totalElements = response.data.totalElements || 0;
                    totalPages = response.data.totalPages || 0;
                    currentPage = response.data.number || page;
                } else if (Array.isArray(response.data)) {
                    availabilities = response.data;
                    totalElements = availabilities.length;
                    totalPages = availabilities.length > 0 ? 1 : 0;
                    isLastPage = true;
                } else {
                    availabilities = [];
                }
            }
            
            console.log(`✅ Processed ${availabilities.length} sports availabilities`);
            
            return {
                content: availabilities,
                totalElements: totalElements,
                totalPages: totalPages,
                last: isLastPage,
                number: currentPage,
                size: size
            };
            
        } catch (error) {
            console.error('❌ Error fetching sports availabilities:', error);
            this.handleError(error);
            
            return {
                content: [],
                totalElements: 0,
                totalPages: 0,
                last: true,
                number: page,
                size: size
            };
        }
    }
    
    // Get availability details
    async getAvailabilityById(id) {
        try {
            const response = await this.api.get(`/api/sports-availability/${id}`);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }
    
    // Create a new sports availability
    async createAvailability(data) {
        try {
            console.log('🏀 Creating sports availability with data:', data);
            
            const response = await this.api.post('/api/sports-availability', data);
            
            console.log('✅ Sports availability created successfully:', response.data);
            
            return response.data;
        } catch (error) {
            console.error('❌ Error creating sports availability:', error);
            this.handleError(error);
        }
    }
    
    // Update an existing sports availability
    async updateAvailability(id, data) {
        try {
            console.log(`🏀 Updating sports availability ${id} with data:`, data);
            
            const response = await this.api.put(`/api/sports-availability/${id}`, data);
            
            console.log('✅ Sports availability updated successfully:', response.data);
            
            return response.data;
        } catch (error) {
            console.error('❌ Error updating sports availability:', error);
            this.handleError(error);
        }
    }
    
    // Cancel a sports availability
    async cancelAvailability(id, reason = '') {
        try {
            const response = await this.api.post(`/api/sports-availability/${id}/cancel`, { reason });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }
    
    // Request a match with another availability
    async requestMatch(availabilityId, targetAvailabilityId, message = '') {
        try {
            const response = await this.api.post(`/api/sports-availability/${availabilityId}/match-request`, {
                targetAvailabilityId,
                message
            });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }
    
    // Get match requests for an availability
    async getMatchRequests(availabilityId) {
        try {
            const response = await this.api.get(`/api/sports-availability/${availabilityId}/match-requests`);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }
    
    // Accept a match request
    async acceptMatchRequest(requestId) {
        try {
            const response = await this.api.post(`/api/match-requests/${requestId}/accept`);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }
    
    // Reject a match request
    async rejectMatchRequest(requestId, reason = '') {
        try {
            const response = await this.api.post(`/api/match-requests/${requestId}/reject`, { reason });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }
    
    // Validate sports availability data
    validateAvailabilityData(data) {
        const errors = [];
        
        if (!data.sportType) {
            errors.push('Loại thể thao không được để trống');
        }
        
        if (!data.availableFrom) {
            errors.push('Thời gian bắt đầu không được để trống');
        } else {
            const availableFrom = new Date(data.availableFrom);
            const now = new Date();
            if (availableFrom <= now) {
                errors.push('Thời gian bắt đầu phải sau thời điểm hiện tại');
            }
        }
        
        if (!data.availableUntil) {
            errors.push('Thời gian kết thúc không được để trống');
        } else if (data.availableFrom) {
            const availableFrom = new Date(data.availableFrom);
            const availableUntil = new Date(data.availableUntil);
            if (availableUntil <= availableFrom) {
                errors.push('Thời gian kết thúc phải sau thời gian bắt đầu');
            }
        }
        
        if (data.groupSizeMin && data.groupSizeMax && data.groupSizeMin > data.groupSizeMax) {
            errors.push('Kích thước nhóm tối thiểu không được lớn hơn kích thước tối đa');
        }
        
        if (!data.preferredLocation && (!data.customLocationName || !data.customLatitude || !data.customLongitude)) {
            errors.push('Vui lòng cung cấp thông tin địa điểm');
        }
        
        return errors;
    }
}

export default new SportsAvailabilityService(); 