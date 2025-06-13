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
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hook/ThemeContext';
import sportsAvailabilityService from '../../services/SportsAvailabilityService';

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
          {/* Form components would go here */}
          <Text style={{ color: colors.text }}>
            Chức năng tạo lịch đang được phát triển. Vui lòng quay lại sau.
          </Text>
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
});

export default CreateSportsAvailabilityScreen; 