import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Platform
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hook/ThemeContext';
import { searchVenues, getNearbyVenues } from '../../services/venueService';
import { getCurrentLocation } from '../../utils/locationUtils';
import { SportTypeIcons } from '../../constants/SportConstants';
import { sportTypeOptions, venueTypeOptions, priceRangeOptions } from '../../constants/VenueConstants';
import FilterModal from '../../components/sports/FilterModal';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

const SportsVenueSearchScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    sportType: null,
    venueType: null,
    priceRange: null,
    radius: 10, // Default 10km radius
    verified: true
  });

  // Get user's current location
  const fetchUserLocation = async () => {
    try {
      const location = await getCurrentLocation();
      if (location) {
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  // Load nearby venues
  const loadVenues = useCallback(async () => {
    try {
      setLoading(true);
      let result = [];

      if (userLocation) {
        // If we have user location, search nearby
        result = await getNearbyVenues(
          userLocation.latitude,
          userLocation.longitude,
          filters.radius,
          filters.sportType,
          filters.venueType,
          filters.priceRange,
          filters.verified
        );
      } else {
        // Otherwise just search with filters
        result = await searchVenues(
          searchQuery,
          filters.sportType,
          filters.venueType,
          filters.priceRange,
          filters.verified
        );
      }

      setVenues(result);
    } catch (error) {
      console.error('Error loading venues:', error);
    } finally {
      setLoading(false);
    }
  }, [userLocation, searchQuery, filters]);

  // Initial data loading
  useEffect(() => {
    fetchUserLocation();
  }, []);

  useEffect(() => {
    loadVenues();
  }, [loadVenues, userLocation]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserLocation();
    await loadVenues();
    setRefreshing(false);
  };

  // Handle search
  const handleSearch = () => {
    loadVenues();
  };

  // Apply filters
  const applyFilters = (newFilters) => {
    setFilters(newFilters);
    setFilterModalVisible(false);
  };

  // Format distance
  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${meters.toFixed(0)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  };

  // Render venue item
  const renderVenueItem = ({ item }) => {
    const sportIcon = item.sportTypes && item.sportTypes.length > 0 
      ? SportTypeIcons[item.sportTypes[0]] 
      : 'dumbbell';

    return (
      <TouchableOpacity
        style={[styles.venueCard, { backgroundColor: colors.cardBackground }]}
        onPress={() => navigation.navigate('SportsVenueDetail', { venueId: item.id })}
      >
        <Image
          source={item.imageUrls && item.imageUrls.length > 0 
            ? { uri: item.imageUrls[0] } 
            : require('../../assets/default-venue.jpg')}
          style={styles.venueImage}
        />
        
        {item.verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          </View>
        )}
        
        <View style={styles.venueInfo}>
          <Text style={[styles.venueName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          
          <View style={styles.venueTypeRow}>
            <MaterialIcons name="category" size={14} color={colors.textLight} />
            <Text style={[styles.venueType, { color: colors.textLight }]}>
              {item.venueType || 'Không xác định'}
            </Text>
          </View>
          
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={14} color={colors.textLight} />
            <Text style={[styles.address, { color: colors.textLight }]} numberOfLines={2}>
              {item.address || 'Không có địa chỉ'}
            </Text>
          </View>
          
          {userLocation && item.distance && (
            <View style={styles.distanceRow}>
              <MaterialCommunityIcons name="map-marker-distance" size={14} color={colors.primary} />
              <Text style={[styles.distance, { color: colors.primary }]}>
                {formatDistance(item.distance)}
              </Text>
            </View>
          )}
          
          <View style={styles.sportTypesRow}>
            {item.sportTypes && item.sportTypes.map((sport, index) => (
              <View 
                key={index} 
                style={[styles.sportTypeTag, { backgroundColor: colors.primary + '20' }]}
              >
                <MaterialCommunityIcons 
                  name={SportTypeIcons[sport] || 'dumbbell'} 
                  size={12} 
                  color={colors.primary} 
                />
                <Text style={[styles.sportTypeText, { color: colors.primary }]}>
                  {sport}
                </Text>
              </View>
            ))}
          </View>
          
          {item.priceRange && (
            <View style={styles.priceRow}>
              <MaterialIcons name="attach-money" size={14} color={colors.textLight} />
              <Text style={[styles.price, { color: colors.textLight }]}>
                {item.priceRange}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons 
          name="map-search-outline" 
          size={80} 
          color={colors.textLight} 
        />
        <Text style={[styles.emptyText, { color: colors.text }]}>
          Không tìm thấy địa điểm nào
        </Text>
        <Text style={[styles.emptySubText, { color: colors.textLight }]}>
          Hãy thử tìm kiếm với từ khóa khác hoặc thay đổi bộ lọc
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Header */}
      <View style={[styles.searchHeader, { backgroundColor: colors.cardBackground }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.background }]}>
          <Ionicons name="search" size={20} color={colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Tìm kiếm địa điểm..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={[styles.filterButton, { backgroundColor: colors.primary }]}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="filter" size={20} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.mapButton, 
            { backgroundColor: showMap ? colors.primary : colors.background }
          ]}
          onPress={() => setShowMap(!showMap)}
        >
          <Ionicons 
            name={showMap ? "list" : "map"} 
            size={20} 
            color={showMap ? "white" : colors.primary} 
          />
        </TouchableOpacity>
      </View>
      
      {/* Map View */}
      {showMap && (
        <View style={styles.mapContainer}>
          {userLocation ? (
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
            >
              {/* User's location */}
              <Marker
                coordinate={userLocation}
                title="Vị trí của bạn"
                pinColor="#4285F4"
              />
              
              {/* Venues */}
              {venues.map((venue) => (
                <Marker
                  key={venue.id}
                  coordinate={{
                    latitude: venue.latitude,
                    longitude: venue.longitude
                  }}
                  title={venue.name}
                  description={venue.address}
                  onCalloutPress={() => navigation.navigate('SportsVenueDetail', { venueId: venue.id })}
                />
              ))}
            </MapView>
          ) : (
            <View style={[styles.loadingMap, { backgroundColor: colors.background }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ color: colors.text, marginTop: 10 }}>Đang tải bản đồ...</Text>
            </View>
          )}
        </View>
      )}
      
      {/* List View */}
      {!showMap && (
        <FlatList
          data={venues}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderVenueItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
      
      {/* Loading indicator */}
      {loading && (
        <View style={[styles.loadingOverlay, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
          <View style={[styles.loadingContainer, { backgroundColor: colors.cardBackground }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>Đang tải...</Text>
          </View>
        </View>
      )}
      
      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={applyFilters}
        initialFilters={filters}
        filterOptions={{
          sportTypeOptions,
          venueTypeOptions,
          priceRangeOptions
        }}
      />
      
      {/* Create Venue FAB (for venue owners) */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('CreateSportsVenue')}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  filterButton: {
    marginLeft: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  mapButton: {
    marginLeft: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingMap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 12,
    paddingBottom: 80,
  },
  venueCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  venueImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
  },
  venueInfo: {
    padding: 12,
  },
  venueName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  venueTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  venueType: {
    fontSize: 14,
    marginLeft: 6,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  address: {
    fontSize: 14,
    marginLeft: 6,
    flex: 1,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  distance: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  sportTypesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  sportTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  sportTypeText: {
    fontSize: 12,
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  price: {
    fontSize: 14,
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default SportsVenueSearchScreen; 