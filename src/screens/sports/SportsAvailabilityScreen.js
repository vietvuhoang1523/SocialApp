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
  Alert
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hook/ThemeContext';
import sportsAvailabilityService from '../../services/SportsAvailabilityService';
import FilterBar from '../../components/sports/FilterBar';
import SportsAvailabilityCard from '../../components/sports/SportsAvailabilityCard';
import EmptyState from '../../components/common/EmptyState';
import { SportTypeIcons } from '../../constants/SportConstants';

const SportsAvailabilityScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  
  const [availabilities, setAvailabilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [lastPage, setLastPage] = useState(false);
  const [filters, setFilters] = useState({});
  
  const fetchAvailabilities = async (pageNumber = 0, shouldRefresh = false) => {
    try {
      if (shouldRefresh) {
        setRefreshing(true);
        setPage(0);
        pageNumber = 0;
      } else if (!shouldRefresh && pageNumber === 0) {
        setLoading(true);
      }
      
      const response = await sportsAvailabilityService.getSportsAvailabilities(pageNumber, 10, filters);
      
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
    setFilters(newFilters);
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
      
      <FilterBar onFilterChange={handleFilterChange} />
      
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
  listContent: {
    padding: 12,
    paddingBottom: 80,
    flexGrow: 1,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default SportsAvailabilityScreen; 