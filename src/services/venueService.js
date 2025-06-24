import api from './api';
import axios from 'axios';
import { BASE_URL } from './api';

// Create a specific API instance for venues
const venuesApi = axios.create({
  baseURL: `${BASE_URL}/venues`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Copy interceptors from main api instance
venuesApi.interceptors.request.use(
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

venuesApi.interceptors.response.use(
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
 * Tìm kiếm địa điểm theo tên và bộ lọc
 * @param {string} name - Tên địa điểm
 * @param {string} sportType - Loại thể thao
 * @param {string} venueType - Loại địa điểm
 * @param {string} priceRange - Mức giá
 * @param {boolean} verified - Chỉ hiển thị địa điểm đã xác thực
 * @param {number} page - Số trang
 * @param {number} size - Số lượng mỗi trang
 * @returns {Promise} - Danh sách địa điểm
 */
export const searchVenues = async (name, sportType, venueType, priceRange, verified = true, page = 0, size = 20) => {
  try {
    const response = await venuesApi.get('/search', {
      params: {
        name,
        sportType,
        venueType,
        priceRange,
        verified,
        page,
        size
      }
    });
    return response.data.content || [];
  } catch (error) {
    console.error('Error searching venues:', error);
    throw handleApiError(error, 'Không thể tìm kiếm địa điểm');
  }
};

/**
 * Tìm địa điểm gần vị trí hiện tại
 * @param {number} latitude - Vĩ độ
 * @param {number} longitude - Kinh độ
 * @param {number} radius - Bán kính (km)
 * @param {string} sportType - Loại thể thao
 * @param {string} venueType - Loại địa điểm
 * @param {string} priceRange - Mức giá
 * @param {boolean} verified - Chỉ hiển thị địa điểm đã xác thực
 * @returns {Promise} - Danh sách địa điểm gần đó
 */
export const getNearbyVenues = async (latitude, longitude, radius = 10, sportType, venueType, priceRange, verified = true) => {
  try {
    const response = await venuesApi.get('/nearby', {
      params: {
        latitude,
        longitude,
        radius,
        sportType,
        venueType,
        priceRange,
        verified
      }
    });
    return response.data || [];
  } catch (error) {
    console.error('Error getting nearby venues:', error);
    throw handleApiError(error, 'Không thể tìm kiếm địa điểm gần đây');
  }
};

/**
 * Lấy chi tiết địa điểm
 * @param {number} id - ID của địa điểm
 * @returns {Promise} - Thông tin chi tiết địa điểm
 */
export const getVenueById = async (id) => {
  try {
    const response = await venuesApi.get(`/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error getting venue ${id}:`, error);
    throw handleApiError(error, 'Không thể tải thông tin địa điểm');
  }
};

/**
 * Lấy danh sách địa điểm phổ biến
 * @param {number} limit - Số lượng địa điểm tối đa
 * @returns {Promise} - Danh sách địa điểm phổ biến
 */
export const getPopularVenues = async (limit = 10) => {
  try {
    const response = await venuesApi.get('/popular', {
      params: { limit }
    });
    return response.data || [];
  } catch (error) {
    console.error('Error getting popular venues:', error);
    throw handleApiError(error, 'Không thể tải địa điểm phổ biến');
  }
};

/**
 * Lấy danh sách địa điểm theo loại thể thao
 * @param {string} sportType - Loại thể thao
 * @param {number} page - Số trang
 * @param {number} size - Số lượng mỗi trang
 * @returns {Promise} - Danh sách địa điểm
 */
export const getVenuesBySportType = async (sportType, page = 0, size = 20) => {
  try {
    const response = await venuesApi.get('/by-sport', {
      params: {
        sportType,
        page,
        size
      }
    });
    return response.data.content || [];
  } catch (error) {
    console.error('Error getting venues by sport type:', error);
    throw handleApiError(error, 'Không thể tải danh sách địa điểm');
  }
};

/**
 * Tạo địa điểm mới
 * @param {object} venueData - Thông tin địa điểm
 * @returns {Promise} - Địa điểm đã tạo
 */
export const createVenue = async (venueData) => {
  try {
    const response = await venuesApi.post('/', venueData);
    return response.data;
  } catch (error) {
    console.error('Error creating venue:', error);
    throw handleApiError(error, 'Không thể tạo địa điểm');
  }
};

/**
 * Cập nhật thông tin địa điểm
 * @param {number} id - ID của địa điểm
 * @param {object} venueData - Thông tin cập nhật
 * @returns {Promise} - Địa điểm đã cập nhật
 */
export const updateVenue = async (id, venueData) => {
  try {
    const response = await venuesApi.put(`/${id}`, venueData);
    return response.data;
  } catch (error) {
    console.error(`Error updating venue ${id}:`, error);
    throw handleApiError(error, 'Không thể cập nhật địa điểm');
  }
};

/**
 * Xóa địa điểm
 * @param {number} id - ID của địa điểm
 * @returns {Promise} - Kết quả xóa
 */
export const deleteVenue = async (id) => {
  try {
    const response = await venuesApi.delete(`/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting venue ${id}:`, error);
    throw handleApiError(error, 'Không thể xóa địa điểm');
  }
};

/**
 * Upload hình ảnh cho địa điểm
 * @param {number} id - ID của địa điểm
 * @param {FormData} formData - Form data chứa hình ảnh
 * @returns {Promise} - Địa điểm đã cập nhật
 */
export const uploadVenueImages = async (id, formData) => {
  try {
    const response = await venuesApi.post(`/${id}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error uploading images for venue ${id}:`, error);
    throw handleApiError(error, 'Không thể tải lên hình ảnh');
  }
};

/**
 * Lấy danh sách địa điểm của người dùng hiện tại
 * @returns {Promise} - Danh sách địa điểm
 */
export const getUserVenues = async () => {
  try {
    const response = await venuesApi.get('/my-venues');
    return response.data || [];
  } catch (error) {
    console.error('Error getting user venues:', error);
    throw handleApiError(error, 'Không thể tải danh sách địa điểm của bạn');
  }
};

/**
 * Lấy các loại thể thao có sẵn
 * @returns {Promise} - Danh sách loại thể thao
 */
export const getAvailableSportTypes = async () => {
  try {
    const response = await venuesApi.get('/sport-types');
    return response.data || [];
  } catch (error) {
    console.error('Error getting sport types:', error);
    throw handleApiError(error, 'Không thể tải danh sách loại thể thao');
  }
};

/**
 * Lấy các loại địa điểm có sẵn
 * @returns {Promise} - Danh sách loại địa điểm
 */
export const getAvailableVenueTypes = async () => {
  try {
    const response = await venuesApi.get('/venue-types');
    return response.data || [];
  } catch (error) {
    console.error('Error getting venue types:', error);
    throw handleApiError(error, 'Không thể tải danh sách loại địa điểm');
  }
};

/**
 * Lấy các mức giá có sẵn
 * @returns {Promise} - Danh sách mức giá
 */
export const getAvailablePriceRanges = async () => {
  try {
    const response = await venuesApi.get('/price-ranges');
    return response.data || [];
  } catch (error) {
    console.error('Error getting price ranges:', error);
    throw handleApiError(error, 'Không thể tải danh sách mức giá');
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
  searchVenues,
  getNearbyVenues,
  getVenueById,
  getPopularVenues,
  getVenuesBySportType,
  createVenue,
  updateVenue,
  deleteVenue,
  uploadVenueImages,
  getUserVenues,
  getAvailableSportTypes,
  getAvailableVenueTypes,
  getAvailablePriceRanges
}; 