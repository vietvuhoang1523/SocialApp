import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hook/ThemeContext';
import { createWorkoutSession } from '../../services/workoutService';
import * as Location from 'expo-location';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { LineChart } from 'react-native-chart-kit';
import { formatDuration } from '../../utils/timeUtils';
import { calculateCaloriesBurned } from '../../utils/fitnessUtils';
import { useUserProfile } from '../../hook/UserProfileContext';

// Enum for workout status
const WorkoutStatus = {
  READY: 'ready',
  ACTIVE: 'active',
  PAUSED: 'paused',
  FINISHED: 'finished'
};

// Enum for sport types
const SportTypes = [
  { id: 'RUNNING', label: 'Chạy bộ', icon: 'run' },
  { id: 'CYCLING', label: 'Đạp xe', icon: 'bike' },
  { id: 'WALKING', label: 'Đi bộ', icon: 'walk' },
  { id: 'SWIMMING', label: 'Bơi lội', icon: 'swim' },
  { id: 'HIKING', label: 'Leo núi', icon: 'hiking' },
  { id: 'YOGA', label: 'Yoga', icon: 'yoga' },
  { id: 'GYM', label: 'Tập gym', icon: 'weight-lifter' },
  { id: 'OTHER', label: 'Khác', icon: 'dumbbell' }
];

// Enum for intensity levels
const IntensityLevels = [
  { id: 'LOW', label: 'Nhẹ nhàng', color: '#2ecc71' },
  { id: 'MEDIUM', label: 'Vừa phải', color: '#f39c12' },
  { id: 'HIGH', label: 'Cao', color: '#e74c3c' }
];

const WorkoutTrackingScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { userProfile } = useUserProfile();
  const [status, setStatus] = useState(WorkoutStatus.READY);
  const [selectedSport, setSelectedSport] = useState('RUNNING');
  const [intensity, setIntensity] = useState('MEDIUM');
  const [duration, setDuration] = useState(0);
  const [distance, setDistance] = useState(0);
  const [calories, setCalories] = useState(0);
  const [locations, setLocations] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [speedData, setSpeedData] = useState([0]);
  const [notes, setNotes] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  
  const mapRef = useRef(null);
  const timerRef = useRef(null);
  const locationSubscription = useRef(null);
  
  // Request location permissions
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Quyền truy cập vị trí bị từ chối',
          'Bạn cần cấp quyền truy cập vị trí để sử dụng tính năng theo dõi hoạt động.'
        );
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location.coords);
    })();
    
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Start workout tracking
  const startWorkout = async () => {
    if (status === WorkoutStatus.READY || status === WorkoutStatus.PAUSED) {
      try {
        // Start location tracking
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            distanceInterval: 5, // update every 5 meters
            timeInterval: 3000 // or every 3 seconds
          },
          (location) => {
            const { latitude, longitude, speed } = location.coords;
            
            setCurrentLocation(location.coords);
            
            if (status === WorkoutStatus.ACTIVE) {
              // Add location to path
              setLocations(prev => [...prev, { latitude, longitude }]);
              
              // Update speed data (convert m/s to km/h)
              const speedKmh = speed !== null ? speed * 3.6 : 0;
              setSpeedData(prev => [...prev, speedKmh]);
              
              // Calculate distance
              if (locations.length > 0) {
                const lastLocation = locations[locations.length - 1];
                const newDistance = distance + calculateDistance(
                  lastLocation.latitude,
                  lastLocation.longitude,
                  latitude,
                  longitude
                );
                setDistance(newDistance);
              }
            }
          }
        );
        
        // Start timer
        timerRef.current = setInterval(() => {
          setDuration(prev => prev + 1);
          
          // Update calories every second based on duration, sport type and intensity
          const weight = userProfile?.weight || 70; // default weight if not available
          const updatedCalories = calculateCaloriesBurned(
            selectedSport,
            intensity,
            (duration + 1) / 60, // convert seconds to minutes
            weight
          );
          setCalories(updatedCalories);
        }, 1000);
        
        setStatus(WorkoutStatus.ACTIVE);
      } catch (error) {
        console.error('Error starting workout tracking:', error);
        Alert.alert('Lỗi', 'Không thể bắt đầu theo dõi hoạt động');
      }
    }
  };
  
  // Pause workout tracking
  const pauseWorkout = () => {
    if (status === WorkoutStatus.ACTIVE) {
      clearInterval(timerRef.current);
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
      setStatus(WorkoutStatus.PAUSED);
    }
  };
  
  // Resume workout tracking
  const resumeWorkout = () => {
    if (status === WorkoutStatus.PAUSED) {
      startWorkout();
    }
  };
  
  // Finish workout tracking
  const finishWorkout = () => {
    if (status === WorkoutStatus.ACTIVE || status === WorkoutStatus.PAUSED) {
      clearInterval(timerRef.current);
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
      setStatus(WorkoutStatus.FINISHED);
    }
  };
  
  // Save workout data
  const saveWorkout = async () => {
    if (!title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề cho buổi tập');
      return;
    }
    
    try {
      setSaving(true);
      
      const workoutData = {
        title,
        sportType: selectedSport,
        intensityLevel: intensity,
        durationInSeconds: duration,
        distanceInKm: distance,
        caloriesBurned: Math.round(calories),
        notes,
        path: locations,
        isPublic: true, // Default to public
        startTime: new Date(Date.now() - duration * 1000).toISOString(),
        endTime: new Date().toISOString()
      };
      
      await createWorkoutSession(workoutData);
      
      Alert.alert(
        'Thành công',
        'Đã lưu thông tin buổi tập của bạn!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('WorkoutHistory')
          }
        ]
      );
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert(
        'Lỗi',
        'Không thể lưu thông tin buổi tập. Vui lòng thử lại sau.'
      );
    } finally {
      setSaving(false);
    }
  };
  
  // Calculate distance between two coordinates in kilometers
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  
  // Convert degrees to radians
  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };
  
  // Render map with route
  const renderMap = () => {
    if (!currentLocation) {
      return (
        <View style={[styles.mapContainer, { backgroundColor: colors.cardBackground }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textLight }]}>
            Đang tải bản đồ...
          </Text>
        </View>
      );
    }
    
    return (
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          region={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          showsUserLocation
          followsUserLocation
        >
          {locations.length > 1 && (
            <Polyline
              coordinates={locations}
              strokeColor={colors.primary}
              strokeWidth={4}
            />
          )}
        </MapView>
      </View>
    );
  };
  
  // Render speed chart
  const renderSpeedChart = () => {
    const chartData = {
      labels: Array(speedData.length).fill(''),
      datasets: [
        {
          data: speedData.length > 10 
            ? speedData.slice(speedData.length - 10) 
            : [...speedData],
          color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
          strokeWidth: 2
        }
      ]
    };
    
    const chartConfig = {
      backgroundGradientFrom: colors.cardBackground,
      backgroundGradientTo: colors.cardBackground,
      decimalPlaces: 1,
      color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
      labelColor: (opacity = 1) => colors.text,
      style: {
        borderRadius: 16
      },
      propsForDots: {
        r: '3',
        strokeWidth: '1',
        stroke: colors.primary
      }
    };
    
    return (
      <View style={[styles.chartContainer, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Tốc độ (km/h)</Text>
        <LineChart
          data={chartData}
          width={Dimensions.get('window').width - 32}
          height={180}
          chartConfig={chartConfig}
          bezier
          withInnerLines={false}
          withOuterLines={false}
          withVerticalLines={false}
          withHorizontalLines
          style={styles.chart}
        />
      </View>
    );
  };
  
  // Render workout stats
  const renderWorkoutStats = () => (
    <View style={[styles.statsContainer, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { color: colors.text }]}>
          {formatDuration(duration)}
        </Text>
        <Text style={[styles.statLabel, { color: colors.textLight }]}>Thời gian</Text>
      </View>
      
      <View style={styles.statDivider} />
      
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { color: colors.text }]}>
          {distance.toFixed(2)} km
        </Text>
        <Text style={[styles.statLabel, { color: colors.textLight }]}>Quãng đường</Text>
      </View>
      
      <View style={styles.statDivider} />
      
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { color: colors.text }]}>
          {Math.round(calories)}
        </Text>
        <Text style={[styles.statLabel, { color: colors.textLight }]}>Calo</Text>
      </View>
    </View>
  );
  
  // Render sport selector
  const renderSportSelector = () => (
    <View style={styles.sportSelectorContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Chọn loại hoạt động
      </Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sportList}
      >
        {SportTypes.map((sport) => (
          <TouchableOpacity
            key={sport.id}
            style={[
              styles.sportItem,
              selectedSport === sport.id && { 
                backgroundColor: colors.primary,
                borderColor: colors.primary 
              },
              { borderColor: colors.border }
            ]}
            onPress={() => setSelectedSport(sport.id)}
            disabled={status !== WorkoutStatus.READY}
          >
            <MaterialCommunityIcons
              name={sport.icon}
              size={24}
              color={selectedSport === sport.id ? 'white' : colors.text}
            />
            <Text
              style={[
                styles.sportLabel,
                { color: selectedSport === sport.id ? 'white' : colors.text }
              ]}
            >
              {sport.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
  
  // Render intensity selector
  const renderIntensitySelector = () => (
    <View style={styles.intensitySelectorContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Cường độ
      </Text>
      
      <View style={styles.intensityList}>
        {IntensityLevels.map((level) => (
          <TouchableOpacity
            key={level.id}
            style={[
              styles.intensityItem,
              intensity === level.id && { 
                backgroundColor: level.color,
                borderColor: level.color 
              },
              { borderColor: colors.border }
            ]}
            onPress={() => setIntensity(level.id)}
            disabled={status !== WorkoutStatus.READY}
          >
            <Text
              style={[
                styles.intensityLabel,
                { color: intensity === level.id ? 'white' : colors.text }
              ]}
            >
              {level.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
  
  // Render workout form for finished state
  const renderWorkoutForm = () => (
    <View style={styles.formContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Thông tin buổi tập
      </Text>
      
      <TextInput
        style={[
          styles.input,
          { 
            backgroundColor: colors.inputBackground,
            color: colors.text,
            borderColor: colors.border
          }
        ]}
        placeholder="Tiêu đề buổi tập"
        placeholderTextColor={colors.textLight}
        value={title}
        onChangeText={setTitle}
      />
      
      <TextInput
        style={[
          styles.textArea,
          { 
            backgroundColor: colors.inputBackground,
            color: colors.text,
            borderColor: colors.border
          }
        ]}
        placeholder="Ghi chú (không bắt buộc)"
        placeholderTextColor={colors.textLight}
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />
      
      <TouchableOpacity
        style={[
          styles.saveButton,
          { backgroundColor: saving ? colors.primary + '80' : colors.primary }
        ]}
        onPress={saveWorkout}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.saveButtonText}>Lưu buổi tập</Text>
        )}
      </TouchableOpacity>
    </View>
  );
  
  // Render action buttons based on status
  const renderActionButtons = () => {
    switch (status) {
      case WorkoutStatus.READY:
        return (
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: colors.success }]}
            onPress={startWorkout}
          >
            <Ionicons name="play" size={24} color="white" />
            <Text style={styles.buttonText}>Bắt đầu</Text>
          </TouchableOpacity>
        );
        
      case WorkoutStatus.ACTIVE:
        return (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.warning }]}
              onPress={pauseWorkout}
            >
              <Ionicons name="pause" size={24} color="white" />
              <Text style={styles.buttonText}>Tạm dừng</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.error }]}
              onPress={finishWorkout}
            >
              <Ionicons name="stop" size={24} color="white" />
              <Text style={styles.buttonText}>Kết thúc</Text>
            </TouchableOpacity>
          </View>
        );
        
      case WorkoutStatus.PAUSED:
        return (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.success }]}
              onPress={resumeWorkout}
            >
              <Ionicons name="play" size={24} color="white" />
              <Text style={styles.buttonText}>Tiếp tục</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.error }]}
              onPress={finishWorkout}
            >
              <Ionicons name="stop" size={24} color="white" />
              <Text style={styles.buttonText}>Kết thúc</Text>
            </TouchableOpacity>
          </View>
        );
        
      case WorkoutStatus.FINISHED:
        return null;
        
      default:
        return null;
    }
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Theo dõi hoạt động
          </Text>
        </View>
        
        {/* Map */}
        {renderMap()}
        
        {/* Workout stats */}
        {(status === WorkoutStatus.ACTIVE || 
          status === WorkoutStatus.PAUSED || 
          status === WorkoutStatus.FINISHED) && 
          renderWorkoutStats()}
        
        {/* Speed chart */}
        {(status === WorkoutStatus.ACTIVE || 
          status === WorkoutStatus.PAUSED || 
          status === WorkoutStatus.FINISHED) && 
          speedData.length > 1 && 
          renderSpeedChart()}
        
        {/* Sport selector */}
        {status === WorkoutStatus.READY && renderSportSelector()}
        
        {/* Intensity selector */}
        {status === WorkoutStatus.READY && renderIntensitySelector()}
        
        {/* Workout form */}
        {status === WorkoutStatus.FINISHED && renderWorkoutForm()}
        
        {/* Action buttons */}
        {renderActionButtons()}
      </ScrollView>
    </View>
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
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#ddd',
    marginHorizontal: 8,
  },
  chartContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  chart: {
    borderRadius: 12,
    marginVertical: 8,
  },
  sportSelectorContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  sportList: {
    paddingBottom: 8,
  },
  sportItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 12,
    width: 100,
  },
  sportLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  intensitySelectorContainer: {
    marginBottom: 24,
  },
  intensityList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  intensityItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  intensityLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  formContainer: {
    marginBottom: 24,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    height: 120,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  saveButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  startButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 0.48,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  }
});

export default WorkoutTrackingScreen; 