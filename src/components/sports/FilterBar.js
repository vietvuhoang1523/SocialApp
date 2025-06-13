import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../hook/ThemeContext';
import { SportTypeNames } from '../../constants/SportConstants';

const FilterBar = ({ onFilterChange = () => {} }) => {
  const { colors } = useTheme();
  
  // This is a simplified version - the full implementation would include 
  // the filter functionality from SportsAvailability.java fields
  
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity
          style={[styles.filterButton, { borderColor: colors.border }]}
          onPress={() => {
            // In the full implementation, this would open a filter modal
            console.log('Open filter modal');
          }}
        >
          <Ionicons name="filter" size={16} color={colors.text} />
          <Text style={[styles.filterText, { color: colors.text }]}>Bộ lọc</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterChip, { backgroundColor: colors.primary + '20' }]}
        >
          <FontAwesome5 name="running" size={14} color={colors.primary} />
          <Text style={[styles.chipText, { color: colors.primary }]}>
            {SportTypeNames.RUNNING}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterChip, { backgroundColor: colors.secondary + '20' }]}
        >
          <Ionicons name="calendar" size={14} color={colors.secondary} />
          <Text style={[styles.chipText, { color: colors.secondary }]}>Hôm nay</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterChip, { backgroundColor: colors.info + '20' }]}
        >
          <Ionicons name="location" size={14} color={colors.info} />
          <Text style={[styles.chipText, { color: colors.info }]}>5km</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  scrollContent: {
    paddingRight: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  filterText: {
    marginLeft: 8,
    fontSize: 14,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  chipText: {
    marginLeft: 8,
    fontSize: 14,
  },
});

export default FilterBar; 