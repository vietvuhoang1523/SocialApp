import * as Location from 'expo-location';

/**
 * Get the current location of the user
 * @returns {Promise<Location.LocationObject|null>} The current location or null if permission denied
 */
export const getCurrentLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Permission to access location was denied');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return location;
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
};

/**
 * Format distance in meters to a human-readable string
 * @param {number} meters - Distance in meters
 * @returns {string} Formatted distance
 */
export const formatDistance = (meters) => {
  if (!meters && meters !== 0) return '';
  
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    return `${(meters / 1000).toFixed(1)}km`;
  }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in meters

  return d;
};

/**
 * Check if a location is within a certain radius of another location
 * @param {number} centerLat - Latitude of center point
 * @param {number} centerLon - Longitude of center point
 * @param {number} pointLat - Latitude of point to check
 * @param {number} pointLon - Longitude of point to check
 * @param {number} radiusKm - Radius in kilometers
 * @returns {boolean} True if point is within radius
 */
export const isWithinRadius = (centerLat, centerLon, pointLat, pointLon, radiusKm) => {
  const distance = calculateDistance(centerLat, centerLon, pointLat, pointLon);
  return distance !== null && distance <= radiusKm * 1000;
};

/**
 * Get address from coordinates using reverse geocoding
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {Promise<Object|null>} Address object or null if failed
 */
export const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    const result = await Location.reverseGeocodeAsync({
      latitude,
      longitude
    });
    
    if (result.length > 0) {
      return result[0];
    }
    return null;
  } catch (error) {
    console.error('Error getting address:', error);
    return null;
  }
};

/**
 * Get coordinates from address using geocoding
 * @param {string} address - Address to geocode
 * @returns {Promise<Object|null>} Coordinates object or null if failed
 */
export const getCoordinatesFromAddress = async (address) => {
  try {
    const result = await Location.geocodeAsync(address);
    
    if (result.length > 0) {
      return {
        latitude: result[0].latitude,
        longitude: result[0].longitude
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting coordinates:', error);
    return null;
  }
};

/**
 * Watch user's location with updates
 * @param {Function} callback - Function to call on location update
 * @param {Object} options - Options for watching location
 * @returns {Promise<number|null>} Location subscription or null if permission denied
 */
export const watchLocation = async (callback, options = {}) => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Permission to access location was denied');
      return null;
    }

    const defaultOptions = {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 5000,
      distanceInterval: 10,
    };

    const subscription = await Location.watchPositionAsync(
      { ...defaultOptions, ...options },
      callback
    );
    
    return subscription;
  } catch (error) {
    console.error('Error watching location:', error);
    return null;
  }
};

export default {
  getCurrentLocation,
  formatDistance,
  calculateDistance,
  isWithinRadius,
  getAddressFromCoordinates,
  getCoordinatesFromAddress,
  watchLocation
}; 