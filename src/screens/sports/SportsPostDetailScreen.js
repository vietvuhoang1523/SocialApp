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
import SportsPostParticipantService from '../../services/SportsPostParticipantService';
import JoinRequestModal from '../../components/sports/JoinRequestModal';
import { SportTypeIcons } from '../../constants/SportConstants';
import { createAvatarUrl, getAvatarFromUser } from '../../utils/ImageUtils';
import sportsService from '../../services/sportsService';

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
      const postData = await sportsService.getSportsPostById(postId);
      console.log('📊 Post data received:', {
        hasCreator: !!postData.creator,
        hasUser: !!postData.user,
        creatorName: postData.creator?.fullName,
        creatorProfilePicture: postData.creator?.profilePictureUrl,
        userName: postData.user?.fullName,
        userAvatar: postData.user?.avatar,
        title: postData.title,
        description: postData.description,
        eventTime: postData.eventTime,
        location: postData.location,
        maxParticipants: postData.maxParticipants,
        currentParticipants: postData.currentParticipants,
        skillLevel: postData.skillLevel,
        sportType: postData.sportType
      });
      setPost(postData);
      
      // Check user participation status
      const status = await SportsPostParticipantService.getUserParticipationStatus(postId);
      setParticipationStatus(status);
      
      // Load participants
      console.log(`📋 About to fetch participants for post ${postId}`);
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
      console.log(`🚀 STARTING fetchParticipants for postId: ${postId}`);
      setParticipantsLoading(true);
      const response = await sportsService.getParticipants(postId);
      
      let participantsList = [];
      
      // Handle different response formats
      if (Array.isArray(response)) {
        participantsList = response;
      } else if (response && response.content && Array.isArray(response.content)) {
        participantsList = response.content;
      } else if (response && Array.isArray(response.data)) {
        participantsList = response.data;
      }
      
      console.log('👥 Participants data received:', {
        responseType: typeof response,
        isArray: Array.isArray(response),
        hasContent: !!(response && response.content),
        count: participantsList.length,
        rawResponse: response,
        sampleParticipant: participantsList[0] ? {
          id: participantsList[0].id,
          userId: participantsList[0].userId,
          status: participantsList[0].status,
          participantStatus: participantsList[0].participantStatus,
          requestStatus: participantsList[0].requestStatus,
          hasUser: !!participantsList[0].user,
          hasFullName: !!participantsList[0].fullName,
          userName: participantsList[0].user?.fullName,
          userProfilePicture: participantsList[0].user?.profilePictureUrl,
          directFullName: participantsList[0].fullName,
          directProfilePicture: participantsList[0].profilePictureUrl,
          allFields: Object.keys(participantsList[0]),
          rawParticipant: participantsList[0]
        } : null,
        allParticipantsData: participantsList
      });
      
      // Debug individual participant data with detailed user info
      participantsList.forEach((participant, index) => {
        console.log(`🔍 Participant ${index + 1} DETAILED:`, {
          id: participant.id,
          userId: participant.userId,
          status: participant.status,
          isCreator: participant.isCreator,
          joinedAt: participant.joinedAt,
          
          // User object details
          hasUser: !!participant.user,
          userDetails: participant.user ? {
            id: participant.user.id,
            fullName: participant.user.fullName,
            name: participant.user.name,
            email: participant.user.email,
            profilePictureUrl: participant.user.profilePictureUrl,
            avatarUrl: participant.user.avatarUrl,
            avatar: participant.user.avatar,
            allUserFields: Object.keys(participant.user)
          } : null,
          
          // Direct fields
          directFullName: participant.fullName,
          directName: participant.name,
          directProfilePictureUrl: participant.profilePictureUrl,
          
          // All participant fields
          allParticipantFields: Object.keys(participant)
        });
        
        // Separate log just for user object
        if (participant.user) {
          console.log(`👤 User object for participant ${index + 1}:`, participant.user);
        }
      });
      
      setParticipants(participantsList);
    } catch (error) {
      console.error('Error fetching participants:', error);
      // Set empty array on error to prevent crashes
      setParticipants([]);
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
      const response = await SportsPostParticipantService.joinSportsPost(postId, message);
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
              await sportsService.leaveSportsPost(postId);
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
    
    // Run debug test
    if (postId) {
      console.log(`🧪 Running debug test for postId: ${postId}`);
      // testParticipantsAPI(); // Uncomment to run debug test
    }
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
  
  // Format dates - handle different field names from backend
  const eventTime = post.eventTime || post.availableFrom || post.startTime;
  const endTime = post.availableUntil || post.endTime || (eventTime ? new Date(new Date(eventTime).getTime() + (post.durationHours || 2) * 60 * 60 * 1000) : new Date());
  
  const startTime = eventTime ? new Date(eventTime) : new Date();
  const formattedDate = format(startTime, 'EEEE, dd/MM/yyyy', { locale: vi });
  const formattedTime = post.durationHours 
    ? `${format(startTime, 'HH:mm')} - ${format(new Date(endTime), 'HH:mm')}` 
    : format(startTime, 'HH:mm');
  
  // Get sport icon
  const sportIcon = SportTypeIcons[post.sportType] || 'football';
  
  // Check if post is created by current user
  const isCreator = post.isCreator || false;
  
  // Check if post is ended
  const isEnded = new Date() > new Date(endTime);
  
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

  // Get accepted participants with better filtering logic
  const getAcceptedParticipants = () => {
    console.log('🔍 getAcceptedParticipants - Raw participants data:', participants);
    
    if (!participants || participants.length === 0) {
      console.log('❌ No participants data available');
      return [];
    }
    
    // Log sample participant structure for debugging
    console.log('📋 Sample participant structure:', {
      sampleParticipant: participants[0],
      hasStatus: participants[0]?.status !== undefined,
      statusValue: participants[0]?.status,
      hasParticipantStatus: participants[0]?.participantStatus !== undefined,
      participantStatusValue: participants[0]?.participantStatus,
      hasUser: !!participants[0]?.user,
      hasFullName: !!participants[0]?.fullName,
      participantCount: participants.length
    });
    
    // Filter accepted participants based on different possible status fields
    const acceptedParticipants = participants.filter(participant => {
      // Check various status field names and values
      const status = participant.status || participant.participantStatus || participant.requestStatus;
      
      // Accept if:
      // 1. Status is explicitly 'ACCEPTED'
      // 2. Status is missing (assume accepted for backwards compatibility)
      // 3. Status is 'APPROVED' (alternative naming)
      const isAccepted = !status || 
                        status === 'ACCEPTED' || 
                        status === 'APPROVED' ||
                        status === 'CONFIRMED';
      
      console.log(`👤 Participant ${participant.id || 'unknown'}: status=${status}, isAccepted=${isAccepted}`);
      
      return isAccepted;
    });
    
    console.log(`✅ Filtered ${acceptedParticipants.length} accepted participants from ${participants.length} total`);
    
    return acceptedParticipants;
  };
  
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
              source={{ 
                uri: getAvatarFromUser(post.creator || post.user) || 
                     'https://randomuser.me/api/portraits/men/1.jpg' 
              }}
              style={styles.avatar}
            />
            <View>
              <Text style={[styles.userName, { color: colors.text }]}>
                {(post.creator?.fullName || post.user?.fullName) || 'Người dùng'}
              </Text>
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
              {post.location || post.customLocationName || (post.preferredLocation ? post.preferredLocation.locationName : 'Chưa xác định')}
            </Text>
            {post.locationNotes && (
              <Text style={[styles.infoSubText, { color: colors.textLight }]}>
                {post.locationNotes}
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
              Tối đa: {post.maxParticipants || 'Không giới hạn'} người
            </Text>
            <Text style={[styles.infoSubText, { color: colors.textLight }]}>
              Đã tham gia: {post.currentParticipants || getAcceptedParticipants().length} người
            </Text>
            {post.availableSlots !== undefined && (
              <Text style={[styles.infoSubText, { color: colors.textLight }]}>
                Còn lại: {post.availableSlots} chỗ
              </Text>
            )}
          </View>
          
          {/* Skill level */}
          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <MaterialCommunityIcons name="trophy-outline" size={20} color={colors.primary} />
              <Text style={[styles.infoHeaderText, { color: colors.primary }]}>Trình độ</Text>
            </View>
            <Text style={[styles.infoText, { color: colors.text }]}>
              {post.skillLevel || post.skillLevelName || 'Mọi trình độ'}
            </Text>
            {post.requirements && (
              <Text style={[styles.infoSubText, { color: colors.textLight }]}>
                Yêu cầu: {post.requirements}
              </Text>
            )}
          </View>
          
          {/* Description */}
          {post.description && (
            <View style={styles.infoSection}>
              <View style={styles.infoHeader}>
                <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
                <Text style={[styles.infoHeaderText, { color: colors.primary }]}>Mô tả</Text>
              </View>
              <Text style={[styles.messageText, { color: colors.text }]}>
                {post.description}
              </Text>
            </View>
          )}
        </View>
        
        {/* Participants section */}
        <View style={[styles.participantsSection, { borderTopColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Người tham gia ({getAcceptedParticipants().length})
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
          ) : getAcceptedParticipants().length > 0 ? (
            <View>
              <FlatList
                data={getAcceptedParticipants()}
                keyExtractor={(item) => (item.id || item.userId || Math.random()).toString()}
                renderItem={({ item }) => {
                  // Detailed logging for debugging
                  console.log(`🎭 Rendering participant ${item.id}:`, {
                    rawItem: JSON.stringify(item, null, 2),
                    hasUser: !!item.user,
                    userObject: item.user ? JSON.stringify(item.user, null, 2) : 'No user object',
                    userKeys: item.user ? Object.keys(item.user) : [],
                    directName: item.fullName || item.name,
                    userFullName: item.user?.fullName,
                    userFirstName: item.user?.firstName,
                    userUsername: item.user?.username,
                    userName: item.user?.name,
                    userEmail: item.user?.email,
                    avatarAttempt: getAvatarFromUser(item.user || item)
                  });
                  
                  // Extract name with detailed logging
                  const extractedName = item.user?.fullName || 
                                      item.user?.firstName || 
                                      item.user?.username || 
                                      item.user?.name || 
                                      item.fullName || 
                                      item.name || 
                                      item.userName ||
                                      item.user?.email?.split('@')[0] ||
                                      `Participant ${item.id}`;
                  
                  console.log(`👤 Extracted name for participant ${item.id}: "${extractedName}"`);
                  
                  return (
                    <View 
                      style={styles.participantItem}
                    >
                      <TouchableOpacity 
                        onPress={() => navigation.navigate('UserProfileScreen', { userId: item.user?.id || item.userId || item.id })}
                      >
                        <Image 
                          source={{ 
                            uri: getAvatarFromUser(item.user || item) || 
                                 `https://ui-avatars.com/api/?name=${encodeURIComponent(extractedName)}&background=E91E63&color=fff&size=100` 
                          }} 
                          style={styles.participantAvatar} 
                          onError={(error) => {
                            console.log(`❌ Failed to load avatar for participant ${item.id}:`, {
                              error: error.nativeEvent.error,
                              attemptedUri: getAvatarFromUser(item.user || item),
                              fallbackUri: `https://ui-avatars.com/api/?name=${encodeURIComponent(extractedName)}&background=E91E63&color=fff&size=100`,
                              participant: item,
                              user: item.user
                            });
                          }}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => navigation.navigate('UserProfileScreen', { userId: item.user?.id || item.userId || item.id })}
                      >
                        <Text style={[styles.participantName, { color: colors.text }]} numberOfLines={1}>
                          {extractedName}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                }}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.participantsList}
              />
              
             
            </View>
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
  participantItem: {
    alignItems: 'center',
    marginRight: 16,
    maxWidth: 80,
  },
  participantAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
  participantName: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
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