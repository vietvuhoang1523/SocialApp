import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { styles } from './styles';

const CustomDatePicker = ({ visible, tempDate, setTempDate, onCancel, onConfirm }) => {
    // Tạo mảng cho date picker
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
        >
            <View style={styles.modalBackground}>
                <View style={styles.datePickerModal}>
                    <Text style={styles.datePickerTitle}>Chọn ngày sinh</Text>

                    <View style={styles.datePickerContainer}>
                        {/* Day Picker */}
                        <View style={styles.datePickerColumn}>
                            <Text style={styles.datePickerLabel}>Ngày</Text>
                            <ScrollView style={styles.pickerScrollView}>
                                {days.map(day => (
                                    <TouchableOpacity
                                        key={`day-${day}`}
                                        style={[
                                            styles.dateOption,
                                            tempDate.day === day && styles.selectedDateOption
                                        ]}
                                        onPress={() => setTempDate({...tempDate, day})}
                                    >
                                        <Text
                                            style={[
                                                styles.dateOptionText,
                                                tempDate.day === day && styles.selectedDateOptionText
                                            ]}
                                        >
                                            {day}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Month Picker */}
                        <View style={styles.datePickerColumn}>
                            <Text style={styles.datePickerLabel}>Tháng</Text>
                            <ScrollView style={styles.pickerScrollView}>
                                {months.map(month => (
                                    <TouchableOpacity
                                        key={`month-${month}`}
                                        style={[
                                            styles.dateOption,
                                            tempDate.month === month && styles.selectedDateOption
                                        ]}
                                        onPress={() => setTempDate({...tempDate, month})}
                                    >
                                        <Text
                                            style={[
                                                styles.dateOptionText,
                                                tempDate.month === month && styles.selectedDateOptionText
                                            ]}
                                        >
                                            {month}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Year Picker */}
                        <View style={styles.datePickerColumn}>
                            <Text style={styles.datePickerLabel}>Năm</Text>
                            <ScrollView style={styles.pickerScrollView}>
                                {years.map(year => (
                                    <TouchableOpacity
                                        key={`year-${year}`}
                                        style={[
                                            styles.dateOption,
                                            tempDate.year === year && styles.selectedDateOption
                                        ]}
                                        onPress={() => setTempDate({...tempDate, year})}
                                    >
                                        <Text
                                            style={[
                                                styles.dateOptionText,
                                                tempDate.year === year && styles.selectedDateOptionText
                                            ]}
                                        >
                                            {year}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>

                    <View style={styles.datePickerButtons}>
                        <TouchableOpacity
                            style={[styles.datePickerButton, styles.cancelButton]}
                            onPress={onCancel}
                        >
                            <Text style={styles.cancelButtonText}>Hủy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.datePickerButton, styles.confirmButton]}
                            onPress={onConfirm}
                        >
                            <Text style={styles.confirmButtonText}>Xác nhận</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default CustomDatePicker;
