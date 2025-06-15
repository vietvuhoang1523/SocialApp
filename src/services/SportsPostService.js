import axios from 'axios';
import {BASE_URL, DEFAULT_HEADERS, FORM_DATA_HEADERS, ERROR_MESSAGES, DEFAULT_TIMEOUT} from './api';
import authService from './AuthService';

class SportsPostService {
    constructor() {
        let apiBaseUrl = BASE_URL;
        
        console.log('API URL for sports posts:', apiBaseUrl);
        
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
    
    // Helper to get appropriate headers
    getHeaders(isFormData = false) {
        return isFormData ? FORM_DATA_HEADERS : DEFAULT_HEADERS;
    }
    
    // Get sports posts for feed
    async getSportsPosts(page = 0, size = 10) {
        try {
            console.log(`🏀 Fetching sports posts with page=${page} and size=${size}`);
            
            let response;
            
            // Try methods in order, catching failures until one works
            try {
                // Option 1: Try simple GET to /sports-posts
                console.log('Attempting GET to /sports-posts');
                response = await this.api.get('/sports-posts');
                console.log('GET request successful');
            } catch (error1) {
                console.warn('GET /sports-posts failed:', error1.message);
                
                try {
                    // Option 2: Try POST to /sports-posts/search
                    console.log('Attempting POST to /sports-posts/search');
                    response = await this.api.post('/sports-posts/search', {
                        page, size
                    });
                    console.log('POST request successful');
                } catch (error2) {
                    console.warn('POST /sports-posts/search failed:', error2.message);
                    
                    try {
                        // Option 3: Try GET to /sports-posts/all
                        console.log('Attempting GET to /sports-posts/all');
                        response = await this.api.get('/sports-posts/all', {
                            params: { page, size }
                        });
                        console.log('Alternate GET request successful');
                    } catch (error3) {
                        // All attempts failed, throw the original error
                        console.error('All API attempts failed');
                        throw error1;
                    }
                }
            }
            
            console.log('📄 Raw Response from getSportsPosts:', JSON.stringify(response.data, null, 2));
            
            // Process response structure
            let posts = [];
            let isLastPage = true;
            let totalElements = 0;
            let totalPages = 0;
            let currentPage = page;
            
            if (response.data) {
                // Case 1: Response is a Spring Boot pagination object
                if (response.data.content && Array.isArray(response.data.content)) {
                    console.log('📋 Detected Spring Boot pagination structure');
                    posts = response.data.content;
                    isLastPage = response.data.last || false;
                    totalElements = response.data.totalElements || 0;
                    totalPages = response.data.totalPages || 0;
                    currentPage = response.data.number || page;
                }
                // Case 2: Response is a direct array
                else if (Array.isArray(response.data)) {
                    console.log('📋 Detected direct array');
                    posts = response.data;
                    totalElements = posts.length;
                    totalPages = posts.length > 0 ? 1 : 0;
                    isLastPage = true;
                }
                // Case 3: Response has another structure
                else {
                    console.log('📋 Unrecognized response structure:', typeof response.data);
                    posts = [];
                }
            }
            
            console.log(`📊 Data statistics:`, {
                totalPosts: posts.length,
                isLastPage,
                totalElements,
                totalPages,
                currentPage
            });
            
            // Process image URLs for posts
            const processedPosts = this.processPostsImageUrls(posts);
            
            console.log(`✅ Processed ${processedPosts.length} sports posts`);
            
            // Return data in standard format
            return {
                content: processedPosts,
                totalElements: totalElements,
                totalPages: totalPages,
                last: isLastPage,
                number: currentPage,
                size: size
            };
            
        } catch (error) {
            console.error('❌ Error fetching sports posts:', error);
            
            // Log detailed error
            if (error.response) {
                console.error('📤 Response Status:', error.response.status);
                console.error('📤 Response Data:', error.response.data);
                console.error('📤 Response Headers:', error.response.headers);
            } else if (error.request) {
                console.error('📤 Request sent but no response:', error.request);
            } else {
                console.error('📤 Error setting up request:', error.message);
            }
            
            this.handleError(error);
            
            // Return empty object to avoid crash
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
    
    // Process image URLs for all posts
    processPostsImageUrls(posts) {
        console.log('🖼️ Starting image URL processing for posts:', posts?.length || 0);
        
        // Check input
        if (!posts) {
            console.log('❌ Posts is null/undefined');
            return [];
        }
        
        // Check if posts is a pagination object
        if (posts && posts.content && Array.isArray(posts.content)) {
            console.log('📋 Detected pagination structure in processPostsImageUrls');
            posts = posts.content;
        }
        
        // If posts is not an array, return empty array
        if (!Array.isArray(posts)) {
            console.log(`❌ Posts is not an array, type: ${typeof posts}`);
            return [];
        }
        
        console.log(`🔄 Processing ${posts.length} posts`);
        
        return posts.map((post, index) => {
            try {
                // Log info for each post for debugging
                console.log(`📝 Sports Post ${index + 1}:`, {
                    id: post.id,
                    hasContent: !!post.content,
                    hasImageUrl: !!post.imageUrl,
                    hasImageUrls: !!post.imageUrls,
                    hasImages: !!post.images,
                    userRes: post.userRes?.fullName || 'No user info'
                });
                
                // Create full image URL for single image
                if (post.imageUrl) {
                    post.fullImageUrl = this.createImageUrl(post.imageUrl);
                    console.log(`🖼️ Created fullImageUrl for post ${post.id}: ${post.fullImageUrl}`);
                }
                
                // Process multiple images if present
                if (post.imageUrls && Array.isArray(post.imageUrls)) {
                    post.processedImageUrls = post.imageUrls.map(imgUrl => this.createImageUrl(imgUrl));
                    console.log(`🖼️ Created ${post.processedImageUrls.length} processedImageUrls for post ${post.id}`);
                }
                
                // Process PostImage entities if present
                if (post.images && Array.isArray(post.images)) {
                    post.processedImages = post.images.map(img => ({
                        ...img,
                        fullUrl: this.createImageUrl(img.imageUrl || img.url)
                    }));
                    console.log(`🖼️ Created ${post.processedImages.length} processedImages for post ${post.id}`);
                }
                
                return post;
            } catch (error) {
                console.error(`❌ Error processing post ${index + 1}:`, error);
                return post; // Return original post if error
            }
        });
    }
    
    // Create image URL from path
    createImageUrl(path) {
        if (!path) return null;
        
        try {
            // Remove leading slash if present
            const cleanPath = path.replace(/^\//, '');
            
            // Create complete URL based on API configuration
            const baseUrl = this.api.defaults.baseURL || BASE_URL;
            const fullUrl = `${baseUrl}/files/image?bucketName=thanh&path=${encodeURIComponent(cleanPath)}`;
            
            return fullUrl;
        } catch (error) {
            console.error('Error creating image URL:', error);
            return null;
        }
    }
    
    // Join/leave a sports post event
    async toggleJoin(postId) {
        try {
            const response = await this.api.post(`/sports-posts/${postId}/join`);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }
    
    // Get sports post details
    async getSportsPostById(postId) {
        try {
            console.log(`🏀 Fetching sports post with ID: ${postId}`);
            
            if (!postId) {
                console.error('Invalid postId provided:', postId);
                return null;
            }
            
        try {
            const response = await this.api.get(`/sports-posts/${postId}`);
                console.log(`✅ Successfully retrieved post ${postId}`);
                return this.processPostsImageUrls([response.data])[0];
            } catch (error) {
                // Handle 404 errors gracefully
                if (error.response && error.response.status === 404) {
                    console.log(`⚠️ Post with ID ${postId} not found`);
                    return null;
                }
                throw error; // Re-throw other errors
            }
        } catch (error) {
            console.error(`❌ Error fetching sports post ${postId}:`, error);
            
            if (error.response) {
                console.error('📤 Response Status:', error.response.status);
                console.error('📤 Response Data:', error.response.data);
            }
            
            this.handleError(error);
            return null;
        }
    }
    
    // Get participants for a sports post
    async getParticipants(postId) {
        try {
            console.log(`👥 Fetching participants for sports post with ID: ${postId}`);
            
            if (!postId) {
                console.error('Invalid postId provided for participants:', postId);
                return [];
            }
            
        try {
            const response = await this.api.get(`/sports-posts/${postId}/participants`);
                console.log(`✅ Successfully retrieved ${response.data?.length || 0} participants for post ${postId}`);
                return response.data || [];
            } catch (error) {
                // Handle 404 errors gracefully
                if (error.response && error.response.status === 404) {
                    console.log(`⚠️ No participants found for post ID ${postId}`);
                    return [];
                }
                throw error; // Re-throw other errors
            }
        } catch (error) {
            console.error(`❌ Error fetching participants for post ${postId}:`, error);
            
            if (error.response) {
                console.error('📤 Response Status:', error.response.status);
                console.error('📤 Response Data:', error.response.data);
            }
            
            this.handleError(error);
            return [];
        }
    }
    
    // Create a new sports post
    async createSportsPost(postData) {
        try {
            // Create FormData for multipart upload
            const formData = new FormData();
            
            // Append image files if any
            if (postData.imageFiles && postData.imageFiles.length > 0) {
                postData.imageFiles.forEach((file, index) => {
                    formData.append('images', {
                        uri: file.uri,
                        type: file.type || 'image/jpeg',
                        name: `sport_image_${index}.jpg`
                    });
                });
                
                // Remove image files from post data to avoid duplication
                const { imageFiles, ...restData } = postData;
                postData = restData;
            }
            
            // Append post data as JSON
            formData.append('postData', JSON.stringify(postData));
            
            console.log('🏀 Creating sports post with form data');
            
            const response = await this.api.post('/sports-posts', formData, {
                headers: FORM_DATA_HEADERS
            });
            
            console.log('✅ Sports post created successfully:', response.data);
            
            return this.processPostsImageUrls([response.data])[0];
        } catch (error) {
            console.error('❌ Error creating sports post:', error);
            this.handleError(error);
        }
    }
    
    // Validate sports post data
    validateSportsPostData(data) {
        const errors = [];
        
        if (!data.title || data.title.trim().length < 5) {
            errors.push('Tiêu đề phải có ít nhất 5 ký tự');
        }
        
        if (!data.description || data.description.trim().length < 10) {
            errors.push('Mô tả phải có ít nhất 10 ký tự');
        }
        
        if (!data.maxParticipants || data.maxParticipants < 2) {
            errors.push('Số người tham gia tối thiểu là 2');
        }
        
        if (!data.eventTime) {
            errors.push('Thời gian sự kiện không hợp lệ');
        } else {
            const eventDate = new Date(data.eventTime);
            const now = new Date();
            if (eventDate <= now) {
                errors.push('Thời gian sự kiện phải sau thời điểm hiện tại');
            }
        }
        
        if (!data.location || data.location.trim().length < 3) {
            errors.push('Địa điểm phải có ít nhất 3 ký tự');
        }
        
        return errors;
    }
}

export default new SportsPostService(); 