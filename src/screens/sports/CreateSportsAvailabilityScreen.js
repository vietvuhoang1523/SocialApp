import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Switch
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hook/ThemeContext';
import sportsAvailabilityService from '../../services/SportsAvailabilityService';
import CustomDatePicker from '../../components/CustomDatePicker';
import { Picker } from '@react-native-picker/picker';
import { SportTypeNames, SkillLevelNames } from '../../constants/SportConstants';

const CreateSportsAvailabilityScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sportType: null,
    availableFrom: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    availableUntil: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
    preferredLocation: null,
    customLocationName: '',
    customLatitude: null,
    customLongitude: null,
    maxDistanceKm: 10,
    skillLevelPreferences: [],
    groupSizeMin: 2,
    groupSizeMax: 4,
    costSharing: true,
    message: '',
    requiredSkillLevel: null,
    isCompetitive: false,
    equipmentNeeded: '',
    flexibleTiming: false,
    recurringWeekly: false,
    maxParticipants: null,
    expectedCostPerPerson: 0
  });
  
  const [errors, setErrors] = useState({});
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showUntilPicker, setShowUntilPicker] = useState(false);
  
  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Validate form
      const validationErrors = sportsAvailabilityService.validateAvailabilityData(formData);
      if (validationErrors.length > 0) {
        Alert.alert('Lỗi', validationErrors.join('\n'));
        setLoading(false);
        return;
      }
      
      // Submit data
      const result = await sportsAvailabilityService.createAvailability(formData);
      
      Alert.alert(
        'Thành công', 
        'Đã tạo lịch tìm người chơi thể thao thành công',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('SportsAvailabilityDetail', { availabilityId: result.id }) 
          }
        ]
      );
    } catch (error) {
      console.error('Error creating sports availability:', error);
      Alert.alert('Lỗi', 'Không thể tạo lịch tìm người chơi thể thao. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const formatTime = (date) => {
    return date?.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (date) => {
    return date?.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleDateChange = (event, selectedDate, type) => {
    if (type === 'from') {
      setShowFromPicker(Platform.OS === 'ios');
      if (selectedDate) {
        handleChange('availableFrom', selectedDate);
      }
    } else {
      setShowUntilPicker(Platform.OS === 'ios');
      if (selectedDate) {
        handleChange('availableUntil', selectedDate);
      }
    }
  };
  
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Tạo lịch chơi thể thao</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Sport Type */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Môn thể thao</Text>
            <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
              <Picker
                selectedValue={formData.sportType}
                onValueChange={(value) => handleChange('sportType', value)}
                style={[styles.picker, { color: colors.text }]}
                dropdownIconColor={colors.text}
              >
                <Picker.Item label="Chọn môn thể thao" value={null} />
                {Object.entries(SportTypeNames).map(([key, name]) => (
                  <Picker.Item key={key} label={name} value={key} />
                ))}
              </Picker>
            </View>
          </View>
          
          {/* Available Time */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Thời gian</Text>
            
            <View style={styles.timeContainer}>
              <TouchableOpacity 
                style={[styles.timeButton, { borderColor: colors.border }]}
                onPress={() => setShowFromPicker(true)}
              >
                <Ionicons name="time-outline" size={20} color={colors.primary} style={styles.timeIcon} />
                <Text style={[styles.timeText, { color: colors.text }]}>
                  {formatTime(formData.availableFrom)} - {formatDate(formData.availableFrom)}
                </Text>
              </TouchableOpacity>
              
              <Text style={[styles.timeSeparator, { color: colors.text }]}>đến</Text>
              
              <TouchableOpacity 
                style={[styles.timeButton, { borderColor: colors.border }]}
                onPress={() => setShowUntilPicker(true)}
              >
                <Ionicons name="time-outline" size={20} color={colors.primary} style={styles.timeIcon} />
                <Text style={[styles.timeText, { color: colors.text }]}>
                  {formatTime(formData.availableUntil)} - {formatDate(formData.availableUntil)}
          </Text>
              </TouchableOpacity>
            </View>
            
            {showFromPicker && (
              <DateTimePicker
                value={formData.availableFrom}
                mode="datetime"
                display="default"
                onChange={(event, date) => handleDateChange(event, date, 'from')}
                minimumDate={new Date()}
              />
            )}
            
            {showUntilPicker && (
              <DateTimePicker
                value={formData.availableUntil}
                mode="datetime"
                display="default"
                onChange={(event, date) => handleDateChange(event, date, 'until')}
                minimumDate={formData.availableFrom}
              />
            )}
          </View>
          
          {/* Location */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Địa điểm</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="Nhập tên địa điểm"
              placeholderTextColor={colors.textLight}
              value={formData.customLocationName}
              onChangeText={(text) => handleChange('customLocationName', text)}
            />
          </View>
          
          {/* Group Size */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Số người</Text>
            <View style={styles.rowContainer}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.subLabel, { color: colors.textLight }]}>Tối thiểu</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                  placeholder="2"
                  placeholderTextColor={colors.textLight}
                  value={formData.groupSizeMin?.toString()}
                  onChangeText={(text) => handleChange('groupSizeMin', parseInt(text) || 2)}
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ width: 20 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.subLabel, { color: colors.textLight }]}>Tối đa</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                  placeholder="4"
                  placeholderTextColor={colors.textLight}
                  value={formData.groupSizeMax?.toString()}
                  onChangeText={(text) => handleChange('groupSizeMax', parseInt(text) || 4)}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </View>
          
          {/* Skill Level */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Trình độ yêu cầu</Text>
            <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
              <Picker
                selectedValue={formData.requiredSkillLevel}
                onValueChange={(value) => handleChange('requiredSkillLevel', value)}
                style={[styles.picker, { color: colors.text }]}
                dropdownIconColor={colors.text}
              >
                <Picker.Item label="Tất cả trình độ" value={null} />
                {Object.entries(SkillLevelNames).map(([key, name]) => (
                  <Picker.Item key={key} label={name} value={key} />
                ))}
              </Picker>
            </View>
          </View>
          
          {/* Additional Options */}
          <View style={styles.formGroup}>
            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>Thi đấu</Text>
              <Switch
                value={formData.isCompetitive}
                onValueChange={(value) => handleChange('isCompetitive', value)}
                trackColor={{ false: '#d4d4d4', true: colors.primary + '80' }}
                thumbColor={formData.isCompetitive ? colors.primary : '#f4f4f4'}
              />
            </View>
            
            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>Chia sẻ chi phí</Text>
              <Switch
                value={formData.costSharing}
                onValueChange={(value) => handleChange('costSharing', value)}
                trackColor={{ false: '#d4d4d4', true: colors.primary + '80' }}
                thumbColor={formData.costSharing ? colors.primary : '#f4f4f4'}
              />
            </View>
          </View>
          
          {/* Message */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Lời nhắn</Text>
            <TextInput
              style={[styles.textarea, { borderColor: colors.border, color: colors.text }]}
              placeholder="Nhập lời nhắn..."
              placeholderTextColor={colors.textLight}
              value={formData.message}
              onChangeText={(text) => handleChange('message', text)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>Tạo lịch tìm người chơi</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    padding: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  submitButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    fontSize: 16,
    minHeight: 100,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 48,
    width: '100%',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flex: 1,
  },
  timeIcon: {
    marginRight: 8,
  },
  timeText: {
    fontSize: 14,
  },
  timeSeparator: {
    marginHorizontal: 8,
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  switchLabel: {
    fontSize: 16,
  },
});

export default CreateSportsAvailabilityScreen; 