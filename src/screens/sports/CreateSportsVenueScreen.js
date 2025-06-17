import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hook/ThemeContext';
import { createVenue, uploadVenueImages } from '../../services/venueService';
import { sportTypeOptions, venueTypeOptions, priceRangeOptions, venueFeatures } from '../../constants/VenueConstants';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { getCurrentLocation } from '../../utils/locationUtils';
import MultiSelect from '../../components/common/MultiSelect';
import OpeningHoursEditor from '../../components/sports/OpeningHoursEditor';

const CreateSportsVenueScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [venueData, setVenueData] = useState({
    name: '',
    description: '',
    address: '',
    venueType: null,
    priceRange: null,
    sportTypes: [],
    features: [],
    latitude: null,
    longitude: null,
    openingHours: {
      MONDAY: { open: '07:00', close: '22:00' },
      TUESDAY: { open: '07:00', close: '22:00' },
      WEDNESDAY: { open: '07:00', close: '22:00' },
      THURSDAY: { open: '07:00', close: '22:00' },
      FRIDAY: { open: '07:00', close: '22:00' },
      SATURDAY: { open: '07:00', close: '22:00' },
      SUNDAY: { open: '07:00', close: '22:00' }
    },
    contactInfo: {
      phone: '',
      email: '',
      website: ''
    },
    pricing: {
      'Giá thuê theo giờ': '',
      'Giá thuê theo ngày': '',
      'Giá thuê theo tháng': ''
    }
  });
  
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [locationPermission, setLocationPermission] = useState(null);
  
  // Request location permission
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status === 'granted') {
        const location = await getCurrentLocation();
        if (location) {
          setVenueData(prev => ({
            ...prev,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          }));
        }
      }
    })();
  }, []);
  
  // Handle form input changes
  const handleChange = (field, value) => {
    setVenueData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };
  
  // Handle contact info changes
  const handleContactChange = (field, value) => {
    setVenueData(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        [field]: value
      }
    }));
  };
  
  // Handle pricing changes
  const handlePricingChange = (field, value) => {
    setVenueData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [field]: value
      }
    }));
  };
  
  // Handle map marker drag
  const handleMapPress = (event) => {
    setVenueData(prev => ({
      ...prev,
      latitude: event.nativeEvent.coordinate.latitude,
      longitude: event.nativeEvent.coordinate.longitude
    }));
  };
  
  // Handle marker drag
  const handleMarkerDrag = (event) => {
    setVenueData(prev => ({
      ...prev,
      latitude: event.nativeEvent.coordinate.latitude,
      longitude: event.nativeEvent.coordinate.longitude
    }));
  };
  
  // Pick images from gallery
  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [16, 9],
        allowsEditing: false
      });
      
      if (!result.canceled) {
        // Limit to 5 images
        const newImages = [...images, ...result.assets];
        if (newImages.length > 5) {
          Alert.alert('Giới hạn ảnh', 'Bạn chỉ có thể tải lên tối đa 5 ảnh.');
          setImages(newImages.slice(0, 5));
        } else {
          setImages(newImages);
        }
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  };
  
  // Remove image
  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!venueData.name.trim()) {
      newErrors.name = 'Vui lòng nhập tên địa điểm';
    }
    
    if (!venueData.address.trim()) {
      newErrors.address = 'Vui lòng nhập địa chỉ';
    }
    
    if (!venueData.venueType) {
      newErrors.venueType = 'Vui lòng chọn loại địa điểm';
    }
    
    if (venueData.sportTypes.length === 0) {
      newErrors.sportTypes = 'Vui lòng chọn ít nhất một môn thể thao';
    }
    
    if (!venueData.latitude || !venueData.longitude) {
      newErrors.location = 'Vui lòng chọn vị trí trên bản đồ';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) {
      // Scroll to first error
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Create venue
      const response = await createVenue(venueData);
      
      // Upload images if any
      if (images.length > 0 && response.id) {
        const formData = new FormData();
        
        images.forEach((image, index) => {
          const uri = image.uri;
          const name = uri.split('/').pop();
          const type = 'image/' + (uri.split('.').pop() === 'png' ? 'png' : 'jpeg');
          
          formData.append('images', {
            uri,
            name,
            type
          });
        });
        
        await uploadVenueImages(response.id, formData);
      }
      
      Alert.alert(
        'Thành công',
        'Địa điểm đã được tạo và đang chờ xác thực',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('SportsVenueDetail', { venueId: response.id })
          }
        ]
      );
    } catch (error) {
      console.error('Error creating venue:', error);
      Alert.alert(
        'Lỗi',
        'Không thể tạo địa điểm. Vui lòng thử lại sau.',
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Tạo địa điểm thể thao mới
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textLight }]}>
              Vui lòng cung cấp thông tin chính xác để giúp người dùng tìm thấy địa điểm của bạn
            </Text>
          </View>
          
          {/* Basic Information */}
          <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Thông tin cơ bản
            </Text>
            
            {/* Name */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Tên địa điểm *</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: colors.inputBackground,
                    color: colors.text,
                    borderColor: errors.name ? colors.error : colors.border
                  }
                ]}
                placeholder="Nhập tên địa điểm"
                placeholderTextColor={colors.textLight}
                value={venueData.name}
                onChangeText={(text) => handleChange('name', text)}
              />
              {errors.name && (
                <Text style={[styles.errorText, { color: colors.error }]}>{errors.name}</Text>
              )}
            </View>
            
            {/* Venue Type */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Loại địa điểm *</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.optionsContainer}
              >
                {venueTypeOptions.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionButton,
                      venueData.venueType === option.value && {
                        backgroundColor: colors.primary + '20',
                        borderColor: colors.primary
                      },
                      { borderColor: colors.border }
                    ]}
                    onPress={() => handleChange('venueType', option.value)}
                  >
                    <MaterialIcons
                      name={option.icon || 'place'}
                      size={20}
                      color={venueData.venueType === option.value ? colors.primary : colors.textLight}
                    />
                    <Text
                      style={[
                        styles.optionText,
                        { color: venueData.venueType === option.value ? colors.primary : colors.text }
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {errors.venueType && (
                <Text style={[styles.errorText, { color: colors.error }]}>{errors.venueType}</Text>
              )}
            </View>
            
            {/* Price Range */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Mức giá</Text>
              <View style={styles.priceRangeContainer}>
                {priceRangeOptions.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.priceButton,
                      venueData.priceRange === option.value && {
                        backgroundColor: colors.primary + '20',
                        borderColor: colors.primary
                      },
                      { borderColor: colors.border }
                    ]}
                    onPress={() => handleChange('priceRange', option.value)}
                  >
                    <Text
                      style={[
                        styles.priceText,
                        { color: venueData.priceRange === option.value ? colors.primary : colors.text }
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Description */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Mô tả</Text>
              <TextInput
                style={[
                  styles.textArea,
                  { 
                    backgroundColor: colors.inputBackground,
                    color: colors.text,
                    borderColor: colors.border
                  }
                ]}
                placeholder="Mô tả về địa điểm của bạn..."
                placeholderTextColor={colors.textLight}
                value={venueData.description}
                onChangeText={(text) => handleChange('description', text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
          
          {/* Sports & Features */}
          <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Môn thể thao & Tiện ích
            </Text>
            
            {/* Sport Types */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Môn thể thao *</Text>
              <MultiSelect
                items={sportTypeOptions}
                selectedItems={venueData.sportTypes}
                onSelectedItemsChange={(items) => handleChange('sportTypes', items)}
                placeholder="Chọn môn thể thao"
                colors={colors}
              />
              {errors.sportTypes && (
                <Text style={[styles.errorText, { color: colors.error }]}>{errors.sportTypes}</Text>
              )}
            </View>
            
            {/* Features */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Tiện ích</Text>
              <MultiSelect
                items={venueFeatures}
                selectedItems={venueData.features}
                onSelectedItemsChange={(items) => handleChange('features', items)}
                placeholder="Chọn tiện ích có sẵn"
                colors={colors}
              />
            </View>
          </View>
          
          {/* Location */}
          <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Địa điểm
            </Text>
            
            {/* Address */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Địa chỉ *</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: colors.inputBackground,
                    color: colors.text,
                    borderColor: errors.address ? colors.error : colors.border
                  }
                ]}
                placeholder="Nhập địa chỉ đầy đủ"
                placeholderTextColor={colors.textLight}
                value={venueData.address}
                onChangeText={(text) => handleChange('address', text)}
              />
              {errors.address && (
                <Text style={[styles.errorText, { color: colors.error }]}>{errors.address}</Text>
              )}
            </View>
            
            {/* Map */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Vị trí trên bản đồ *</Text>
              
              {!locationPermission && (
                <View style={[styles.permissionWarning, { backgroundColor: colors.warning + '20' }]}>
                  <Ionicons name="warning" size={20} color={colors.warning} />
                  <Text style={[styles.permissionText, { color: colors.text }]}>
                    Cần quyền truy cập vị trí để sử dụng bản đồ
                  </Text>
                </View>
              )}
              
              <View style={styles.mapContainer}>
                {venueData.latitude && venueData.longitude ? (
                  <MapView
                    style={styles.map}
                    initialRegion={{
                      latitude: venueData.latitude,
                      longitude: venueData.longitude,
                      latitudeDelta: 0.005,
                      longitudeDelta: 0.005,
                    }}
                    onPress={handleMapPress}
                  >
                    <Marker
                      coordinate={{
                        latitude: venueData.latitude,
                        longitude: venueData.longitude
                      }}
                      draggable
                      onDragEnd={handleMarkerDrag}
                    />
                  </MapView>
                ) : (
                  <View style={[styles.mapPlaceholder, { backgroundColor: colors.border }]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.mapPlaceholderText, { color: colors.textLight }]}>
                      Đang tải bản đồ...
                    </Text>
                  </View>
                )}
              </View>
              
              <Text style={[styles.mapHelper, { color: colors.textLight }]}>
                Di chuyển ghim để đánh dấu vị trí chính xác
              </Text>
              
              {errors.location && (
                <Text style={[styles.errorText, { color: colors.error }]}>{errors.location}</Text>
              )}
            </View>
          </View>
          
          {/* Opening Hours */}
          <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Giờ mở cửa
            </Text>
            
            <OpeningHoursEditor
              openingHours={venueData.openingHours}
              onChange={(hours) => handleChange('openingHours', hours)}
              colors={colors}
            />
          </View>
          
          {/* Contact Information */}
          <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Thông tin liên hệ
            </Text>
            
            {/* Phone */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Số điện thoại</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: colors.inputBackground,
                    color: colors.text,
                    borderColor: colors.border
                  }
                ]}
                placeholder="Nhập số điện thoại liên hệ"
                placeholderTextColor={colors.textLight}
                value={venueData.contactInfo.phone}
                onChangeText={(text) => handleContactChange('phone', text)}
                keyboardType="phone-pad"
              />
            </View>
            
            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: colors.inputBackground,
                    color: colors.text,
                    borderColor: colors.border
                  }
                ]}
                placeholder="Nhập email liên hệ"
                placeholderTextColor={colors.textLight}
                value={venueData.contactInfo.email}
                onChangeText={(text) => handleContactChange('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            {/* Website */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Website</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: colors.inputBackground,
                    color: colors.text,
                    borderColor: colors.border
                  }
                ]}
                placeholder="Nhập website (nếu có)"
                placeholderTextColor={colors.textLight}
                value={venueData.contactInfo.website}
                onChangeText={(text) => handleContactChange('website', text)}
                autoCapitalize="none"
              />
            </View>
          </View>
          
          {/* Pricing */}
          <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Giá cả
            </Text>
            
            {Object.keys(venueData.pricing).map((key, index) => (
              <View key={index} style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>{key}</Text>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: colors.inputBackground,
                      color: colors.text,
                      borderColor: colors.border
                    }
                  ]}
                  placeholder="Nhập giá (VNĐ)"
                  placeholderTextColor={colors.textLight}
                  value={venueData.pricing[key]}
                  onChangeText={(text) => handlePricingChange(key, text)}
                  keyboardType="numeric"
                />
              </View>
            ))}
          </View>
          
          {/* Images */}
          <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Hình ảnh
            </Text>
            
            <View style={styles.imageSection}>
              <TouchableOpacity 
                style={[styles.addImageButton, { borderColor: colors.primary }]}
                onPress={pickImages}
              >
                <Ionicons name="add" size={40} color={colors.primary} />
                <Text style={[styles.addImageText, { color: colors.primary }]}>
                  Thêm ảnh
                </Text>
              </TouchableOpacity>
              
              {images.map((image, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri: image.uri }} style={styles.previewImage} />
                  <TouchableOpacity 
                    style={[styles.removeImageButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            
            <Text style={[styles.imageHelper, { color: colors.textLight }]}>
              Tải lên tối đa 5 hình ảnh chất lượng cao của địa điểm
            </Text>
          </View>
          
          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: submitting ? colors.primary + '80' : colors.primary }
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Tạo địa điểm</Text>
            )}
          </TouchableOpacity>
          
          <Text style={[styles.disclaimer, { color: colors.textLight }]}>
            * Địa điểm sẽ được xem xét và xác thực trước khi hiển thị công khai
          </Text>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  optionsContainer: {
    paddingBottom: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  optionText: {
    marginLeft: 6,
    fontSize: 14,
  },
  priceRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '500',
  },
  permissionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  permissionText: {
    marginLeft: 8,
    flex: 1,
  },
  mapContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    marginTop: 12,
  },
  mapHelper: {
    fontSize: 12,
    textAlign: 'center',
  },
  imageSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  addImageText: {
    fontSize: 12,
    marginTop: 4,
  },
  imageContainer: {
    width: 100,
    height: 100,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageHelper: {
    fontSize: 12,
    textAlign: 'center',
  },
  submitButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
  }
});

export default CreateSportsVenueScreen; 