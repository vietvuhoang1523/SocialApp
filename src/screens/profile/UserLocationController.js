import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
  FlatList,
  Image
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useProfileContext } from '../../components/ProfileContext';
import LocationService from '../../services/LocationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const UserLocationController = ({ navigation }) => {
  // States
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [shareLocation, setShareLocation] = useState(false);
  const [locationAddress, setLocationAddress] = useState(null);
  const [settings, setSettings] = useState({
    shareLocation: false,
    notifyNearbyFriends: false,
    autoUpdateLocation: true,
    locationUpdateFrequency: 'medium',
    nearbyDistance: 'medium',
    privacyLevel: 'PUBLIC'
  });
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [loadingNearbyUsers, setLoadingNearbyUsers] = useState(false);
  const [activeTab, setActiveTab] = useState('location'); // 'location', 'nearby', 'settings'
  
  // Get user profile from context
  const { userProfile, updateUserProfile } = useProfileContext();
  
  // Check if location permissions are enabled on component mount
  useEffect(() => {
    checkLocationPermission();
    loadLocationSettings();
  }, []);
  
  // Effect để tự động cập nhật vị trí theo khoảng thời gian
  useEffect(() => {
    let interval = null;
    
    if (locationEnabled && settings.autoUpdateLocation && settings.shareLocation) {
      const updateFrequency = LocationService.getUpdateIntervalFromFrequency(settings.locationUpdateFrequency);
      
      interval = setInterval(() => {
        if (!loadingLocation) {
          console.log('Auto updating location...');
          getCurrentLocation();
        }
      }, updateFrequency);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [locationEnabled, settings, loadingLocation]);
  
  // Load saved location settings from AsyncStorage
  const loadLocationSettings = async () => {
    try {
      const locationSettings = await LocationService.loadLocationSettings();
      setSettings(locationSettings);
      setShareLocation(locationSettings.shareLocation);
    } catch (error) {
      console.error('Error loading location settings:', error);
    }
  };
  
  // Kiểm tra trạng thái dịch vụ vị trí của thiết bị
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
  
  // Check if location permissions are granted
  const checkLocationPermission = async () => {
    try {
      try {
        await LocationService.ensureLocationAvailable();
        setLocationEnabled(true);
      } catch (error) {
        console.warn('Location not fully available:', error);
        
        // Vẫn kiểm tra riêng quyền để hiển thị UI phù hợp
        const status = await LocationService.getLocationPermissionStatus();
        setLocationEnabled(status === 'granted');
        
        if (status === 'granted') {
          // Nếu quyền đã cấp nhưng vẫn có vấn đề, đó có thể là do GPS tắt
          Alert.alert(
            'Dịch vụ vị trí chưa được bật',
            'Vui lòng bật dịch vụ vị trí (GPS) trên thiết bị của bạn để sử dụng tính năng này.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error checking location permission:', error);
      setLocationEnabled(false);
    }
  };
  
  // Request location permissions
  const requestLocationPermission = async () => {
    try {
      const status = await LocationService.requestLocationPermission();
      setLocationEnabled(status === 'granted');
      
      if (status === 'granted') {
        getCurrentLocation();
      } else {
        Alert.alert(
          'Quyền truy cập vị trí bị từ chối',
          'Vui lòng cấp quyền truy cập vị trí trong cài đặt để sử dụng tính năng này.'
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setLocationEnabled(false);
    }
  };
  
  // Get current user location
  const getCurrentLocation = async () => {
    if (!locationEnabled) {
      await requestLocationPermission();
      return;
    }
    
    setLoadingLocation(true);
    setLocationError(null);
    
    try {
      // Sử dụng phương thức an toàn để lấy vị trí
      const location = await LocationService.getLocationSafely();
      
      setCurrentLocation(location.coords);
      
      // Lấy địa chỉ từ tọa độ
      let addressInfo = null;
      try {
        const address = await LocationService.getAddressFromCoordinates(location.coords);
        setLocationAddress(address);
        addressInfo = address;
      } catch (addressError) {
        console.warn('Could not get address:', addressError);
      }
      
      // Nếu chia sẻ vị trí được bật, cập nhật vị trí lên server
      if (shareLocation) {
        try {
          // Chuẩn bị thông tin bổ sung từ địa chỉ nếu có
          const additionalInfo = {
            address: addressInfo?.formattedAddress,
            city: addressInfo?.city,
            district: addressInfo?.district,
            ward: addressInfo?.subregion,
            locationName: "Vị trí hiện tại", // Có thể sửa thành giá trị khác tùy người dùng
            isCurrentLocation: true,
            locationSource: "GPS"
          };
          
          // Cập nhật vị trí lên server với đầy đủ thông tin
          await LocationService.updateUserLocation(
            null, // Sẽ lấy userId từ token trên server
            location.coords,
            settings.privacyLevel, // Sử dụng mức quyền riêng tư từ cài đặt
            additionalInfo
          );
          
          console.log('Location shared successfully');
          
          // Tải danh sách người dùng gần đó nếu đang ở tab 'nearby'
          if (activeTab === 'nearby') {
            fetchNearbyUsers(location.coords);
          }
        } catch (error) {
          console.error('Error sharing location:', error);
          Alert.alert(
            'Lỗi',
            'Không thể cập nhật vị trí lên máy chủ. Vui lòng thử lại sau.'
          );
        }
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      setLocationError(LocationService.getLocationErrorMessage(error));
      
      // Thử lấy vị trí cuối cùng đã biết
      try {
        const lastLocation = await Location.getLastKnownPositionAsync();
        if (lastLocation) {
          setCurrentLocation(lastLocation.coords);
          Alert.alert(
            'Thông báo',
            'Không thể lấy vị trí chính xác. Đang hiển thị vị trí cuối cùng đã biết.'
          );
        }
      } catch (lastLocationError) {
        console.warn('Could not get last known location:', lastLocationError);
      }
    } finally {
      setLoadingLocation(false);
    }
  };
  
  // Lấy danh sách người dùng gần đó
  const fetchNearbyUsers = async (coords) => {
    if (!coords) {
      if (!currentLocation) {
        Alert.alert('Vị trí không khả dụng', 'Cần có thông tin vị trí để tìm người dùng gần đó.');
        return;
      }
      coords = currentLocation;
    }
    
    setLoadingNearbyUsers(true);
    
    try {
      const radius = LocationService.getDistanceFromSetting(settings.nearbyDistance);
      const users = await LocationService.findNearbyUsers(coords, radius);
      setNearbyUsers(users);
    } catch (error) {
      console.error('Error fetching nearby users:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách người dùng gần đó.');
    } finally {
      setLoadingNearbyUsers(false);
    }
  };
  
  // Toggle location sharing
  const toggleLocationSharing = (value) => {
    setShareLocation(value);
    
    if (currentLocation) {
      // Chuẩn bị thông tin bổ sung từ địa chỉ nếu có
      const additionalInfo = locationAddress ? {
        address: locationAddress.formattedAddress,
        city: locationAddress.city,
        district: locationAddress.district,
        ward: locationAddress.subregion,
        locationName: "Vị trí hiện tại",
        isCurrentLocation: true,
        locationSource: "GPS"
      } : {};
      
      LocationService.toggleLocationSharing(value, currentLocation)
        .then(() => {
          if (value) {
            // Nếu bật chia sẻ vị trí, cập nhật lên server với đầy đủ thông tin
            return LocationService.updateUserLocation(
              null,
              currentLocation,
              settings.privacyLevel,
              additionalInfo
            );
          }
        })
        .then(() => {
          console.log('Location sharing toggled successfully:', value);
        })
        .catch(error => {
          console.error('Error toggling location sharing:', error);
          Alert.alert(
            'Lỗi',
            'Không thể cập nhật trạng thái chia sẻ vị trí. Vui lòng thử lại sau.'
          );
          // Revert UI state if server update fails
          setShareLocation(!value);
        });
    } else {
      // If no location is available, just update settings locally
      LocationService.saveLocationSettings({
        ...settings,
        shareLocation: value
      }).catch(error => {
        console.error('Error saving location settings:', error);
      });
    }
  };
  
  // Cập nhật mức độ quyền riêng tư
  const updatePrivacyLevel = (level) => {
    LocationService.updateLocationPrivacy(level)
      .then(() => {
        setSettings(prev => ({
          ...prev,
          privacyLevel: level
        }));
        Alert.alert('Thành công', 'Đã cập nhật mức độ quyền riêng tư vị trí.');
      })
      .catch(error => {
        console.error('Error updating privacy level:', error);
        Alert.alert('Lỗi', 'Không thể cập nhật mức độ quyền riêng tư vị trí.');
      });
  };
  
  // Navigate to location settings
  const navigateToLocationSettings = () => {
    navigation.navigate('LocationSettings');
  };
  
  // View location on map
  const viewLocationOnMap = () => {
    if (!currentLocation) {
      Alert.alert('Vị trí không khả dụng', 'Vui lòng cập nhật vị trí trước khi xem trên bản đồ.');
      return;
    }
    
    navigation.navigate('LocationMap', {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      title: userProfile?.name || 'Vị trí của tôi',
      address: locationAddress?.formattedAddress
    });
  };
  
  // Xem hồ sơ người dùng gần đó
  const viewUserProfile = (user) => {
    navigation.navigate('UserProfileScreen', { userId: user.userId });
  };
  
  // Hiển thị danh sách người dùng gần đó
  const renderNearbyUsersList = () => {
    if (loadingNearbyUsers) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Đang tìm người dùng gần đây...</Text>
        </View>
      );
    }
    
    if (nearbyUsers.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="person-search" size={48} color="#757575" />
          <Text style={styles.emptyText}>Không tìm thấy người dùng nào gần đây</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={() => fetchNearbyUsers()}
          >
            <MaterialIcons name="refresh" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Làm mới</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <FlatList
        data={nearbyUsers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.userItem}
            onPress={() => viewUserProfile(item)}
          >
            <Image
              source={{ uri: item.profilePictureUrl || 'https://via.placeholder.com/50' }}
              style={styles.userAvatar}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{item.username || 'Unknown User'}</Text>
              <Text style={styles.userDistance}>
                Cách {(LocationService.calculateDistance(
                  currentLocation,
                  { latitude: item.latitude, longitude: item.longitude }
                )).toFixed(2)} km
              </Text>
              {item.address && (
                <Text style={styles.userAddress} numberOfLines={1}>
                  <MaterialIcons name="location-on" size={12} color="#757575" />
                  {item.address}
                </Text>
              )}
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#bdbdbd" />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.usersList}
        refreshing={loadingNearbyUsers}
        onRefresh={() => fetchNearbyUsers()}
      />
    );
  };
  
  // Render tabs
  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'location' && styles.activeTab]}
        onPress={() => setActiveTab('location')}
      >
        <MaterialIcons
          name="my-location"
          size={20}
          color={activeTab === 'location' ? '#2196F3' : '#757575'}
        />
        <Text style={[styles.tabText, activeTab === 'location' && styles.activeTabText]}>
          Vị trí
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'nearby' && styles.activeTab]}
        onPress={() => {
          setActiveTab('nearby');
          if (currentLocation) {
            fetchNearbyUsers(currentLocation);
          }
        }}
      >
        <MaterialIcons
          name="people"
          size={20}
          color={activeTab === 'nearby' ? '#2196F3' : '#757575'}
        />
        <Text style={[styles.tabText, activeTab === 'nearby' && styles.activeTabText]}>
          Gần đây
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'settings' && styles.activeTab]}
        onPress={() => setActiveTab('settings')}
      >
        <MaterialIcons
          name="settings"
          size={20}
          color={activeTab === 'settings' ? '#2196F3' : '#757575'}
        />
        <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
          Cài đặt
        </Text>
      </TouchableOpacity>
    </View>
  );
  
  // Chuyển đến màn hình nhập vị trí thủ công
      const goToManualLocationScreen = () => {
        navigation.navigate('ManualLocation', {
      location: currentLocation ? { coords: currentLocation } : null
    });
  };
  
  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Quản lý vị trí</Text>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={navigateToLocationSettings}
          >
            <Ionicons name="settings-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        
        {renderTabs()}
        
        {activeTab === 'location' && (
          <View style={styles.locationContainer}>
            <View style={styles.permissionContainer}>
              <View style={styles.permissionInfo}>
                <MaterialIcons 
                  name={locationEnabled ? "location-on" : "location-off"} 
                  size={24} 
                  color={locationEnabled ? "#4CAF50" : "#F44336"} 
                />
                <Text style={styles.permissionText}>
                  {locationEnabled 
                    ? 'Quyền truy cập vị trí đã được cấp' 
                    : 'Quyền truy cập vị trí chưa được cấp'}
                </Text>
              </View>
              
              {!locationEnabled && (
                <TouchableOpacity 
                  style={styles.permissionButton}
                  onPress={requestLocationPermission}
                >
                  <Text style={styles.permissionButtonText}>Cấp quyền</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.sharingContainer}>
              <View style={styles.sharingInfo}>
                <MaterialIcons 
                  name={shareLocation ? "share-location" : "location-disabled"} 
                  size={24} 
                  color={shareLocation ? "#2196F3" : "#757575"} 
                />
                <Text style={styles.sharingText}>Chia sẻ vị trí với bạn bè</Text>
              </View>
              
              <Switch
                value={shareLocation}
                onValueChange={toggleLocationSharing}
                trackColor={{ false: "#ccc", true: "#2196F3" }}
                thumbColor={shareLocation ? "#fff" : "#f4f3f4"}
                disabled={!locationEnabled}
              />
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.currentLocationContainer}>
              <Text style={styles.sectionTitle}>Vị trí hiện tại</Text>
              
              {loadingLocation ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#2196F3" />
                  <Text style={styles.loadingText}>Đang lấy thông tin vị trí...</Text>
                </View>
              ) : locationError ? (
                <View style={styles.errorContainer}>
                  <MaterialIcons name="error-outline" size={36} color="#F44336" />
                  <Text style={styles.errorText}>{locationError}</Text>
                </View>
              ) : currentLocation ? (
                <View style={styles.locationInfo}>
                  <MaterialIcons name="location-on" size={36} color="#4CAF50" style={styles.locationIcon} />
                  
                  <Text style={styles.locationText}>
                    {`Vĩ độ: ${currentLocation.latitude.toFixed(6)}`}
                  </Text>
                  <Text style={styles.locationText}>
                    {`Kinh độ: ${currentLocation.longitude.toFixed(6)}`}
                  </Text>
                  
                  {locationAddress && (
                    <View style={styles.addressContainer}>
                      <Text style={styles.addressTitle}>Địa chỉ:</Text>
                      <Text style={styles.addressText}>{locationAddress.formattedAddress}</Text>
                    </View>
                  )}
                  
                  <Text style={styles.lastUpdatedText}>
                    Cập nhật lần cuối: {new Date().toLocaleTimeString()}
                  </Text>
                </View>
              ) : (
                <View style={styles.noLocationContainer}>
                  <MaterialIcons name="location-searching" size={48} color="#FFA000" />
                  <Text style={styles.noLocationText}>Chưa có thông tin vị trí</Text>
                </View>
              )}
              
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, !locationEnabled && styles.disabledButton]}
                  onPress={getCurrentLocation}
                  disabled={!locationEnabled || loadingLocation}
                >
                  <MaterialIcons name="my-location" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Cập nhật vị trí</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.mapButton, (!locationEnabled || !currentLocation) && styles.disabledButton]}
                  onPress={viewLocationOnMap}
                  disabled={!locationEnabled || !currentLocation || loadingLocation}
                >
                  <MaterialIcons name="map" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Xem trên bản đồ</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity
                style={styles.manualButton}
                onPress={goToManualLocationScreen}
              >
                <MaterialIcons name="edit-location" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Nhập vị trí thủ công</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {activeTab === 'nearby' && (
          <View style={styles.nearbyContainer}>
            <View style={styles.nearbyHeader}>
              <Text style={styles.sectionTitle}>Người dùng gần đây</Text>
              <View style={styles.distanceSelector}>
                <Text style={styles.distanceLabel}>Bán kính: </Text>
                <TouchableOpacity
                  style={[
                    styles.distanceOption,
                    settings.nearbyDistance === 'close' && styles.activeDistanceOption
                  ]}
                  onPress={() => {
                    setSettings(prev => ({ ...prev, nearbyDistance: 'close' }));
                    if (currentLocation) fetchNearbyUsers(currentLocation);
                  }}
                >
                  <Text 
                    style={[
                      styles.distanceOptionText,
                      settings.nearbyDistance === 'close' && styles.activeDistanceOptionText
                    ]}
                  >
                    1km
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.distanceOption,
                    settings.nearbyDistance === 'medium' && styles.activeDistanceOption
                  ]}
                  onPress={() => {
                    setSettings(prev => ({ ...prev, nearbyDistance: 'medium' }));
                    if (currentLocation) fetchNearbyUsers(currentLocation);
                  }}
                >
                  <Text 
                    style={[
                      styles.distanceOptionText,
                      settings.nearbyDistance === 'medium' && styles.activeDistanceOptionText
                    ]}
                  >
                    5km
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.distanceOption,
                    settings.nearbyDistance === 'far' && styles.activeDistanceOption
                  ]}
                  onPress={() => {
                    setSettings(prev => ({ ...prev, nearbyDistance: 'far' }));
                    if (currentLocation) fetchNearbyUsers(currentLocation);
                  }}
                >
                  <Text 
                    style={[
                      styles.distanceOptionText,
                      settings.nearbyDistance === 'far' && styles.activeDistanceOptionText
                    ]}
                  >
                    10km
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {renderNearbyUsersList()}
          </View>
        )}
        
        {activeTab === 'settings' && (
          <View style={styles.settingsContainer}>
            <Text style={styles.sectionTitle}>Cài đặt vị trí</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <MaterialIcons name="privacy-tip" size={24} color="#2196F3" />
                <Text style={styles.settingText}>Mức độ quyền riêng tư</Text>
              </View>
              
              <View style={styles.privacyOptions}>
                <TouchableOpacity
                  style={[
                    styles.privacyOption,
                    settings.privacyLevel === 'PUBLIC' && styles.activePrivacyOption
                  ]}
                  onPress={() => updatePrivacyLevel('PUBLIC')}
                >
                  <Text style={styles.privacyOptionText}>
                    Công khai
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.privacyOption,
                    settings.privacyLevel === 'FRIENDS_ONLY' && styles.activePrivacyOption
                  ]}
                  onPress={() => updatePrivacyLevel('FRIENDS_ONLY')}
                >
                  <Text style={styles.privacyOptionText}>
                    Chỉ bạn bè
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.privacyOption,
                    settings.privacyLevel === 'PRIVATE' && styles.activePrivacyOption
                  ]}
                  onPress={() => updatePrivacyLevel('PRIVATE')}
                >
                  <Text style={styles.privacyOptionText}>
                    Riêng tư
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <MaterialIcons name="autorenew" size={24} color="#2196F3" />
                <Text style={styles.settingText}>Tự động cập nhật vị trí</Text>
              </View>
              
              <Switch
                value={settings.autoUpdateLocation}
                onValueChange={(value) => {
                  setSettings(prev => ({ ...prev, autoUpdateLocation: value }));
                  LocationService.saveLocationSettings({
                    ...settings,
                    autoUpdateLocation: value
                  });
                }}
                trackColor={{ false: "#ccc", true: "#2196F3" }}
                thumbColor={settings.autoUpdateLocation ? "#fff" : "#f4f3f4"}
                disabled={!locationEnabled}
              />
            </View>
            
            {settings.autoUpdateLocation && (
              <View style={styles.settingSubItem}>
                <Text style={styles.settingSubText}>Tần suất cập nhật:</Text>
                <View style={styles.frequencyOptions}>
                  <TouchableOpacity
                    style={[
                      styles.frequencyOption,
                      settings.locationUpdateFrequency === 'low' && styles.activeFrequencyOption
                    ]}
                    onPress={() => {
                      setSettings(prev => ({ ...prev, locationUpdateFrequency: 'low' }));
                      LocationService.saveLocationSettings({
                        ...settings,
                        locationUpdateFrequency: 'low'
                      });
                    }}
                  >
                    <Text style={styles.frequencyOptionText}>
                      Thấp (5 phút)
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.frequencyOption,
                      settings.locationUpdateFrequency === 'medium' && styles.activeFrequencyOption
                    ]}
                    onPress={() => {
                      setSettings(prev => ({ ...prev, locationUpdateFrequency: 'medium' }));
                      LocationService.saveLocationSettings({
                        ...settings,
                        locationUpdateFrequency: 'medium'
                      });
                    }}
                  >
                    <Text style={styles.frequencyOptionText}>
                      Trung bình (2 phút)
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.frequencyOption,
                      settings.locationUpdateFrequency === 'high' && styles.activeFrequencyOption
                    ]}
                    onPress={() => {
                      setSettings(prev => ({ ...prev, locationUpdateFrequency: 'high' }));
                      LocationService.saveLocationSettings({
                        ...settings,
                        locationUpdateFrequency: 'high'
                      });
                    }}
                  >
                    <Text style={styles.frequencyOptionText}>
                      Cao (30 giây)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            <View style={styles.divider} />
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <MaterialIcons name="notifications" size={24} color="#2196F3" />
                <Text style={styles.settingText}>Thông báo khi có bạn bè gần đó</Text>
              </View>
              
              <Switch
                value={settings.notifyNearbyFriends}
                onValueChange={(value) => {
                  setSettings(prev => ({ ...prev, notifyNearbyFriends: value }));
                  LocationService.saveLocationSettings({
                    ...settings,
                    notifyNearbyFriends: value
                  });
                }}
                trackColor={{ false: "#ccc", true: "#2196F3" }}
                thumbColor={settings.notifyNearbyFriends ? "#fff" : "#f4f3f4"}
                disabled={!locationEnabled}
              />
            </View>
            
            <View style={styles.divider} />
            
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => {
                Alert.alert(
                  'Xác nhận',
                  'Bạn có chắc chắn muốn xóa thông tin vị trí của mình khỏi máy chủ?',
                  [
                    { text: 'Hủy', style: 'cancel' },
                    { 
                      text: 'Xóa', 
                      style: 'destructive',
                      onPress: () => {
                        LocationService.deleteUserLocation()
                          .then(() => {
                            Alert.alert('Thành công', 'Đã xóa thông tin vị trí.');
                            setCurrentLocation(null);
                            setLocationAddress(null);
                            setShareLocation(false);
                          })
                          .catch(error => {
                            console.error('Error deleting location:', error);
                            Alert.alert('Lỗi', 'Không thể xóa thông tin vị trí.');
                          });
                      }
                    }
                  ]
                );
              }}
            >
              <MaterialIcons name="delete" size={20} color="#fff" />
              <Text style={styles.deleteButtonText}>Xóa vị trí của tôi</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {shareLocation && locationEnabled && activeTab === 'location' && (
          <View style={styles.infoContainer}>
            <MaterialIcons name="info-outline" size={16} color="#666" />
            <Text style={styles.infoText}>
              Vị trí của bạn được chia sẻ với mức độ quyền riêng tư: {settings.privacyLevel === 'PUBLIC' ? 'Công khai' : settings.privacyLevel === 'FRIENDS_ONLY' ? 'Chỉ bạn bè' : 'Riêng tư'}
            </Text>
          </View>
        )}
        
        {activeTab === 'location' && (
          <View style={styles.integrationContainer}>
            <Text style={styles.integrationTitle}>Ứng dụng sử dụng vị trí của bạn để:</Text>
            <View style={styles.integrationItem}>
              <MaterialIcons name="people" size={20} color="#2196F3" />
              <Text style={styles.integrationText}>Tìm kiếm người dùng gần bạn</Text>
            </View>
            <View style={styles.integrationItem}>
              <MaterialIcons name="sports" size={20} color="#2196F3" />
              <Text style={styles.integrationText}>Tìm đối thủ thể thao phù hợp trong khu vực</Text>
            </View>
            <View style={styles.integrationItem}>
              <MaterialIcons name="event" size={20} color="#2196F3" />
              <Text style={styles.integrationText}>Đề xuất sự kiện địa phương phù hợp với bạn</Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  settingsButton: {
    padding: 4,
  },
  locationContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  permissionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  permissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  permissionText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#333',
  },
  permissionButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  sharingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sharingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sharingText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#333',
  },
  currentLocationContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  locationInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  locationIcon: {
    marginBottom: 10,
  },
  locationText: {
    fontSize: 15,
    color: '#333',
    marginBottom: 4,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  noLocationText: {
    fontSize: 15,
    color: '#757575',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    textAlign: 'center',
    marginVertical: 12,
  },
  loader: {
    marginVertical: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  mapButton: {
    backgroundColor: '#4CAF50',
    marginRight: 0,
    marginLeft: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 6,
  },
  disabledButton: {
    backgroundColor: '#BDBDBD',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 5,
    marginBottom: 15,
    paddingHorizontal: 12,
    backgroundColor: '#FFF8E1',
    padding: 10,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  integrationContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  integrationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  integrationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  integrationText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
  },
  addressContainer: {
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  addressTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
  noLocationContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFF8F8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    minHeight: 100,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 15,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  tabText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#757575',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userDistance: {
    fontSize: 14,
    color: '#2196F3',
    marginTop: 2,
  },
  userAddress: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  usersList: {
    paddingBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
    marginVertical: 10,
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 8,
  },
  nearbyContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  nearbyHeader: {
    marginBottom: 16,
  },
  distanceSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  distanceLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  distanceOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f1f1f1',
    borderRadius: 20,
    marginRight: 8,
  },
  activeDistanceOption: {
    backgroundColor: '#2196F3',
  },
  distanceOptionText: {
    fontSize: 13,
    color: '#666',
  },
  activeDistanceOptionText: {
    color: '#fff',
    fontWeight: '500',
  },
  settingsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#333',
  },
  settingSubItem: {
    marginLeft: 32,
    marginBottom: 12,
  },
  settingSubText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  privacyOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  privacyOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f1f1f1',
    borderRadius: 20,
    marginLeft: 8,
    marginBottom: 4,
  },
  activePrivacyOption: {
    backgroundColor: '#2196F3',
  },
  privacyOptionText: {
    fontSize: 12,
    color: '#666',
  },
  activePrivacyOptionText: {
    color: '#fff',
  },
  frequencyOptions: {
    flexDirection: 'column',
  },
  frequencyOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    marginTop: 4,
  },
  activeFrequencyOption: {
    backgroundColor: '#2196F3',
  },
  frequencyOptionText: {
    fontSize: 13,
    color: '#666',
  },
  activeFrequencyOptionText: {
    color: '#fff',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 6,
  },
  manualButton: {
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 10,
  },
});

export default UserLocationController; 