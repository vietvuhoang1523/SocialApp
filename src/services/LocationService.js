import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { API_ENDPOINTS, formatEndpoint } from './api';
import { Platform } from 'react-native';

/**
 * Service xử lý vị trí người dùng, tích hợp với BE UserLocationService
 */
class LocationService {
  // Kiểm tra quyền truy cập vị trí
  async getLocationPermissionStatus() {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status;
    } catch (error) {
      console.error('Error checking location permission:', error);
      throw error;
    }
  }

  // Yêu cầu quyền truy cập vị trí
  async requestLocationPermission() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      throw error;
    }
  }

  // Lấy vị trí hiện tại
  async getCurrentLocation(options = {}) {
    try {
      // 1. Kiểm tra quyền truy cập vị trí
      const permissionStatus = await this.getLocationPermissionStatus();
      console.log('📍 Location permission status:', permissionStatus);
      
      if (permissionStatus !== 'granted') {
        console.log('📍 Requesting location permission...');
        const requestResult = await this.requestLocationPermission();
        if (requestResult !== 'granted') {
          throw new Error('LOCATION_PERMISSION_DENIED');
        }
      }

      // 2. Kiểm tra xem dịch vụ vị trí có được bật không
      const isLocationServicesEnabled = await Location.hasServicesEnabledAsync();
      console.log('📍 Location services enabled:', isLocationServicesEnabled);
      
      if (!isLocationServicesEnabled) {
        throw new Error('LOCATION_SERVICES_DISABLED');
      }
      
      // 3. Thử lấy vị trí cuối cùng đã biết trước (nhanh hơn)
      console.log('📍 Trying to get last known position...');
      const lastKnownPosition = await Location.getLastKnownPositionAsync({
        maxAge: 300000, // 5 phút
        requiredAccuracy: 1000 // 1km
      });
      
      if (lastKnownPosition) {
        console.log('📍 Using last known position:', lastKnownPosition.coords);
        return lastKnownPosition;
      }
      
      // 4. Thử lấy vị trí với mức độ chính xác thấp trước (nhanh nhất)
      console.log('📍 Getting current position with low accuracy...');
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
          timeout: 10000,
          maximumAge: 60000, // 1 phút
          ...options
        });
        console.log('📍 Got location with low accuracy:', location.coords);
        return location;
      } catch (lowAccuracyError) {
        console.warn('📍 Failed with low accuracy:', lowAccuracyError.message);
        
        // 5. Thử với độ chính xác cân bằng
        console.log('📍 Trying with balanced accuracy...');
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeout: 15000,
            maximumAge: 30000, // 30 giây
            ...options
          });
          console.log('📍 Got location with balanced accuracy:', location.coords);
          return location;
        } catch (balancedAccuracyError) {
          console.warn('📍 Failed with balanced accuracy:', balancedAccuracyError.message);
          
          // 6. Thử lấy vị trí cuối cùng với tiêu chí rộng hơn
          console.log('📍 Trying last known position with relaxed criteria...');
          const fallbackPosition = await Location.getLastKnownPositionAsync({
            maxAge: 3600000, // 1 giờ
            requiredAccuracy: 5000 // 5km
          });
          
          if (fallbackPosition) {
            console.log('📍 Using fallback position:', fallbackPosition.coords);
            return fallbackPosition;
          }
          
          // 7. Nếu tất cả đều thất bại, ném lỗi với thông tin chi tiết
          console.error('📍 All location methods failed');
          throw new Error('LOCATION_UNAVAILABLE');
        }
      }
    } catch (error) {
      console.error('❌ Error getting current location:', error);
      
      // Xử lý các loại lỗi khác nhau
      if (error.message === 'LOCATION_PERMISSION_DENIED') {
        throw new Error('Vui lòng cho phép ứng dụng truy cập vị trí trong Cài đặt');
      } else if (error.message === 'LOCATION_SERVICES_DISABLED') {
        throw new Error('Vui lòng bật GPS/Định vị trong Cài đặt thiết bị');
      } else if (error.message === 'LOCATION_UNAVAILABLE') {
        throw new Error('Không thể xác định vị trí. Vui lòng kiểm tra kết nối GPS');
      } else {
        throw new Error('Lỗi khi lấy vị trí: ' + error.message);
      }
    }
  }

  // Lấy địa chỉ từ tọa độ
  async getAddressFromCoordinates(coords) {
    try {
      const [addressData] = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude
      });

      if (!addressData) {
        throw new Error('Không tìm thấy địa chỉ');
      }

      // Tạo địa chỉ đầy đủ từ dữ liệu
      const formattedAddress = [
        addressData.street,
        addressData.district,
        addressData.city,
        addressData.region,
        addressData.country
      ]
        .filter(Boolean)
        .join(', ');

      return {
        ...addressData,
        formattedAddress
      };
    } catch (error) {
      console.error('Error getting address from coordinates:', error);
      throw error;
    }
  }

  // Lấy tọa độ từ địa chỉ
  async getCoordinatesFromAddress(address) {
    try {
      const locationData = await Location.geocodeAsync(address);

      if (locationData.length === 0) {
        throw new Error('Không tìm thấy vị trí cho địa chỉ này');
      }

      return locationData[0];
    } catch (error) {
      console.error('Error getting coordinates from address:', error);
      throw error;
    }
  }

  /**
   * Cập nhật vị trí người dùng lên server
   * Tích hợp với updateUserLocation của backend
   * @param {object} coords - Tọa độ từ expo-location 
   * @param {string} privacyLevel - PUBLIC, FRIENDS_ONLY, PRIVATE
   * @param {object} additionalInfo - Thông tin bổ sung về vị trí
   * @returns {Promise} Kết quả cập nhật vị trí
   */
  async updateUserLocation(userId, coords, privacyLevel = 'FRIENDS_ONLY', additionalInfo = {}) {
    try {
      // Lấy thông tin địa chỉ từ tọa độ nếu có thể và không được cung cấp
      let address = additionalInfo.address;
      let city = additionalInfo.city;
      let district = additionalInfo.district;
      let ward = additionalInfo.ward;
      
      if (!address && !city) {
        try {
          const addressData = await this.getAddressFromCoordinates(coords);
          if (addressData) {
            address = address || addressData.formattedAddress;
            city = city || addressData.city;
            district = district || addressData.district;
            ward = ward || addressData.subregion;
          }
        } catch (addrError) {
          console.warn('Could not get address for coordinates', addrError);
        }
      }
      
      // Chuẩn bị dữ liệu gửi lên server theo định dạng LocationUpdateRequest
      const payload = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        privacyLevel: privacyLevel,
        address: address,
        city: city,
        district: district,
        ward: ward,
        locationName: additionalInfo.locationName || null,
        isCurrentLocation: additionalInfo.isCurrentLocation !== undefined ? additionalInfo.isCurrentLocation : true,
        accuracyMeters: coords.accuracy || 10.0,
        locationSource: additionalInfo.locationSource || "GPS"
      };
      
      const response = await api.post(API_ENDPOINTS.USER_LOCATION, payload);
      return response.data;
    } catch (error) {
      console.error('Error updating user location:', error);
      throw error;
    }
  }
  
  /**
   * Cập nhật vị trí đầy đủ với toàn bộ thông tin
   * @param {object} locationData - Đầy đủ thông tin vị trí theo LocationUpdateRequest
   * @returns {Promise} Kết quả cập nhật vị trí
   */
  async updateFullUserLocation(locationData) {
    try {
      // Kiểm tra các trường bắt buộc
      if (!locationData.latitude || !locationData.longitude) {
        throw new Error('Latitude và longitude là bắt buộc');
      }
      
      const response = await api.post(API_ENDPOINTS.USER_LOCATION, locationData);
      return response.data;
    } catch (error) {
      console.error('Error updating full user location:', error);
      throw error;
    }
  }

  // Tính khoảng cách giữa hai vị trí (trả về khoảng cách theo km)
  calculateDistance(coords1, coords2) {
    // Sử dụng công thức Haversine để tính khoảng cách
    const toRadians = (degree) => degree * (Math.PI / 180);
    
    const R = 6371; // Bán kính trái đất theo km
    const dLat = toRadians(coords2.latitude - coords1.latitude);
    const dLon = toRadians(coords2.longitude - coords1.longitude);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRadians(coords1.latitude)) * Math.cos(toRadians(coords2.latitude)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Khoảng cách theo km
    
    return distance;
  }

  // Lưu cài đặt vị trí vào AsyncStorage
  async saveLocationSettings(settings) {
    try {
      await AsyncStorage.setItem('locationSettings', JSON.stringify(settings));
      
      // Nếu người dùng chọn chia sẻ vị trí
      if (settings.shareLocation) {
        await this.enableLocationSharing();
      } else {
        await this.disableLocationSharing();
      }
      
      // Cập nhật mức độ riêng tư nếu được chỉ định
      if (settings.privacyLevel) {
        await this.updateLocationPrivacy(settings.privacyLevel);
      }
      
      return true;
    } catch (error) {
      console.error('Error saving location settings:', error);
      return false;
    }
  }

  // Lấy cài đặt vị trí từ AsyncStorage
  async loadLocationSettings() {
    try {
      // Đầu tiên lấy từ localStorage
      const settingsString = await AsyncStorage.getItem('locationSettings');
      let settings = null;
      
      if (settingsString) {
        settings = JSON.parse(settingsString);
      } else {
        // Cài đặt mặc định nếu không có
        settings = {
          shareLocation: false,
          notifyNearbyFriends: false,
          autoUpdateLocation: true,
          locationUpdateFrequency: 'medium',
          nearbyDistance: 'medium',
          privacyLevel: 'PUBLIC'
        };
      }
      
      // Thử lấy dữ liệu vị trí hiện tại từ server để cập nhật trạng thái chia sẻ
      try {
        const serverLocation = await this.getCurrentUserLocationFromServer();
        if (serverLocation) {
          // Cập nhật cài đặt từ server
          settings.shareLocation = true;
          settings.privacyLevel = serverLocation.privacyLevel;
        }
      } catch (error) {
        // Nếu không lấy được từ server thì giữ nguyên giá trị từ local
        console.log('Could not fetch location from server, using local settings');
      }
      
      // Lưu lại các cài đặt sau khi đã cập nhật
      await AsyncStorage.setItem('locationSettings', JSON.stringify(settings));
      
      return settings;
    } catch (error) {
      console.error('Error loading location settings:', error);
      return {
        shareLocation: false,
        notifyNearbyFriends: false,
        autoUpdateLocation: true,
        locationUpdateFrequency: 'medium',
        nearbyDistance: 'medium',
        privacyLevel: 'PUBLIC'
      };
    }
  }
  
  // Bật/tắt chia sẻ vị trí và đồng bộ với server
  async toggleLocationSharing(value, coords) {
    try {
      // Cập nhật AsyncStorage
      const settings = await this.loadLocationSettings();
      settings.shareLocation = value;
      await AsyncStorage.setItem('locationSettings', JSON.stringify(settings));
      
      // Cập nhật trên server
      if (value) {
        // Nếu bật chia sẻ và có tọa độ, không cần cập nhật ngay vị trí
        // vì người gọi sẽ gọi updateUserLocation riêng với thông tin đầy đủ
        
        // Bật chia sẻ vị trí
        await this.enableLocationSharing();
      } else {
        // Tắt chia sẻ vị trí
        await this.disableLocationSharing();
      }
      
      return true;
    } catch (error) {
      console.error('Error toggling location sharing:', error);
      return false;
    }
  }
  
  // Tìm người dùng gần đây
  async findNearbyUsers(coords, radius = 5.0) { // radius tính theo km
    try {
      const response = await api.get(API_ENDPOINTS.USER_NEARBY, {
        params: {
          latitude: coords.latitude,
          longitude: coords.longitude,
          radius: radius
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error finding nearby users:', error);
      throw error;
    }
  }
  
  // Lấy vị trí hiện tại của người dùng từ server
  async getCurrentUserLocationFromServer() {
    try {
      const response = await api.get(API_ENDPOINTS.USER_LOCATION_ME);
      return response.data;
    } catch (error) {
      console.error('Error getting current user location from server:', error);
      throw error;
    }
  }
  
  // Cập nhật mức độ riêng tư cho vị trí
  async updateLocationPrivacy(privacyLevel) {
    try {
      await api.put(API_ENDPOINTS.USER_LOCATION_PRIVACY, null, {
        params: { privacyLevel }
      });
      return true;
    } catch (error) {
      console.error('Error updating location privacy:', error);
      throw error;
    }
  }
  
  // Bật chia sẻ vị trí
  async enableLocationSharing() {
    try {
      await api.put(API_ENDPOINTS.USER_LOCATION_ENABLE);
      return true;
    } catch (error) {
      console.error('Error enabling location sharing:', error);
      throw error;
    }
  }
  
  // Tắt chia sẻ vị trí
  async disableLocationSharing() {
    try {
      await api.put(API_ENDPOINTS.USER_LOCATION_DISABLE);
      return true;
    } catch (error) {
      console.error('Error disabling location sharing:', error);
      throw error;
    }
  }
  
  // Xóa vị trí người dùng
  async deleteUserLocation() {
    try {
      await api.delete(API_ENDPOINTS.USER_LOCATION);
      return true;
    } catch (error) {
      console.error('Error deleting user location:', error);
      throw error;
    }
  }
  
  /**
   * Tìm bạn bè gần đó
   * Tích hợp với findNearbyFriends backend
   */
  async findNearbyFriends(coords, radius = 5.0) {
    try {
      const response = await api.get(`${API_ENDPOINTS.USER_NEARBY}/friends`, {
        params: {
          latitude: coords.latitude,
          longitude: coords.longitude,
          radius: radius
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error finding nearby friends:', error);
      throw error;
    }
  }
  
  // Chuyển đổi cài đặt tần suất cập nhật thành milliseconds
  getUpdateIntervalFromFrequency(frequency) {
    switch (frequency) {
      case 'low':
        return 5 * 60 * 1000; // 5 phút
      case 'medium':
        return 2 * 60 * 1000; // 2 phút
      case 'high':
        return 30 * 1000; // 30 giây
      default:
        return 2 * 60 * 1000; // Mặc định 2 phút
    }
  }
  
  // Chuyển đổi cài đặt khoảng cách thành km
  getDistanceFromSetting(distance) {
    switch (distance) {
      case 'close':
        return 1; // 1km
      case 'medium':
        return 5; // 5km
      case 'far':
        return 10; // 10km
      default:
        return 5; // Mặc định 5km
    }
  }
  
  /**
   * Kiểm tra xem người dùng có đang ở trong khu vực cụ thể không
   * Tích hợp với isUserInArea backend
   */
  async isUserInArea(centerCoords, radius) {
    try {
      // Lấy vị trí hiện tại
      const userLocation = await this.getCurrentUserLocationFromServer();
      
      if (!userLocation) {
        return false;
      }
      
      // Tính khoảng cách
      const distance = this.calculateDistance(
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        centerCoords
      );
      
      return distance <= radius;
    } catch (error) {
      console.error('Error checking if user is in area:', error);
      return false;
    }
  }
  
  /**
   * Lấy lịch sử vị trí người dùng
   */
  async getUserLocationHistory(limit = 10) {
    try {
      const response = await api.get(`${API_ENDPOINTS.USER_LOCATION}/history`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting location history:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra và yêu cầu quyền vị trí, đảm bảo dịch vụ vị trí được bật
   */
  async ensureLocationAvailable() {
    // Kiểm tra quyền
    const permissionStatus = await this.getLocationPermissionStatus();
    if (permissionStatus !== 'granted') {
      const newStatus = await this.requestLocationPermission();
      if (newStatus !== 'granted') {
        throw new Error('PERMISSION_DENIED');
      }
    }
    
    // Kiểm tra dịch vụ vị trí
    const isEnabled = await Location.hasServicesEnabledAsync();
    if (!isEnabled) {
      // Trên một số thiết bị, bạn có thể mở cài đặt vị trí
      if (Platform.OS === 'android') {
        await Location.enableNetworkProviderAsync().catch(e => {
          console.warn('Could not enable location provider:', e);
        });
        
        // Kiểm tra lại sau khi cố gắng bật
        const recheck = await Location.hasServicesEnabledAsync();
        if (!recheck) {
          throw new Error('LOCATION_SERVICES_DISABLED');
        }
      } else {
        throw new Error('LOCATION_SERVICES_DISABLED');
      }
    }
    
    return true;
  }
  
  // Phương thức an toàn để lấy vị trí, với nhiều lớp dự phòng
  async getLocationSafely() {
    try {
      // Đảm bảo quyền và dịch vụ vị trí được bật
      await this.ensureLocationAvailable();
      
      try {
        // Thử với mức độ chính xác thấp trước
        return await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
          timeout: 15000
        });
      } catch (e) {
        console.warn('Low accuracy location failed, trying with coarse accuracy:', e);
        
        try {
          // Thử với độ chính xác thô
          return await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Lowest,
            timeout: 10000
          });
        } catch (e2) {
          console.warn('Coarse accuracy location failed, trying last known position:', e2);
          
          // Thử lấy vị trí cuối cùng đã biết
          const lastLocation = await Location.getLastKnownPositionAsync();
          if (lastLocation) return lastLocation;
          
          throw new Error('LOCATION_UNAVAILABLE');
        }
      }
    } catch (error) {
      console.error('Error in getLocationSafely:', error);
      throw error;
    }
  }
  
  // Phiên dịch mã lỗi thành thông báo thân thiện với người dùng
  getLocationErrorMessage(error) {
    if (!error) return 'Đã xảy ra lỗi không xác định khi lấy vị trí.';
    
    const errorMessage = error.message || '';
    
    if (errorMessage.includes('LOCATION_SERVICES_DISABLED') || 
        errorMessage.includes('unsatisfied device settings')) {
      return 'Dịch vụ vị trí (GPS) chưa được bật. Vui lòng bật GPS trong cài đặt thiết bị của bạn.';
    }
    
    if (errorMessage.includes('PERMISSION_DENIED') || 
        errorMessage.includes('Permission denied')) {
      return 'Ứng dụng không có quyền truy cập vị trí. Vui lòng cấp quyền trong cài đặt.';
    }
    
    if (errorMessage.includes('LOCATION_UNAVAILABLE')) {
      return 'Không thể xác định vị trí hiện tại. Vui lòng đảm bảo bạn đang ở nơi có tín hiệu GPS tốt.';
    }
    
    if (errorMessage.includes('timed out')) {
      return 'Yêu cầu vị trí đã hết thời gian chờ. Vui lòng đảm bảo GPS được bật và thử lại.';
    }
    
    return `Không thể lấy vị trí: ${errorMessage}`;
  }

  /**
   * Lấy vị trí với fallback khi GPS không khả dụng
   * Sử dụng vị trí mặc định (Hà Nội) nếu không thể lấy vị trí thực
   */
  async getLocationWithFallback() {
    try {
      console.log('📍 Attempting to get location with fallback...');
      const location = await this.getCurrentLocation();
      return {
        coords: location.coords,
        source: 'GPS',
        accuracy: location.coords.accuracy || 10
      };
    } catch (error) {
      console.warn('📍 GPS unavailable, using fallback location:', error.message);
      
      // Vị trí mặc định (Hà Nội, Việt Nam)
      const fallbackLocation = {
        coords: {
          latitude: 21.0285,
          longitude: 105.8542,
          accuracy: 1000,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        source: 'FALLBACK',
        accuracy: 1000,
        timestamp: Date.now()
      };
      
      console.log('📍 Using fallback location (Hanoi):', fallbackLocation.coords);
      return fallbackLocation;
    }
  }
}

// Export một instance duy nhất
export default new LocationService(); 