import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';
import { getAuthToken } from '../utils/authStorage';

// Base API configuration
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/sports`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Sports post participation APIs

/**
 * Gửi yêu cầu tham gia bài đăng thể thao
 * @param {number} postId - ID của bài đăng
 * @param {string} joinMessage - Tin nhắn kèm theo (có thể để trống)
 * @returns {Promise} - Kết quả yêu cầu tham gia
 */
export const joinSportsPost = async (postId, joinMessage = '') => {
  try {
    const response = await api.post(`/posts/${postId}/join`, { joinMessage });
    return response.data;
  } catch (error) {
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
    const response = await api.post(`/posts/${postId}/leave`);
    return response.data;
  } catch (error) {
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
    const response = await api.get(`/posts/${postId}/participation-status`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Không thể lấy trạng thái tham gia');
  }
};

/**
 * Lấy danh sách người tham gia của bài đăng
 * @param {number} postId - ID của bài đăng
 * @param {number} page - Số trang
 * @param {number} size - Số lượng mỗi trang
 * @returns {Promise} - Danh sách người tham gia
 */
export const getParticipants = async (postId, page = 0, size = 10) => {
  try {
    const response = await api.get(`/posts/${postId}/participants`, {
      params: { page, size }
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Không thể lấy danh sách người tham gia');
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
    const response = await api.get(`/posts/${postId}/pending-requests`, {
      params: { page, size }
    });
    return response.data;
  } catch (error) {
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
    const response = await api.post(`/posts/${postId}/respond-request`, {
      participantId,
      approve,
      responseMessage
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Không thể xử lý yêu cầu tham gia');
  }
};

/**
 * Lấy lịch sử tham gia của user
 * @param {string} status - Trạng thái (PENDING, ACCEPTED, REJECTED hoặc ALL)
 * @param {number} page - Số trang
 * @param {number} size - Số lượng mỗi trang
 * @returns {Promise} - Lịch sử tham gia
 */
export const getParticipationHistory = async (status = 'ALL', page = 0, size = 10) => {
  try {
    const response = await api.get('/user/participation-history', {
      params: { status, page, size }
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Không thể lấy lịch sử tham gia');
  }
};

// Xử lý lỗi API
const handleApiError = (error, defaultMessage) => {
  const errorMessage = 
    error.response?.data?.message || 
    error.response?.data?.error || 
    error.message || 
    defaultMessage;
  
  return {
    message: errorMessage,
    status: error.response?.status || 500,
    error: true
  };
};

export default {
  joinSportsPost,
  leaveSportsPost,
  getUserParticipationStatus,
  getParticipants,
  getPendingRequests,
  respondToJoinRequest,
  getParticipationHistory
}; 