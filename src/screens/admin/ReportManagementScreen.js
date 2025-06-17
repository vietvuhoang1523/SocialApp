import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hook/ThemeContext';
import { 
  getAllReports, 
  getPendingReports, 
  resolveReport, 
  rejectReport 
} from '../../services/reportService';
import { useFocusEffect } from '@react-navigation/native';

const ReportManagementScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('PENDING'); // 'ALL', 'PENDING', 'RESOLVED', 'REJECTED'
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Load reports based on current filter
  const loadReports = async (pageToLoad = 0, shouldRefresh = false) => {
    try {
      if (shouldRefresh) {
        setLoading(true);
      }

      let response;
      if (filter === 'PENDING') {
        response = await getPendingReports(pageToLoad, 10);
      } else {
        response = await getAllReports(pageToLoad, 10, filter === 'ALL' ? null : filter);
      }

      if (response.content.length === 0) {
        setHasMore(false);
      }

      if (shouldRefresh || pageToLoad === 0) {
        setReports(response.content);
      } else {
        setReports(prev => [...prev, ...response.content]);
      }
      
      setPage(pageToLoad);
    } catch (error) {
      console.error('Error loading reports:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách báo cáo');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadReports(0, true);
      return () => {};
    }, [filter])
  );

  // Handle pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    setHasMore(true);
    loadReports(0, true);
  };

  // Load more reports when reaching end of list
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadReports(page + 1);
    }
  };

  // Handle report resolution
  const handleResolve = (reportId) => {
    Alert.prompt(
      'Xử lý báo cáo',
      'Nhập hành động xử lý:',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async (action) => {
            if (!action) {
              Alert.alert('Lỗi', 'Vui lòng nhập hành động xử lý');
              return;
            }
            
            Alert.prompt(
              'Ghi chú',
              'Nhập ghi chú (không bắt buộc):',
              [
                { text: 'Bỏ qua', onPress: async () => await processResolve(reportId, action, '') },
                { 
                  text: 'Xác nhận', 
                  onPress: async (note) => await processResolve(reportId, action, note || '') 
                }
              ]
            );
          }
        }
      ]
    );
  };

  // Process report resolution
  const processResolve = async (reportId, action, note) => {
    try {
      setLoading(true);
      await resolveReport(reportId, action, note);
      Alert.alert('Thành công', 'Đã xử lý báo cáo');
      loadReports(0, true);
    } catch (error) {
      console.error('Error resolving report:', error);
      Alert.alert('Lỗi', error.message || 'Không thể xử lý báo cáo');
    } finally {
      setLoading(false);
    }
  };

  // Handle report rejection
  const handleReject = (reportId) => {
    Alert.prompt(
      'Từ chối báo cáo',
      'Nhập lý do từ chối (không bắt buộc):',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async (note) => {
            try {
              setLoading(true);
              await rejectReport(reportId, note || '');
              Alert.alert('Thành công', 'Đã từ chối báo cáo');
              loadReports(0, true);
            } catch (error) {
              console.error('Error rejecting report:', error);
              Alert.alert('Lỗi', error.message || 'Không thể từ chối báo cáo');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // View report details
  const viewReportDetails = (reportId) => {
    navigation.navigate('ReportDetail', { reportId });
  };

  // Render filter tabs
  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {['PENDING', 'ALL', 'RESOLVED', 'REJECTED'].map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.filterTab,
              filter === item && { backgroundColor: colors.primary },
            ]}
            onPress={() => {
              setFilter(item);
              setHasMore(true);
            }}
          >
            <Text
              style={[
                styles.filterText,
                filter === item ? { color: 'white' } : { color: colors.text },
              ]}
            >
              {getFilterLabel(item)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Render report item
  const renderReportItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.reportItem, { backgroundColor: colors.cardBackground }]}
      onPress={() => viewReportDetails(item.id)}
    >
      <View style={styles.reportHeader}>
        <View style={styles.reportTypeContainer}>
          <Text style={[styles.reportType, { backgroundColor: getReportTypeColor(item.reportType) }]}>
            {getReportTypeLabel(item.reportType)}
          </Text>
          <Text style={[styles.reportStatus, { backgroundColor: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
        <Text style={[styles.reportDate, { color: colors.textLight }]}>
          {new Date(item.createdAt).toLocaleDateString('vi-VN')}
        </Text>
      </View>
      
      <Text style={[styles.reportReason, { color: colors.text }]}>
        {getReasonLabel(item.reason)}
      </Text>
      
      {item.description && (
        <Text 
          style={[styles.reportDescription, { color: colors.textLight }]}
          numberOfLines={2}
        >
          {item.description}
        </Text>
      )}
      
      {item.status === 'PENDING' && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.success + '20' }]}
            onPress={() => handleResolve(item.id)}
          >
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.actionText, { color: colors.success }]}>Xử lý</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error + '20' }]}
            onPress={() => handleReject(item.id)}
          >
            <Ionicons name="close-circle" size={20} color={colors.error} />
            <Text style={[styles.actionText, { color: colors.error }]}>Từ chối</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="report-off" size={64} color={colors.textLight} />
      <Text style={[styles.emptyText, { color: colors.textLight }]}>
        Không có báo cáo nào
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Quản lý báo cáo
        </Text>
        <TouchableOpacity
          style={styles.statsButton}
          onPress={() => navigation.navigate('ReportStats')}
        >
          <Ionicons name="stats-chart" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Filter tabs */}
      {renderFilterTabs()}
      
      {/* Report list */}
      <FlatList
        data={reports}
        renderItem={renderReportItem}
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
    </View>
  );
};

// Helper functions
const getFilterLabel = (filter) => {
  switch (filter) {
    case 'ALL':
      return 'Tất cả';
    case 'PENDING':
      return 'Chờ xử lý';
    case 'RESOLVED':
      return 'Đã xử lý';
    case 'REJECTED':
      return 'Đã từ chối';
    default:
      return filter;
  }
};

const getReportTypeLabel = (type) => {
  switch (type) {
    case 'USER':
      return 'Người dùng';
    case 'POST':
      return 'Bài viết';
    case 'COMMENT':
      return 'Bình luận';
    case 'SPORTS_POST':
      return 'Bài đăng thể thao';
    case 'SPORTS_VENUE':
      return 'Địa điểm thể thao';
    case 'WORKOUT':
      return 'Buổi tập';
    case 'MESSAGE':
      return 'Tin nhắn';
    default:
      return type;
  }
};

const getReportTypeColor = (type) => {
  switch (type) {
    case 'USER':
      return '#3498db';
    case 'POST':
      return '#9b59b6';
    case 'COMMENT':
      return '#2ecc71';
    case 'SPORTS_POST':
      return '#e74c3c';
    case 'SPORTS_VENUE':
      return '#f39c12';
    case 'WORKOUT':
      return '#1abc9c';
    case 'MESSAGE':
      return '#34495e';
    default:
      return '#95a5a6';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'PENDING':
      return 'Chờ xử lý';
    case 'RESOLVED':
      return 'Đã xử lý';
    case 'REJECTED':
      return 'Đã từ chối';
    default:
      return status;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'PENDING':
      return '#f39c12';
    case 'RESOLVED':
      return '#2ecc71';
    case 'REJECTED':
      return '#e74c3c';
    default:
      return '#95a5a6';
  }
};

const getReasonLabel = (reason) => {
  switch (reason) {
    case 'INAPPROPRIATE_CONTENT':
      return 'Nội dung không phù hợp';
    case 'HARASSMENT':
      return 'Quấy rối/Bắt nạt';
    case 'SPAM':
      return 'Spam';
    case 'FALSE_INFORMATION':
      return 'Thông tin sai sự thật';
    case 'VIOLENCE':
      return 'Bạo lực';
    case 'HATE_SPEECH':
      return 'Phát ngôn thù ghét';
    case 'INTELLECTUAL_PROPERTY':
      return 'Vi phạm bản quyền';
    case 'SCAM':
      return 'Lừa đảo';
    case 'OTHER':
      return 'Khác';
    default:
      return reason;
  }
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
  statsButton: {
    padding: 8,
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  reportItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportTypeContainer: {
    flexDirection: 'row',
  },
  reportType: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  reportStatus: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  reportDate: {
    fontSize: 12,
  },
  reportReason: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  reportDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  actionText: {
    marginLeft: 8,
    fontWeight: '500',
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
    fontSize: 16,
    marginTop: 16,
  },
});

export default ReportManagementScreen; 