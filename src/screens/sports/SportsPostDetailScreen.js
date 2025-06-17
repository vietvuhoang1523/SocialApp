import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  FlatList
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../hook/ThemeContext';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getSportsPostById } from '../../services/sportsService';
import { getParticipants, joinSportsPost, leaveSportsPost, getUserParticipationStatus } from '../../services/sportsService';
import ParticipantItem from '../../components/sports/ParticipantItem';
import JoinRequestModal from '../../components/sports/JoinRequestModal';
import { SportTypeIcons } from '../../constants/SportConstants';

const SportsPostDetailScreen = ({ route, navigation }) => {
  const { postId } = route.params;
  const { colors } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [post, setPost] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participationStatus, setParticipationStatus] = useState(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  
  // Fetch post details
  const fetchPostDetails = useCallback(async () => {
    try {
      setLoading(true);
      const postData = await getSportsPostById(postId);
      setPost(postData);
      
      // Check user participation status
      const status = await getUserParticipationStatus(postId);
      setParticipationStatus(status);
      
      // Load participants
      fetchParticipants();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải thông tin bài đăng');
    } finally {
      setLoading(false);
    }
  }, [postId]);
  
  // Fetch participants
  const fetchParticipants = useCallback(async () => {
    try {
      setParticipantsLoading(true);
      const response = await getParticipants(postId);
      setParticipants(response.content || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setParticipantsLoading(false);
    }
  }, [postId]);
  
  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPostDetails();
    setRefreshing(false);
  }, [fetchPostDetails]);
  
  // Handle join button press
  const handleJoinPress = () => {
    // Check if already joined
    if (participationStatus === 'ACCEPTED') {
      Alert.alert(
        'Đã tham gia',
        'Bạn đã tham gia hoạt động này rồi',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Check if already sent request
    if (participationStatus === 'PENDING') {
      Alert.alert(
        'Yêu cầu đang chờ duyệt',
        'Yêu cầu tham gia của bạn đang chờ người tạo duyệt',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Show join modal
    setShowJoinModal(true);
  };
  
  // Handle join submission
  const handleJoinSubmit = async (message) => {
    try {
      setShowJoinModal(false);
      const response = await joinSportsPost(postId, message);
      setParticipationStatus('PENDING');
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
    }
  };
  
  // Handle leave
  const handleLeavePress = () => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc muốn hủy tham gia hoạt động này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xác nhận', 
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveSportsPost(postId);
              setParticipationStatus(null);
              fetchParticipants(); // Refresh participants list
              Alert.alert('Thành công', 'Đã hủy tham gia hoạt động');
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể hủy tham gia. Vui lòng thử lại sau.');
            }
          }
        }
      ]
    );
  };
  
  // Load data on mount
  useEffect(() => {
    fetchPostDetails();
  }, [fetchPostDetails]);
  
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  if (!post) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Không tìm thấy bài đăng</Text>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: 'white' }}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Format dates
  const startTime = new Date(post.availableFrom);
  const endTime = new Date(post.availableUntil);
  const formattedDate = format(startTime, 'EEEE, dd/MM/yyyy', { locale: vi });
  const formattedTime = `${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`;
  
  // Get sport icon
  const sportIcon = SportTypeIcons[post.sportType] || 'football';
  
  // Check if post is created by current user
  const isCreator = post.isCreator || false;
  
  // Check if post is ended
  const isEnded = new Date() > endTime;
  
  // Get join button status
  const getJoinButtonText = () => {
    if (isCreator) return 'Bài đăng của bạn';
    if (participationStatus === 'ACCEPTED') return 'Đã tham gia';
    if (participationStatus === 'PENDING') return 'Đang chờ duyệt';
    if (participationStatus === 'REJECTED') return 'Đã bị từ chối';
    if (isEnded) return 'Đã kết thúc';
    return 'Tham gia';
  };
  
  // Get join button color
  const getJoinButtonColor = () => {
    if (isCreator) return colors.secondary;
    if (participationStatus === 'ACCEPTED') return colors.success;
    if (participationStatus === 'PENDING') return colors.warning;
    if (participationStatus === 'REJECTED') return colors.error;
    if (isEnded) return colors.textLight;
    return colors.primary;
  };
  
  // Check if user can join
  const canJoin = !isCreator && !isEnded && participationStatus !== 'ACCEPTED' && participationStatus !== 'PENDING';
  
  // Check if user can leave
  const canLeave = !isCreator && (participationStatus === 'ACCEPTED' || participationStatus === 'PENDING');
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image 
              source={post.user?.avatar ? { uri: post.user.avatar } : require('../../assets/default-avatar.png')}
              style={styles.avatar}
            />
            <View>
              <Text style={[styles.userName, { color: colors.text }]}>{post.user?.fullName || 'Người dùng'}</Text>
              <Text style={[styles.timeAgo, { color: colors.textLight }]}>
                {format(new Date(post.createdAt), "'Đăng ngày' dd/MM/yyyy", { locale: vi })}
              </Text>
            </View>
          </View>
          <View style={[styles.sportBadge, { backgroundColor: colors.primary + '20' }]}>
            <FontAwesome5 name={sportIcon} size={18} color={colors.primary} />
            <Text style={[styles.sportText, { color: colors.primary }]}>
              {post.sportType}
            </Text>
          </View>
        </View>
        
        {/* Main content */}
        <View style={styles.content}>
          {/* Time and date */}
          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={[styles.infoHeaderText, { color: colors.primary }]}>Thời gian</Text>
            </View>
            <Text style={[styles.infoText, { color: colors.text }]}>{formattedDate}</Text>
            <Text style={[styles.infoText, { color: colors.text }]}>{formattedTime}</Text>
          </View>
          
          {/* Location */}
          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <Ionicons name="location-outline" size={20} color={colors.primary} />
              <Text style={[styles.infoHeaderText, { color: colors.primary }]}>Địa điểm</Text>
            </View>
            <Text style={[styles.infoText, { color: colors.text }]}>
              {post.customLocationName || (post.preferredLocation ? post.preferredLocation.locationName : 'Chưa xác định')}
            </Text>
            {post.maxDistanceKm && (
              <Text style={[styles.infoSubText, { color: colors.textLight }]}>
                Phạm vi: {post.maxDistanceKm}km
              </Text>
            )}
          </View>
          
          {/* Group size */}
          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <Ionicons name="people-outline" size={20} color={colors.primary} />
              <Text style={[styles.infoHeaderText, { color: colors.primary }]}>Số người</Text>
            </View>
            <Text style={[styles.infoText, { color: colors.text }]}>
              {post.groupSizeMin === post.groupSizeMax 
                ? `${post.groupSizeMin} người` 
                : `${post.groupSizeMin} - ${post.groupSizeMax} người`}
            </Text>
            <Text style={[styles.infoSubText, { color: colors.textLight }]}>
              Đã tham gia: {participants.filter(p => p.status === 'ACCEPTED').length} người
            </Text>
          </View>
          
          {/* Skill level */}
          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <MaterialCommunityIcons name="trophy-outline" size={20} color={colors.primary} />
              <Text style={[styles.infoHeaderText, { color: colors.primary }]}>Trình độ</Text>
            </View>
            {post.requiredSkillLevel && (
              <Text style={[styles.infoText, { color: colors.text }]}>
                Yêu cầu: {post.requiredSkillLevel}
              </Text>
            )}
            <Text style={[styles.infoText, { color: colors.text }]}>
              Chấp nhận: {post.skillLevelPreferences && post.skillLevelPreferences.length > 0 
                ? post.skillLevelPreferences.join(', ') 
                : 'Tất cả trình độ'}
            </Text>
            {post.isCompetitive && (
              <View style={[styles.badge, { backgroundColor: colors.error + '20' }]}>
                <MaterialCommunityIcons name="medal-outline" size={14} color={colors.error} />
                <Text style={[styles.badgeText, { color: colors.error }]}>
                  Thi đấu
                </Text>
              </View>
            )}
          </View>
          
          {/* Message */}
          {post.message && (
            <View style={styles.infoSection}>
              <View style={styles.infoHeader}>
                <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
                <Text style={[styles.infoHeaderText, { color: colors.primary }]}>Ghi chú</Text>
              </View>
              <Text style={[styles.messageText, { color: colors.text }]}>
                {post.message}
              </Text>
            </View>
          )}
        </View>
        
        {/* Participants section */}
        <View style={[styles.participantsSection, { borderTopColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Người tham gia ({participants.filter(p => p.status === 'ACCEPTED').length})
            </Text>
            {isCreator && (
              <TouchableOpacity 
                onPress={() => navigation.navigate('ParticipantManagement', { postId })}
              >
                <Text style={{ color: colors.primary }}>Quản lý</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {participantsLoading ? (
            <ActivityIndicator size="small" color={colors.primary} style={styles.participantsLoading} />
          ) : participants.filter(p => p.status === 'ACCEPTED').length > 0 ? (
            <FlatList
              data={participants.filter(p => p.status === 'ACCEPTED')}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => <ParticipantItem participant={item} />}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.participantsList}
            />
          ) : (
            <Text style={[styles.emptyText, { color: colors.textLight }]}>
              Chưa có người tham gia
            </Text>
          )}
        </View>
      </ScrollView>
      
      {/* Action buttons */}
      <View style={[styles.actionBar, { backgroundColor: colors.cardBackground, borderTopColor: colors.border }]}>
        {canJoin && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: getJoinButtonColor() }]}
            onPress={handleJoinPress}
          >
            <Text style={styles.actionButtonText}>Tham gia</Text>
          </TouchableOpacity>
        )}
        
        {canLeave && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error }]}
            onPress={handleLeavePress}
          >
            <Text style={styles.actionButtonText}>Hủy tham gia</Text>
          </TouchableOpacity>
        )}
        
        {!canJoin && !canLeave && (
          <View
            style={[styles.actionButton, { backgroundColor: getJoinButtonColor() }]}
          >
            <Text style={styles.actionButtonText}>{getJoinButtonText()}</Text>
          </View>
        )}
      </View>
      
      {/* Join request modal */}
      <JoinRequestModal
        visible={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSubmit={handleJoinSubmit}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sportText: {
    marginLeft: 6,
    fontWeight: '500',
    fontSize: 14,
  },
  content: {
    padding: 16,
  },
  infoSection: {
    marginBottom: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoHeaderText: {
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 4,
  },
  infoSubText: {
    fontSize: 14,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  badgeText: {
    fontSize: 12,
    marginLeft: 4,
  },
  participantsSection: {
    padding: 16,
    borderTopWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  participantsLoading: {
    marginVertical: 20,
  },
  participantsList: {
    marginTop: 8,
  },
  emptyText: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 20,
  },
  actionBar: {
    padding: 16,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    minWidth: 150,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
});

export default SportsPostDetailScreen; 