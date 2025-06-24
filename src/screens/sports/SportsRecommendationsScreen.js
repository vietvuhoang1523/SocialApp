import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hook/ThemeContext';
import sportsService from '../../services/sportsService';
import SportsPostItem from '../../components/SportsPostItem';

const SportsRecommendationsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  
  const [recommendationSections, setRecommendationSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('smart');

  const recommendationTabs = [
    { key: 'smart', title: 'Thông minh', icon: 'brain' },
    { key: 'personalized', title: 'Cá nhân hóa', icon: 'person' },
    { key: 'nearby', title: 'Gần đây', icon: 'location' },
    { key: 'popular', title: 'Phổ biến', icon: 'trending-up' },
    { key: 'friends', title: 'Bạn bè', icon: 'people' }
  ];

  useEffect(() => {
    loadRecommendations();
  }, [selectedTab]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      console.log(`🤖 Loading ${selectedTab} recommendations`);
      
      let sections = [];
      
      switch (selectedTab) {
        case 'smart':
          sections = await loadSmartRecommendations();
          break;
        case 'personalized':
          sections = await loadPersonalizedRecommendations();
          break;
        case 'nearby':
          sections = await loadNearbyRecommendations();
          break;
        case 'popular':
          sections = await loadPopularRecommendations();
          break;
        case 'friends':
          sections = await loadFriendsRecommendations();
          break;
      }
      
      setRecommendationSections(sections);
      console.log(`✅ Loaded ${sections.length} recommendation sections`);
      
    } catch (error) {
      console.error('❌ Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSmartRecommendations = async () => {
    const sections = [];
    
    try {
      // Get smart recommendations
      const smartRecs = await sportsService.getSmartRecommendations();
      if (smartRecs && smartRecs.length > 0) {
        sections.push({
          title: '🧠 Gợi ý thông minh',
          description: 'Dựa trên sở thích và hoạt động của bạn',
          data: smartRecs.slice(0, 5),
          type: 'smart'
        });
      }

      // Get skill-based recommendations
      const skillBasedRecs = await sportsService.getSportsPostsBySkillLevel('INTERMEDIATE');
      if (skillBasedRecs && skillBasedRecs.content && skillBasedRecs.content.length > 0) {
        sections.push({
          title: '⚡ Phù hợp trình độ',
          description: 'Các hoạt động phù hợp với trình độ của bạn',
          data: skillBasedRecs.content.slice(0, 3),
          type: 'skill'
        });
      }

      // Get starting soon recommendations
      const startingSoon = await sportsService.getStartingSoonSportsPosts();
      if (startingSoon && startingSoon.content && startingSoon.content.length > 0) {
        sections.push({
          title: '⏰ Sắp bắt đầu',
          description: 'Các hoạt động sắp diễn ra',
          data: startingSoon.content.slice(0, 4),
          type: 'timing'
        });
      }

    } catch (error) {
      console.error('❌ Error loading smart recommendations:', error);
    }
    
    return sections;
  };

  const loadPersonalizedRecommendations = async () => {
    const sections = [];
    
    try {
      // Get personalized recommendations
      const personalizedRecs = await sportsService.getPersonalizedRecommendations();
      if (personalizedRecs && personalizedRecs.length > 0) {
        sections.push({
          title: '👤 Dành riêng cho bạn',
          description: 'Được chọn lọc dựa trên lịch sử hoạt động',
          data: personalizedRecs.slice(0, 5),
          type: 'personalized'
        });
      }

      // Get similar users' activities
      sections.push({
        title: '👥 Người dùng tương tự',
        description: 'Những gì người khác có cùng sở thích đang tham gia',
        data: [], // This would need additional backend endpoint
        type: 'similar_users'
      });

    } catch (error) {
      console.error('❌ Error loading personalized recommendations:', error);
    }
    
    return sections;
  };

  const loadNearbyRecommendations = async () => {
    const sections = [];
    
    try {
      // Get current location first
      // const location = await LocationService.getCurrentLocation();
      const location = { latitude: 10.762622, longitude: 106.660172 }; // Default HCM City
      
      // Get nearby posts within different radii
      const nearby1km = await sportsService.getNearbySportsPosts(
        location.latitude, location.longitude, 1
      );
      
      if (nearby1km && nearby1km.content && nearby1km.content.length > 0) {
        sections.push({
          title: '📍 Trong 1km',
          description: 'Các hoạt động rất gần bạn',
          data: nearby1km.content.slice(0, 3),
          type: 'nearby_1km'
        });
      }

      const nearby5km = await sportsService.getNearbySportsPosts(
        location.latitude, location.longitude, 5
      );
      
      if (nearby5km && nearby5km.content && nearby5km.content.length > 0) {
        sections.push({
          title: '🚗 Trong 5km',
          description: 'Các hoạt động gần bạn',
          data: nearby5km.content.slice(0, 4),
          type: 'nearby_5km'
        });
      }

    } catch (error) {
      console.error('❌ Error loading nearby recommendations:', error);
    }
    
    return sections;
  };

  const loadPopularRecommendations = async () => {
    const sections = [];
    
    try {
      // Get popular posts
      const popular = await sportsService.getPopularSportsPosts();
      if (popular && popular.content && popular.content.length > 0) {
        sections.push({
          title: '🔥 Thịnh hành',
          description: 'Các hoạt động được yêu thích nhất',
          data: popular.content.slice(0, 5),
          type: 'trending'
        });
      }

      // Get posts by popular sports
      const popularSports = ['FOOTBALL', 'BASKETBALL', 'BADMINTON'];
      
      for (const sport of popularSports) {
        try {
          const sportPosts = await sportsService.getSportsPostsBySportType(sport);
          if (sportPosts && sportPosts.content && sportPosts.content.length > 0) {
            sections.push({
              title: `⚽ ${sport} phổ biến`,
              description: `Các hoạt động ${sport} được quan tâm`,
              data: sportPosts.content.slice(0, 3),
              type: `popular_${sport.toLowerCase()}`
            });
          }
        } catch (error) {
          console.log(`Could not load popular ${sport} posts`);
        }
      }

    } catch (error) {
      console.error('❌ Error loading popular recommendations:', error);
    }
    
    return sections;
  };

  const loadFriendsRecommendations = async () => {
    const sections = [];
    
    try {
      // Get friends' posts
      const friendsPosts = await sportsService.getFriendsSportsPosts();
      if (friendsPosts && friendsPosts.content && friendsPosts.content.length > 0) {
        sections.push({
          title: '👫 Bạn bè đang tham gia',
          description: 'Các hoạt động của bạn bè',
          data: friendsPosts.content.slice(0, 5),
          type: 'friends_activity'
        });
      }

      // Get posts where friends are participating
      sections.push({
        title: '🤝 Có bạn bè tham gia',
        description: 'Các hoạt động có bạn bè đang tham gia',
        data: [], // This would need additional backend logic
        type: 'friends_participating'
      });

    } catch (error) {
      console.error('❌ Error loading friends recommendations:', error);
    }
    
    return sections;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRecommendations();
    setRefreshing(false);
  };

  const renderTabButton = (tab) => (
    <TouchableOpacity
      key={tab.key}
      style={[
        styles.tabButton,
        {
          backgroundColor: selectedTab === tab.key ? colors.primary : colors.cardBackground,
          borderColor: colors.primary
        }
      ]}
      onPress={() => setSelectedTab(tab.key)}
    >
      <MaterialCommunityIcons
        name={tab.icon}
        size={20}
        color={selectedTab === tab.key ? 'white' : colors.text}
      />
      <Text style={[
        styles.tabButtonText,
        { color: selectedTab === tab.key ? 'white' : colors.text }
      ]}>
        {tab.title}
      </Text>
    </TouchableOpacity>
  );

  const renderRecommendationSection = ({ item: section }) => (
    <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {section.title}
        </Text>
        <Text style={[styles.sectionDescription, { color: colors.textLight }]}>
          {section.description}
        </Text>
      </View>
      
      {section.data && section.data.length > 0 ? (
        <FlatList
          data={section.data}
          renderItem={({ item }) => (
            <SportsPostItem
              item={item}
              navigation={navigation}
              currentUserId={null} // Replace with actual user ID
            />
          )}
          keyExtractor={(item) => `${section.type}_${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />
      ) : (
        <View style={styles.emptySection}>
          <MaterialCommunityIcons name="information" size={24} color={colors.textLight} />
          <Text style={[styles.emptyText, { color: colors.textLight }]}>
            Chưa có gợi ý cho mục này
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Gợi ý cho bạn</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Ionicons name="refresh" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {recommendationTabs.map(renderTabButton)}
      </ScrollView>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textLight }]}>
            Đang tải gợi ý...
          </Text>
        </View>
      ) : (
        <FlatList
          data={recommendationSections}
          renderItem={renderRecommendationSection}
          keyExtractor={(item) => item.type}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        />
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
  tabsContainer: {
    paddingHorizontal: 16,
  },
  tabsContent: {
    paddingRight: 16,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
    gap: 6,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
  },
  horizontalList: {
    paddingHorizontal: 4,
  },
  emptySection: {
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
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

export default SportsRecommendationsScreen; 