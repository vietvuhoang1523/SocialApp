import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import LocationService from '../../services/LocationService';

const SimpleLocationController = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationAddress, setLocationAddress] = useState(null);
  const [shareLocation, setShareLocation] = useState(false);
  
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        
        try {
          // Đảm bảo vị trí được bật và quyền đã được cấp
          await LocationService.ensureLocationAvailable().catch(error => {
            console.warn("Location not available:", error);
            setHasPermission(false);
            throw error;
          });
          
          setHasPermission(true);
          
          // Lấy vị trí an toàn
          const location = await LocationService.getLocationSafely();
          setLocation(location);
          
          // Lấy địa chỉ từ tọa độ
          try {
            const address = await LocationService.getAddressFromCoordinates(location.coords);
            setLocationAddress(address);
          } catch (addressError) {
            console.warn('Could not get address:', addressError);
          }
          
          // Kiểm tra cài đặt chia sẻ vị trí
          const settings = await LocationService.loadLocationSettings();
          setShareLocation(settings.shareLocation);
          
          // Nếu đã bật chia sẻ vị trí, cập nhật lên server
          if (settings.shareLocation) {
            await LocationService.toggleLocationSharing(true, location.coords);
          }
        } catch (locationError) {
          console.warn('Error getting location:', locationError);
          
          // Hiện thông báo lỗi thân thiện
          Alert.alert(
            'Lỗi lấy vị trí',
            LocationService.getLocationErrorMessage(locationError)
          );
          
          // Thử lấy vị trí cuối cùng đã biết
          try {
            const lastKnownLocation = await Location.getLastKnownPositionAsync();
            if (lastKnownLocation) {
              setLocation(lastKnownLocation);
              Alert.alert(
                'Thông báo',
                'Không thể lấy vị trí chính xác. Đang hiển thị vị trí cuối cùng đã biết.'
              );
            }
          } catch (lastLocationError) {
            console.warn('Could not get last known location:', lastLocationError);
          }
        }
      } catch (error) {
        console.error('Error in location process:', error);
        Alert.alert('Lỗi', 'Không thể xử lý thông tin vị trí. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  
  const openMap = () => {
    if (location) {
      navigation.navigate('LocationMap', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        title: 'Vị trí của tôi',
        address: locationAddress?.formattedAddress
      });
    } else {
      Alert.alert('Thông báo', 'Chưa có thông tin vị trí');
    }
  };
  
  // Kiểm tra trạng thái vị trí
  const checkLocationServices = async () => {
    try {
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        Alert.alert(
          'Dịch vụ vị trí chưa được bật',
          'Vui lòng bật dịch vụ vị trí (GPS) trên thiết bị của bạn để sử dụng tính năng này.',
          [{ text: 'OK' }]
        );
      }
      return isEnabled;
    } catch (error) {
      console.error('Error checking location services:', error);
      return false;
    }
  };
  
  // Cập nhật vị trí
  const updateLocation = async () => {
    if (!hasPermission) return;
    
    setLoading(true);
    
    try {
      // Sử dụng phương thức an toàn để lấy vị trí
      const location = await LocationService.getLocationSafely();
      
      setLocation(location);
      
      // Lấy địa chỉ từ tọa độ
      let addressInfo = null;
      try {
        const address = await LocationService.getAddressFromCoordinates(location.coords);
        setLocationAddress(address);
        addressInfo = address;
      } catch (addressError) {
        console.warn('Could not get address:', addressError);
      }
      
      // Nếu đã bật chia sẻ vị trí, cập nhật lên server
      if (shareLocation) {
        const additionalInfo = {
          address: addressInfo?.formattedAddress,
          city: addressInfo?.city,
          district: addressInfo?.district,
          ward: addressInfo?.subregion,
          locationName: "Vị trí hiện tại",
          isCurrentLocation: true,
          locationSource: "GPS"
        };
        
        await LocationService.updateUserLocation(
          null, // userId lấy từ token trên server
          location.coords,
          'PUBLIC', // Mặc định là PUBLIC cho SimpleLocationController
          additionalInfo
        );
      }
    } catch (error) {
      console.error('Error updating location:', error);
      Alert.alert(
        'Lỗi cập nhật vị trí',
        LocationService.getLocationErrorMessage(error)
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Bật/tắt chia sẻ vị trí
  const toggleShareLocation = async (value) => {
    if (!location) {
      Alert.alert('Vị trí không khả dụng', 'Vui lòng cập nhật vị trí trước khi chia sẻ.');
      return;
    }
    
    setLoading(true);
    
    try {
      // Chuẩn bị thông tin địa chỉ nếu có
      const additionalInfo = locationAddress ? {
        address: locationAddress.formattedAddress,
        city: locationAddress.city,
        district: locationAddress.district,
        ward: locationAddress.subregion,
        locationName: "Vị trí hiện tại",
        isCurrentLocation: true,
        locationSource: "GPS"
      } : {};
      
      // Cập nhật trạng thái chia sẻ
      await LocationService.toggleLocationSharing(value, location.coords);
      
      // Nếu bật chia sẻ, cập nhật vị trí đầy đủ lên server
      if (value) {
        await LocationService.updateUserLocation(
          null,
          location.coords,
          'PUBLIC', // Mặc định là PUBLIC
          additionalInfo
        );
      }
      
      setShareLocation(value);
      
      if (value) {
        Alert.alert('Thông báo', 'Vị trí của bạn đã được chia sẻ.');
      } else {
        Alert.alert('Thông báo', 'Đã tắt chia sẻ vị trí.');
      }
    } catch (error) {
      console.error('Error toggling location sharing:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái chia sẻ vị trí.');
    } finally {
      setLoading(false);
    }
  };
  
  // Chuyển đến màn hình quản lý vị trí đầy đủ
  const goToFullLocationManager = () => {
    navigation.navigate('UserLocationController');
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thông tin vị trí của bạn</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Đang lấy thông tin vị trí...</Text>
        </View>
      ) : hasPermission === null ? (
        <Text style={styles.message}>Đang kiểm tra quyền truy cập vị trí...</Text>
      ) : hasPermission === false ? (
        <View style={styles.permissionContainer}>
          <MaterialIcons name="location-off" size={48} color="#F44336" />
          <Text style={styles.permissionText}>
            Quyền truy cập vị trí bị từ chối. Vui lòng cấp quyền để sử dụng tính năng này.
          </Text>
          <TouchableOpacity 
            style={styles.permissionButton}
            onPress={async () => {
              const status = await LocationService.requestLocationPermission();
              setHasPermission(status === 'granted');
              if (status === 'granted') {
                // Nếu quyền được cấp, thử lấy vị trí ngay lập tức
                updateLocation();
              }
            }}
          >
            <Text style={styles.permissionButtonText}>Cấp quyền</Text>
          </TouchableOpacity>
        </View>
      ) : location ? (
        <View style={styles.locationContainer}>
          <MaterialIcons name="location-on" size={48} color="#4CAF50" />
          <Text style={styles.coordsText}>
            Vĩ độ: {location.coords.latitude.toFixed(6)}
          </Text>
          <Text style={styles.coordsText}>
            Kinh độ: {location.coords.longitude.toFixed(6)}
          </Text>
          
          {locationAddress && (
            <View style={styles.addressContainer}>
              <Text style={styles.addressTitle}>Địa chỉ:</Text>
              <Text style={styles.addressText}>{locationAddress.formattedAddress}</Text>
            </View>
          )}
          
          <View style={styles.sharingContainer}>
            <Text style={styles.sharingText}>
              Chia sẻ vị trí của tôi:
            </Text>
            <TouchableOpacity
              style={[
                styles.sharingButton,
                shareLocation ? styles.sharingActiveButton : {}
              ]}
              onPress={() => toggleShareLocation(!shareLocation)}
            >
              <MaterialIcons
                name={shareLocation ? "share-location" : "location-disabled"}
                size={24}
                color={shareLocation ? "#FFFFFF" : "#757575"}
              />
              <Text style={[
                styles.sharingButtonText,
                shareLocation ? styles.sharingActiveText : {}
              ]}>
                {shareLocation ? "Đang chia sẻ" : "Chưa chia sẻ"}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.mapButton}
              onPress={openMap}
            >
              <MaterialIcons name="map" size={20} color="#FFFFFF" />
              <Text style={styles.mapButtonText}>Xem trên bản đồ</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={updateLocation}
              disabled={loading}
            >
              <MaterialIcons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.mapButtonText}>Cập nhật vị trí</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.advancedButton}
            onPress={goToFullLocationManager}
          >
            <MaterialIcons name="settings" size={20} color="#FFFFFF" />
            <Text style={styles.advancedButtonText}>Quản lý vị trí nâng cao</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.noLocationContainer}>
          <MaterialIcons name="location-searching" size={48} color="#FFA000" />
          <Text style={styles.message}>Chưa có thông tin vị trí</Text>
          <TouchableOpacity 
            style={styles.getLocationButton}
            onPress={updateLocation}
          >
            <MaterialIcons name="my-location" size={20} color="#FFFFFF" />
            <Text style={styles.getLocationButtonText}>Lấy vị trí hiện tại</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 300,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    minHeight: 200,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
  },
  permissionContainer: {
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 10,
  },
  permissionButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  locationContainer: {
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  coordsText: {
    fontSize: 16,
    color: '#333',
    marginVertical: 5,
  },
  addressContainer: {
    marginBottom: 20,
  },
  addressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  addressText: {
    fontSize: 16,
    color: '#666',
  },
  sharingContainer: {
    marginBottom: 20,
  },
  sharingText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sharingButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  sharingActiveButton: {
    backgroundColor: '#4CAF50',
  },
  sharingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  sharingActiveText: {
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  mapButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 1,
    marginRight: 5,
  },
  refreshButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
  },
  mapButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  noLocationContainer: {
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  getLocationButton: {
    backgroundColor: '#FFA000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  getLocationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  advancedButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  advancedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default SimpleLocationController; 