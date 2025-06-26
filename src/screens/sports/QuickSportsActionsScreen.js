import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hook/ThemeContext';
import sportsService from '../../services/sportsService';
import SportsPostParticipantService from '../../services/SportsPostParticipantService';

const QuickSportsActionsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  
  const [quickStats, setQuickStats] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadQuickStats();
  }, []);

  const loadQuickStats = async () => {
    try {
      const [createdCount, participationCount, pendingRequests] = await Promise.all([
        SportsPostParticipantService.getMyCreatedCount(),
        SportsPostParticipantService.getMyParticipationCount(),
        SportsPostParticipantService.getMyPendingRequests()
      ]);

      setQuickStats({
        createdCount: createdCount || 0,
        participationCount: participationCount || 0,
        pendingCount: pendingRequests?.content?.length || 0
      });
    } catch (error) {
      console.error('Error loading quick stats:', error);
    }
  };

  const quickActions = [
    {
      id: 'create_post',
      title: 'Tạo hoạt động mới',
      subtitle: 'Tạo bài đăng thể thao',
      icon: 'plus-circle',
      color: '#4CAF50',
      action: () => navigation.navigate('CreateSportsPostScreen')
    },
    {
      id: 'find_nearby',
      title: 'Tìm gần đây',
      subtitle: 'Hoạt động xung quanh',
      icon: 'map-marker',
      color: '#2196F3',
      action: () => handleFindNearby()
    },
    {
      id: 'join_popular',
      title: 'Tham gia phổ biến',
      subtitle: 'Hoạt động hot nhất',
      icon: 'fire',
      color: '#FF5722',
      action: () => handleJoinPopular()
    },
    {
      id: 'smart_recommend',
      title: 'Gợi ý thông minh',
      subtitle: 'Dành riêng cho bạn',
      icon: 'brain',
      color: '#9C27B0',
      action: () => navigation.navigate('SportsRecommendationsScreen')
    }
  ];

  const sportCategories = [
    { name: 'FOOTBALL', label: 'Bóng đá', icon: 'soccer', color: '#4CAF50' },
    { name: 'BASKETBALL', label: 'Bóng rổ', icon: 'basketball', color: '#FF9800' },
    { name: 'BADMINTON', label: 'Cầu lông', icon: 'badminton', color: '#2196F3' },
    { name: 'TENNIS', label: 'Tennis', icon: 'tennis', color: '#9C27B0' },
    { name: 'VOLLEYBALL', label: 'Bóng chuyền', icon: 'volleyball', color: '#00BCD4' },
    { name: 'RUNNING', label: 'Chạy bộ', icon: 'run', color: '#FF5722' }
  ];

  const handleFindNearby = async () => {
    setLoading(true);
    try {
      // Get location and find nearby posts
      const location = { latitude: 10.762622, longitude: 106.660172 }; // Default HCM
      navigation.navigate('SearchScreen', { 
        searchType: 'nearby',
        location: location 
      });
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tìm hoạt động gần đây');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinPopular = async () => {
    setLoading(true);
    try {
      const popular = await sportsService.getPopularSportsPosts();
      if (popular && popular.content && popular.content.length > 0) {
        navigation.navigate('SportsSearchResultsScreen', {
          results: popular.content,
          title: 'Hoạt động phổ biến'
        });
      } else {
        Alert.alert('Thông báo', 'Không có hoạt động phổ biến nào');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải hoạt động phổ biến');
    } finally {
      setLoading(false);
    }
  };

  const handleSportCategoryPress = async (sportType) => {
    setLoading(true);
    try {
      const posts = await sportsService.getSportsPostsBySportType(sportType);
      if (posts && posts.content && posts.content.length > 0) {
        navigation.navigate('SportsSearchResultsScreen', {
          results: posts.content,
          title: `Hoạt động ${sportCategories.find(s => s.name === sportType)?.label}`
        });
      } else {
        Alert.alert('Thông báo', `Không có hoạt động ${sportType} nào`);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải hoạt động');
    } finally {
      setLoading(false);
    }
  };

  const renderQuickAction = (action) => (
    <TouchableOpacity
      key={action.id}
      style={[styles.actionCard, { backgroundColor: colors.cardBackground }]}
      onPress={action.action}
      disabled={loading}
    >
      <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
        <MaterialCommunityIcons name={action.icon} size={32} color={action.color} />
      </View>
      <View style={styles.actionContent}>
        <Text style={[styles.actionTitle, { color: colors.text }]}>{action.title}</Text>
        <Text style={[styles.actionSubtitle, { color: colors.textLight }]}>{action.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
    </TouchableOpacity>
  );

  const renderSportCategory = (sport) => (
    <TouchableOpacity
      key={sport.name}
      style={[styles.sportCard, { backgroundColor: colors.cardBackground }]}
      onPress={() => handleSportCategoryPress(sport.name)}
      disabled={loading}
    >
      <View style={[styles.sportIcon, { backgroundColor: sport.color + '20' }]}>
        <MaterialCommunityIcons name={sport.icon} size={28} color={sport.color} />
      </View>
      <Text style={[styles.sportLabel, { color: colors.text }]}>{sport.label}</Text>
    </TouchableOpacity>
  );

  const renderStatCard = (title, value, icon, color) => (
    <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
      <MaterialCommunityIcons name={icon} size={24} color={color} />
      <View style={styles.statContent}>
        <Text style={[styles.statValue, { color: color }]}>{value}</Text>
        <Text style={[styles.statTitle, { color: colors.text }]}>{title}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Hành động nhanh</Text>
        <TouchableOpacity onPress={loadQuickStats}>
          <Ionicons name="refresh" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📊 Tổng quan nhanh</Text>
          <View style={styles.statsContainer}>
            {renderStatCard('Đã tạo', quickStats.createdCount, 'plus-circle', '#4CAF50')}
            {renderStatCard('Đã tham gia', quickStats.participationCount, 'account-group', '#2196F3')}
            {renderStatCard('Chờ duyệt', quickStats.pendingCount, 'clock', '#FF9800')}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>⚡ Hành động nhanh</Text>
          {quickActions.map(renderQuickAction)}
        </View>

        {/* Sport Categories */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🏃 Danh mục thể thao</Text>
          <View style={styles.sportsGrid}>
            {sportCategories.map(renderSportCategory)}
          </View>
        </View>

        {/* Quick Navigation */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🧭 Điều hướng nhanh</Text>
          
          <TouchableOpacity
            style={[styles.navCard, { backgroundColor: colors.cardBackground }]}
            onPress={() => navigation.navigate('MyCreatedPostsScreen')}
          >
            <MaterialCommunityIcons name="post" size={24} color={colors.primary} />
            <Text style={[styles.navText, { color: colors.text }]}>Bài đăng của tôi</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navCard, { backgroundColor: colors.cardBackground }]}
            onPress={() => navigation.navigate('MyJoinedPostsScreen')}
          >
            <MaterialCommunityIcons name="account-group" size={24} color={colors.primary} />
            <Text style={[styles.navText, { color: colors.text }]}>Đã tham gia</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navCard, { backgroundColor: colors.cardBackground }]}
            onPress={() => navigation.navigate('AllPendingRequests')}
          >
            <MaterialCommunityIcons name="clock-outline" size={24} color={colors.primary} />
            <Text style={[styles.navText, { color: colors.text }]}>Yêu cầu chờ duyệt</Text>
            {quickStats.pendingCount > 0 && (
              <View style={[styles.badge, { backgroundColor: '#FF5722' }]}>
                <Text style={styles.badgeText}>{quickStats.pendingCount}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navCard, { backgroundColor: colors.cardBackground }]}
            onPress={() => navigation.navigate('AdvancedSportsSearchScreen')}
          >
            <MaterialCommunityIcons name="magnify" size={24} color={colors.primary} />
            <Text style={[styles.navText, { color: colors.text }]}>Tìm kiếm nâng cao</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navCard, { backgroundColor: colors.cardBackground }]}
            onPress={() => navigation.navigate('SportsStatsScreen')}
          >
            <MaterialCommunityIcons name="chart-line" size={24} color={colors.primary} />
            <Text style={[styles.navText, { color: colors.text }]}>Thống kê chi tiết</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>
        </View>

        {/* Emergency Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🚨 Tác vụ khẩn cấp</Text>
          
          <TouchableOpacity
            style={[styles.emergencyCard, { backgroundColor: '#FFE5E5' }]}
            onPress={() => {
              Alert.alert(
                'Hủy tất cả hoạt động',
                'Bạn có chắc muốn hủy tất cả hoạt động đang chờ?',
                [
                  { text: 'Hủy', style: 'cancel' },
                  { text: 'Xác nhận', style: 'destructive', onPress: () => {} }
                ]
              );
            }}
          >
            <MaterialCommunityIcons name="cancel" size={24} color="#F44336" />
            <Text style={[styles.emergencyText, { color: '#F44336' }]}>Hủy tất cả hoạt động</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.emergencyCard, { backgroundColor: '#E8F5E8' }]}
            onPress={() => {
              Alert.alert(
                'Hoàn thành tất cả',
                'Đánh dấu tất cả hoạt động đã hoàn thành?',
                [
                  { text: 'Hủy', style: 'cancel' },
                  { text: 'Xác nhận', onPress: () => {} }
                ]
              );
            }}
          >
            <MaterialCommunityIcons name="check-all" size={24} color="#4CAF50" />
            <Text style={[styles.emergencyText, { color: '#4CAF50' }]}>Hoàn thành tất cả</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statContent: {
    marginLeft: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statTitle: {
    fontSize: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
    marginLeft: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sportCard: {
    width: '30%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  sportIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  sportLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  navText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  emergencyText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
});

export default QuickSportsActionsScreen;