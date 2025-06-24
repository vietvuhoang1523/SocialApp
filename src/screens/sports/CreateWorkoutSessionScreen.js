import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomDatePicker from '../../components/CustomDatePicker';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';

const CreateWorkoutSessionScreen = ({ navigation }) => {
  // State cho các trường dữ liệu
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sportType, setSportType] = useState('RUNNING');
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 60 * 60 * 1000)); // 1 giờ sau
  const [location, setLocation] = useState('');
  const [caloriesBurned, setCaloriesBurned] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [intensity, setIntensity] = useState('MODERATE');
  const [isPublic, setIsPublic] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [photos, setPhotos] = useState([]);
  const [notes, setNotes] = useState('');
  const [isPersonalRecord, setIsPersonalRecord] = useState(false);
  const [recordType, setRecordType] = useState('DISTANCE');

  // State cho DateTimePicker
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Danh sách loại thể thao
  const sportTypes = [
    { label: 'Chạy bộ', value: 'RUNNING' },
    { label: 'Đạp xe', value: 'CYCLING' },
    { label: 'Bơi lội', value: 'SWIMMING' },
    { label: 'Tập gym', value: 'GYM' },
    { label: 'Yoga', value: 'YOGA' },
    { label: 'Bóng đá', value: 'FOOTBALL' },
    { label: 'Bóng rổ', value: 'BASKETBALL' },
    { label: 'Bóng chuyền', value: 'VOLLEYBALL' },
    { label: 'Quần vợt', value: 'TENNIS' },
    { label: 'Cầu lông', value: 'BADMINTON' },
    { label: 'Bóng bàn', value: 'TABLE_TENNIS' },
    { label: 'Võ thuật', value: 'MARTIAL_ARTS' },
    { label: 'Khác', value: 'OTHER' }
  ];

  // Danh sách cường độ
  const intensityLevels = [
    { label: 'Nhẹ nhàng', value: 'LOW' },
    { label: 'Vừa phải', value: 'MODERATE' },
    { label: 'Cường độ cao', value: 'HIGH' },
    { label: 'Cực cao', value: 'VERY_HIGH' }
  ];

  // Danh sách loại kỷ lục
  const recordTypes = [
    { label: 'Quãng đường', value: 'DISTANCE' },
    { label: 'Thời gian', value: 'TIME' },
    { label: 'Trọng lượng', value: 'WEIGHT' },
    { label: 'Số lần lặp', value: 'REPS' }
  ];

  // Xử lý chọn ảnh từ thư viện
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập vào thư viện ảnh');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  // Xử lý xóa ảnh
  const removeImage = (index) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  // Xử lý thay đổi thời gian bắt đầu
  const onChangeStartTime = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartTime(selectedDate);
      
      // Nếu thời gian kết thúc < thời gian bắt đầu thì cập nhật thời gian kết thúc
      if (endTime < selectedDate) {
        const newEndTime = new Date(selectedDate.getTime() + 60 * 60 * 1000); // 1 giờ sau
        setEndTime(newEndTime);
      }
    }
  };

  // Xử lý thay đổi thời gian kết thúc
  const onChangeEndTime = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      if (selectedDate < startTime) {
        Alert.alert('Lỗi', 'Thời gian kết thúc phải sau thời gian bắt đầu');
        return;
      }
      setEndTime(selectedDate);
    }
  };

  // Format thời gian hiển thị
  const formatTime = (date) => {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // Xử lý lưu buổi tập
  const handleSave = () => {
    // Kiểm tra các trường bắt buộc
    if (!title) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề buổi tập');
      return;
    }

    if (!sportType) {
      Alert.alert('Lỗi', 'Vui lòng chọn loại thể thao');
      return;
    }

    // Tính thời lượng
    const durationMinutes = Math.round((endTime - startTime) / (60 * 1000));

    // Tạo đối tượng buổi tập
    const workoutSession = {
      title,
      description,
      sportType,
      startTime,
      endTime,
      durationMinutes,
      location,
      caloriesBurned: caloriesBurned ? parseInt(caloriesBurned) : null,
      distanceKm: distanceKm ? parseFloat(distanceKm) : null,
      intensity,
      isPublic,
      allowComments,
      photoUrls: photos,
      notes,
      isPersonalRecord,
      recordType: isPersonalRecord ? recordType : null,
      createdAt: new Date()
    };

    // Trong thực tế, gọi API để lưu buổi tập
    console.log('Saving workout session:', workoutSession);
    
    // Quay lại màn hình danh sách
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container}>
        <View style={styles.formContainer}>
          {/* Tiêu đề */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tiêu đề *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Nhập tiêu đề buổi tập"
            />
          </View>

          {/* Loại thể thao */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Loại thể thao *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={sportType}
                onValueChange={(itemValue) => setSportType(itemValue)}
                style={styles.picker}
              >
                {sportTypes.map((type) => (
                  <Picker.Item key={type.value} label={type.label} value={type.value} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Thời gian bắt đầu */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Thời gian bắt đầu *</Text>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Text>{formatTime(startTime)}</Text>
              <Ionicons name="calendar-outline" size={20} color="#666" />
            </TouchableOpacity>
            {showStartDatePicker && (
              <DateTimePicker
                value={startTime}
                mode="datetime"
                is24Hour={true}
                display="default"
                onChange={onChangeStartTime}
              />
            )}
          </View>

          {/* Thời gian kết thúc */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Thời gian kết thúc *</Text>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Text>{formatTime(endTime)}</Text>
              <Ionicons name="calendar-outline" size={20} color="#666" />
            </TouchableOpacity>
            {showEndDatePicker && (
              <DateTimePicker
                value={endTime}
                mode="datetime"
                is24Hour={true}
                display="default"
                onChange={onChangeEndTime}
              />
            )}
          </View>

          {/* Mô tả */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mô tả</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Mô tả chi tiết về buổi tập"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Địa điểm */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Địa điểm</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Nhập địa điểm tập luyện"
            />
          </View>

          {/* Thông số hiệu suất */}
          <View style={styles.sectionTitle}>
            <Text style={styles.sectionTitleText}>Thông số hiệu suất</Text>
          </View>

          {/* Calories */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Calories đã đốt</Text>
            <TextInput
              style={styles.input}
              value={caloriesBurned}
              onChangeText={setCaloriesBurned}
              placeholder="Nhập số calories"
              keyboardType="numeric"
            />
          </View>

          {/* Quãng đường */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quãng đường (km)</Text>
            <TextInput
              style={styles.input}
              value={distanceKm}
              onChangeText={setDistanceKm}
              placeholder="Nhập quãng đường"
              keyboardType="numeric"
            />
          </View>

          {/* Cường độ */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cường độ</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={intensity}
                onValueChange={(itemValue) => setIntensity(itemValue)}
                style={styles.picker}
              >
                {intensityLevels.map((level) => (
                  <Picker.Item key={level.value} label={level.label} value={level.value} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Kỷ lục cá nhân */}
          <View style={styles.inputGroup}>
            <View style={styles.switchRow}>
              <Text style={styles.label}>Kỷ lục cá nhân</Text>
              <Switch
                value={isPersonalRecord}
                onValueChange={setIsPersonalRecord}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={isPersonalRecord ? '#2196F3' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Loại kỷ lục */}
          {isPersonalRecord && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Loại kỷ lục</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={recordType}
                  onValueChange={(itemValue) => setRecordType(itemValue)}
                  style={styles.picker}
                >
                  {recordTypes.map((type) => (
                    <Picker.Item key={type.value} label={type.label} value={type.value} />
                  ))}
                </Picker>
              </View>
            </View>
          )}

          {/* Cài đặt quyền riêng tư */}
          <View style={styles.sectionTitle}>
            <Text style={styles.sectionTitleText}>Cài đặt quyền riêng tư</Text>
          </View>

          {/* Công khai */}
          <View style={styles.inputGroup}>
            <View style={styles.switchRow}>
              <Text style={styles.label}>Công khai buổi tập</Text>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={isPublic ? '#2196F3' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Cho phép bình luận */}
          <View style={styles.inputGroup}>
            <View style={styles.switchRow}>
              <Text style={styles.label}>Cho phép bình luận</Text>
              <Switch
                value={allowComments}
                onValueChange={setAllowComments}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={allowComments ? '#2196F3' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Ảnh */}
          <View style={styles.sectionTitle}>
            <Text style={styles.sectionTitleText}>Ảnh</Text>
          </View>

          <View style={styles.photoSection}>
            <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
              <Ionicons name="add" size={24} color="#2196F3" />
              <Text style={styles.addPhotoText}>Thêm ảnh</Text>
            </TouchableOpacity>

            <View style={styles.photoList}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoContainer}>
                  <Image source={{ uri: photo }} style={styles.photo} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#F44336" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Ghi chú */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ghi chú</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Ghi chú thêm về buổi tập"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Nút lưu */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Lưu buổi tập</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  formContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 8,
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  photoSection: {
    marginBottom: 16,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2196F3',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  addPhotoText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  photoList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  photoContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    marginRight: 8,
    marginBottom: 8,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateWorkoutSessionScreen; 