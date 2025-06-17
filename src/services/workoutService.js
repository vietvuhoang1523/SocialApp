import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';
import { getAuthToken } from '../utils/authStorage';

// Base API configuration
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/workouts`,
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

/**
 * Tạo buổi tập mới
 * @param {Object} workoutData - Dữ liệu buổi tập
 * @returns {Promise} - Buổi tập đã tạo
 */
export const createWorkoutSession = async (workoutData) => {
  try {
    const response = await api.post('/', workoutData);
    return response.data;
  } catch (error) {
    console.error('Error creating workout session:', error);
    throw handleApiError(error, 'Không thể tạo buổi tập');
  }
};

/**
 * Lấy chi tiết buổi tập
 * @param {number} workoutId - ID của buổi tập
 * @returns {Promise} - Chi tiết buổi tập
 */
export const getWorkoutById = async (workoutId) => {
  try {
    const response = await api.get(`/${workoutId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting workout details:', error);
    throw handleApiError(error, 'Không thể tải thông tin buổi tập');
  }
};

/**
 * Lấy danh sách buổi tập của người dùng hiện tại
 * @param {number} page - Số trang
 * @param {number} size - Số lượng mỗi trang
 * @returns {Promise} - Danh sách buổi tập
 */
export const getUserWorkouts = async (page = 0, size = 10) => {
  try {
    const response = await api.get('/my-workouts', {
      params: { page, size }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting user workouts:', error);
    throw handleApiError(error, 'Không thể tải danh sách buổi tập');
  }
};

/**
 * Lấy danh sách buổi tập theo khoảng thời gian
 * @param {string} startDate - Ngày bắt đầu (YYYY-MM-DD)
 * @param {string} endDate - Ngày kết thúc (YYYY-MM-DD)
 * @returns {Promise} - Danh sách buổi tập
 */
export const getWorkoutsByDateRange = async (startDate, endDate) => {
  try {
    const response = await api.get('/date-range', {
      params: { startDate, endDate }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting workouts by date range:', error);
    throw handleApiError(error, 'Không thể tải danh sách buổi tập theo thời gian');
  }
};

/**
 * Lấy danh sách buổi tập theo loại thể thao
 * @param {string} sportType - Loại thể thao
 * @returns {Promise} - Danh sách buổi tập
 */
export const getWorkoutsBySport = async (sportType) => {
  try {
    const response = await api.get('/by-sport', {
      params: { sportType }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting workouts by sport:', error);
    throw handleApiError(error, 'Không thể tải danh sách buổi tập theo môn thể thao');
  }
};

/**
 * Cập nhật thông tin buổi tập
 * @param {number} workoutId - ID của buổi tập
 * @param {Object} workoutData - Dữ liệu cập nhật
 * @returns {Promise} - Buổi tập đã cập nhật
 */
export const updateWorkoutSession = async (workoutId, workoutData) => {
  try {
    const response = await api.put(`/${workoutId}`, workoutData);
    return response.data;
  } catch (error) {
    console.error('Error updating workout session:', error);
    throw handleApiError(error, 'Không thể cập nhật buổi tập');
  }
};

/**
 * Xóa buổi tập
 * @param {number} workoutId - ID của buổi tập
 * @returns {Promise<boolean>} - Kết quả xóa
 */
export const deleteWorkoutSession = async (workoutId) => {
  try {
    await api.delete(`/${workoutId}`);
    return true;
  } catch (error) {
    console.error('Error deleting workout session:', error);
    throw handleApiError(error, 'Không thể xóa buổi tập');
  }
};

/**
 * Lấy thống kê người dùng
 * @param {string} startDate - Ngày bắt đầu (YYYY-MM-DD)
 * @param {string} endDate - Ngày kết thúc (YYYY-MM-DD)
 * @returns {Promise} - Thống kê người dùng
 */
export const getUserStatistics = async (startDate, endDate) => {
  try {
    const response = await api.get('/statistics', {
      params: { startDate, endDate }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting user statistics:', error);
    throw handleApiError(error, 'Không thể tải thống kê người dùng');
  }
};

/**
 * Lấy tổng số buổi tập từ một thời điểm
 * @param {string} since - Thời điểm bắt đầu (YYYY-MM-DD)
 * @returns {Promise<number>} - Tổng số buổi tập
 */
export const getTotalWorkouts = async (since) => {
  try {
    const response = await api.get('/total', {
      params: { since }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting total workouts:', error);
    throw handleApiError(error, 'Không thể tải tổng số buổi tập');
  }
};

/**
 * Lấy tổng số calo đã đốt từ một thời điểm
 * @param {string} since - Thời điểm bắt đầu (YYYY-MM-DD)
 * @returns {Promise<number>} - Tổng số calo
 */
export const getTotalCaloriesBurned = async (since) => {
  try {
    const response = await api.get('/calories', {
      params: { since }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting total calories burned:', error);
    throw handleApiError(error, 'Không thể tải tổng số calo đã đốt');
  }
};

/**
 * Lấy tổng quãng đường từ một thời điểm
 * @param {string} since - Thời điểm bắt đầu (YYYY-MM-DD)
 * @returns {Promise<number>} - Tổng quãng đường (km)
 */
export const getTotalDistance = async (since) => {
  try {
    const response = await api.get('/distance', {
      params: { since }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting total distance:', error);
    throw handleApiError(error, 'Không thể tải tổng quãng đường');
  }
};

/**
 * Lấy tổng thời gian tập luyện từ một thời điểm
 * @param {string} since - Thời điểm bắt đầu (YYYY-MM-DD)
 * @returns {Promise<number>} - Tổng thời gian (phút)
 */
export const getTotalDuration = async (since) => {
  try {
    const response = await api.get('/duration', {
      params: { since }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting total duration:', error);
    throw handleApiError(error, 'Không thể tải tổng thời gian tập luyện');
  }
};

/**
 * Lấy danh sách kỷ lục cá nhân
 * @returns {Promise} - Danh sách kỷ lục
 */
export const getPersonalRecords = async () => {
  try {
    const response = await api.get('/personal-records');
    return response.data;
  } catch (error) {
    console.error('Error getting personal records:', error);
    throw handleApiError(error, 'Không thể tải kỷ lục cá nhân');
  }
};

/**
 * Lấy phân bố theo loại thể thao
 * @param {string} since - Thời điểm bắt đầu (YYYY-MM-DD)
 * @returns {Promise<Object>} - Phân bố theo loại thể thao
 */
export const getSportDistribution = async (since) => {
  try {
    const response = await api.get('/sport-distribution', {
      params: { since }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting sport distribution:', error);
    throw handleApiError(error, 'Không thể tải phân bố theo loại thể thao');
  }
};

/**
 * Lấy tiến độ theo tuần
 * @returns {Promise<Object>} - Tiến độ theo tuần
 */
export const getWeeklyProgress = async () => {
  try {
    const response = await api.get('/weekly-progress');
    return response.data;
  } catch (error) {
    console.error('Error getting weekly progress:', error);
    throw handleApiError(error, 'Không thể tải tiến độ theo tuần');
  }
};

/**
 * Lấy tiến độ theo tháng
 * @returns {Promise<Object>} - Tiến độ theo tháng
 */
export const getMonthlyProgress = async () => {
  try {
    const response = await api.get('/monthly-progress');
    return response.data;
  } catch (error) {
    console.error('Error getting monthly progress:', error);
    throw handleApiError(error, 'Không thể tải tiến độ theo tháng');
  }
};

/**
 * Lấy danh sách buổi tập công khai
 * @param {number} page - Số trang
 * @param {number} size - Số lượng mỗi trang
 * @returns {Promise} - Danh sách buổi tập công khai
 */
export const getPublicWorkouts = async (page = 0, size = 10) => {
  try {
    const response = await api.get('/public', {
      params: { page, size }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting public workouts:', error);
    throw handleApiError(error, 'Không thể tải danh sách buổi tập công khai');
  }
};

/**
 * Thêm người tham gia buổi tập
 * @param {number} workoutId - ID của buổi tập
 * @param {number} userId - ID của người dùng
 * @returns {Promise} - Buổi tập đã cập nhật
 */
export const addParticipant = async (workoutId, userId) => {
  try {
    const response = await api.post(`/${workoutId}/participants/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error adding participant:', error);
    throw handleApiError(error, 'Không thể thêm người tham gia');
  }
};

/**
 * Xóa người tham gia buổi tập
 * @param {number} workoutId - ID của buổi tập
 * @param {number} userId - ID của người dùng
 * @returns {Promise} - Buổi tập đã cập nhật
 */
export const removeParticipant = async (workoutId, userId) => {
  try {
    const response = await api.delete(`/${workoutId}/participants/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing participant:', error);
    throw handleApiError(error, 'Không thể xóa người tham gia');
  }
};

/**
 * Kiểm tra đạt mục tiêu
 * @param {string} goalType - Loại mục tiêu
 * @param {number} targetValue - Giá trị mục tiêu
 * @param {string} period - Khoảng thời gian (DAILY, WEEKLY, MONTHLY)
 * @returns {Promise<boolean>} - Đạt mục tiêu hay không
 */
export const checkGoalAchievement = async (goalType, targetValue, period) => {
  try {
    const response = await api.get('/check-goal', {
      params: { goalType, targetValue, period }
    });
    return response.data;
  } catch (error) {
    console.error('Error checking goal achievement:', error);
    throw handleApiError(error, 'Không thể kiểm tra mục tiêu');
  }
};

/**
 * Lấy danh sách thành tích
 * @returns {Promise<Array>} - Danh sách thành tích
 */
export const getAchievements = async () => {
  try {
    const response = await api.get('/achievements');
    return response.data;
  } catch (error) {
    console.error('Error getting achievements:', error);
    throw handleApiError(error, 'Không thể tải danh sách thành tích');
  }
};

/**
 * Lấy gợi ý buổi tập
 * @returns {Promise<Array>} - Danh sách gợi ý buổi tập
 */
export const getRecommendedWorkouts = async () => {
  try {
    const response = await api.get('/recommendations');
    return response.data;
  } catch (error) {
    console.error('Error getting recommended workouts:', error);
    throw handleApiError(error, 'Không thể tải gợi ý buổi tập');
  }
};

/**
 * Lấy gợi ý bạn tập
 * @returns {Promise<Array>} - Danh sách gợi ý bạn tập
 */
export const getWorkoutPartnerSuggestions = async () => {
  try {
    const response = await api.get('/partner-suggestions');
    return response.data;
  } catch (error) {
    console.error('Error getting workout partner suggestions:', error);
    throw handleApiError(error, 'Không thể tải gợi ý bạn tập');
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
  createWorkoutSession,
  getWorkoutById,
  getUserWorkouts,
  getWorkoutsByDateRange,
  getWorkoutsBySport,
  updateWorkoutSession,
  deleteWorkoutSession,
  getUserStatistics,
  getTotalWorkouts,
  getTotalCaloriesBurned,
  getTotalDistance,
  getTotalDuration,
  getPersonalRecords,
  getSportDistribution,
  getWeeklyProgress,
  getMonthlyProgress,
  getPublicWorkouts,
  addParticipant,
  removeParticipant,
  checkGoalAchievement,
  getAchievements,
  getRecommendedWorkouts,
  getWorkoutPartnerSuggestions
}; 