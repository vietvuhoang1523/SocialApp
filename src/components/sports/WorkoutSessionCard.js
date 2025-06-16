import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const WorkoutSessionCard = ({ session, onPress }) => {
  // Format thời gian
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy HH:mm', { locale: vi });
  };

  // Lấy icon tương ứng với loại thể thao
  const getSportIcon = (sportType) => {
    switch (sportType) {
      case 'FOOTBALL': return 'football-outline';
      case 'BASKETBALL': return 'basketball-outline';
      case 'VOLLEYBALL': return 'baseball-outline';
      case 'TENNIS': return 'tennisball-outline';
      case 'BADMINTON': return 'tennisball-outline';
      case 'TABLE_TENNIS': return 'tennisball-outline';
      case 'SWIMMING': return 'water-outline';
      case 'RUNNING': return 'walk-outline';
      case 'CYCLING': return 'bicycle-outline';
      case 'GYM': return 'barbell-outline';
      case 'YOGA': return 'body-outline';
      case 'MARTIAL_ARTS': return 'hand-right-outline';
      default: return 'fitness-outline';
    }
  };

  // Lấy màu tương ứng với mức độ cường độ
  const getIntensityColor = (intensity) => {
    switch (intensity) {
      case 'LOW': return '#4CAF50'; // Xanh lá
      case 'MODERATE': return '#2196F3'; // Xanh dương
      case 'HIGH': return '#FF9800'; // Cam
      case 'VERY_HIGH': return '#F44336'; // Đỏ
      default: return '#9E9E9E'; // Xám
    }
  };

  // Lấy mô tả tiếng Việt cho cường độ
  const getIntensityDescription = (intensity) => {
    switch (intensity) {
      case 'LOW': return 'Nhẹ nhàng';
      case 'MODERATE': return 'Vừa phải';
      case 'HIGH': return 'Cường độ cao';
      case 'VERY_HIGH': return 'Cực cao';
      default: return 'Không xác định';
    }
  };

  // Lấy mô tả tiếng Việt cho loại thể thao
  const getSportTypeDescription = (sportType) => {
    switch (sportType) {
      case 'FOOTBALL': return 'Bóng đá';
      case 'BASKETBALL': return 'Bóng rổ';
      case 'VOLLEYBALL': return 'Bóng chuyền';
      case 'TENNIS': return 'Quần vợt';
      case 'BADMINTON': return 'Cầu lông';
      case 'TABLE_TENNIS': return 'Bóng bàn';
      case 'SWIMMING': return 'Bơi lội';
      case 'RUNNING': return 'Chạy bộ';
      case 'CYCLING': return 'Đạp xe';
      case 'GYM': return 'Tập gym';
      case 'YOGA': return 'Yoga';
      case 'MARTIAL_ARTS': return 'Võ thuật';
      case 'OTHER': return 'Khác';
      default: return 'Không xác định';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.sportTypeContainer}>
          <Ionicons 
            name={getSportIcon(session.sportType)} 
            size={24} 
            color="#333" 
          />
          <Text style={styles.sportType}>{getSportTypeDescription(session.sportType)}</Text>
        </View>
        <View style={[styles.intensityBadge, { backgroundColor: getIntensityColor(session.intensity) }]}>
          <Text style={styles.intensityText}>{getIntensityDescription(session.intensity)}</Text>
        </View>
      </View>
      
      <Text style={styles.title}>{session.title}</Text>
      
      {session.description && (
        <Text style={styles.description} numberOfLines={2}>
          {session.description}
        </Text>
      )}
      
      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            {formatDate(session.startTime)}
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <Ionicons name="hourglass-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            {session.durationMinutes} phút
          </Text>
        </View>
        
        {session.location && (
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{session.location}</Text>
          </View>
        )}
      </View>
      
      {session.photoUrls && session.photoUrls.length > 0 && (
        <Image 
          source={{ uri: session.photoUrls[0] }} 
          style={styles.image} 
          resizeMode="cover"
        />
      )}
      
      <View style={styles.footer}>
        {session.caloriesBurned && (
          <View style={styles.footerItem}>
            <Ionicons name="flame-outline" size={16} color="#FF5722" />
            <Text style={styles.footerText}>{session.caloriesBurned} kcal</Text>
          </View>
        )}
        
        {session.distanceKm && (
          <View style={styles.footerItem}>
            <Ionicons name="map-outline" size={16} color="#2196F3" />
            <Text style={styles.footerText}>{session.distanceKm} km</Text>
          </View>
        )}
        
        {session.participants && session.participants.length > 0 && (
          <View style={styles.footerItem}>
            <Ionicons name="people-outline" size={16} color="#4CAF50" />
            <Text style={styles.footerText}>{session.participants.length} người tham gia</Text>
          </View>
        )}
        
        {session.isPersonalRecord && (
          <View style={styles.footerItem}>
            <Ionicons name="trophy-outline" size={16} color="#FFC107" />
            <Text style={styles.footerText}>Kỷ lục cá nhân</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sportTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sportType: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
    color: '#333',
  },
  intensityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  intensityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  detailsContainer: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  footerText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
});

export default WorkoutSessionCard; 