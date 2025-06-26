import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const daysOfWeek = [
  { key: 'MONDAY', label: 'Thứ 2' },
  { key: 'TUESDAY', label: 'Thứ 3' },
  { key: 'WEDNESDAY', label: 'Thứ 4' },
  { key: 'THURSDAY', label: 'Thứ 5' },
  { key: 'FRIDAY', label: 'Thứ 6' },
  { key: 'SATURDAY', label: 'Thứ 7' },
  { key: 'SUNDAY', label: 'Chủ nhật' }
];

const OpeningHoursEditor = ({ openingHours, onChange, colors }) => {
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedType, setSelectedType] = useState(null); // 'open' or 'close'
  
  // Convert time string to Date object
  const timeStringToDate = (timeString) => {
    const date = new Date();
    if (!timeString) return date;
    
    const [hours, minutes] = timeString.split(':').map(Number);
    date.setHours(hours);
    date.setMinutes(minutes);
    return date;
  };
  
  // Convert Date object to time string
  const dateToTimeString = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  
  // Show time picker
  const showTimePicker = (day, type) => {
    setSelectedDay(day);
    setSelectedType(type);
    setTimePickerVisible(true);
  };
  

  
  // Toggle day open/closed
  const toggleDay = (day) => {
    const updatedHours = { ...openingHours };
    
    if (updatedHours[day] && (updatedHours[day].open || updatedHours[day].close)) {
      // Day is open, set to closed
      updatedHours[day] = null;
    } else {
      // Day is closed, set to open with default hours
      updatedHours[day] = { open: '07:00', close: '22:00' };
    }
    
    onChange(updatedHours);
  };
  
  // Copy hours from previous day
  const copyFromPrevious = (index) => {
    if (index === 0) return;
    
    const previousDay = daysOfWeek[index - 1].key;
    const currentDay = daysOfWeek[index].key;
    
    const updatedHours = { ...openingHours };
    updatedHours[currentDay] = updatedHours[previousDay] 
      ? { ...updatedHours[previousDay] } 
      : null;
    
    onChange(updatedHours);
  };
  
  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return '--:--';
    return timeString;
  };
  
  // Check if day is open
  const isDayOpen = (day) => {
    return openingHours[day] && (openingHours[day].open || openingHours[day].close);
  };
  
  return (
    <View style={styles.container}>
      {daysOfWeek.map((day, index) => (
        <View key={day.key} style={styles.dayRow}>
          <View style={styles.dayLabelContainer}>
            <Text style={[styles.dayLabel, { color: colors.text }]}>{day.label}</Text>
            
            {index > 0 && (
              <TouchableOpacity 
                style={styles.copyButton}
                onPress={() => copyFromPrevious(index)}
              >
                <Ionicons name="copy-outline" size={16} color={colors.textLight} />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.hoursContainer}>
            {isDayOpen(day.key) ? (
              <>
                <TouchableOpacity
                  style={[styles.timeButton, { borderColor: colors.border }]}
                  onPress={() => showTimePicker(day.key, 'open')}
                >
                  <Text style={{ color: colors.text }}>
                    {formatTime(openingHours[day.key]?.open)}
                  </Text>
                </TouchableOpacity>
                
                <Text style={[styles.timeSeparator, { color: colors.text }]}>-</Text>
                
                <TouchableOpacity
                  style={[styles.timeButton, { borderColor: colors.border }]}
                  onPress={() => showTimePicker(day.key, 'close')}
                >
                  <Text style={{ color: colors.text }}>
                    {formatTime(openingHours[day.key]?.close)}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={[styles.closedText, { color: colors.error }]}>Đóng cửa</Text>
            )}
            
            <Switch
              value={isDayOpen(day.key)}
              onValueChange={() => toggleDay(day.key)}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={isDayOpen(day.key) ? colors.primary : '#f4f3f4'}
              ios_backgroundColor={colors.border}
              style={styles.switch}
            />
          </View>
        </View>
      ))}
      
      <DateTimePickerModal
        isVisible={timePickerVisible}
        mode="time"
        date={timeStringToDate(openingHours[selectedDay]?.[selectedType])}
        onConfirm={(selectedDate) => {
          setTimePickerVisible(false);
          if (selectedDate) {
            const timeString = dateToTimeString(selectedDate);
            
            const updatedHours = { ...openingHours };
            if (!updatedHours[selectedDay]) {
              updatedHours[selectedDay] = { open: '07:00', close: '22:00' };
            }
            
            updatedHours[selectedDay][selectedType] = timeString;
            onChange(updatedHours);
          }
        }}
        onCancel={() => setTimePickerVisible(false)}
        locale="vi_VN"
        confirmTextIOS="Xác nhận"
        cancelTextIOS="Hủy"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dayLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  copyButton: {
    marginLeft: 8,
    padding: 4,
  },
  hoursContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  timeButton: {
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    minWidth: 70,
    alignItems: 'center',
  },
  timeSeparator: {
    marginHorizontal: 8,
    fontSize: 16,
  },
  closedText: {
    fontSize: 14,
    fontWeight: '500',
  },
  switch: {
    marginLeft: 12,
  }
});

export default OpeningHoursEditor; 