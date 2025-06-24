import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './api';

// Create a specific API instance for sports participant management
// Maps to SportsPostParticipantController.java
const sportsParticipantApi = axios.create({
  baseURL: `${BASE_URL}/sports-posts/participants`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

console.log('🏗️ SportsPostParticipantService initialized');
console.log('📋 This service maps to SportsPostParticipantController.java');
console.log('🎯 Base URL:', `${BASE_URL}/api/sports-posts/participants`);

// Add interceptors
sportsParticipantApi.interceptors.request.use(
  async (config) => {
    try {
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

sportsParticipantApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userData']);
      } catch (storageError) {
        console.error('Error clearing storage:', storageError);
      }
    }
    return Promise.reject(error);
  }
);

// Xử lý lỗi API
const handleApiError = (error, defaultMessage) => {
  const errorMessage = 
    error.response?.data?.message || 
    error.response?.data?.error || 
    error.message || 
    defaultMessage;
  
  console.error('SportsPostParticipant API Error:', {
    message: errorMessage,
    status: error.response?.status || 500,
    error: true
  });
  
  throw new Error(errorMessage);
};

// ===== PARTICIPANT MANAGEMENT APIs =====

/**
 * Gửi yêu cầu tham gia bài đăng thể thao
 * @param {number} postId - ID của bài đăng
 * @param {string} joinMessage - Tin nhắn kèm theo (có thể để trống)
 * @returns {Promise} - Kết quả yêu cầu tham gia
 */
export const joinSportsPost = async (postId, joinMessage = '') => {
  try {
    console.log(`🏃‍♂️ Joining sports post ${postId} with message:`, joinMessage);
    console.log(`🔗 API URL: ${sportsParticipantApi.defaults.baseURL}/${postId}/join`);
    console.log(`🔗 Full URL: ${BASE_URL}/api/sports-posts/participants/${postId}/join`);
    
    // Gửi joinMessage như một JSON object, hoặc string plain text
    const response = await sportsParticipantApi.post(`/${postId}/join`, joinMessage || "Tôi muốn tham gia bài đăng này!", {
      headers: { 
        'Content-Type': 'text/plain',
        'Accept': 'application/json'
      }
    });
    
    console.log('✅ Successfully joined sports post:', response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Error joining sports post ${postId}:`, error);
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
      url: error.config?.url,
      method: error.config?.method
    });
    throw handleApiError(error, 'Không thể gửi yêu cầu tham gia');
  }
};

/**
 * Hủy yêu cầu tham gia
 * @param {number} postId - ID của bài đăng
 * @returns {Promise} - Kết quả hủy tham gia
 */
export const leaveSportsPost = async (postId) => {
  try {
    console.log(`🚪 Leaving sports post ${postId}`);
    
    const response = await sportsParticipantApi.delete(`/${postId}/leave`);
    
    console.log('✅ Successfully left sports post');
    return response.data;
  } catch (error) {
    console.error(`❌ Error leaving sports post ${postId}:`, error);
    throw handleApiError(error, 'Không thể hủy tham gia');
  }
};

/**
 * Lấy trạng thái tham gia của user hiện tại cho bài đăng
 * @param {number} postId - ID của bài đăng
 * @returns {Promise} - Trạng thái tham gia
 */
export const getUserParticipationStatus = async (postId) => {
  try {
    console.log(`📊 Getting participation status for post ${postId}`);
    
    const response = await sportsParticipantApi.get(`/${postId}/participation-status`);
    
    console.log('✅ Successfully retrieved participation status:', response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Error getting participation status for post ${postId}:`, error);
    throw handleApiError(error, 'Không thể lấy trạng thái tham gia');
  }
};

/**
 * Lấy TỔNG danh sách người tham gia của bài đăng (bao gồm cả PENDING)
 * Endpoint: GET /api/sports-posts/participants/{postId}
 * Controller: SportsPostParticipantController.java
 * 
 * LƯU Ý: Khác với SportsPostService.getParticipants() chỉ lấy ACCEPTED
 * @param {number} postId - ID của bài đăng
 * @param {number} page - Số trang
 * @param {number} size - Số lượng mỗi trang
 * @returns {Promise} - Danh sách TẤT CẢ người tham gia (PENDING + ACCEPTED)
 */
export const getParticipants = async (postId, page = 0, size = 10) => {
  try {
    console.log(`👥 Getting ALL participants (including PENDING) for post ${postId}, page=${page}, size=${size}`);
    console.log(`🎯 Using endpoint: GET /api/sports-posts/participants/${postId}`);
    console.log(`📋 This endpoint returns ALL participants including PENDING (for management)`);
    
    const response = await sportsParticipantApi.get(`/${postId}`, {
      params: { page, size }
    });
    
    console.log('✅ Successfully retrieved participants:', response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Error getting participants for post ${postId}:`, error);
    throw handleApiError(error, 'Không thể lấy danh sách người tham gia');
  }
};

/**
 * Lấy danh sách người tham gia đã được chấp nhận
 * @param {number} postId - ID của bài đăng
 * @returns {Promise} - Danh sách người tham gia đã được chấp nhận
 */
export const getAcceptedParticipants = async (postId) => {
  try {
    console.log(`✅ Getting accepted participants for post ${postId}`);
    
    const response = await sportsParticipantApi.get(`/${postId}/accepted`);
    
    console.log('✅ Successfully retrieved accepted participants:', response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Error getting accepted participants for post ${postId}:`, error);
    throw handleApiError(error, 'Không thể lấy danh sách người tham gia đã được chấp nhận');
  }
};

/**
 * Lấy danh sách yêu cầu đang chờ duyệt
 * @param {number} postId - ID của bài đăng
 * @param {number} page - Số trang
 * @param {number} size - Số lượng mỗi trang
 * @returns {Promise} - Danh sách yêu cầu chờ duyệt
 */
export const getPendingRequests = async (postId, page = 0, size = 10) => {
  try {
    console.log(`⏳ Getting pending requests for post ${postId}, page=${page}, size=${size}`);
    
    const response = await sportsParticipantApi.get(`/${postId}/pending`, {
      params: { page, size }
    });
    
    console.log('✅ Successfully retrieved pending requests:', response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Error getting pending requests for post ${postId}:`, error);
    throw handleApiError(error, 'Không thể lấy danh sách yêu cầu chờ duyệt');
  }
};

/**
 * Phê duyệt hoặc từ chối yêu cầu tham gia (dành cho creator)
 * @param {number} postId - ID của bài đăng
 * @param {number} participantId - ID của người tham gia
 * @param {boolean} approve - true: chấp nhận, false: từ chối
 * @param {string} responseMessage - Tin nhắn phản hồi (có thể để trống)
 * @returns {Promise} - Kết quả phê duyệt
 */
export const respondToJoinRequest = async (postId, participantId, approve, responseMessage = '') => {
  try {
    console.log(`🔄 Responding to join request: postId=${postId}, participantId=${participantId}, approve=${approve}`);
    
    const response = await sportsParticipantApi.post(
      `/${postId}/participants/${participantId}/respond`, 
      responseMessage, 
      {
        params: { approve },
        headers: { 'Content-Type': 'text/plain' }
      }
    );
    
    console.log('✅ Successfully responded to join request:', response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Error responding to join request:`, error);
    throw handleApiError(error, 'Không thể xử lý yêu cầu tham gia');
  }
};

/**
 * Lấy lịch sử tham gia của user
 * @param {string} status - Trạng thái (PENDING, ACCEPTED, DECLINED hoặc ALL)
 * @param {number} page - Số trang
 * @param {number} size - Số lượng mỗi trang
 * @returns {Promise} - Lịch sử tham gia
 */
export const getParticipationHistory = async (status = 'ALL', page = 0, size = 10) => {
  try {
    console.log(`📜 Getting participation history: status=${status}, page=${page}, size=${size}`);
    
    const response = await sportsParticipantApi.get('/participation-history', {
      params: { status, page, size }
    });
    
    console.log('✅ Successfully retrieved participation history:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error getting participation history:', error);
    throw handleApiError(error, 'Không thể lấy lịch sử tham gia');
  }
};

/**
 * Lấy tất cả yêu cầu chờ duyệt của creator hiện tại
 * @param {number} page - Số trang
 * @param {number} size - Số lượng mỗi trang
 * @returns {Promise} - Danh sách yêu cầu chờ duyệt
 */
export const getAllPendingRequestsForCurrentUser = async (page = 0, size = 20) => {
  try {
    console.log(`⏳ Getting all pending requests for current user: page=${page}, size=${size}`);
    
    const response = await sportsParticipantApi.get('/my-pending-requests', {
      params: { page, size }
    });
    
    console.log('✅ Successfully retrieved pending requests for current user:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error getting pending requests for current user:', error);
    throw handleApiError(error, 'Không thể lấy danh sách yêu cầu chờ duyệt');
  }
};

/**
 * Lấy danh sách bài đăng mà user đã tham gia
 * @param {number} page - Số trang
 * @param {number} size - Số lượng mỗi trang
 * @returns {Promise} - Danh sách bài đăng đã tham gia
 */
export const getUserJoinedPosts = async (page = 0, size = 10) => {
  try {
    console.log(`📋 Getting user joined posts: page=${page}, size=${size}`);
    
    const response = await sportsParticipantApi.get('/my-joined-posts', {
      params: { page, size }
    });
    
    console.log('✅ Successfully retrieved user joined posts:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error getting user joined posts:', error);
    throw handleApiError(error, 'Không thể lấy danh sách bài đăng đã tham gia');
  }
};

/**
 * Lấy danh sách bài đăng mà user đã tạo
 * @param {number} page - Số trang
 * @param {number} size - Số lượng mỗi trang
 * @returns {Promise} - Danh sách bài đăng đã tạo
 */
export const getUserCreatedPosts = async (page = 0, size = 10) => {
  try {
    console.log(`📝 Getting user created posts: page=${page}, size=${size}`);
    
    const response = await sportsParticipantApi.get('/my-created-posts', {
      params: { page, size }
    });
    
    console.log('✅ Successfully retrieved user created posts:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error getting user created posts:', error);
    throw handleApiError(error, 'Không thể lấy danh sách bài đăng đã tạo');
  }
};

/**
 * Kiểm tra user đã tham gia bài đăng chưa
 * @param {number} postId - ID của bài đăng
 * @returns {Promise<boolean>} - true nếu đã tham gia
 */
export const hasUserJoined = async (postId) => {
  try {
    console.log(`❓ Checking if user has joined post ${postId}`);
    
    const response = await sportsParticipantApi.get(`/${postId}/has-joined`);
    
    console.log(`✅ User joined status for post ${postId}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Error checking if user joined post ${postId}:`, error);
    throw handleApiError(error, 'Không thể kiểm tra trạng thái tham gia');
  }
};

/**
 * Kiểm tra user có yêu cầu đang chờ duyệt không
 * @param {number} postId - ID của bài đăng
 * @returns {Promise<boolean>} - true nếu có yêu cầu chờ duyệt
 */
export const hasPendingRequest = async (postId) => {
  try {
    console.log(`❓ Checking if user has pending request for post ${postId}`);
    
    const response = await sportsParticipantApi.get(`/${postId}/has-pending-request`);
    
    console.log(`✅ User pending request status for post ${postId}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Error checking pending request for post ${postId}:`, error);
    throw handleApiError(error, 'Không thể kiểm tra yêu cầu chờ duyệt');
  }
};

/**
 * Đếm số người tham gia của một bài đăng
 * @param {number} postId - ID của bài đăng
 * @returns {Promise<number>} - Số lượng người tham gia
 */
export const countParticipants = async (postId) => {
  try {
    console.log(`🔢 Counting participants for post ${postId}`);
    
    const response = await sportsParticipantApi.get(`/${postId}/count`);
    
    console.log(`✅ Participant count for post ${postId}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Error counting participants for post ${postId}:`, error);
    throw handleApiError(error, 'Không thể đếm số người tham gia');
  }
};

/**
 * Batch approve multiple join requests
 * @param {number} postId - ID của bài đăng
 * @param {Array<number>} participantIds - Danh sách ID người tham gia
 * @param {string} responseMessage - Tin nhắn phản hồi
 * @returns {Promise} - Kết quả batch approve
 */
export const batchApproveRequests = async (postId, participantIds, responseMessage = '') => {
  try {
    console.log(`✅ Batch approving ${participantIds.length} requests for post ${postId}`);
    
    const response = await sportsParticipantApi.post(`/${postId}/batch-approve`, {
      participantIds,
      responseMessage
    });
    
    console.log('✅ Successfully batch approved requests:', response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Error batch approving requests:`, error);
    throw handleApiError(error, 'Không thể duyệt hàng loạt yêu cầu');
  }
};

/**
 * Batch decline multiple join requests
 * @param {number} postId - ID của bài đăng
 * @param {Array<number>} participantIds - Danh sách ID người tham gia
 * @param {string} responseMessage - Tin nhắn phản hồi
 * @returns {Promise} - Kết quả batch decline
 */
export const batchDeclineRequests = async (postId, participantIds, responseMessage = '') => {
  try {
    console.log(`❌ Batch declining ${participantIds.length} requests for post ${postId}`);
    
    const response = await sportsParticipantApi.post(`/${postId}/batch-decline`, {
      participantIds,
      responseMessage
    });
    
    console.log('✅ Successfully batch declined requests:', response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Error batch declining requests:`, error);
    throw handleApiError(error, 'Không thể từ chối hàng loạt yêu cầu');
  }
};

export default {
  // Participant management
  joinSportsPost,
  leaveSportsPost,
  getUserParticipationStatus,
  getParticipants,
  getAcceptedParticipants,
  getPendingRequests,
  respondToJoinRequest,
  getParticipationHistory,
  getAllPendingRequestsForCurrentUser,
  getUserJoinedPosts,
  getUserCreatedPosts,
  hasUserJoined,
  hasPendingRequest,
  countParticipants,
  batchApproveRequests,
  batchDeclineRequests
}; 