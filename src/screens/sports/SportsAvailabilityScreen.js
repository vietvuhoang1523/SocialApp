import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
  Image,
  SafeAreaView,
  StatusBar,
  Alert,
  TextInput,
  ScrollView
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../hook/ThemeContext';
import sportsAvailabilityService from '../../services/SportsAvailabilityService';
import FilterBar from '../../components/sports/FilterBar';
import SportsAvailabilityCard from '../../components/sports/SportsAvailabilityCard';
import EmptyState from '../../components/common/EmptyState';
import { SportTypeIcons } from '../../constants/SportConstants';

const sportTypeOptions = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Bóng đá', value: 'FOOTBALL' },
  { label: 'Bóng rổ', value: 'BASKETBALL' },
  { label: 'Bóng chuyền', value: 'VOLLEYBALL' },
  { label: 'Quần vợt', value: 'TENNIS' },
  { label: 'Cầu lông', value: 'BADMINTON' },
  { label: 'Bơi lội', value: 'SWIMMING' },
  { label: 'Chạy bộ', value: 'RUNNING' },
  { label: 'Đạp xe', value: 'CYCLING' },
  { label: 'Gym', value: 'GYM' }
];

const SportsAvailabilityScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  
  const [availabilities, setAvailabilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [lastPage, setLastPage] = useState(false);
  const [filters, setFilters] = useState({
    sportType: 'ALL',
    distance: 10,
    timeRange: 'TODAY',
    skillLevel: 'ALL'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('nearby'); // 'nearby', 'popular', 'new', 'my'
  
  const fetchAvailabilities = async (pageNumber = 0, shouldRefresh = false) => {
    try {
      if (shouldRefresh) {
        setRefreshing(true);
        setPage(0);
        pageNumber = 0;
      } else if (!shouldRefresh && pageNumber === 0) {
        setLoading(true);
      }
      
      // Thêm các tham số tìm kiếm theo tab hiện tại
      const searchParams = { ...filters };
      
      if (activeTab === 'nearby') {
        searchParams.sortBy = 'distance';
        searchParams.maxDistance = filters.distance;
      } else if (activeTab === 'popular') {
        searchParams.sortBy = 'popularity';
      } else if (activeTab === 'new') {
        searchParams.sortBy = 'createdAt';
      } else if (activeTab === 'my') {
        searchParams.onlyMine = true;
      }
      
      if (searchQuery) {
        searchParams.query = searchQuery;
      }
      
      const response = await sportsAvailabilityService.getSportsAvailabilities(pageNumber, 10, searchParams);
      
      if (response) {
        if (shouldRefresh || pageNumber === 0) {
          setAvailabilities(response.content);
        } else {
          setAvailabilities(prev => [...prev, ...response.content]);
        }
        
        setLastPage(response.last);
        setPage(pageNumber);
      }
    } catch (error) {
      console.error('Error fetching availabilities:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách khả dụng thể thao. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    fetchAvailabilities(0, true);
  };
  
  const handleLoadMore = () => {
    if (!lastPage && !loading) {
      fetchAvailabilities(page + 1);
    }
  };
  
  const handleFilterChange = (newFilters) => {
    setFilters({...filters, ...newFilters});
    fetchAvailabilities(0, true);
  };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    fetchAvailabilities(0, true);
  };
  
  const handleSearch = () => {
    fetchAvailabilities(0, true);
  };
  
  const navigateToCreateAvailability = () => {
    navigation.navigate('CreateSportsAvailability');
  };
  
  const navigateToAvailabilityDetail = (availabilityId) => {
    navigation.navigate('SportsAvailabilityDetail', { availabilityId });
  };
  
  useFocusEffect(
    useCallback(() => {
      fetchAvailabilities(0, true);
    }, [])
  );
  
  const renderItem = ({ item }) => (
    <SportsAvailabilityCard 
      availability={item}
      onPress={() => navigateToAvailabilityDetail(item.id)}
    />
  );
  
  const renderEmptyState = () => {
    if (loading) return null;
    
    return (
      <EmptyState
        icon="sports"
        title="Không có hoạt động thể thao nào"
        message="Hiện tại không có ai đang tìm bạn chơi thể thao. Tạo lịch của bạn để tìm bạn cùng chơi!"
        actionText="Tạo lịch chơi thể thao"
        onAction={navigateToCreateAvailability}
      />
    );
  };
  
  const renderFooter = () => {
    if (!loading || refreshing) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Tìm người chơi thể thao</Text>
        <TouchableOpacity 
          style={[styles.createButton, { backgroundColor: colors.primary }]}
          onPress={navigateToCreateAvailability}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.cardBackground }]}>
        <Ionicons name="search" size={20} color={colors.textLight} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Tìm theo địa điểm, môn thể thao..."
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => {
            setSearchQuery('');
            fetchAvailabilities(0, true);
          }}>
            <Ionicons name="close-circle" size={20} color={colors.textLight} />
          </TouchableOpacity>
        ) : null}
      </View>
      
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'nearby' && [styles.activeTab, { borderColor: colors.primary }]
          ]}
          onPress={() => handleTabChange('nearby')}
        >
          <Ionicons 
            name="location" 
            size={18} 
            color={activeTab === 'nearby' ? colors.primary : colors.textLight} 
          />
          <Text 
            style={[
              styles.tabText, 
              { color: activeTab === 'nearby' ? colors.primary : colors.textLight }
            ]}
          >
            Gần đây
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'popular' && [styles.activeTab, { borderColor: colors.primary }]
          ]}
          onPress={() => handleTabChange('popular')}
        >
          <Ionicons 
            name="trending-up" 
            size={18} 
            color={activeTab === 'popular' ? colors.primary : colors.textLight} 
          />
          <Text 
            style={[
              styles.tabText, 
              { color: activeTab === 'popular' ? colors.primary : colors.textLight }
            ]}
          >
            Phổ biến
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'new' && [styles.activeTab, { borderColor: colors.primary }]
          ]}
          onPress={() => handleTabChange('new')}
        >
          <Ionicons 
            name="time" 
            size={18} 
            color={activeTab === 'new' ? colors.primary : colors.textLight} 
          />
          <Text 
            style={[
              styles.tabText, 
              { color: activeTab === 'new' ? colors.primary : colors.textLight }
            ]}
          >
            Mới nhất
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'my' && [styles.activeTab, { borderColor: colors.primary }]
          ]}
          onPress={() => handleTabChange('my')}
        >
          <Ionicons 
            name="person" 
            size={18} 
            color={activeTab === 'my' ? colors.primary : colors.textLight} 
          />
          <Text 
            style={[
              styles.tabText, 
              { color: activeTab === 'my' ? colors.primary : colors.textLight }
            ]}
          >
            Của tôi
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Sport Type Filter */}
      <View style={styles.sportFilterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.sportFilterScroll}
        >
          {sportTypeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.sportFilterItem,
                filters.sportType === option.value && [
                  styles.activeSportFilter,
                  { backgroundColor: colors.primary + '20', borderColor: colors.primary }
                ]
              ]}
              onPress={() => handleFilterChange({ sportType: option.value })}
            >
              {option.value !== 'ALL' && (
                <FontAwesome5 
                  name={SportTypeIcons[option.value] || 'running'} 
                  size={14} 
                  color={filters.sportType === option.value ? colors.primary : colors.textLight}
                  style={styles.sportFilterIcon}
                />
              )}
              <Text
                style={[
                  styles.sportFilterText,
                  { color: filters.sportType === option.value ? colors.primary : colors.textLight }
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <FlatList
        data={availabilities}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
      />
      
      {/* Quick Action Button */}
      <TouchableOpacity 
        style={[styles.quickActionButton, { backgroundColor: colors.primary }]}
        onPress={navigateToCreateAvailability}
      >
        <Text style={styles.quickActionText}>Tìm người chơi ngay</Text>
        <Ionicons name="arrow-forward" size={20} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 22,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeTab: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  sportFilterContainer: {
    marginBottom: 12,
  },
  sportFilterScroll: {
    paddingHorizontal: 16,
  },
  sportFilterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeSportFilter: {
    borderWidth: 1,
  },
  sportFilterIcon: {
    marginRight: 4,
  },
  sportFilterText: {
    fontSize: 13,
    fontWeight: '500',
  },
  listContent: {
    padding: 12,
    paddingBottom: 80,
    flexGrow: 1,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  quickActionButton: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: [{ translateX: -100 }],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 50,
    borderRadius: 25,
    elevation: 5,
  },
  quickActionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 8,
  },
});

export default SportsAvailabilityScreen; 