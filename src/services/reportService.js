import api from './api';
import axios from 'axios';
import { BASE_URL } from './api';

// Create a specific API instance for reports
const reportsApi = axios.create({
  baseURL: `${BASE_URL}/reports`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Copy interceptors from main api instance
reportsApi.interceptors.request.use(
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

reportsApi.interceptors.response.use(
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

/**
 * Tạo báo cáo mới
 * @param {Object} reportData - Dữ liệu báo cáo
 * @param {string} reportData.reportType - Loại báo cáo (USER, POST, COMMENT, etc.)
 * @param {number} reportData.targetId - ID của đối tượng bị báo cáo
 * @param {string} reportData.reason - Lý do báo cáo
 * @param {string} reportData.description - Mô tả chi tiết
 * @returns {Promise} - Kết quả báo cáo
 */
export const createReport = async (reportData) => {
  try {
    const response = await reportsApi.post('/', reportData);
    return response.data;
  } catch (error) {
    console.error('Error creating report:', error);
    throw handleApiError(error, 'Không thể gửi báo cáo');
  }
};

/**
 * Lấy danh sách báo cáo của người dùng hiện tại
 * @param {number} page - Số trang
 * @param {number} size - Số lượng mỗi trang
 * @returns {Promise} - Danh sách báo cáo
 */
export const getMyReports = async (page = 0, size = 10) => {
  try {
    const response = await reportsApi.get('/my-reports', {
      params: { page, size }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting user reports:', error);
    throw handleApiError(error, 'Không thể tải danh sách báo cáo');
  }
};

/**
 * Kiểm tra người dùng đã báo cáo đối tượng này chưa
 * @param {string} reportType - Loại báo cáo
 * @param {number} targetId - ID của đối tượng
 * @returns {Promise<boolean>} - Đã báo cáo hay chưa
 */
export const hasUserReported = async (reportType, targetId) => {
  try {
    const response = await reportsApi.get('/check', {
      params: { reportType, targetId }
    });
    return response.data;
  } catch (error) {
    console.error('Error checking report status:', error);
    return false;
  }
};

/**
 * Lấy chi tiết báo cáo
 * @param {number} reportId - ID của báo cáo
 * @returns {Promise} - Chi tiết báo cáo
 */
export const getReportDetails = async (reportId) => {
  try {
    const response = await reportsApi.get(`/${reportId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting report details:', error);
    throw handleApiError(error, 'Không thể tải thông tin báo cáo');
  }
};

/**
 * Lấy tất cả báo cáo (Admin)
 * @param {number} page - Số trang
 * @param {number} size - Số lượng mỗi trang
 * @param {string} status - Trạng thái báo cáo (PENDING, RESOLVED, REJECTED)
 * @param {string} reportType - Loại báo cáo (USER, POST, COMMENT, etc.)
 * @returns {Promise} - Danh sách báo cáo
 */
export const getAllReports = async (page = 0, size = 10, status = null, reportType = null) => {
  try {
    const response = await reportsApi.get('/admin/all', {
      params: { page, size, status, reportType }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting all reports:', error);
    throw handleApiError(error, 'Không thể tải danh sách báo cáo');
  }
};

/**
 * Lấy báo cáo chưa xử lý (Admin)
 * @param {number} page - Số trang
 * @param {number} size - Số lượng mỗi trang
 * @returns {Promise} - Danh sách báo cáo chưa xử lý
 */
export const getPendingReports = async (page = 0, size = 10) => {
  try {
    const response = await reportsApi.get('/admin/pending', {
      params: { page, size }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting pending reports:', error);
    throw handleApiError(error, 'Không thể tải danh sách báo cáo chưa xử lý');
  }
};

/**
 * Xử lý báo cáo (Admin)
 * @param {number} reportId - ID của báo cáo
 * @param {string} action - Hành động xử lý
 * @param {string} note - Ghi chú của admin
 * @returns {Promise} - Kết quả xử lý
 */
export const resolveReport = async (reportId, action, note) => {
  try {
    const response = await reportsApi.put(`/admin/resolve/${reportId}`, { action, note });
    return response.data;
  } catch (error) {
    console.error('Error resolving report:', error);
    throw handleApiError(error, 'Không thể xử lý báo cáo');
  }
};

/**
 * Từ chối báo cáo (Admin)
 * @param {number} reportId - ID của báo cáo
 * @param {string} note - Ghi chú của admin
 * @returns {Promise} - Kết quả từ chối
 */
export const rejectReport = async (reportId, note) => {
  try {
    const response = await reportsApi.put(`/admin/reject/${reportId}`, { note });
    return response.data;
  } catch (error) {
    console.error('Error rejecting report:', error);
    throw handleApiError(error, 'Không thể từ chối báo cáo');
  }
};

/**
 * Lấy thống kê báo cáo (Admin)
 * @returns {Promise} - Thống kê báo cáo
 */
export const getReportStats = async () => {
  try {
    const response = await reportsApi.get('/admin/stats');
    return response.data;
  } catch (error) {
    console.error('Error getting report stats:', error);
    throw handleApiError(error, 'Không thể tải thống kê báo cáo');
  }
};

/**
 * Lấy bài viết bị báo cáo nhiều nhất (Admin)
 * @param {number} limit - Số lượng kết quả
 * @returns {Promise} - Danh sách bài viết bị báo cáo nhiều nhất
 */
export const getMostReportedPosts = async (limit = 5) => {
  try {
    const response = await reportsApi.get('/admin/most-reported-posts', {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting most reported posts:', error);
    throw handleApiError(error, 'Không thể tải danh sách bài viết bị báo cáo nhiều nhất');
  }
};

/**
 * Lấy báo cáo theo khoảng thời gian (Admin)
 * @param {string} startDate - Ngày bắt đầu (YYYY-MM-DD)
 * @param {string} endDate - Ngày kết thúc (YYYY-MM-DD)
 * @returns {Promise} - Thống kê báo cáo theo thời gian
 */
export const getReportStatsByDateRange = async (startDate, endDate) => {
  try {
    const response = await reportsApi.get('/admin/stats/date-range', {
      params: { startDate, endDate }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting report stats by date range:', error);
    throw handleApiError(error, 'Không thể tải thống kê báo cáo theo thời gian');
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
  createReport,
  getMyReports,
  hasUserReported,
  getReportDetails,
  getAllReports,
  getPendingReports,
  resolveReport,
  rejectReport,
  getReportStats,
  getMostReportedPosts,
  getReportStatsByDateRange
}; 