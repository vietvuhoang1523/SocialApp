import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hook/ThemeContext';
import { getUserWorkouts } from '../../services/workoutService';
import { useFocusEffect } from '@react-navigation/native';
import { formatDuration, formatDate, formatRelativeTime } from '../../utils/timeUtils';

const WorkoutHistoryScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  // Load workouts
  const loadWorkouts = async (pageToLoad = 0, shouldRefresh = false) => {
    try {
      if (shouldRefresh) {
        setLoading(true);
      }
      
      const response = await getUserWorkouts(pageToLoad, 10);
      
      if (response.content.length === 0) {
        setHasMore(false);
      }
      
      if (shouldRefresh || pageToLoad === 0) {
        setWorkouts(response.content);
      } else {
        setWorkouts(prev => [...prev, ...response.content]);
      }
      
      setPage(pageToLoad);
    } catch (error) {
      console.error('Error loading workouts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadWorkouts(0, true);
      return () => {};
    }, [])
  );
  
  // Handle pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    setHasMore(true);
    loadWorkouts(0, true);
  };
  
  // Load more workouts when reaching end of list
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadWorkouts(page + 1);
    }
  };
  
  // Navigate to workout details
  const navigateToWorkoutDetails = (workoutId) => {
    navigation.navigate('WorkoutDetail', { workoutId });
  };
  
  // Start new workout
  const startNewWorkout = () => {
    navigation.navigate('WorkoutTracking');
  };
  
  // Get sport icon
  const getSportIcon = (sportType) => {
    switch (sportType) {
      case 'RUNNING':
        return 'run';
      case 'CYCLING':
        return 'bike';
      case 'WALKING':
        return 'walk';
      case 'SWIMMING':
        return 'swim';
      case 'HIKING':
        return 'hiking';
      case 'YOGA':
        return 'yoga';
      case 'GYM':
        return 'weight-lifter';
      default:
        return 'dumbbell';
    }
  };
  
  // Get intensity color
  const getIntensityColor = (intensity) => {
    switch (intensity) {
      case 'LOW':
        return '#2ecc71';
      case 'MEDIUM':
        return '#f39c12';
      case 'HIGH':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };
  
  // Render workout item
  const renderWorkoutItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.workoutItem, { backgroundColor: colors.cardBackground }]}
      onPress={() => navigateToWorkoutDetails(item.id)}
    >
      <View style={styles.workoutHeader}>
        <View style={styles.workoutIcon}>
          <MaterialCommunityIcons
            name={getSportIcon(item.sportType)}
            size={24}
            color={colors.primary}
          />
        </View>
        
        <View style={styles.workoutInfo}>
          <Text style={[styles.workoutTitle, { color: colors.text }]}>
            {item.title}
          </Text>
          
          <Text style={[styles.workoutDate, { color: colors.textLight }]}>
            {formatRelativeTime(item.startTime)}
          </Text>
        </View>
        
        <View
          style={[
            styles.intensityIndicator,
            { backgroundColor: getIntensityColor(item.intensityLevel) }
          ]}
        />
      </View>
      
      <View style={styles.workoutStats}>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={16} color={colors.textLight} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {formatDuration(item.durationInSeconds)}
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="speedometer-outline" size={16} color={colors.textLight} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {item.distanceInKm.toFixed(2)} km
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="flame-outline" size={16} color={colors.textLight} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {item.caloriesBurned} kcal
          </Text>
        </View>
      </View>
      
      {item.path && item.path.length > 0 && (
        <View style={styles.mapPreview}>
          <Image
            source={{
              uri: `https://maps.googleapis.com/maps/api/staticmap?size=400x200&path=color:0x4285F4|weight:3|${item.path
                .map(point => `${point.latitude},${point.longitude}`)
                .join('|')}&key=YOUR_GOOGLE_MAPS_API_KEY`
            }}
            style={styles.mapImage}
            resizeMode="cover"
          />
        </View>
      )}
    </TouchableOpacity>
  );
  
  // Render empty state
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="run-fast" size={64} color={colors.textLight} />
      <Text style={[styles.emptyText, { color: colors.textLight }]}>
        Bạn chưa có buổi tập nào
      </Text>
      <Text style={[styles.emptySubtext, { color: colors.textLight }]}>
        Bắt đầu theo dõi hoạt động của bạn ngay bây giờ
      </Text>
    </View>
  );
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Lịch sử tập luyện
        </Text>
        
        <TouchableOpacity
          style={[styles.newWorkoutButton, { backgroundColor: colors.primary }]}
          onPress={startNewWorkout}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      {/* Workout list */}
      <FlatList
        data={workouts}
        renderItem={renderWorkoutItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={!loading && renderEmptyComponent()}
        ListFooterComponent={
          loading && !refreshing ? (
            <ActivityIndicator
              color={colors.primary}
              size="large"
              style={styles.loadingIndicator}
            />
          ) : null
        }
      />
      
      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={startNewWorkout}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  newWorkoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 80,
  },
  workoutItem: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  workoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginRight: 12,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  workoutDate: {
    fontSize: 12,
  },
  intensityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  mapPreview: {
    height: 120,
    width: '100%',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  loadingIndicator: {
    marginVertical: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default WorkoutHistoryScreen; 