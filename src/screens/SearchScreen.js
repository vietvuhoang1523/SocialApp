import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Image,
  SafeAreaView,
  StatusBar,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../hook/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { SportTypeIcons } from '../constants/SportConstants';

const { width } = Dimensions.get('window');

// Danh sách các môn thể thao
const sportTypes = [
  { id: 'FOOTBALL', name: 'Bóng đá', icon: 'football' },
  { id: 'BASKETBALL', name: 'Bóng rổ', icon: 'basketball' },
  { id: 'VOLLEYBALL', name: 'Bóng chuyền', icon: 'volleyball' },
  { id: 'TENNIS', name: 'Quần vợt', icon: 'tennis' },
  { id: 'BADMINTON', name: 'Cầu lông', icon: 'badminton' },
  { id: 'TABLE_TENNIS', name: 'Bóng bàn', icon: 'table-tennis' },
  { id: 'SWIMMING', name: 'Bơi lội', icon: 'swimming' },
  { id: 'RUNNING', name: 'Chạy bộ', icon: 'running' },
  { id: 'CYCLING', name: 'Đạp xe', icon: 'biking' },
  { id: 'GYM', name: 'Tập gym', icon: 'dumbbell' },
  { id: 'YOGA', name: 'Yoga', icon: 'yoga' },
  { id: 'MARTIAL_ARTS', name: 'Võ thuật', icon: 'hand-rock' }
];

// Danh sách các địa điểm thể thao phổ biến (mẫu)
const popularLocations = [
  { id: 1, name: 'Sân vận động Mỹ Đình', address: 'Từ Liêm, Hà Nội', distance: 2.3 },
  { id: 2, name: 'Sân bóng đá Thành Đô', address: 'Cầu Giấy, Hà Nội', distance: 1.5 },
  { id: 3, name: 'Sân bóng rổ Tố Hữu', address: 'Hà Đông, Hà Nội', distance: 3.2 },
  { id: 4, name: 'Bể bơi Mỹ Đình', address: 'Nam Từ Liêm, Hà Nội', distance: 2.1 },
  { id: 5, name: 'CLB Tennis Hà Nội', address: 'Đống Đa, Hà Nội', distance: 4.7 }
];

// Danh sách người chơi gần đây (mẫu)
const nearbyPlayers = [
  { id: 1, name: 'Nguyễn Văn A', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', sport: 'FOOTBALL', distance: 0.8, rating: 4.8 },
  { id: 2, name: 'Trần Thị B', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', sport: 'TENNIS', distance: 1.2, rating: 4.5 },
  { id: 3, name: 'Lê Văn C', avatar: 'https://randomuser.me/api/portraits/men/62.jpg', sport: 'BASKETBALL', distance: 1.5, rating: 4.9 },
  { id: 4, name: 'Phạm Thị D', avatar: 'https://randomuser.me/api/portraits/women/26.jpg', sport: 'VOLLEYBALL', distance: 2.1, rating: 4.7 },
  { id: 5, name: 'Hoàng Văn E', avatar: 'https://randomuser.me/api/portraits/men/22.jpg', sport: 'SWIMMING', distance: 2.3, rating: 4.6 }
];

// Danh sách các nhóm thể thao (mẫu)
const sportsGroups = [
  { id: 1, name: 'CLB Bóng đá Hà Nội', members: 42, sport: 'FOOTBALL', image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&auto=format&fit=crop' },
  { id: 2, name: 'Nhóm Tennis cuối tuần', members: 18, sport: 'TENNIS', image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&auto=format&fit=crop' },
  { id: 3, name: 'Hội Chạy bộ buổi sáng', members: 56, sport: 'RUNNING', image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&auto=format&fit=crop' },
  { id: 4, name: 'CLB Bơi lội Hà Nội', members: 24, sport: 'SWIMMING', image: 'https://images.unsplash.com/photo-1560090995-01632a28895b?w=800&auto=format&fit=crop' }
];

const SearchScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, players, locations, groups
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    
    // Giả lập tìm kiếm
    setTimeout(() => {
      // Kết quả tìm kiếm mẫu
      const results = [
        ...nearbyPlayers.filter(player => 
          player.name.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        ...popularLocations.filter(location => 
          location.name.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        ...sportsGroups.filter(group => 
          group.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      ];
      
      setSearchResults(results);
      setLoading(false);
    }, 800);
  };
  
  const navigateToSportType = (sportType) => {
    navigation.navigate('FindPlayers', {
      screen: 'SportsAvailability',
      params: { sportType: sportType.id }
    });
  };
  
  const navigateToPlayerProfile = (playerId) => {
    // Chuyển đến trang hồ sơ người chơi
    console.log('Navigate to player:', playerId);
  };
  
  const navigateToLocation = (locationId) => {
    // Chuyển đến trang chi tiết địa điểm
    console.log('Navigate to location:', locationId);
  };
  
  const navigateToGroup = (groupId) => {
    // Chuyển đến trang chi tiết nhóm
    console.log('Navigate to group:', groupId);
  };
  
  const renderSportTypeItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.sportTypeItem}
      onPress={() => navigateToSportType(item)}
    >
      <View style={[styles.sportTypeIconContainer, { backgroundColor: colors.primary + '20' }]}>
        <FontAwesome5 name={item.icon} size={24} color={colors.primary} />
      </View>
      <Text style={[styles.sportTypeName, { color: colors.text }]} numberOfLines={1}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );
  
  const renderPlayerItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.playerCard, { backgroundColor: colors.cardBackground }]}
      onPress={() => navigateToPlayerProfile(item.id)}
    >
      <Image source={{ uri: item.avatar }} style={styles.playerAvatar} />
      <View style={styles.playerInfo}>
        <Text style={[styles.playerName, { color: colors.text }]}>{item.name}</Text>
        <View style={styles.playerDetail}>
          <FontAwesome5 
            name={SportTypeIcons[item.sport] || 'running'} 
            size={12} 
            color={colors.textLight} 
            style={styles.playerDetailIcon}
          />
          <Text style={[styles.playerDetailText, { color: colors.textLight }]}>
            {item.sport}
          </Text>
        </View>
        <View style={styles.playerDetail}>
          <Ionicons name="location" size={12} color={colors.textLight} style={styles.playerDetailIcon} />
          <Text style={[styles.playerDetailText, { color: colors.textLight }]}>
            {item.distance} km
          </Text>
        </View>
      </View>
      <View style={styles.playerRating}>
        <Ionicons name="star" size={16} color="#FFC107" />
        <Text style={styles.playerRatingText}>{item.rating}</Text>
      </View>
    </TouchableOpacity>
  );
  
  const renderLocationItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.locationCard, { backgroundColor: colors.cardBackground }]}
      onPress={() => navigateToLocation(item.id)}
    >
      <View style={[styles.locationIconContainer, { backgroundColor: colors.primary + '10' }]}>
        <Ionicons name="location" size={24} color={colors.primary} />
      </View>
      <View style={styles.locationInfo}>
        <Text style={[styles.locationName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.locationAddress, { color: colors.textLight }]}>{item.address}</Text>
      </View>
      <View style={styles.locationDistance}>
        <Text style={[styles.locationDistanceText, { color: colors.primary }]}>{item.distance} km</Text>
      </View>
    </TouchableOpacity>
  );
  
  const renderGroupItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.groupCard}
      onPress={() => navigateToGroup(item.id)}
    >
      <Image source={{ uri: item.image }} style={styles.groupImage} />
      <View style={styles.groupInfo}>
        <Text style={styles.groupName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.groupDetail}>
          <FontAwesome5 
            name={SportTypeIcons[item.sport] || 'running'} 
            size={12} 
            color="#fff" 
            style={styles.groupDetailIcon}
          />
          <Text style={styles.groupDetailText}>{item.sport}</Text>
        </View>
        <View style={styles.groupDetail}>
          <Ionicons name="people" size={12} color="#fff" style={styles.groupDetailIcon} />
          <Text style={styles.groupDetailText}>{item.members} thành viên</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Tìm kiếm</Text>
      </View>
      
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.cardBackground }]}>
        <Ionicons name="search" size={20} color={colors.textLight} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Tìm người chơi, địa điểm, nhóm..."
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textLight} />
          </TouchableOpacity>
        ) : null}
      </View>
      
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity 
            style={[
              styles.tab, 
              activeTab === 'all' && [styles.activeTab, { borderColor: colors.primary }]
            ]}
            onPress={() => setActiveTab('all')}
          >
            <Text 
              style={[
                styles.tabText, 
                { color: activeTab === 'all' ? colors.primary : colors.textLight }
              ]}
            >
              Tất cả
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.tab, 
              activeTab === 'players' && [styles.activeTab, { borderColor: colors.primary }]
            ]}
            onPress={() => setActiveTab('players')}
          >
            <Text 
              style={[
                styles.tabText, 
                { color: activeTab === 'players' ? colors.primary : colors.textLight }
              ]}
            >
              Người chơi
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.tab, 
              activeTab === 'locations' && [styles.activeTab, { borderColor: colors.primary }]
            ]}
            onPress={() => setActiveTab('locations')}
          >
            <Text 
              style={[
                styles.tabText, 
                { color: activeTab === 'locations' ? colors.primary : colors.textLight }
              ]}
            >
              Địa điểm
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.tab, 
              activeTab === 'groups' && [styles.activeTab, { borderColor: colors.primary }]
            ]}
            onPress={() => setActiveTab('groups')}
          >
            <Text 
              style={[
                styles.tabText, 
                { color: activeTab === 'groups' ? colors.primary : colors.textLight }
              ]}
            >
              Nhóm
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : searchQuery ? (
        // Kết quả tìm kiếm
        <FlatList
          data={searchResults}
          keyExtractor={(item) => `${item.id}`}
          renderItem={({ item }) => {
            if (item.avatar) {
              return renderPlayerItem({ item });
            } else if (item.address) {
              return renderLocationItem({ item });
            } else if (item.members) {
              return renderGroupItem({ item });
            }
            return null;
          }}
          contentContainerStyle={styles.searchResultsContainer}
          ListEmptyComponent={
            <View style={styles.emptyResultsContainer}>
              <Ionicons name="search" size={64} color={colors.textLight} />
              <Text style={[styles.emptyResultsText, { color: colors.text }]}>
                Không tìm thấy kết quả nào cho "{searchQuery}"
              </Text>
            </View>
          }
        />
      ) : (
        // Màn hình tìm kiếm mặc định
        <ScrollView style={styles.content}>
          {/* Các môn thể thao */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Môn thể thao</Text>
            <FlatList
              data={sportTypes}
              renderItem={renderSportTypeItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sportTypeList}
            />
          </View>
          
          {/* Người chơi gần đây */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Người chơi gần đây</Text>
              <TouchableOpacity onPress={() => setActiveTab('players')}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={nearbyPlayers}
              renderItem={renderPlayerItem}
              keyExtractor={(item) => `${item.id}`}
              contentContainerStyle={styles.playerList}
            />
          </View>
          
          {/* Địa điểm phổ biến */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Địa điểm phổ biến</Text>
              <TouchableOpacity onPress={() => setActiveTab('locations')}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={popularLocations}
              renderItem={renderLocationItem}
              keyExtractor={(item) => `${item.id}`}
              contentContainerStyle={styles.locationList}
            />
          </View>
          
          {/* Nhóm thể thao */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Nhóm thể thao</Text>
              <TouchableOpacity onPress={() => setActiveTab('groups')}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={sportsGroups}
              renderItem={renderGroupItem}
              keyExtractor={(item) => `${item.id}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.groupList}
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
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
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sportTypeList: {
    paddingHorizontal: 12,
  },
  sportTypeItem: {
    width: 80,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  sportTypeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  sportTypeName: {
    fontSize: 12,
    textAlign: 'center',
  },
  playerList: {
    paddingHorizontal: 16,
  },
  playerCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
  },
  playerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  playerDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  playerDetailIcon: {
    marginRight: 4,
  },
  playerDetailText: {
    fontSize: 12,
  },
  playerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
  },
  playerRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFA000',
    marginLeft: 4,
  },
  locationList: {
    paddingHorizontal: 16,
  },
  locationCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
  },
  locationIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 12,
  },
  locationDistance: {
    justifyContent: 'center',
  },
  locationDistanceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  groupList: {
    paddingHorizontal: 16,
  },
  groupCard: {
    width: 200,
    height: 120,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
  },
  groupImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  groupInfo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 12,
    justifyContent: 'flex-end',
  },
  groupName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  groupDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  groupDetailIcon: {
    marginRight: 4,
  },
  groupDetailText: {
    fontSize: 12,
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultsContainer: {
    padding: 16,
  },
  emptyResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyResultsText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default SearchScreen;
