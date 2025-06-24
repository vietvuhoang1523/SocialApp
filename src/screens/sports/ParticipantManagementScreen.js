import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { useTheme } from '../../hook/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import SportsPostService from '../../services/SportsPostService';
import SportsPostParticipantService from '../../services/SportsPostParticipantService';
import ParticipantItem from '../../components/sports/ParticipantItem';
import ResponseModal from '../../components/sports/ResponseModal';

const ParticipantManagementScreen = ({ route, navigation }) => {
  const { postId } = route.params;
  const { colors } = useTheme();
  
  const [activeTab, setActiveTab] = useState('pending');
  const [participants, setParticipants] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [responseModalVisible, setResponseModalVisible] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [responseType, setResponseType] = useState(null); // 'approve' or 'reject'
  
  // Fetch participants data
  const fetchParticipants = useCallback(async () => {
    try {
      setLoading(true);
      const response = await SportsPostParticipantService.getParticipants(postId);
      setParticipants(response.content || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách người tham gia');
    } finally {
      setLoading(false);
    }
  }, [postId]);
  
  // Fetch pending requests
  const fetchPendingRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await SportsPostParticipantService.getPendingRequests(postId);
      setPendingRequests(response.content || []);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách yêu cầu chờ duyệt');
    } finally {
      setLoading(false);
    }
  }, [postId]);
  
  // Load data based on active tab
  const loadData = useCallback(() => {
    if (activeTab === 'participants') {
      fetchParticipants();
    } else {
      fetchPendingRequests();
    }
  }, [activeTab, fetchParticipants, fetchPendingRequests]);
  
  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);
  
  // Handle approve request
  const handleApprove = (participantId) => {
    const participant = pendingRequests.find(p => p.id === participantId);
    if (participant) {
      setSelectedParticipant(participant);
      setResponseType('approve');
      setResponseModalVisible(true);
    }
  };
  
  // Handle reject request
  const handleReject = (participantId) => {
    const participant = pendingRequests.find(p => p.id === participantId);
    if (participant) {
      setSelectedParticipant(participant);
      setResponseType('reject');
      setResponseModalVisible(true);
    }
  };
  
  // Submit response
  const handleResponseSubmit = async (message) => {
    if (!selectedParticipant) return;
    
    try {
      setResponseModalVisible(false);
      setLoading(true);
      
      const approve = responseType === 'approve';
      await SportsPostParticipantService.respondToJoinRequest(
        postId,
        selectedParticipant.id,
        approve,
        message
      );
      
      // Refresh data
      fetchPendingRequests();
      if (approve) {
        fetchParticipants();
      }
      
      Alert.alert(
        'Thành công',
        `Đã ${approve ? 'chấp nhận' : 'từ chối'} yêu cầu tham gia`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Lỗi',
        `Không thể ${responseType === 'approve' ? 'chấp nhận' : 'từ chối'} yêu cầu. Vui lòng thử lại sau.`,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setSelectedParticipant(null);
      setResponseType(null);
    }
  };
  
  // Initial data loading
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Render empty state
  const renderEmptyState = () => {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons 
          name={activeTab === 'participants' ? 'people' : 'time'} 
          size={48} 
          color={colors.textLight} 
        />
        <Text style={[styles.emptyText, { color: colors.textLight }]}>
          {activeTab === 'participants' 
            ? 'Chưa có người tham gia' 
            : 'Không có yêu cầu chờ duyệt'}
        </Text>
      </View>
    );
  };
  
  // Render tab button
  const renderTabButton = (title, tabName, icon) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tabName && { 
          backgroundColor: colors.primary + '20',
          borderBottomColor: colors.primary,
          borderBottomWidth: 2
        }
      ]}
      onPress={() => setActiveTab(tabName)}
    >
      <Ionicons 
        name={icon} 
        size={20} 
        color={activeTab === tabName ? colors.primary : colors.textLight} 
      />
      <Text
        style={[
          styles.tabButtonText,
          { color: activeTab === tabName ? colors.primary : colors.textLight }
        ]}
      >
        {title}
      </Text>
      {tabName === 'pending' && pendingRequests.length > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.error }]}>
          <Text style={styles.badgeText}>{pendingRequests.length}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {renderTabButton('Chờ duyệt', 'pending', 'time-outline')}
        {renderTabButton('Đã tham gia', 'participants', 'people-outline')}
      </View>
      
      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={activeTab === 'participants' ? participants : pendingRequests}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ParticipantItem
              participant={item}
              showStatus={activeTab === 'participants'}
              onApprove={activeTab === 'pending' ? handleApprove : null}
              onReject={activeTab === 'pending' ? handleReject : null}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
      
      {/* Response modal */}
      <ResponseModal
        visible={responseModalVisible}
        onClose={() => setResponseModalVisible(false)}
        onSubmit={handleResponseSubmit}
        type={responseType}
        participant={selectedParticipant}
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
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabButtonText: {
    fontWeight: '500',
    marginLeft: 8,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 24,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 12,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ParticipantManagementScreen; 