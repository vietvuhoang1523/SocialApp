import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import LocationService from '../../services/LocationService';
import * as Location from 'expo-location';
import { Picker } from '@react-native-picker/picker';

const ManualLocationScreen = ({ navigation, route }) => {
  // Lấy dữ liệu vị trí từ route nếu có
  const initialLocation = route.params?.location || null;
  
  // States
  const [loading, setLoading] = useState(false);
  const [locationData, setLocationData] = useState({
    latitude: initialLocation?.coords?.latitude?.toString() || '',
    longitude: initialLocation?.coords?.longitude?.toString() || '',
    address: '',
    city: '',
    district: '',
    ward: '',
    locationName: '',
    isCurrentLocation: true,
    privacyLevel: 'FRIENDS_ONLY',
    accuracyMeters: '10.0',
    locationSource: 'MANUAL'
  });
  
  // Lấy vị trí hiện tại để điền tự động
  const getAndFillCurrentLocation = async () => {
    setLoading(true);
    
    try {
      const location = await LocationService.getLocationSafely();
      
      // Cập nhật tọa độ
      setLocationData(prev => ({
        ...prev,
        latitude: location.coords.latitude.toString(),
        longitude: location.coords.longitude.toString(),
        accuracyMeters: location.coords.accuracy ? location.coords.accuracy.toString() : '10.0'
      }));
      
      // Lấy địa chỉ từ tọa độ
      try {
        const address = await LocationService.getAddressFromCoordinates(location.coords);
        
        if (address) {
          setLocationData(prev => ({
            ...prev,
            address: address.formattedAddress || '',
            city: address.city || '',
            district: address.district || '',
            ward: address.subregion || ''
          }));
        }
      } catch (addressError) {
        console.warn('Could not get address:', addressError);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert(
        'Lỗi lấy vị trí',
        LocationService.getLocationErrorMessage(error)
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Tự động lấy vị trí khi mở màn hình nếu không có dữ liệu ban đầu
  useEffect(() => {
    if (!initialLocation) {
      getAndFillCurrentLocation();
    }
  }, [initialLocation]);
  
  // Lấy tọa độ từ địa chỉ đã nhập
  const getCoordinatesFromAddress = async () => {
    // Kiểm tra xem có đủ thông tin địa chỉ không
    const addressString = [
      locationData.address,
      locationData.district,
      locationData.city
    ].filter(Boolean).join(', ');
    
    if (!addressString) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập ít nhất địa chỉ, quận/huyện hoặc thành phố.');
      return;
    }
    
    setLoading(true);
    
    try {
      const coords = await LocationService.getCoordinatesFromAddress(addressString);
      
      if (coords) {
        setLocationData(prev => ({
          ...prev,
          latitude: coords.latitude.toString(),
          longitude: coords.longitude.toString()
        }));
        
        Alert.alert('Thành công', 'Đã lấy tọa độ từ địa chỉ.');
      } else {
        Alert.alert('Không tìm thấy', 'Không thể tìm thấy tọa độ cho địa chỉ này.');
      }
    } catch (error) {
      console.error('Error getting coordinates from address:', error);
      Alert.alert('Lỗi', 'Không thể lấy tọa độ từ địa chỉ đã nhập.');
    } finally {
      setLoading(false);
    }
  };
  
  // Cập nhật vị trí lên server
  const saveLocation = async () => {
    // Kiểm tra dữ liệu bắt buộc
    if (!locationData.latitude || !locationData.longitude) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tọa độ (vĩ độ và kinh độ).');
      return;
    }
    
    // Chuyển đổi dữ liệu sang đúng kiểu
    const payload = {
      ...locationData,
      latitude: parseFloat(locationData.latitude),
      longitude: parseFloat(locationData.longitude),
      accuracyMeters: parseFloat(locationData.accuracyMeters),
      isCurrentLocation: Boolean(locationData.isCurrentLocation)
    };
    
    setLoading(true);
    
    try {
      // Gọi API để cập nhật vị trí
      const response = await LocationService.updateFullUserLocation(payload);
      
      Alert.alert(
        'Thành công',
        'Đã cập nhật vị trí thành công.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error saving location:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật vị trí. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };
  
  // Xử lý thay đổi giá trị input
  const handleChange = (field, value) => {
    setLocationData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Nhập thông tin vị trí</Text>
        
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>Đang xử lý...</Text>
          </View>
        )}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tọa độ</Text>
          
          <View style={styles.inputRow}>
            <Text style={styles.label}>Vĩ độ:</Text>
            <TextInput
              style={styles.input}
              value={locationData.latitude}
              onChangeText={(text) => handleChange('latitude', text)}
              keyboardType="numeric"
              placeholder="Ví dụ: 10.762622"
            />
          </View>
          
          <View style={styles.inputRow}>
            <Text style={styles.label}>Kinh độ:</Text>
            <TextInput
              style={styles.input}
              value={locationData.longitude}
              onChangeText={(text) => handleChange('longitude', text)}
              keyboardType="numeric"
              placeholder="Ví dụ: 106.660172"
            />
          </View>
          
          <TouchableOpacity
            style={styles.button}
            onPress={getAndFillCurrentLocation}
          >
            <MaterialIcons name="my-location" size={20} color="#fff" />
            <Text style={styles.buttonText}>Lấy vị trí hiện tại</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin địa chỉ</Text>
          
          <View style={styles.inputRow}>
            <Text style={styles.label}>Địa chỉ:</Text>
            <TextInput
              style={styles.input}
              value={locationData.address}
              onChangeText={(text) => handleChange('address', text)}
              placeholder="Nhập địa chỉ"
            />
          </View>
          
          <View style={styles.inputRow}>
            <Text style={styles.label}>Thành phố:</Text>
            <TextInput
              style={styles.input}
              value={locationData.city}
              onChangeText={(text) => handleChange('city', text)}
              placeholder="Nhập thành phố"
            />
          </View>
          
          <View style={styles.inputRow}>
            <Text style={styles.label}>Quận/Huyện:</Text>
            <TextInput
              style={styles.input}
              value={locationData.district}
              onChangeText={(text) => handleChange('district', text)}
              placeholder="Nhập quận/huyện"
            />
          </View>
          
          <View style={styles.inputRow}>
            <Text style={styles.label}>Phường/Xã:</Text>
            <TextInput
              style={styles.input}
              value={locationData.ward}
              onChangeText={(text) => handleChange('ward', text)}
              placeholder="Nhập phường/xã"
            />
          </View>
          
          <TouchableOpacity
            style={styles.button}
            onPress={getCoordinatesFromAddress}
          >
            <MaterialIcons name="search" size={20} color="#fff" />
            <Text style={styles.buttonText}>Lấy tọa độ từ địa chỉ</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin khác</Text>
          
          <View style={styles.inputRow}>
            <Text style={styles.label}>Tên địa điểm:</Text>
            <TextInput
              style={styles.input}
              value={locationData.locationName}
              onChangeText={(text) => handleChange('locationName', text)}
              placeholder="Ví dụ: Nhà, Công ty, ..."
            />
          </View>
          
          <View style={styles.inputRow}>
            <Text style={styles.label}>Độ chính xác (m):</Text>
            <TextInput
              style={styles.input}
              value={locationData.accuracyMeters}
              onChangeText={(text) => handleChange('accuracyMeters', text)}
              keyboardType="numeric"
              placeholder="Độ chính xác tính bằng mét"
            />
          </View>
          
          <View style={styles.inputRow}>
            <Text style={styles.label}>Nguồn dữ liệu:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={locationData.locationSource}
                onValueChange={(value) => handleChange('locationSource', value)}
                style={styles.picker}
              >
                <Picker.Item label="Thủ công" value="MANUAL" />
                <Picker.Item label="GPS" value="GPS" />
                <Picker.Item label="Mạng" value="NETWORK" />
              </Picker>
            </View>
          </View>
          
          <View style={styles.inputRow}>
            <Text style={styles.label}>Quyền riêng tư:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={locationData.privacyLevel}
                onValueChange={(value) => handleChange('privacyLevel', value)}
                style={styles.picker}
              >
                <Picker.Item label="Công khai" value="PUBLIC" />
                <Picker.Item label="Chỉ bạn bè" value="FRIENDS_ONLY" />
                <Picker.Item label="Riêng tư" value="PRIVATE" />
              </Picker>
            </View>
          </View>
          
          <View style={styles.switchRow}>
            <Text style={styles.label}>Vị trí hiện tại:</Text>
            <Switch
              value={locationData.isCurrentLocation}
              onValueChange={(value) => handleChange('isCurrentLocation', value)}
              trackColor={{ false: "#ccc", true: "#2196F3" }}
              thumbColor={locationData.isCurrentLocation ? "#fff" : "#f4f3f4"}
            />
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveLocation}
          disabled={loading}
        >
          <MaterialIcons name="save" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>Lưu vị trí</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  inputRow: {
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    color: '#555',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: 48,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 16,
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
});

export default ManualLocationScreen; 