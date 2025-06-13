import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProfileContext } from '../../components/ProfileContext';
import LocationService from '../../services/LocationService';

const LocationSettings = ({ navigation }) => {
  // States
  const [shareLocation, setShareLocation] = useState(false);
  const [notifyNearbyFriends, setNotifyNearbyFriends] = useState(false);
  const [autoUpdateLocation, setAutoUpdateLocation] = useState(true);
  const [locationUpdateFrequency, setLocationUpdateFrequency] = useState('medium'); // low, medium, high
  const [nearbyDistance, setNearbyDistance] = useState('medium'); // close, medium, far
  
  // Get user profile from context
  const { userProfile } = useProfileContext();
  
  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);
  
  // Load settings from AsyncStorage
  const loadSettings = async () => {
    try {
      const settings = await LocationService.loadLocationSettings();
      
      setShareLocation(settings.shareLocation);
      setNotifyNearbyFriends(settings.notifyNearbyFriends);
      setAutoUpdateLocation(settings.autoUpdateLocation);
      setLocationUpdateFrequency(settings.locationUpdateFrequency);
      setNearbyDistance(settings.nearbyDistance);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };
  
  // Save settings to AsyncStorage
  const saveSettings = async () => {
    try {
      const settings = {
        shareLocation,
        notifyNearbyFriends,
        autoUpdateLocation,
        locationUpdateFrequency,
        nearbyDistance
      };
      
      await LocationService.saveLocationSettings(settings);
      
      // Update settings on server if user is logged in
      if (userProfile && userProfile.id) {
        await updateServerSettings();
      }
      
      Alert.alert(
        'Thành công',
        'Cài đặt vị trí đã được lưu thành công.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert(
        'Lỗi',
        'Không thể lưu cài đặt vị trí. Vui lòng thử lại sau.',
        [{ text: 'OK' }]
      );
    }
  };
  
  // Update settings on server
  const updateServerSettings = async () => {
    try {
      const settings = {
        shareLocation,
        notifyNearbyFriends,
        autoUpdateLocation,
        locationUpdateFrequency,
        nearbyDistance
      };
      
      await LocationService.updateLocationSettingsOnServer(userProfile.id, settings);
    } catch (error) {
      console.error('Error updating server settings:', error);
      // We don't show error to user here, since local settings were saved
    }
  };
  
  // Toggle share location
  const toggleShareLocation = (value) => {
    setShareLocation(value);
    
    // If turning off location sharing, also turn off notifications
    if (!value) {
      setNotifyNearbyFriends(false);
    }
  };
  
  // Reset settings to default
  const resetToDefault = () => {
    Alert.alert(
      'Đặt lại cài đặt',
      'Bạn có chắc chắn muốn đặt lại tất cả cài đặt vị trí về mặc định?',
      [
        {
          text: 'Hủy',
          style: 'cancel'
        },
        {
          text: 'Đặt lại',
          onPress: () => {
            setShareLocation(false);
            setNotifyNearbyFriends(false);
            setAutoUpdateLocation(true);
            setLocationUpdateFrequency('medium');
            setNearbyDistance('medium');
          }
        }
      ]
    );
  };
  
  // Get human-readable frequency text
  const getFrequencyText = (frequency) => {
    switch (frequency) {
      case 'low':
        return 'Thấp (tiết kiệm pin)';
      case 'medium':
        return 'Trung bình';
      case 'high':
        return 'Cao (chính xác hơn)';
      default:
        return 'Trung bình';
    }
  };
  
  // Get human-readable distance text
  const getDistanceText = (distance) => {
    switch (distance) {
      case 'close':
        return 'Gần (dưới 1km)';
      case 'medium':
        return 'Trung bình (1-5km)';
      case 'far':
        return 'Xa (trên 5km)';
      default:
        return 'Trung bình (1-5km)';
    }
  };
  
  // Toggle frequency setting
  const toggleFrequency = () => {
    switch (locationUpdateFrequency) {
      case 'low':
        setLocationUpdateFrequency('medium');
        break;
      case 'medium':
        setLocationUpdateFrequency('high');
        break;
      case 'high':
        setLocationUpdateFrequency('low');
        break;
      default:
        setLocationUpdateFrequency('medium');
    }
  };
  
  // Toggle distance setting
  const toggleDistance = () => {
    switch (nearbyDistance) {
      case 'close':
        setNearbyDistance('medium');
        break;
      case 'medium':
        setNearbyDistance('far');
        break;
      case 'far':
        setNearbyDistance('close');
        break;
      default:
        setNearbyDistance('medium');
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt vị trí</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveSettings}
        >
          <Text style={styles.saveButtonText}>Lưu</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="location-on" size={20} color="#2196F3" />
            <Text style={styles.sectionTitle}>Chia sẻ vị trí</Text>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Chia sẻ vị trí với bạn bè</Text>
              <Text style={styles.settingDescription}>
                Cho phép bạn bè xem vị trí hiện tại của bạn
              </Text>
            </View>
            <Switch
              value={shareLocation}
              onValueChange={toggleShareLocation}
              trackColor={{ false: "#ccc", true: "#2196F3" }}
              thumbColor={shareLocation ? "#fff" : "#f4f3f4"}
            />
          </View>
          
          <View style={[styles.settingItem, !shareLocation && styles.disabledSetting]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, !shareLocation && styles.disabledText]}>
                Thông báo khi bạn bè ở gần
              </Text>
              <Text style={[styles.settingDescription, !shareLocation && styles.disabledText]}>
                Nhận thông báo khi bạn bè ở gần vị trí của bạn
              </Text>
            </View>
            <Switch
              value={notifyNearbyFriends}
              onValueChange={setNotifyNearbyFriends}
              trackColor={{ false: "#ccc", true: "#2196F3" }}
              thumbColor={notifyNearbyFriends ? "#fff" : "#f4f3f4"}
              disabled={!shareLocation}
            />
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="settings" size={20} color="#2196F3" />
            <Text style={styles.sectionTitle}>Cài đặt cập nhật</Text>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Tự động cập nhật vị trí</Text>
              <Text style={styles.settingDescription}>
                Tự động cập nhật vị trí của bạn trong khi sử dụng ứng dụng
              </Text>
            </View>
            <Switch
              value={autoUpdateLocation}
              onValueChange={setAutoUpdateLocation}
              trackColor={{ false: "#ccc", true: "#2196F3" }}
              thumbColor={autoUpdateLocation ? "#fff" : "#f4f3f4"}
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.settingItem, !autoUpdateLocation && styles.disabledSetting]}
            onPress={toggleFrequency}
            disabled={!autoUpdateLocation}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, !autoUpdateLocation && styles.disabledText]}>
                Tần suất cập nhật vị trí
              </Text>
              <Text style={[styles.settingDescription, !autoUpdateLocation && styles.disabledText]}>
                {getFrequencyText(locationUpdateFrequency)}
              </Text>
            </View>
            <MaterialIcons 
              name="chevron-right" 
              size={24} 
              color={autoUpdateLocation ? "#666" : "#ccc"} 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="people" size={20} color="#2196F3" />
            <Text style={styles.sectionTitle}>Cài đặt bạn bè ở gần</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.settingItem, !shareLocation && styles.disabledSetting]}
            onPress={toggleDistance}
            disabled={!shareLocation}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, !shareLocation && styles.disabledText]}>
                Khoảng cách xác định "ở gần"
              </Text>
              <Text style={[styles.settingDescription, !shareLocation && styles.disabledText]}>
                {getDistanceText(nearbyDistance)}
              </Text>
            </View>
            <MaterialIcons 
              name="chevron-right" 
              size={24} 
              color={shareLocation ? "#666" : "#ccc"} 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.privacySection}>
          <MaterialIcons name="privacy-tip" size={20} color="#F44336" />
          <Text style={styles.privacyText}>
            Lưu ý về quyền riêng tư: Ứng dụng chỉ chia sẻ vị trí của bạn khi được cấp quyền và 
            chỉ chia sẻ với những người bạn đã kết nối.
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.resetButton}
          onPress={resetToDefault}
        >
          <Text style={styles.resetButtonText}>Đặt lại về mặc định</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  saveButtonText: {
    color: '#2196F3',
    fontWeight: '600',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    paddingRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  disabledSetting: {
    opacity: 0.6,
  },
  disabledText: {
    color: '#999',
  },
  divider: {
    height: 8,
    backgroundColor: '#f5f5f5',
  },
  privacySection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#FFF8E1',
  },
  privacyText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  resetButton: {
    alignSelf: 'center',
    marginVertical: 24,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#F44336',
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LocationSettings; 