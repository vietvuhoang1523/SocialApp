import axios from 'axios';
import { BASE_URL } from './api';

// Create a specific API instance for sports posts
const sportsPostApi = axios.create({
  baseURL: `${BASE_URL}/sports-posts`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Add interceptors to API instance
const setupInterceptors = (apiInstance) => {
  apiInstance.interceptors.request.use(
    async (config) => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.warn('Failed to get token:', error);
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  apiInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userData']);
        } catch (storageError) {
          console.error('Error clearing storage:', storageError);
        }
      }
      return Promise.reject(error);
    }
  );
};

// Apply interceptors
setupInterceptors(sportsPostApi);

// Xử lý lỗi API
const handleApiError = (error, defaultMessage) => {
  const errorMessage = 
    error.response?.data?.message || 
    error.response?.data?.error || 
    error.message || 
    defaultMessage;
  
  console.error('API Error:', {
    message: errorMessage,
    status: error.response?.status || 500,
    error: true
  });
  
  throw new Error(errorMessage);
};

// Xử lý image URLs
const processImageUrls = (posts) => {
  if (!posts) return [];
  
  // Handle both single post and array of posts
  const postsArray = Array.isArray(posts) ? posts : [posts];
  
  return postsArray.map(post => {
    if (!post) return post;
    
    return {
      ...post,
      imageUrls: post.imageUrls?.map(imagePath => createImageUrl(imagePath)) || [],
      images: post.images?.map(imagePath => createImageUrl(imagePath)) || [],
      // Thêm xử lý cho các field khác có thể chứa image paths
      imagePaths: post.imagePaths?.map(imagePath => createImageUrl(imagePath)) || [],
      postImages: post.postImages?.map(imagePath => createImageUrl(imagePath)) || []
    };
  });
};

// Tạo full URL cho hình ảnh
const createImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // Nếu đã là URL đầy đủ, return nguyên
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Loại bỏ leading slash nếu có
  const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
  
  // Tạo full URL
  return `${BASE_URL}/${cleanPath}`;
};

// Validate image file
const validateImageFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Định dạng file không được hỗ trợ: ${file.type}`);
  }
  
  if (file.size && file.size > maxSize) {
    throw new Error('Kích thước file quá lớn (tối đa 10MB)');
  }
  
  return true;
};

// Prepare image files for upload
const prepareImageFiles = (imageFiles) => {
  if (!imageFiles || imageFiles.length === 0) return [];
  
  return imageFiles.map((file, index) => {
    try {
      validateImageFile(file);
      return {
        uri: file.uri,
        type: file.type || 'image/jpeg',
        name: file.name || `sport_image_${Date.now()}_${index}.jpg`
      };
    } catch (error) {
      console.warn(`⚠️ Skipping invalid image file ${index}:`, error.message);
      return null;
    }
  }).filter(Boolean);
};

// ===== SPORTS POST MANAGEMENT APIs =====

/**
 * Tạo bài đăng thể thao mới
 * @param {Object} postData - Dữ liệu bài đăng
 * @param {Array} imageFiles - Danh sách file ảnh (optional)
 * @returns {Promise} - Bài đăng đã tạo với image URLs đã xử lý
 */
export const createSportsPost = async (postData, imageFiles = []) => {
  try {
    console.log('🏀 Starting to create sports post...');
    console.log('📝 Post data:', JSON.stringify(postData, null, 2));
    console.log('🖼️ Image files count:', imageFiles?.length || 0);

    // Create FormData for multipart upload
    const formData = new FormData();
    
    // Prepare and validate image files
    const validImageFiles = prepareImageFiles(imageFiles);
    
    // Append image files if any
    if (validImageFiles && validImageFiles.length > 0) {
      console.log('📸 Processing validated image files...');
      validImageFiles.forEach((file, index) => {
        console.log(`📷 Adding image ${index + 1}:`, {
          uri: file.uri,
          type: file.type,
          name: file.name
        });
        
        formData.append('imageFiles', file);
      });
    }
    
    // Append post data as JSON string
    formData.append('postData', JSON.stringify(postData));
    
    console.log('📤 Sending request to create sports post...');
    
    const response = await sportsPostApi.post('/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000 // Tăng timeout cho upload hình ảnh
    });
    
    console.log('✅ Sports post created successfully:', response.data);
    
    // Xử lý image URLs trong response
    const processedResponse = processImageUrls([response.data])[0];
    console.log('🖼️ Processed response with image URLs:', processedResponse);
    
    return processedResponse;
  } catch (error) {
    console.error('❌ Error creating sports post:', error);
    console.error('📋 Error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    throw handleApiError(error, 'Không thể tạo bài đăng thể thao');
  }
};

/**
 * Lấy danh sách bài đăng thể thao
 * @param {number} page - Số trang
 * @param {number} size - Số lượng mỗi trang
 * @returns {Promise} - Danh sách bài đăng với image URLs đã xử lý
 */
export const getSportsPosts = async (page = 0, size = 10) => {
  try {
    console.log(`🏀 Fetching sports posts with page=${page} and size=${size}`);
    
    const response = await sportsPostApi.get('/available', {
      params: { page, size }
    });
    
    console.log('✅ Successfully retrieved sports posts:', response.data);
    
    // Process image URLs for the response
    const processedData = {
      ...response.data,
      content: response.data.content ? processImageUrls(response.data.content) : []
    };
    
    console.log('🖼️ Processed image URLs for sports posts');
    return processedData;
  } catch (error) {
    console.error('❌ Error fetching sports posts:', error);
    throw handleApiError(error, 'Không thể lấy danh sách bài đăng thể thao');
  }
};

/**
 * Lấy tất cả bài đăng thể thao (bao gồm cả không available)
 * @param {number} page - Số trang
 * @param {number} size - Số lượng mỗi trang
 * @returns {Promise} - Danh sách tất cả bài đăng với image URLs đã xử lý
 */
export const getAllSportsPosts = async (page = 0, size = 10) => {
  try {
    console.log(`🏀 Fetching all sports posts with page=${page} and size=${size}`);
    
    // Sử dụng search endpoint với empty criteria để lấy tất cả
    const response = await sportsPostApi.post('/search', {
      page,
      size,
      sortBy: 'createdAt',
      sortDirection: 'DESC'
    });
    
    console.log('✅ Successfully retrieved all sports posts:', response.data);
    
    // Process image URLs for the response
    const processedData = {
      ...response.data,
      content: response.data.content ? processImageUrls(response.data.content) : []
    };
    
    console.log('🖼️ Processed image URLs for all sports posts');
    return processedData;
  } catch (error) {
    console.error('❌ Error fetching all sports posts:', error);
    throw handleApiError(error, 'Không thể lấy danh sách tất cả bài đăng thể thao');
  }
};

/**
 * Lấy bài đăng của người dùng hiện tại
 * @param {number} page - Số trang
 * @param {number} size - Số lượng mỗi trang
 * @returns {Promise} - Danh sách bài đăng của user với image URLs đã xử lý
 */
export const getMyPosts = async (page = 0, size = 10) => {
  try {
    console.log(`👤 Fetching my sports posts with page=${page} and size=${size}`);
    
    const response = await sportsPostApi.get('/my-posts', {
      params: { page, size }
    });
    
    console.log('✅ Successfully retrieved my sports posts:', response.data);
    
    // Process image URLs for the response
    const processedData = {
      ...response.data,
      content: response.data.content ? processImageUrls(response.data.content) : []
    };
    
    console.log('🖼️ Processed image URLs for my sports posts');
    return processedData;
  } catch (error) {
    console.error('❌ Error fetching my sports posts:', error);
    throw handleApiError(error, 'Không thể lấy danh sách bài đăng của bạn');
  }
};

/**
 * Lấy chi tiết bài đăng thể thao
 * @param {number} postId - ID của bài đăng
 * @returns {Promise} - Chi tiết bài đăng với image URLs đã xử lý
 */
export const getSportsPostById = async (postId) => {
  try {
    console.log(`🏀 Fetching sports post with ID: ${postId}`);
    
    if (!postId) {
      console.error('Invalid postId provided:', postId);
      return null;
    }
    
    const response = await sportsPostApi.get(`/${postId}`);
    console.log(`✅ Successfully retrieved post ${postId}`);
    
    // Process image URLs for the single post
    const processedPost = processImageUrls([response.data])[0];
    console.log('🖼️ Processed image URLs for sports post detail');
    
    return processedPost;
  } catch (error) {
    console.error(`❌ Error fetching sports post ${postId}:`, error);
    if (error.response && error.response.status === 404) {
      console.log(`⚠️ Post with ID ${postId} not found`);
      return null;
    }
    throw handleApiError(error, 'Không thể lấy thông tin bài đăng');
  }
};

/**
 * Cập nhật bài đăng thể thao
 * @param {number} postId - ID của bài đăng
 * @param {Object} postData - Dữ liệu cập nhật
 * @returns {Promise} - Bài đăng đã cập nhật
 */
export const updateSportsPost = async (postId, postData) => {
  try {
    console.log(`📝 Updating sports post ${postId}`);
    
    const response = await sportsPostApi.put(`/${postId}`, postData);
    console.log(`✅ Successfully updated post ${postId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error updating sports post ${postId}:`, error);
    throw handleApiError(error, 'Không thể cập nhật bài đăng');
  }
};

/**
 * Xóa bài đăng thể thao
 * @param {number} postId - ID của bài đăng
 * @returns {Promise} - Kết quả xóa
 */
export const deleteSportsPost = async (postId) => {
  try {
    console.log(`🗑️ Deleting sports post ${postId}`);
    
    const response = await sportsPostApi.delete(`/${postId}`);
    console.log(`✅ Successfully deleted post ${postId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error deleting sports post ${postId}:`, error);
    throw handleApiError(error, 'Không thể xóa bài đăng');
  }
};

/**
 * Tham gia bài đăng thể thao
 * @param {number} postId - ID của bài đăng
 * @param {string} joinMessage - Tin nhắn khi tham gia (optional)
 * @returns {Promise} - Bài đăng đã cập nhật với image URLs đã xử lý
 */
export const joinSportsPost = async (postId, joinMessage = '') => {
  try {
    console.log(`🤝 Joining sports post ${postId}`);
    
    const response = await sportsPostApi.post(`/${postId}/join`, joinMessage, {
      headers: {
        'Content-Type': 'text/plain'
      }
    });
    
    console.log(`✅ Successfully joined post ${postId}`);
    
    // Process image URLs in response
    const processedResponse = processImageUrls([response.data])[0];
    return processedResponse;
  } catch (error) {
    console.error(`❌ Error joining sports post ${postId}:`, error);
    throw handleApiError(error, 'Không thể tham gia bài đăng');
  }
};

/**
 * Rời khỏi bài đăng thể thao
 * @param {number} postId - ID của bài đăng
 * @returns {Promise} - Bài đăng đã cập nhật với image URLs đã xử lý
 */
export const leaveSportsPost = async (postId) => {
  try {
    console.log(`👋 Leaving sports post ${postId}`);
    
    const response = await sportsPostApi.post(`/${postId}/leave`);
    console.log(`✅ Successfully left post ${postId}`);
    
    // Process image URLs in response
    const processedResponse = processImageUrls([response.data])[0];
    return processedResponse;
  } catch (error) {
    console.error(`❌ Error leaving sports post ${postId}:`, error);
    throw handleApiError(error, 'Không thể rời khỏi bài đăng');
  }
};

/**
 * Lấy danh sách người tham gia bài đăng
 * @param {number} postId - ID của bài đăng
 * @param {number} page - Số trang (default: 0)
 * @param {number} size - Số lượng mỗi trang (default: 20)
 * @returns {Promise} - Danh sách người tham gia
 */
export const getParticipants = async (postId, page = 0, size = 20) => {
  try {
    // Validate postId
    if (!postId || postId === 'undefined' || postId === undefined) {
      console.error(`❌ Invalid postId provided: ${postId}`);
      throw new Error('PostId is required and cannot be undefined');
    }
    
    console.log(`👥 Fetching participants for sports post ${postId}`);
    console.log(`🎯 Using endpoint: GET /api/sports-posts/${postId}/participants`);
    console.log(`📋 This endpoint returns ACCEPTED participants EXCLUDING creator`);
    
    // Use the SportsPostController endpoint for getting ACCEPTED participants (excluding creator)
    // This is for UI display purposes
    const participantsApi = axios.create({
      baseURL: `${BASE_URL}/sports-posts`,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
    
    // Apply same interceptors to participants API
    setupInterceptors(participantsApi);
    
    const response = await participantsApi.get(`/${postId}/participants`, {
      params: { page, size }
    });
    
    console.log(`✅ Successfully retrieved participants for post ${postId}:`, response.data);
    
    // Return the participants data
    if (response.data.content) {
      // If paginated response
      return {
        ...response.data,
        content: response.data.content || []
      };
    } else if (Array.isArray(response.data)) {
      // If direct array response
      return response.data;
    } else {
      // Fallback
      return [];
    }
  } catch (error) {
    console.error(`❌ Error fetching participants for post ${postId}:`, error);
    
    // Handle specific error cases
    if (error.response?.status === 404) {
      console.warn(`⚠️ Post ${postId} not found, trying fallback method`);
      
      // Try fallback: get accepted participants only
      try {
        console.log(`🔄 Trying fallback method for post ${postId}`);
        const participantsApiFallback = axios.create({
          baseURL: `${BASE_URL}/sports-posts`,
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        });
        
        setupInterceptors(participantsApiFallback);
        
        const fallbackResponse = await participantsApiFallback.get(`/${postId}/participants/accepted`);
        console.log(`✅ Fallback method successful for post ${postId}:`, fallbackResponse.data);
        
        if (Array.isArray(fallbackResponse.data)) {
          return fallbackResponse.data;
        } else if (fallbackResponse.data.content && Array.isArray(fallbackResponse.data.content)) {
          return {
            ...fallbackResponse.data,
            content: fallbackResponse.data.content
          };
        }
        
        return [];
      } catch (fallbackError) {
        console.error(`❌ Fallback method also failed for post ${postId}:`, fallbackError);
        return [];
      }
    }
    
    // For other errors, try to provide meaningful error message
    if (error.response?.status === 403) {
      console.warn(`⚠️ Access denied for post ${postId} participants`);
      return [];
    }
    
    // Log more details for debugging
    console.error(`📤 Error details:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    console.warn(`⚠️ Returning empty participants list due to error`);
    return [];
  }
};

export default {
  // Post management
  createSportsPost,
  getSportsPosts,
  getAllSportsPosts,
  getMyPosts,
  getSportsPostById,
  updateSportsPost,
  deleteSportsPost,
  // Participant management
  joinSportsPost,
  leaveSportsPost,
  getParticipants,
  // Image utilities
  createImageUrl,
  processImageUrls,
  validateImageFile,
  prepareImageFiles
}; 