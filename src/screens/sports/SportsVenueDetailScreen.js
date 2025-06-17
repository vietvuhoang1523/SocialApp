import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  RefreshControl,
  Share,
  FlatList,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../hook/ThemeContext';
import { getVenueById } from '../../services/venueService';
import MapView, { Marker } from 'react-native-maps';
import { formatDistance } from '../../utils/locationUtils';
import { daysOfWeek } from '../../constants/VenueConstants';
import ImageViewer from '../../components/common/ImageViewer';

const { width } = Dimensions.get('window');

const SportsVenueDetailScreen = ({ route, navigation }) => {
  const { venueId } = route.params;
  const { colors } = useTheme();
  
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Load venue data
  const loadVenueData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getVenueById(venueId);
      setVenue(data);
    } catch (error) {
      console.error('Error loading venue:', error);
    } finally {
      setLoading(false);
    }
  }, [venueId]);
  
  // Initial data loading
  useEffect(() => {
    loadVenueData();
  }, [loadVenueData]);
  
  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadVenueData();
    setRefreshing(false);
  };
  
  // Open maps app with directions
  const openDirections = () => {
    if (!venue || !venue.latitude || !venue.longitude) return;
    
    const scheme = Platform.select({
      ios: 'maps:',
      android: 'geo:'
    });
    const latLng = `${venue.latitude},${venue.longitude}`;
    const label = venue.name;
    const url = Platform.select({
      ios: `${scheme}?q=${label}&ll=${latLng}`,
      android: `${scheme}0,0?q=${latLng}(${label})`
    });
    
    Linking.openURL(url);
  };
  
  // Open phone dialer
  const callVenue = () => {
    if (!venue || !venue.contactInfo || !venue.contactInfo.phone) return;
    
    const phoneNumber = venue.contactInfo.phone;
    Linking.openURL(`tel:${phoneNumber}`);
  };
  
  // Open website
  const openWebsite = () => {
    if (!venue || !venue.contactInfo || !venue.contactInfo.website) return;
    
    let url = venue.contactInfo.website;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    
    Linking.openURL(url);
  };
  
  // Share venue
  const shareVenue = async () => {
    if (!venue) return;
    
    try {
      await Share.share({
        message: `Ghé thăm ${venue.name} tại ${venue.address || 'địa chỉ không xác định'}`,
        title: venue.name
      });
    } catch (error) {
      console.error('Error sharing venue:', error);
    }
  };
  
  // View image in full screen
  const viewImage = (index) => {
    setSelectedImageIndex(index);
    setImageViewerVisible(true);
  };
  
  // Format opening hours
  const formatOpeningHours = () => {
    if (!venue || !venue.openingHours) return [];
    
    return daysOfWeek.map(day => {
      const hours = venue.openingHours[day.value];
      let timeText = 'Đóng cửa';
      
      if (hours && hours.open && hours.close) {
        timeText = `${hours.open} - ${hours.close}`;
      }
      
      return {
        day: day.label,
        hours: timeText
      };
    });
  };
  
  // Check if venue is open now
  const isOpenNow = () => {
    if (!venue || !venue.openingHours) return false;
    
    const now = new Date();
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const today = dayNames[now.getDay()];
    
    const hours = venue.openingHours[today];
    if (!hours || !hours.open || !hours.close) return false;
    
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    
    const [openHour, openMinute] = hours.open.split(':').map(Number);
    const [closeHour, closeMinute] = hours.close.split(':').map(Number);
    
    const openTime = openHour * 60 + openMinute;
    const closeTime = closeHour * 60 + closeMinute;
    
    return currentTime >= openTime && currentTime <= closeTime;
  };
  
  // Render loading state
  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Đang tải thông tin...</Text>
      </View>
    );
  }
  
  // Render error state
  if (!venue) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <MaterialIcons name="error-outline" size={64} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.text }]}>
          Không thể tải thông tin địa điểm
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={loadVenueData}
        >
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Image Gallery */}
        <View style={styles.imageGallery}>
          {venue.imageUrls && venue.imageUrls.length > 0 ? (
            <FlatList
              data={venue.imageUrls}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <TouchableOpacity onPress={() => viewImage(index)}>
                  <Image
                    source={{ uri: item }}
                    style={styles.venueImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}
            />
          ) : (
            <Image
              source={require('../../assets/default-venue.jpg')}
              style={styles.venueImage}
              resizeMode="cover"
            />
          )}
          
          {venue.verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <Text style={styles.verifiedText}>Đã xác thực</Text>
            </View>
          )}
        </View>
        
        {/* Venue Header */}
        <View style={[styles.venueHeader, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.nameRow}>
            <Text style={[styles.venueName, { color: colors.text }]}>{venue.name}</Text>
            <TouchableOpacity onPress={shareVenue}>
              <Ionicons name="share-social-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.venueTypeRow}>
            <MaterialIcons name="category" size={16} color={colors.textLight} />
            <Text style={[styles.venueType, { color: colors.textLight }]}>
              {venue.venueType || 'Không xác định'}
            </Text>
          </View>
          
          <View style={styles.statusRow}>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: isOpenNow() ? colors.success + '20' : colors.error + '20' }
            ]}>
              <Text style={{ 
                color: isOpenNow() ? colors.success : colors.error,
                fontWeight: '500',
                fontSize: 12
              }}>
                {isOpenNow() ? 'Đang mở cửa' : 'Đóng cửa'}
              </Text>
            </View>
            
            {venue.priceRange && (
              <View style={[styles.priceBadge, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.priceText, { color: colors.primary }]}>
                  {venue.priceRange}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Quick Actions */}
        <View style={[styles.quickActions, { backgroundColor: colors.cardBackground }]}>
          <TouchableOpacity style={styles.actionButton} onPress={openDirections}>
            <View style={[styles.actionIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="navigate" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.actionText, { color: colors.text }]}>Chỉ đường</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={callVenue}
            disabled={!venue.contactInfo?.phone}
          >
            <View style={[styles.actionIcon, { 
              backgroundColor: venue.contactInfo?.phone ? colors.primary + '20' : colors.border
            }]}>
              <Ionicons 
                name="call" 
                size={20} 
                color={venue.contactInfo?.phone ? colors.primary : colors.textLight} 
              />
            </View>
            <Text style={[styles.actionText, { 
              color: venue.contactInfo?.phone ? colors.text : colors.textLight 
            }]}>
              Gọi điện
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={openWebsite}
            disabled={!venue.contactInfo?.website}
          >
            <View style={[styles.actionIcon, { 
              backgroundColor: venue.contactInfo?.website ? colors.primary + '20' : colors.border
            }]}>
              <Ionicons 
                name="globe" 
                size={20} 
                color={venue.contactInfo?.website ? colors.primary : colors.textLight} 
              />
            </View>
            <Text style={[styles.actionText, { 
              color: venue.contactInfo?.website ? colors.text : colors.textLight 
            }]}>
              Website
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('CreateSportsPost', { venueId: venue.id, venueName: venue.name })}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="add-circle" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.actionText, { color: colors.text }]}>Tạo hoạt động</Text>
          </TouchableOpacity>
        </View>
        
        {/* Address & Map */}
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Địa chỉ</Text>
          </View>
          
          <Text style={[styles.address, { color: colors.text }]}>
            {venue.address || 'Không có địa chỉ'}
          </Text>
          
          {venue.latitude && venue.longitude && (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: venue.latitude,
                  longitude: venue.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: venue.latitude,
                    longitude: venue.longitude
                  }}
                  title={venue.name}
                />
              </MapView>
              <TouchableOpacity 
                style={[styles.mapButton, { backgroundColor: colors.primary }]}
                onPress={openDirections}
              >
                <Text style={styles.mapButtonText}>Chỉ đường</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Opening Hours */}
        {venue.openingHours && (
          <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Giờ mở cửa</Text>
            </View>
            
            {formatOpeningHours().map((item, index) => (
              <View key={index} style={styles.hourRow}>
                <Text style={[styles.dayText, { color: colors.text }]}>{item.day}</Text>
                <Text style={[styles.hourText, { 
                  color: item.hours === 'Đóng cửa' ? colors.error : colors.text 
                }]}>
                  {item.hours}
                </Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Contact Information */}
        {venue.contactInfo && (
          <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="call-outline" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Thông tin liên hệ</Text>
            </View>
            
            {venue.contactInfo.phone && (
              <TouchableOpacity style={styles.contactRow} onPress={callVenue}>
                <Ionicons name="call-outline" size={16} color={colors.textLight} />
                <Text style={[styles.contactText, { color: colors.text }]}>
                  {venue.contactInfo.phone}
                </Text>
              </TouchableOpacity>
            )}
            
            {venue.contactInfo.email && (
              <TouchableOpacity 
                style={styles.contactRow}
                onPress={() => Linking.openURL(`mailto:${venue.contactInfo.email}`)}
              >
                <Ionicons name="mail-outline" size={16} color={colors.textLight} />
                <Text style={[styles.contactText, { color: colors.text }]}>
                  {venue.contactInfo.email}
                </Text>
              </TouchableOpacity>
            )}
            
            {venue.contactInfo.website && (
              <TouchableOpacity style={styles.contactRow} onPress={openWebsite}>
                <Ionicons name="globe-outline" size={16} color={colors.textLight} />
                <Text style={[styles.contactText, { color: colors.text }]}>
                  {venue.contactInfo.website}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {/* Sports & Facilities */}
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="dumbbell" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Môn thể thao & Tiện ích</Text>
          </View>
          
          {venue.sportTypes && venue.sportTypes.length > 0 && (
            <View style={styles.tagsContainer}>
              <Text style={[styles.tagSectionTitle, { color: colors.textLight }]}>Môn thể thao:</Text>
              <View style={styles.tagsRow}>
                {venue.sportTypes.map((sport, index) => (
                  <View 
                    key={index}
                    style={[styles.tag, { backgroundColor: colors.primary + '20' }]}
                  >
                    <Text style={[styles.tagText, { color: colors.primary }]}>{sport}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {venue.features && venue.features.length > 0 && (
            <View style={styles.tagsContainer}>
              <Text style={[styles.tagSectionTitle, { color: colors.textLight }]}>Tiện ích:</Text>
              <View style={styles.tagsRow}>
                {venue.features.map((feature, index) => (
                  <View 
                    key={index}
                    style={[styles.tag, { backgroundColor: colors.secondary + '20' }]}
                  >
                    <Text style={[styles.tagText, { color: colors.secondary }]}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
        
        {/* Description */}
        {venue.description && (
          <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Mô tả</Text>
            </View>
            <Text style={[styles.description, { color: colors.text }]}>
              {venue.description}
            </Text>
          </View>
        )}
        
        {/* Pricing */}
        {venue.pricing && (
          <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="attach-money" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Giá cả</Text>
            </View>
            {Object.entries(venue.pricing).map(([key, value], index) => (
              <View key={index} style={styles.pricingRow}>
                <Text style={[styles.pricingLabel, { color: colors.text }]}>{key}</Text>
                <Text style={[styles.pricingValue, { color: colors.text }]}>
                  {typeof value === 'number' ? `${value.toLocaleString()} VNĐ` : value}
                </Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Owner Information */}
        {venue.owner && (
          <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Chủ sở hữu</Text>
            </View>
            <View style={styles.ownerRow}>
              <Image 
                source={venue.owner.avatar 
                  ? { uri: venue.owner.avatar } 
                  : require('../../assets/default-avatar.png')
                }
                style={styles.ownerAvatar}
              />
              <View style={styles.ownerInfo}>
                <Text style={[styles.ownerName, { color: colors.text }]}>
                  {venue.owner.fullName || 'Không xác định'}
                </Text>
                {venue.lastVerifiedAt && (
                  <Text style={[styles.verifiedDate, { color: colors.textLight }]}>
                    Xác thực lần cuối: {new Date(venue.lastVerifiedAt).toLocaleDateString('vi-VN')}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}
        
        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
      
      {/* Image Viewer Modal */}
      <ImageViewer
        visible={imageViewerVisible}
        images={venue.imageUrls || []}
        initialIndex={selectedImageIndex}
        onClose={() => setImageViewerVisible(false)}
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  imageGallery: {
    position: 'relative',
  },
  venueImage: {
    width: width,
    height: 250,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  venueHeader: {
    padding: 16,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  venueName: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  venueTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  venueType: {
    fontSize: 14,
    marginLeft: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
  },
  priceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    padding: 16,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionText: {
    fontSize: 12,
  },
  section: {
    padding: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  address: {
    fontSize: 16,
    lineHeight: 24,
  },
  mapContainer: {
    height: 200,
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  mapButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dayText: {
    fontSize: 16,
  },
  hourText: {
    fontSize: 16,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  contactText: {
    fontSize: 16,
    marginLeft: 8,
  },
  tagsContainer: {
    marginBottom: 12,
  },
  tagSectionTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pricingLabel: {
    fontSize: 16,
  },
  pricingValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  ownerInfo: {
    marginLeft: 12,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  verifiedDate: {
    fontSize: 12,
    marginTop: 4,
  },
  bottomSpacing: {
    height: 20,
  }
});

export default SportsVenueDetailScreen; 