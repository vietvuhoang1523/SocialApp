import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../hook/ThemeContext';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { SportTypeIcons } from '../../constants/SportConstants';

const SportsAvailabilityCard = ({ availability, onPress }) => {
  const { colors } = useTheme();
  
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
    isCompetitive
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
  
  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.cardBackground }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
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
          <Text style={[styles.sportText, { color: colors.primary }]}>{sportType}</Text>
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
});

export default SportsAvailabilityCard; 