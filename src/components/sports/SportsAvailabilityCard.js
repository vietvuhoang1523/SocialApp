import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../hook/ThemeContext';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { SportTypeIcons } from '../../constants/SportConstants';
import SportsPostParticipantService from '../../services/SportsPostParticipantService';

const SportsAvailabilityCard = ({ availability, onPress, onJoinSuccess }) => {
  const { colors } = useTheme();
  const [joining, setJoining] = useState(false);
  const [joinStatus, setJoinStatus] = useState(availability?.userParticipationStatus || null);
  
  if (!availability) return null;
  
  const {
    id,
    user,
    sportType,
    availableFrom,
    availableUntil,
    preferredLocation,
    customLocationName,
    maxDistanceKm,
    groupSizeMin,
    groupSizeMax,
    skillLevelPreferences,
    message,
    status,
    createdAt,
    requiredSkillLevel,
    isCompetitive,
    matchRequestCount,
    viewCount,
    userParticipationStatus
  } = availability;
  
  const sportIcon = SportTypeIcons[sportType] || 'football';
  const locationName = customLocationName || 
    (preferredLocation ? preferredLocation.locationName : 'Chưa xác định');
  
  // Calculate time
  const startTime = new Date(availableFrom);
  const endTime = new Date(availableUntil);
  
  const formatTime = (date) => {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (date) => {
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };
  
  const timeText = `${formatTime(startTime)} - ${formatTime(endTime)}, ${formatDate(startTime)}`;
  
  // Format created time
  const createdAtDate = new Date(createdAt);
  const createdTimeAgo = formatDistanceToNow(createdAtDate, { addSuffix: true, locale: vi });
  
  // Format skill level
  const getSkillLevelText = () => {
    if (!skillLevelPreferences || skillLevelPreferences.length === 0) {
      return 'Tất cả trình độ';
    }
    
    if (skillLevelPreferences.length === 1) {
      return `Trình độ ${skillLevelPreferences[0].toLowerCase()}`;
    }
    
    return `${skillLevelPreferences.length} trình độ`;
  };

  // Tính thời gian còn lại
  const getTimeRemaining = () => {
    const now = new Date();
    const diffMs = startTime - now;
    
    if (diffMs < 0) {
      if (now < endTime) {
        return 'Đang diễn ra';
      }
      return 'Đã kết thúc';
    }
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours > 24) {
      const diffDays = Math.floor(diffHours / 24);
      return `Còn ${diffDays} ngày`;
    }
    
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `Còn ${diffMinutes} phút`;
    }
    
    return `Còn ${diffHours} giờ`;
  };
  
  // Kiểm tra xem có đang diễn ra không
  const isOngoing = () => {
    const now = new Date();
    return now >= startTime && now <= endTime;
  };
  
  // Kiểm tra xem đã kết thúc chưa
  const isEnded = () => {
    const now = new Date();
    return now > endTime;
  };
  
  // Lấy màu trạng thái
  const getStatusColor = () => {
    if (isEnded()) {
      return colors.error;
    }
    if (isOngoing()) {
      return colors.success;
    }
    return colors.warning;
  };
  
  // Lấy thông tin về môn thể thao bằng tiếng Việt
  const getSportTypeVietnamese = (type) => {
    const sportTypes = {
      FOOTBALL: 'Bóng đá',
      BASKETBALL: 'Bóng rổ',
      VOLLEYBALL: 'Bóng chuyền',
      TENNIS: 'Quần vợt',
      BADMINTON: 'Cầu lông',
      TABLE_TENNIS: 'Bóng bàn',
      SWIMMING: 'Bơi lội',
      RUNNING: 'Chạy bộ',
      CYCLING: 'Đạp xe',
      GYM: 'Tập gym',
      YOGA: 'Yoga',
      MARTIAL_ARTS: 'Võ thuật',
      OTHER: 'Khác'
    };
    
    return sportTypes[type] || type;
  };
  
  // Handle join button press
  const handleJoinPress = async () => {
    // Prevent creator from joining their own post
    if (availability.isCreator) {
      Alert.alert('Thông báo', 'Bạn không thể tham gia bài đăng của chính mình');
      return;
    }

    // If already joined or has pending request
    if (joinStatus === 'ACCEPTED') {
      Alert.alert(
        'Đã tham gia',
        'Bạn đã tham gia hoạt động này rồi',
        [{ text: 'OK' }]
      );
      return;
    }

    if (joinStatus === 'PENDING') {
      Alert.alert(
        'Yêu cầu đang chờ duyệt',
        'Yêu cầu tham gia của bạn đang chờ người tạo duyệt',
        [{ text: 'OK' }]
      );
      return;
    }

    // If ended
    if (isEnded()) {
      Alert.alert('Thông báo', 'Hoạt động này đã kết thúc');
      return;
    }

    // Show join confirmation
    Alert.alert(
      'Xác nhận tham gia',
      'Bạn có muốn gửi tin nhắn kèm theo yêu cầu tham gia không?',
      [
        {
          text: 'Hủy',
          style: 'cancel'
        },
        {
          text: 'Không cần',
          onPress: () => submitJoinRequest('')
        },
        {
          text: 'Có, gửi tin nhắn',
          onPress: () => showJoinMessagePrompt()
        }
      ]
    );
  };

  const showJoinMessagePrompt = () => {
    Alert.prompt(
      'Tin nhắn tham gia',
      'Nhập tin nhắn bạn muốn gửi đến người tạo:',
      [
        {
          text: 'Hủy',
          style: 'cancel'
        },
        {
          text: 'Gửi',
          onPress: (message) => submitJoinRequest(message || '')
        }
      ],
      'plain-text'
    );
  };

  const submitJoinRequest = async (joinMessage) => {
    try {
      setJoining(true);
      const response = await SportsPostParticipantService.joinSportsPost(id, joinMessage);
      setJoinStatus('PENDING');
      
      // Update parent component if needed
      if (onJoinSuccess) {
        onJoinSuccess(id);
      }
      
      Alert.alert(
        'Thành công',
        'Yêu cầu tham gia đã được gửi và đang chờ duyệt',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Lỗi',
        error.message || 'Không thể gửi yêu cầu tham gia. Vui lòng thử lại sau.',
        [{ text: 'OK' }]
      );
    } finally {
      setJoining(false);
    }
  };

  // Get join button text based on status
  const getJoinButtonText = () => {
    if (joining) return '';
    if (joinStatus === 'ACCEPTED') return 'Đã tham gia';
    if (joinStatus === 'PENDING') return 'Đang chờ';
    if (joinStatus === 'REJECTED') return 'Bị từ chối';
    if (isEnded()) return 'Đã kết thúc';
    return 'Tham gia';
  };

  // Get join button color based on status
  const getJoinButtonColor = () => {
    if (joinStatus === 'ACCEPTED') return colors.success;
    if (joinStatus === 'PENDING') return colors.warning;
    if (joinStatus === 'REJECTED') return colors.error;
    if (isEnded()) return colors.textLight;
    return '#4CAF50'; // Default green
  };
  
  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.cardBackground }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Status badge */}
      <View 
        style={[
          styles.statusBadge, 
          { backgroundColor: getStatusColor() + '20' }
        ]}
      >
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getTimeRemaining()}
        </Text>
      </View>
      
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image 
            source={user?.avatar ? { uri: user.avatar } : require('../../assets/default-avatar.png')}
            style={styles.avatar}
          />
          <View>
            <Text style={[styles.userName, { color: colors.text }]}>{user?.fullName || 'Người dùng'}</Text>
            <Text style={[styles.timeAgo, { color: colors.textLight }]}>{createdTimeAgo}</Text>
          </View>
        </View>
        <View style={[styles.sportBadge, { backgroundColor: colors.primary + '20' }]}>
          <FontAwesome5 name={sportIcon} size={16} color={colors.primary} />
          <Text style={[styles.sportText, { color: colors.primary }]}>
            {getSportTypeVietnamese(sportType)}
          </Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color={colors.textLight} style={styles.icon} />
          <Text style={[styles.infoText, { color: colors.text }]}>{timeText}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color={colors.textLight} style={styles.icon} />
          <Text style={[styles.infoText, { color: colors.text }]} numberOfLines={1}>
            {locationName} {maxDistanceKm ? `(${maxDistanceKm}km)` : ''}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="people-outline" size={16} color={colors.textLight} style={styles.icon} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            {groupSizeMin === groupSizeMax ? `${groupSizeMin} người` : `${groupSizeMin} - ${groupSizeMax} người`}
          </Text>
        </View>
        
        {message && (
          <Text style={[styles.message, { color: colors.text }]} numberOfLines={2}>
            {message}
          </Text>
        )}
      </View>
      
      <View style={styles.footer}>
        {requiredSkillLevel && (
          <View style={[styles.badge, { backgroundColor: colors.secondary + '20' }]}>
            <MaterialCommunityIcons name="trophy-outline" size={14} color={colors.secondary} />
            <Text style={[styles.badgeText, { color: colors.secondary }]}>
              {requiredSkillLevel}
            </Text>
          </View>
        )}
        
        {isCompetitive && (
          <View style={[styles.badge, { backgroundColor: colors.error + '20' }]}>
            <MaterialCommunityIcons name="medal-outline" size={14} color={colors.error} />
            <Text style={[styles.badgeText, { color: colors.error }]}>
              Thi đấu
            </Text>
          </View>
        )}
        
        <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name="fitness-outline" size={14} color={colors.primary} />
          <Text style={[styles.badgeText, { color: colors.primary }]}>
            {getSkillLevelText()}
          </Text>
        </View>
      </View>
      
      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="eye-outline" size={14} color={colors.textLight} />
          <Text style={[styles.statText, { color: colors.textLight }]}>
            {viewCount || 0}
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="people-outline" size={14} color={colors.textLight} />
          <Text style={[styles.statText, { color: colors.textLight }]}>
            {matchRequestCount || 0} người quan tâm
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.joinButton, { backgroundColor: getJoinButtonColor() }]}
          onPress={handleJoinPress}
          disabled={joining || joinStatus === 'ACCEPTED' || isEnded()}
        >
          {joining ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.joinButtonText}>{getJoinButtonText()}</Text>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  timeAgo: {
    fontSize: 12,
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  sportText: {
    marginLeft: 4,
    fontWeight: '500',
    fontSize: 14,
  },
  content: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
  message: {
    fontSize: 14,
    marginTop: 8,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 12,
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    marginLeft: 4,
  },
  joinButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 80,
    alignItems: 'center',
  },
  joinButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
});

export default SportsAvailabilityCard; 