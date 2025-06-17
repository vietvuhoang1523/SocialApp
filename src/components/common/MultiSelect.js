import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

const MultiSelect = ({ 
  items = [], 
  selectedItems = [], 
  onSelectedItemsChange,
  placeholder = 'Select items',
  colors
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  // Toggle item selection
  const toggleItem = (value) => {
    let result = [...selectedItems];
    
    if (selectedItems.includes(value)) {
      result = result.filter(item => item !== value);
    } else {
      result.push(value);
    }
    
    onSelectedItemsChange(result);
  };
  
  // Get selected item labels
  const getSelectedItemsLabels = () => {
    return items
      .filter(item => selectedItems.includes(item.value))
      .map(item => item.label);
  };
  
  // Render selected items as tags
  const renderSelectedItems = () => {
    const selectedLabels = getSelectedItemsLabels();
    
    if (selectedLabels.length === 0) {
      return (
        <Text style={[styles.placeholder, { color: colors.textLight }]}>
          {placeholder}
        </Text>
      );
    }
    
    return (
      <View style={styles.selectedItemsContainer}>
        {selectedLabels.map((label, index) => (
          <View 
            key={index} 
            style={[styles.selectedItemTag, { backgroundColor: colors.primary + '20' }]}
          >
            <Text style={[styles.selectedItemText, { color: colors.primary }]}>
              {label}
            </Text>
          </View>
        ))}
      </View>
    );
  };
  
  // Render item in modal
  const renderItem = ({ item }) => {
    const isSelected = selectedItems.includes(item.value);
    const icon = item.icon || 'circle';
    
    return (
      <TouchableOpacity
        style={[
          styles.item,
          isSelected && { backgroundColor: colors.primary + '10' }
        ]}
        onPress={() => toggleItem(item.value)}
      >
        <View style={styles.itemContent}>
          {item.icon && (
            <MaterialCommunityIcons 
              name={icon} 
              size={20} 
              color={isSelected ? colors.primary : colors.textLight}
              style={styles.itemIcon}
            />
          )}
          <Text style={[styles.itemText, { color: colors.text }]}>
            {item.label}
          </Text>
        </View>
        
        <View style={[
          styles.checkbox,
          isSelected ? { backgroundColor: colors.primary } : { borderColor: colors.border }
        ]}>
          {isSelected && (
            <Ionicons name="checkmark" size={16} color="white" />
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <View>
      {/* Selection field */}
      <TouchableOpacity
        style={[
          styles.selectField,
          { 
            backgroundColor: colors.inputBackground,
            borderColor: colors.border
          }
        ]}
        onPress={() => setModalVisible(true)}
      >
        {renderSelectedItems()}
        <Ionicons name="chevron-down" size={20} color={colors.textLight} />
      </TouchableOpacity>
      
      {/* Selection modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {placeholder}
                  </Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                
                <FlatList
                  data={items}
                  renderItem={renderItem}
                  keyExtractor={(item) => item.value.toString()}
                  contentContainerStyle={styles.itemsList}
                />
                
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.clearButton, { borderColor: colors.border }]}
                    onPress={() => {
                      onSelectedItemsChange([]);
                    }}
                  >
                    <Text style={{ color: colors.text }}>Xóa hết</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.doneButton, { backgroundColor: colors.primary }]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.doneButtonText}>Xong</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  placeholder: {
    flex: 1,
    fontSize: 16,
  },
  selectedItemsContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 4,
  },
  selectedItemTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  selectedItemText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemsList: {
    paddingVertical: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    marginRight: 12,
  },
  itemText: {
    fontSize: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  clearButton: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  doneButton: {
    flex: 2,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  }
});

export default MultiSelect; 