import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WorkoutSessionCard from '../../components/sports/WorkoutSessionCard';
import FilterBar from '../../components/sports/FilterBar';

// Dữ liệu mẫu để hiển thị
const MOCK_DATA = [
  {
    id: '1',
    title: 'Buổi tập chạy bộ buổi sáng',
    description: 'Chạy bộ quanh công viên Thống Nhất',
    sportType: 'RUNNING',
    startTime: '2023-07-15T06:30:00',
    durationMinutes: 45,
    caloriesBurned: 350,
    distanceKm: 5.2,
    location: 'Công viên Thống Nhất',
    intensity: 'MODERATE',
    photoUrls: ['https://example.com/running1.jpg'],
    participants: [{ id: '1', name: 'Nguyễn Văn A' }],
    isPersonalRecord: true,
    recordType: 'DISTANCE'
  },
  {
    id: '2',
    title: 'Tập gym buổi tối',
    description: 'Tập tăng cơ chân và vai',
    sportType: 'GYM',
    startTime: '2023-07-16T18:00:00',
    durationMinutes: 90,
    caloriesBurned: 450,
    exercises: ['Squat', 'Deadlift', 'Shoulder Press'],
    sets: 4,
    reps: 12,
    weightKg: 60,
    location: 'California Fitness & Yoga',
    intensity: 'HIGH',
    photoUrls: ['https://example.com/gym1.jpg'],
    participants: [],
    isPersonalRecord: false
  },
  {
    id: '3',
    title: 'Bơi lội cuối tuần',
    description: 'Bơi tự do và bơi ếch',
    sportType: 'SWIMMING',
    startTime: '2023-07-17T10:00:00',
    durationMinutes: 60,
    caloriesBurned: 400,
    distanceKm: 1.5,
    location: 'Hồ bơi Phú Thọ',
    intensity: 'MODERATE',
    photoUrls: ['https://example.com/swimming1.jpg'],
    participants: [
      { id: '2', name: 'Trần Thị B' },
      { id: '3', name: 'Lê Văn C' }
    ],
    isPersonalRecord: false
  },
  {
    id: '4',
    title: 'Đá bóng với đồng nghiệp',
    description: 'Trận đấu giao hữu với team công ty',
    sportType: 'FOOTBALL',
    startTime: '2023-07-18T17:30:00',
    durationMinutes: 120,
    caloriesBurned: 800,
    location: 'Sân bóng Thành Đô',
    intensity: 'HIGH',
    photoUrls: ['https://example.com/football1.jpg'],
    participants: [
      { id: '4', name: 'Phạm Văn D' },
      { id: '5', name: 'Nguyễn Thị E' },
      { id: '6', name: 'Trần Văn F' }
    ],
    isPersonalRecord: false
  },
  {
    id: '5',
    title: 'Yoga buổi sáng',
    description: 'Tập yoga thư giãn',
    sportType: 'YOGA',
    startTime: '2023-07-19T07:00:00',
    durationMinutes: 60,
    caloriesBurned: 200,
    location: 'Nhà',
    intensity: 'LOW',
    photoUrls: ['https://example.com/yoga1.jpg'],
    participants: [],
    isPersonalRecord: false
  }
];

const WorkoutSessionsScreen = ({ navigation }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    // Giả lập việc tải dữ liệu từ API
    fetchWorkoutSessions();
  }, []);

  const fetchWorkoutSessions = () => {
    // Trong thực tế, đây sẽ là API call
    setTimeout(() => {
      setSessions(MOCK_DATA);
      setLoading(false);
      setRefreshing(false);
    }, 1000);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWorkoutSessions();
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    // Trong thực tế, bạn sẽ lọc dữ liệu từ API hoặc lọc dữ liệu cục bộ
  };

  const navigateToDetail = (session) => {
    navigation.navigate('WorkoutSessionDetail', { sessionId: session.id });
  };

  const navigateToCreate = () => {
    navigation.navigate('CreateWorkoutSession');
  };

  const renderItem = ({ item }) => (
    <WorkoutSessionCard 
      session={item} 
      onPress={() => navigateToDetail(item)} 
    />
  );

  const renderFilterOptions = () => {
    return [
      { label: 'Tất cả', value: 'ALL' },
      { label: 'Chạy bộ', value: 'RUNNING' },
      { label: 'Gym', value: 'GYM' },
      { label: 'Bơi lội', value: 'SWIMMING' },
      { label: 'Bóng đá', value: 'FOOTBALL' },
      { label: 'Yoga', value: 'YOGA' },
      { label: 'Khác', value: 'OTHER' }
    ];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FilterBar 
        options={renderFilterOptions()} 
        selectedValue={filter}
        onValueChange={handleFilterChange}
      />
      
      <FlatList
        data={sessions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không có buổi tập nào</Text>
          </View>
        }
      />
      
      <TouchableOpacity 
        style={styles.fabButton} 
        onPress={navigateToCreate}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  fabButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});

export default WorkoutSessionsScreen; 