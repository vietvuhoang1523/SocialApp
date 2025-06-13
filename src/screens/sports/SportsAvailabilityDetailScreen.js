import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../hook/ThemeContext';
import sportsAvailabilityService from '../../services/SportsAvailabilityService';
import { SportTypeIcons, SportTypeNames, SkillLevelNames, getDurationText } from '../../constants/SportConstants';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const SportsAvailabilityDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { availabilityId } = route.params || {};
  
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [matchRequestSending, setMatchRequestSending] = useState(false);
  
  useEffect(() => {
    fetchAvailabilityDetails();
  }, [availabilityId]);
  
  const fetchAvailabilityDetails = async () => {
    try {
      setLoading(true);
      const data = await sportsAvailabilityService.getAvailabilityById(availabilityId);
      setAvailability(data);
    } catch (error) {
      console.error('Error fetching availability details:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin chi tiết. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRequestMatch = async () => {
    try {
      setMatchRequestSending(true);
      const result = await sportsAvailabilityService.requestMatch(
        availability.id, 
        availability.id,  // This would actually be the current user's availability ID in real implementation
        'Tôi muốn tham gia cùng bạn'
      );
      
      Alert.alert('Thành công', 'Đã gửi yêu cầu kết nối thành công');
      setRequestModalVisible(false);
      fetchAvailabilityDetails(); // Refresh data
    } catch (error) {
      console.error('Error sending match request:', error);
      Alert.alert('Lỗi', 'Không thể gửi yêu cầu kết nối. Vui lòng thử lại sau.');
    } finally {
      setMatchRequestSending(false);
    }
  };
  
  const navigateToUserProfile = (userId) => {
    navigation.navigate('UserProfile', { userId });
  };
  
  const openMap = (latitude, longitude, name) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url);
  };
  
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  if (!availability) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.text }]}>
          Không tìm thấy thông tin về lịch chơi thể thao này
        </Text>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const {
    id,
    user,
    sportType,
    availableFrom,
    availableUntil,
    preferredLocation,
    customLocationName,
    customLatitude,
    customLongitude,
    maxDistanceKm,
    groupSizeMin,
    groupSizeMax,
    skillLevelPreferences,
    message,
    status,
    requiredSkillLevel,
    isCompetitive,
    costSharing,
    expectedCostPerPerson,
    equipmentNeeded,
    flexibleTiming,
    recurringWeekly,
    maxParticipants,
    createdAt,
    expiresAt
  } = availability;
  
  const startTime = new Date(availableFrom);
  const endTime = new Date(availableUntil);
  const duration = getDurationText(
    Math.round((endTime - startTime) / (1000 * 60))
  );
  
  const locationName = customLocationName || 
    (preferredLocation ? preferredLocation.locationName : 'Chưa xác định');
    
  const locationCoords = customLatitude && customLongitude 
    ? [customLatitude, customLongitude]
    : (preferredLocation ? [preferredLocation.latitude, preferredLocation.longitude] : null);
  
  const dateStr = format(startTime, 'EEEE, dd/MM/yyyy', { locale: vi });
  const timeStr = `${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`;
  
  const sportIcon = SportTypeIcons[sportType] || 'running';
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Chi tiết</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Sport Type Badge */}
          <View style={styles.sportBadgeContainer}>
            <View style={[styles.sportBadge, { backgroundColor: colors.primary + '20' }]}>
              <FontAwesome5 name={sportIcon} size={24} color={colors.primary} />
              <Text style={[styles.sportBadgeText, { color: colors.primary }]}>
                {SportTypeNames[sportType] || sportType}
              </Text>
            </View>
          </View>
          
          {/* User Info */}
          <TouchableOpacity 
            style={styles.userInfoContainer}
            onPress={() => navigateToUserProfile(user.id)}
          >
            <Image 
              source={user.avatar ? { uri: user.avatar } : require('../../assets/default-avatar.png')}
              style={styles.userAvatar}
            />
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: colors.text }]}>{user.fullName}</Text>
              <Text style={[styles.userSkillLevel, { color: colors.textLight }]}>
                {requiredSkillLevel ? SkillLevelNames[requiredSkillLevel] : 'Trình độ không xác định'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>
          
          {/* Time & Date */}
          <View style={[styles.infoCard, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} style={styles.infoIcon} />
              <Text style={[styles.infoLabel, { color: colors.textLight }]}>Ngày:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{dateStr}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={colors.primary} style={styles.infoIcon} />
              <Text style={[styles.infoLabel, { color: colors.textLight }]}>Thời gian:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{timeStr}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="hourglass-outline" size={20} color={colors.primary} style={styles.infoIcon} />
              <Text style={[styles.infoLabel, { color: colors.textLight }]}>Thời lượng:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{duration}</Text>
            </View>
            
            {flexibleTiming && (
              <View style={styles.tagContainer}>
                <View style={[styles.tag, { backgroundColor: colors.success + '20' }]}>
                  <Text style={[styles.tagText, { color: colors.success }]}>Linh hoạt thời gian</Text>
                </View>
              </View>
            )}
            
            {recurringWeekly && (
              <View style={styles.tagContainer}>
                <View style={[styles.tag, { backgroundColor: colors.info + '20' }]}>
                  <Text style={[styles.tagText, { color: colors.info }]}>Lặp lại hàng tuần</Text>
                </View>
              </View>
            )}
          </View>
          
          {/* Location */}
          <View style={[styles.infoCard, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color={colors.primary} style={styles.infoIcon} />
              <Text style={[styles.infoLabel, { color: colors.textLight }]}>Địa điểm:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={2}>{locationName}</Text>
            </View>
            
            {locationCoords && (
              <TouchableOpacity 
                style={[styles.mapButton, { backgroundColor: colors.primary }]}
                onPress={() => openMap(locationCoords[0], locationCoords[1], locationName)}
              >
                <Ionicons name="map-outline" size={16} color="white" />
                <Text style={styles.mapButtonText}>Xem bản đồ</Text>
              </TouchableOpacity>
            )}
            
            <View style={styles.infoRow}>
              <Ionicons name="compass-outline" size={20} color={colors.primary} style={styles.infoIcon} />
              <Text style={[styles.infoLabel, { color: colors.textLight }]}>Khoảng cách tối đa:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{maxDistanceKm} km</Text>
            </View>
          </View>
          
          {/* Group Size & Skills */}
          <View style={[styles.infoCard, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.infoRow}>
              <Ionicons name="people-outline" size={20} color={colors.primary} style={styles.infoIcon} />
              <Text style={[styles.infoLabel, { color: colors.textLight }]}>Số người:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {groupSizeMin === groupSizeMax ? 
                  `${groupSizeMin} người` : 
                  `${groupSizeMin} - ${groupSizeMax} người`
                }
              </Text>
            </View>
            
            {maxParticipants && (
              <View style={styles.infoRow}>
                <Ionicons name="people-circle-outline" size={20} color={colors.primary} style={styles.infoIcon} />
                <Text style={[styles.infoLabel, { color: colors.textLight }]}>Giới hạn:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {maxParticipants} người tối đa
                </Text>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="trophy-outline" size={20} color={colors.primary} style={styles.infoIcon} />
              <Text style={[styles.infoLabel, { color: colors.textLight }]}>Trình độ chấp nhận:</Text>
              <View style={styles.skillsContainer}>
                {skillLevelPreferences && skillLevelPreferences.length > 0 ? 
                  skillLevelPreferences.map(skill => (
                    <View 
                      key={skill} 
                      style={[styles.skillBadge, { backgroundColor: colors.secondary + '20' }]}
                    >
                      <Text style={[styles.skillText, { color: colors.secondary }]}>
                        {SkillLevelNames[skill] || skill}
                      </Text>
                    </View>
                  )) : 
                  <Text style={[styles.infoValue, { color: colors.text }]}>Tất cả trình độ</Text>
                }
              </View>
            </View>
            
            <View style={styles.tagsRow}>
              {isCompetitive !== null && (
                <View style={[
                  styles.tag, 
                  { backgroundColor: isCompetitive ? colors.error + '20' : colors.success + '20' }
                ]}>
                  <Text style={[
                    styles.tagText, 
                    { color: isCompetitive ? colors.error : colors.success }
                  ]}>
                    {isCompetitive ? 'Thi đấu' : 'Giải trí'}
                  </Text>
                </View>
              )}
              
              {costSharing !== null && (
                <View style={[
                  styles.tag, 
                  { backgroundColor: costSharing ? colors.warning + '20' : colors.info + '20' }
                ]}>
                  <Text style={[
                    styles.tagText, 
                    { color: costSharing ? colors.warning : colors.info }
                  ]}>
                    {costSharing ? 'Chia sẻ chi phí' : 'Không chia sẻ chi phí'}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          {/* Additional Info */}
          {(expectedCostPerPerson || equipmentNeeded || message) && (
            <View style={[styles.infoCard, { backgroundColor: colors.cardBackground }]}>
              {expectedCostPerPerson > 0 && (
                <View style={styles.infoRow}>
                  <FontAwesome name="money" size={20} color={colors.primary} style={styles.infoIcon} />
                  <Text style={[styles.infoLabel, { color: colors.textLight }]}>Chi phí dự kiến:</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {expectedCostPerPerson.toLocaleString()} VNĐ / người
                  </Text>
                </View>
              )}
              
              {equipmentNeeded && (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="toolbox-outline" size={20} color={colors.primary} style={styles.infoIcon} />
                  <Text style={[styles.infoLabel, { color: colors.textLight }]}>Dụng cụ cần thiết:</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={3}>
                    {equipmentNeeded}
                  </Text>
                </View>
              )}
              
              {message && (
                <View style={styles.messageContainer}>
                  <Text style={[styles.messageTitle, { color: colors.textLight }]}>Tin nhắn:</Text>
                  <Text style={[styles.messageText, { color: colors.text }]}>
                    {message}
                  </Text>
                </View>
              )}
            </View>
          )}
          
          {/* Status & Expiry */}
          <View style={[styles.statusCard, { backgroundColor: 
            status === 'ACTIVE' ? colors.success + '15' : 
            status === 'MATCHED' ? colors.primary + '15' : 
            status === 'EXPIRED' ? colors.textLight + '15' : 
            colors.error + '15'
          }]}>
            <Ionicons 
              name={
                status === 'ACTIVE' ? 'checkmark-circle' : 
                status === 'MATCHED' ? 'people' : 
                status === 'EXPIRED' ? 'time' : 
                'close-circle'
              } 
              size={20} 
              color={
                status === 'ACTIVE' ? colors.success : 
                status === 'MATCHED' ? colors.primary : 
                status === 'EXPIRED' ? colors.textLight : 
                colors.error
              } 
            />
            <Text style={[styles.statusText, { 
              color: status === 'ACTIVE' ? colors.success : 
              status === 'MATCHED' ? colors.primary : 
              status === 'EXPIRED' ? colors.textLight : 
              colors.error 
            }]}>
              {status === 'ACTIVE' ? 'Đang hoạt động' : 
               status === 'MATCHED' ? 'Đã kết nối' : 
               status === 'EXPIRED' ? 'Đã hết hạn' : 
               'Đã hủy'}
            </Text>
            
            {expiresAt && status === 'ACTIVE' && (
              <Text style={[styles.expiryText, { color: colors.textLight }]}>
                Hết hạn vào: {format(new Date(expiresAt), 'HH:mm, dd/MM/yyyy')}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
      
      {/* Action Buttons */}
      {status === 'ACTIVE' && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.secondary }]}
            onPress={() => Linking.openURL(`tel:${user.phone || '0987654321'}`)}
          >
            <Ionicons name="call-outline" size={20} color="white" />
            <Text style={styles.actionButtonText}>Gọi điện</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleRequestMatch}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="white" />
            <Text style={styles.actionButtonText}>Gửi yêu cầu kết nối</Text>
          </TouchableOpacity>
        </View>
      )}
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
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  sportBadgeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sportBadgeText: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userDetails: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userSkillLevel: {
    fontSize: 14,
    marginTop: 4,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoLabel: {
    width: 120,
    fontSize: 14,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  mapButtonText: {
    color: 'white',
    marginLeft: 4,
    fontWeight: '500',
  },
  skillsContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  messageContainer: {
    marginTop: 8,
  },
  messageTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  statusCard: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  expiryText: {
    fontSize: 12,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default SportsAvailabilityDetailScreen; 