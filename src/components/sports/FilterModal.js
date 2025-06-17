import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Switch,
  Platform
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hook/ThemeContext';
import Slider from '@react-native-community/slider';

const FilterModal = ({ visible, onClose, onApply, initialFilters, filterOptions }) => {
  const { colors } = useTheme();
  const [filters, setFilters] = useState({
    sportType: null,
    venueType: null,
    priceRange: null,
    radius: 10,
    verified: true,
    ...initialFilters
  });
  
  // Update filters when initialFilters change
  useEffect(() => {
    if (initialFilters) {
      setFilters({
        sportType: null,
        venueType: null,
        priceRange: null,
        radius: 10,
        verified: true,
        ...initialFilters
      });
    }
  }, [initialFilters]);
  
  const handleApply = () => {
    onApply(filters);
  };
  
  const handleReset = () => {
    setFilters({
      sportType: null,
      venueType: null,
      priceRange: null,
      radius: 10,
      verified: true
    });
  };
  
  const selectSportType = (sportType) => {
    setFilters(prev => ({
      ...prev,
      sportType: prev.sportType === sportType ? null : sportType
    }));
  };
  
  const selectVenueType = (venueType) => {
    setFilters(prev => ({
      ...prev,
      venueType: prev.venueType === venueType ? null : venueType
    }));
  };
  
  const selectPriceRange = (priceRange) => {
    setFilters(prev => ({
      ...prev,
      priceRange: prev.priceRange === priceRange ? null : priceRange
    }));
  };
  
  const toggleVerified = () => {
    setFilters(prev => ({
      ...prev,
      verified: !prev.verified
    }));
  };
  
  const formatRadius = (value) => {
    return `${value} km`;
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContainer, { backgroundColor: colors.cardBackground }]}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Bộ lọc tìm kiếm</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.content}>
                {/* Sport Type Filter */}
                <View style={styles.filterSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Loại thể thao
                  </Text>
                  <View style={styles.optionsGrid}>
                    {filterOptions?.sportTypeOptions?.map((option, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.optionButton,
                          filters.sportType === option.value && {
                            backgroundColor: colors.primary + '20',
                            borderColor: colors.primary
                          }
                        ]}
                        onPress={() => selectSportType(option.value)}
                      >
                        <MaterialCommunityIcons
                          name={option.icon || 'dumbbell'}
                          size={20}
                          color={filters.sportType === option.value ? colors.primary : colors.textLight}
                        />
                        <Text
                          style={[
                            styles.optionText,
                            { color: filters.sportType === option.value ? colors.primary : colors.text }
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                {/* Venue Type Filter */}
                <View style={styles.filterSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Loại địa điểm
                  </Text>
                  <View style={styles.optionsGrid}>
                    {filterOptions?.venueTypeOptions?.map((option, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.optionButton,
                          filters.venueType === option.value && {
                            backgroundColor: colors.primary + '20',
                            borderColor: colors.primary
                          }
                        ]}
                        onPress={() => selectVenueType(option.value)}
                      >
                        <MaterialIcons
                          name={option.icon || 'place'}
                          size={20}
                          color={filters.venueType === option.value ? colors.primary : colors.textLight}
                        />
                        <Text
                          style={[
                            styles.optionText,
                            { color: filters.venueType === option.value ? colors.primary : colors.text }
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                {/* Price Range Filter */}
                <View style={styles.filterSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Mức giá
                  </Text>
                  <View style={styles.optionsRow}>
                    {filterOptions?.priceRangeOptions?.map((option, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.priceButton,
                          filters.priceRange === option.value && {
                            backgroundColor: colors.primary + '20',
                            borderColor: colors.primary
                          }
                        ]}
                        onPress={() => selectPriceRange(option.value)}
                      >
                        <Text
                          style={[
                            styles.priceText,
                            { color: filters.priceRange === option.value ? colors.primary : colors.text }
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                {/* Radius Filter */}
                <View style={styles.filterSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Bán kính tìm kiếm
                    </Text>
                    <Text style={[styles.radiusValue, { color: colors.primary }]}>
                      {formatRadius(filters.radius)}
                    </Text>
                  </View>
                  <Slider
                    style={styles.slider}
                    minimumValue={1}
                    maximumValue={50}
                    step={1}
                    value={filters.radius}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, radius: value }))}
                    minimumTrackTintColor={colors.primary}
                    maximumTrackTintColor={colors.border}
                    thumbTintColor={colors.primary}
                  />
                  <View style={styles.sliderLabels}>
                    <Text style={{ color: colors.textLight }}>1km</Text>
                    <Text style={{ color: colors.textLight }}>50km</Text>
                  </View>
                </View>
                
                {/* Verified Filter */}
                <View style={styles.switchSection}>
                  <View style={styles.switchRow}>
                    <Text style={[styles.switchLabel, { color: colors.text }]}>
                      Chỉ hiện địa điểm đã xác thực
                    </Text>
                    <Switch
                      value={filters.verified}
                      onValueChange={toggleVerified}
                      trackColor={{ false: colors.border, true: colors.primary + '80' }}
                      thumbColor={filters.verified ? colors.primary : '#f4f3f4'}
                      ios_backgroundColor={colors.border}
                    />
                  </View>
                  <Text style={[styles.switchDescription, { color: colors.textLight }]}>
                    Địa điểm đã xác thực đã được kiểm tra và đảm bảo chất lượng
                  </Text>
                </View>
              </ScrollView>
              
              {/* Footer */}
              <View style={[styles.footer, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.resetButton, { borderColor: colors.border }]}
                  onPress={handleReset}
                >
                  <Text style={{ color: colors.text }}>Đặt lại</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.applyButton, { backgroundColor: colors.primary }]}
                  onPress={handleApply}
                >
                  <Text style={styles.applyButtonText}>Áp dụng</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  radiusValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    margin: 4,
  },
  optionText: {
    marginLeft: 6,
    fontSize: 14,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 4,
  },
  priceText: {
    fontSize: 14,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: -8,
  },
  switchSection: {
    marginBottom: 24,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 16,
    flex: 1,
  },
  switchDescription: {
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  applyButton: {
    flex: 2,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  applyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default FilterModal; 