import React, { useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';

const CustomDatePicker = ({ 
  value, 
  onChange, 
  mode = 'date', 
  placeholder = 'Chọn ngày',
  style,
  minimumDate,
  maximumDate,
  locale = 'vi'
}) => {
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (date) => {
    onChange && onChange(date);
    hideDatePicker();
  };

  const formatDate = (date) => {
    if (!date) return placeholder;
    
    if (mode === 'time') {
      return moment(date).format('HH:mm');
    } else if (mode === 'datetime') {
      return moment(date).format('DD/MM/YYYY HH:mm');
    } else {
      return moment(date).format('DD/MM/YYYY');
    }
  };

  const getIcon = () => {
    switch (mode) {
      case 'time':
        return 'time-outline';
      case 'datetime':
        return 'calendar-outline';
      default:
        return 'calendar-outline';
    }
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity style={styles.dateButton} onPress={showDatePicker}>
        <Ionicons name={getIcon()} size={20} color="#666" style={styles.icon} />
        <Text style={[styles.dateText, !value && styles.placeholderText]}>
          {formatDate(value)}
        </Text>
      </TouchableOpacity>
      
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode={mode}
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
        date={value || new Date()}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        locale={locale}
        confirmTextIOS="Xác nhận"
        cancelTextIOS="Hủy"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  icon: {
    marginRight: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
});

export default CustomDatePicker; 