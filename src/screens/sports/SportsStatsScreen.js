import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hook/ThemeContext';
import { BarChart, PieChart, LineChart } from 'react-native-chart-kit';
import sportsService from '../../services/sportsService';
import SportsPostParticipantService from '../../services/SportsPostParticipantService';

const screenWidth = Dimensions.get('window').width;

const SportsStatsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [stats, setStats] = useState({
    personal: {},
    platform: {},
    charts: {}
  });

  const periods = [
    { key: 'week', label: 'Tuần' },
    { key: 'month', label: 'Tháng' },
    { key: 'year', label: 'Năm' },
    { key: 'all', label: 'Tất cả' }
  ];

  useEffect(() => {
    loadStats();
  }, [selectedPeriod]);

  const loadStats = async () => {
    try {
      setLoading(true);
      console.log(`📊 Loading stats for period: ${selectedPeriod}`);
      
      const [personalStats, platformStats, chartData] = await Promise.all([
        loadPersonalStats(),
        loadPlatformStats(),
        loadChartData()
      ]);

      setStats({
        personal: personalStats,
        platform: platformStats,
        charts: chartData
      });

      console.log('✅ Stats loaded successfully');
      
    } catch (error) {
      console.error('❌ Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPersonalStats = async () => {
    try {
      const [
        myCreatedCount,
        myParticipationCount,
        myJoinedPosts,
        myCreatedPosts
      ] = await Promise.all([
        SportsPostParticipantService.getMyCreatedCount(),
        SportsPostParticipantService.getMyParticipationCount(),
        SportsPostParticipantService.getMyJoinedPosts(),
        SportsPostParticipantService.getMyCreatedPosts()
      ]);

      return {
        postsCreated: myCreatedCount || 0,
        postsJoined: myParticipationCount || 0,
        totalActivities: (myCreatedCount || 0) + (myParticipationCount || 0),
        recentJoined: myJoinedPosts?.content?.length || 0,
        recentCreated: myCreatedPosts?.content?.length || 0,
        completionRate: 85, // This would need backend calculation
        averageRating: 4.2, // This would need backend calculation
        favoriteSpot: 'Bóng đá' // This would need backend calculation
      };
    } catch (error) {
      console.error('Error loading personal stats:', error);
      return {};
    }
  };

  const loadPlatformStats = async () => {
    try {
      const generalStats = await sportsService.getStatistics();
      
      // Get sport type counts
      const sportCounts = {};
      const sportTypes = ['FOOTBALL', 'BASKETBALL', 'TENNIS', 'VOLLEYBALL', 'BADMINTON'];
      
      for (const sport of sportTypes) {
        try {
          const count = await sportsService.getCountBySport(sport);
          sportCounts[sport] = count || 0;
        } catch (error) {
          sportCounts[sport] = 0;
        }
      }

      return {
        totalPosts: generalStats?.totalPosts || 0,
        totalUsers: generalStats?.totalUsers || 0,
        totalParticipants: generalStats?.totalParticipants || 0,
        activePosts: generalStats?.activePosts || 0,
        completedPosts: generalStats?.completedPosts || 0,
        sportCounts,
        growthRate: 15.2, // This would need backend calculation
        mostPopularSport: 'FOOTBALL', // This would need backend calculation
        peakHours: '18:00-20:00' // This would need backend calculation
      };
    } catch (error) {
      console.error('Error loading platform stats:', error);
      return {};
    }
  };

  const loadChartData = async () => {
    try {
      // Mock data - would come from backend analytics endpoints
      return {
        activityTrend: {
          labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
          datasets: [{
            data: [12, 19, 8, 15, 25, 35, 28]
          }]
        },
        sportDistribution: [
          { name: 'Bóng đá', population: 35, color: '#FF6384', legendFontColor: colors.text },
          { name: 'Cầu lông', population: 25, color: '#36A2EB', legendFontColor: colors.text },
          { name: 'Bóng rổ', population: 20, color: '#FFCE56', legendFontColor: colors.text },
          { name: 'Tennis', population: 15, color: '#4BC0C0', legendFontColor: colors.text },
          { name: 'Khác', population: 5, color: '#9966FF', legendFontColor: colors.text }
        ],
        participationTrend: {
          labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'],
          datasets: [{
            data: [5, 8, 12, 15, 20, 18],
            color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
            strokeWidth: 2
          }]
        }
      };
    } catch (error) {
      console.error('Error loading chart data:', error);
      return {};
    }
  };

  const renderStatCard = (title, value, subtitle, icon, color = colors.primary) => (
    <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.statHeader}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
        <Text style={[styles.statTitle, { color: colors.text }]}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color: color }]}>{value}</Text>
      <Text style={[styles.statSubtitle, { color: colors.textLight }]}>{subtitle}</Text>
    </View>
  );

  const renderChart = (title, component) => (
    <View style={[styles.chartContainer, { backgroundColor: colors.cardBackground }]}>
      <Text style={[styles.chartTitle, { color: colors.text }]}>{title}</Text>
      {component}
    </View>
  );

  const chartConfig = {
    backgroundColor: colors.cardBackground,
    backgroundGradientFrom: colors.cardBackground,
    backgroundGradientTo: colors.cardBackground,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
    labelColor: (opacity = 1) => colors.text,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: colors.primary
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Thống kê</Text>
        <TouchableOpacity onPress={loadStats}>
          <Ionicons name="refresh" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.periodContainer}
        contentContainerStyle={styles.periodContent}
      >
        {periods.map((period) => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              {
                backgroundColor: selectedPeriod === period.key ? colors.primary : colors.cardBackground,
                borderColor: colors.primary
              }
            ]}
            onPress={() => setSelectedPeriod(period.key)}
          >
            <Text style={[
              styles.periodButtonText,
              { color: selectedPeriod === period.key ? 'white' : colors.text }
            ]}>
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textLight }]}>
            Đang tải thống kê...
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Personal Stats Section */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📊 Thống kê cá nhân</Text>
          <View style={styles.statsGrid}>
            {renderStatCard(
              'Đã tạo',
              stats.personal.postsCreated || 0,
              'bài đăng',
              'plus-circle',
              '#4CAF50'
            )}
            {renderStatCard(
              'Đã tham gia',
              stats.personal.postsJoined || 0,
              'hoạt động',
              'account-group',
              '#2196F3'
            )}
            {renderStatCard(
              'Tỷ lệ hoàn thành',
              `${stats.personal.completionRate || 0}%`,
              'hoạt động',
              'check-circle',
              '#FF9800'
            )}
            {renderStatCard(
              'Đánh giá TB',
              `${stats.personal.averageRating || 0}/5`,
              'sao',
              'star',
              '#FFD700'
            )}
          </View>

          {/* Activity Trend Chart */}
          {stats.charts.activityTrend && renderChart(
            '📈 xu hướng hoạt động trong tuần',
            <BarChart
              data={stats.charts.activityTrend}
              width={screenWidth - 48}
              height={200}
              chartConfig={chartConfig}
              verticalLabelRotation={0}
              style={styles.chart}
            />
          )}

          {/* Sport Distribution Chart */}
          {stats.charts.sportDistribution && renderChart(
            '🏃 Phân bố theo thể thao',
            <PieChart
              data={stats.charts.sportDistribution}
              width={screenWidth - 48}
              height={200}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
          )}

          {/* Participation Trend Chart */}
          {stats.charts.participationTrend && renderChart(
            '📊 Xu hướng tham gia theo tháng',
            <LineChart
              data={stats.charts.participationTrend}
              width={screenWidth - 48}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          )}

          {/* Platform Stats Section */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🌐 Thống kê nền tảng</Text>
          <View style={styles.statsGrid}>
            {renderStatCard(
              'Tổng bài đăng',
              stats.platform.totalPosts || 0,
              'trên hệ thống',
              'post',
              '#9C27B0'
            )}
            {renderStatCard(
              'Người dùng',
              stats.platform.totalUsers || 0,
              'đang hoạt động',
              'account',
              '#00BCD4'
            )}
            {renderStatCard(
              'Tăng trưởng',
              `+${stats.platform.growthRate || 0}%`,
              'tháng này',
              'trending-up',
              '#4CAF50'
            )}
            {renderStatCard(
              'Giờ cao điểm',
              stats.platform.peakHours || 'N/A',
              'hoạt động nhất',
              'clock',
              '#FF5722'
            )}
          </View>

          {/* Insights Section */}
          <View style={[styles.insightsContainer, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.insightsTitle, { color: colors.text }]}>💡 Thông tin hữu ích</Text>
            <View style={styles.insightItem}>
              <MaterialCommunityIcons name="trophy" size={20} color="#FFD700" />
              <Text style={[styles.insightText, { color: colors.text }]}>
                Thể thao yêu thích của bạn: {stats.personal.favoriteSpot || 'Bóng đá'}
              </Text>
            </View>
            <View style={styles.insightItem}>
              <MaterialCommunityIcons name="fire" size={20} color="#FF5722" />
              <Text style={[styles.insightText, { color: colors.text }]}>
                Thể thao phổ biến nhất: {stats.platform.mostPopularSport || 'Bóng đá'}
              </Text>
            </View>
            <View style={styles.insightItem}>
              <MaterialCommunityIcons name="chart-line" size={20} color="#4CAF50" />
              <Text style={[styles.insightText, { color: colors.text }]}>
                Bạn tích cực hơn {75}% người dùng khác
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
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
  periodContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  periodContent: {
    paddingRight: 16,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
  },
  chartContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  insightsContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  insightText: {
    fontSize: 14,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
});

export default SportsStatsScreen; 