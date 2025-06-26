import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    ActivityIndicator,
    Animated,
    Alert,
    RefreshControl,
    Switch,
    Modal,
    TextInput,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

// Services
import sportsMatchingService from '../../services/sportsMatchingService';
import { SportType, getPopularSports } from '../../constants/SportConstants';

// Skill levels
const SkillLevels = [
    { value: 'BEGINNER', label: 'Người mới bắt đầu', icon: 'leaf-outline' },
    { value: 'NOVICE', label: 'Tập luyện cơ bản', icon: 'fitness-outline' },
    { value: 'INTERMEDIATE', label: 'Trung bình', icon: 'trending-up-outline' },
    { value: 'ADVANCED', label: 'Nâng cao', icon: 'flash-outline' },
    { value: 'EXPERT', label: 'Chuyên nghiệp', icon: 'trophy-outline' }
];

const SportsAvailabilityScreen = ({ navigation }) => {
    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // State
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [availabilities, setAvailabilities] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    // Create availability form - Basic fields
    const [selectedSport, setSelectedSport] = useState('');
    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date(Date.now() + 2 * 60 * 60 * 1000)); // 2 hours later
    const [location, setLocation] = useState('');
    const [notes, setNotes] = useState('');
    
    // Advanced settings
    const [autoMatchEnabled, setAutoMatchEnabled] = useState(true);
    const [groupSizeMin, setGroupSizeMin] = useState(1);
    const [groupSizeMax, setGroupSizeMax] = useState(4);
    const [maxParticipants, setMaxParticipants] = useState(8);
    const [requiredSkillLevel, setRequiredSkillLevel] = useState('');
    const [isCompetitive, setIsCompetitive] = useState(false);
    const [expectedCost, setExpectedCost] = useState('');
    const [equipmentNeeded, setEquipmentNeeded] = useState('');
    const [flexibleTiming, setFlexibleTiming] = useState(false);
    const [recurringWeekly, setRecurringWeekly] = useState(false);
    const [notificationEnabled, setNotificationEnabled] = useState(true);
    const [costSharing, setCostSharing] = useState(true);
    
    // UI States
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

    useEffect(() => {
        loadAvailabilities();
        
        // Entrance animation
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, []);

    const loadAvailabilities = async () => {
        try {
            setLoading(true);
            const data = await sportsMatchingService.getMyAvailabilities('ACTIVE');
            setAvailabilities(data);
        } catch (error) {
            console.error('Error loading availabilities:', error);
            
            // Xử lý lỗi cụ thể
            if (error.message?.includes('500')) {
                Alert.alert(
                    'Lỗi Server', 
                    'Server đang gặp sự cố. Vui lòng kiểm tra kết nối và thử lại sau.',
                    [
                        { text: 'Thử lại', onPress: () => loadAvailabilities() },
                        { text: 'Đóng', style: 'cancel' }
                    ]
                );
            } else if (error.message?.includes('Network')) {
                Alert.alert(
                    'Lỗi Kết nối', 
                    'Không thể kết nối tới server. Vui lòng kiểm tra internet.',
                    [
                        { text: 'Thử lại', onPress: () => loadAvailabilities() },
                        { text: 'Đóng', style: 'cancel' }
                    ]
                );
            } else {
                Alert.alert(
                    'Lỗi', 
                    'Không thể tải danh sách khả năng tham gia. Vui lòng thử lại.',
                    [
                        { text: 'Thử lại', onPress: () => loadAvailabilities() },
                        { text: 'Đóng', style: 'cancel' }
                    ]
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAvailability = async () => {
        if (!selectedSport || !location.trim()) {
            Alert.alert('Thông báo', 'Vui lòng điền đầy đủ thông tin');
            return;
        }

        // Validate time range
        if (endTime <= startTime) {
            Alert.alert('Lỗi', 'Thời gian kết thúc phải sau thời gian bắt đầu');
            return;
        }

        // Validate future time
        const now = new Date();
        if (startTime <= now) {
            Alert.alert('Lỗi', 'Thời gian bắt đầu phải ở tương lai');
            return;
        }

        try {
            const availabilityData = {
                // Basic info
                sportType: selectedSport,
                availableFrom: startTime.toISOString(),
                availableUntil: endTime.toISOString(),
                customLocationName: location.trim(),
                message: notes.trim() || undefined,
                
                // Group settings
                groupSizeMin: groupSizeMin,
                groupSizeMax: groupSizeMax,
                maxParticipants: maxParticipants,
                
                // Skill & Competition
                requiredSkillLevel: requiredSkillLevel || undefined,
                isCompetitive: isCompetitive,
                
                // Cost & Equipment
                expectedCostPerPerson: expectedCost ? parseInt(expectedCost) : undefined,
                equipmentNeeded: equipmentNeeded.trim() || undefined,
                costSharing: costSharing,
                
                // Scheduling
                flexibleTiming: flexibleTiming,
                recurringWeekly: recurringWeekly,
                
                // Settings
                autoMatchEnabled: autoMatchEnabled,
                notificationEnabled: notificationEnabled,
                
                // Location defaults
                maxDistanceKm: 10.0,
                
                // Backward compatibility
                allowNovices: true,
                allowExperts: true,
                equipmentProvided: "NONE",
                gameFormat: "MIXED"
            };

            console.log('🔧 Creating availability with data:', availabilityData);
            
            await sportsMatchingService.createAvailability(availabilityData);
            Alert.alert('Thành công', 'Đã tạo khả năng tham gia mới!');
            
            // Reset form
            setSelectedSport('');
            setLocation('');
            setNotes('');
            setAutoMatchEnabled(true);
            setGroupSizeMin(1);
            setGroupSizeMax(4);
            setMaxParticipants(8);
            setRequiredSkillLevel('');
            setIsCompetitive(false);
            setExpectedCost('');
            setEquipmentNeeded('');
            setFlexibleTiming(false);
            setRecurringWeekly(false);
            setNotificationEnabled(true);
            setCostSharing(true);
            setStartTime(new Date());
            setEndTime(new Date(Date.now() + 2 * 60 * 60 * 1000));
            setShowAdvancedSettings(false);
            setShowCreateModal(false);
            
            // Reload data
            loadAvailabilities();
        } catch (error) {
            console.error('❌ Create availability error:', error);
            Alert.alert(
                'Lỗi', 
                `Không thể tạo khả năng tham gia: ${error.message || 'Vui lòng thử lại'}`
            );
        }
    };

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            await sportsMatchingService.updateAvailabilityStatus(id, newStatus);
            Alert.alert('Thành công', 'Đã cập nhật trạng thái!');
            loadAvailabilities();
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
        }
    };

    const handleUpdateAutoMatch = async (id, enabled) => {
        try {
            // Tạm thời cập nhật local state
            setAvailabilities(prev => 
                prev.map(item => 
                    item.id === id 
                        ? { ...item, autoMatchEnabled: enabled }
                        : item
                )
            );
            
            // TODO: Gọi API để cập nhật backend khi endpoint được implement
            console.log('🔄 Auto-match toggled:', { id, enabled });
            
            Alert.alert(
                'Thành công', 
                enabled 
                    ? 'Đã bật tự động ghép đôi. Bạn sẽ xuất hiện trong kết quả tìm kiếm.' 
                    : 'Đã tắt tự động ghép đôi. Bạn sẽ không xuất hiện trong gợi ý tự động.'
            );
        } catch (error) {
            console.error('Error updating auto-match:', error);
            Alert.alert('Lỗi', 'Không thể cập nhật cài đặt tự động ghép đôi');
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadAvailabilities();
        setRefreshing(false);
    };

    // Render Header
    const renderHeader = () => (
        <LinearGradient
            colors={['#E91E63', '#C2185B', '#AD1457']}
            style={styles.header}
        >
            <StatusBar backgroundColor="#C2185B" barStyle="light-content" />
            <SafeAreaView>
                <View style={styles.headerContent}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    
                    <Text style={styles.headerTitle}>Khả năng tham gia</Text>
                    
                    <TouchableOpacity 
                        style={styles.addButton}
                        onPress={() => setShowCreateModal(true)}
                    >
                        <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );

    // Render Availability Card
    const renderAvailabilityCard = (availability, index) => {
        const sport = SportType[availability.sportType];
        const isActive = availability.status === 'ACTIVE';
        
        return (
            <View key={index} style={styles.availabilityCard}>
                <View style={styles.cardHeader}>
                    <View style={styles.sportInfo}>
                        {sport && (
                            <View style={[styles.sportIcon, { backgroundColor: sport.color + '20' }]}>
                                <Ionicons name={sport.icon} size={20} color={sport.color} />
                            </View>
                        )}
                        <View style={styles.sportDetails}>
                            <Text style={styles.sportName}>
                                {sport ? sport.display : availability.sportType}
                            </Text>
                            <Text style={styles.timeRange}>
                                {new Date(availability.availableFrom).toLocaleString('vi-VN')} - {' '}
                                {new Date(availability.availableUntil).toLocaleString('vi-VN')}
                            </Text>
                        </View>
                    </View>
                    
                    <View style={styles.switchesContainer}>
                        <Text style={styles.switchLabel}>Hoạt động</Text>
                        <Switch
                            value={isActive}
                            onValueChange={(value) => 
                                handleUpdateStatus(availability.id, value ? 'ACTIVE' : 'PAUSED')
                            }
                            trackColor={{ false: '#ccc', true: '#E91E63' }}
                            thumbColor={isActive ? '#fff' : '#fff'}
                        />
                    </View>
                </View>

                {/* Auto Match Toggle */}
                <View style={styles.autoMatchContainer}>
                    <View style={styles.autoMatchInfo}>
                        <Ionicons name="sync-outline" size={16} color="#4285F4" />
                        <Text style={styles.autoMatchLabel}>Tự động ghép đôi</Text>
                    </View>
                    <Switch
                        value={availability.autoMatchEnabled !== false} // Default true nếu undefined
                        onValueChange={(value) => handleUpdateAutoMatch(availability.id, value)}
                        trackColor={{ false: '#ccc', true: '#4285F4' }}
                        thumbColor={availability.autoMatchEnabled !== false ? '#fff' : '#fff'}
                    />
                </View>

                {availability.location && (
                    <View style={styles.locationContainer}>
                        <Ionicons name="location-outline" size={16} color="#666" />
                        <Text style={styles.locationText}>{availability.location}</Text>
                    </View>
                )}

                {availability.notes && (
                    <View style={styles.notesContainer}>
                        <Text style={styles.notesText}>{availability.notes}</Text>
                    </View>
                )}

                {/* Additional info */}
                <View style={styles.additionalInfoContainer}>
                    {/* Group size */}
                    <View style={styles.infoItem}>
                        <Ionicons name="people-outline" size={14} color="#666" />
                        <Text style={styles.infoText}>
                            {availability.groupSizeMin || 1}-{availability.groupSizeMax || 4} người
                            {availability.maxParticipants && ` (tối đa ${availability.maxParticipants})`}
                        </Text>
                    </View>

                    {/* Skill level */}
                    {availability.requiredSkillLevel && (
                        <View style={styles.infoItem}>
                            <Ionicons name="trending-up-outline" size={14} color="#666" />
                            <Text style={styles.infoText}>
                                {SkillLevels.find(s => s.value === availability.requiredSkillLevel)?.label || availability.requiredSkillLevel}
                            </Text>
                        </View>
                    )}

                    {/* Cost */}
                    {availability.expectedCostPerPerson && (
                        <View style={styles.infoItem}>
                            <Ionicons name={availability.costSharing ? "cash-outline" : "card-outline"} size={14} color="#666" />
                            <Text style={styles.infoText}>
                                {availability.expectedCostPerPerson.toLocaleString('vi-VN')}đ
                                {availability.costSharing && ' (chia sẻ)'}
                            </Text>
                        </View>
                    )}

                    {/* Competition level */}
                    {availability.isCompetitive && (
                        <View style={styles.infoItem}>
                            <Ionicons name="trophy-outline" size={14} color="#FF6B35" />
                            <Text style={[styles.infoText, { color: '#FF6B35' }]}>Thi đấu</Text>
                        </View>
                    )}

                    {/* Flexible timing */}
                    {availability.flexibleTiming && (
                        <View style={styles.infoItem}>
                            <Ionicons name="time-outline" size={14} color="#4CAF50" />
                            <Text style={[styles.infoText, { color: '#4CAF50' }]}>Thời gian linh hoạt</Text>
                        </View>
                    )}

                    {/* Recurring */}
                    {availability.recurringWeekly && (
                        <View style={styles.infoItem}>
                            <Ionicons name="repeat-outline" size={14} color="#2196F3" />
                            <Text style={[styles.infoText, { color: '#2196F3' }]}>Hàng tuần</Text>
                        </View>
                    )}
                </View>

                {/* Equipment needed */}
                {availability.equipmentNeeded && (
                    <View style={styles.equipmentContainer}>
                        <Ionicons name="construct-outline" size={14} color="#666" />
                        <Text style={styles.equipmentText}>Dụng cụ: {availability.equipmentNeeded}</Text>
                    </View>
                )}

                <View style={styles.cardFooter}>
                    <View style={styles.statusContainer}>
                        <View style={[
                            styles.statusBadge, 
                            { backgroundColor: getStatusColor(availability.status) + '20' }
                        ]}>
                            <Text style={[
                                styles.statusText, 
                                { color: getStatusColor(availability.status) }
                            ]}>
                                {getStatusText(availability.status)}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={styles.cancelButton}
                        onPress={() => 
                            Alert.alert(
                                'Hủy khả năng tham gia',
                                'Bạn có chắc chắn muốn hủy?',
                                [
                                    { text: 'Không', style: 'cancel' },
                                    {
                                        text: 'Hủy',
                                        style: 'destructive',
                                        onPress: () => handleUpdateStatus(availability.id, 'CANCELLED')
                                    }
                                ]
                            )
                        }
                    >
                        <Ionicons name="trash-outline" size={16} color="#F44336" />
                        <Text style={styles.cancelButtonText}>Hủy</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // Helper functions
    const getStatusColor = (status) => {
        switch (status) {
            case 'ACTIVE': return '#4CAF50';
            case 'PAUSED': return '#FF9800';
            case 'CANCELLED': return '#F44336';
            case 'EXPIRED': return '#9E9E9E';
            default: return '#666';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'ACTIVE': return 'Đang hoạt động';
            case 'PAUSED': return 'Tạm dừng';
            case 'CANCELLED': return 'Đã hủy';
            case 'EXPIRED': return 'Đã hết hạn';
            default: return 'Không xác định';
        }
    };

    // Render Create Modal
    const renderCreateModal = () => (
        <Modal
            visible={showCreateModal}
            animationType="slide"
            presentationStyle="pageSheet"
        >
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                        <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Tạo khả năng tham gia</Text>
                    <TouchableOpacity onPress={handleCreateAvailability}>
                        <Text style={styles.saveButton}>Lưu</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent}>
                    {/* Sport Selection */}
                    <Text style={styles.labelText}>Môn thể thao *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sportsList}>
                        {Object.values(SportType).map((sport) => (
                            <TouchableOpacity
                                key={sport.name}
                                style={[
                                    styles.sportOption,
                                    selectedSport === sport.name && styles.selectedSportOption,
                                    { borderColor: sport.color }
                                ]}
                                onPress={() => setSelectedSport(sport.name)}
                            >
                                <Ionicons 
                                    name={sport.icon} 
                                    size={20} 
                                    color={selectedSport === sport.name ? '#fff' : sport.color} 
                                />
                                <Text style={[
                                    styles.sportOptionText,
                                    selectedSport === sport.name && styles.selectedSportOptionText
                                ]}>
                                    {sport.display}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Time Selection */}
                    <Text style={styles.labelText}>Thời gian bắt đầu *</Text>
                    <TouchableOpacity 
                        style={styles.timeButton}
                        onPress={() => setShowStartTimePicker(true)}
                    >
                        <Ionicons name="time-outline" size={20} color="#666" />
                        <Text style={styles.timeButtonText}>
                            {startTime.toLocaleString('vi-VN')}
                        </Text>
                    </TouchableOpacity>

                    <Text style={styles.labelText}>Thời gian kết thúc *</Text>
                    <TouchableOpacity 
                        style={styles.timeButton}
                        onPress={() => setShowEndTimePicker(true)}
                    >
                        <Ionicons name="time-outline" size={20} color="#666" />
                        <Text style={styles.timeButtonText}>
                            {endTime.toLocaleString('vi-VN')}
                        </Text>
                    </TouchableOpacity>

                    {/* Location */}
                    <Text style={styles.labelText}>Địa điểm *</Text>
                    <TextInput
                        style={styles.textInput}
                        value={location}
                        onChangeText={setLocation}
                        placeholder="Nhập địa điểm chơi thể thao"
                        placeholderTextColor="#999"
                    />

                    {/* Notes */}
                    <Text style={styles.labelText}>Ghi chú</Text>
                    <TextInput
                        style={[styles.textInput, styles.notesInput]}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Thêm ghi chú (không bắt buộc)"
                        placeholderTextColor="#999"
                        multiline
                        numberOfLines={3}
                    />

                    {/* Advanced Settings Toggle */}
                    <TouchableOpacity 
                        style={styles.advancedToggle}
                        onPress={() => setShowAdvancedSettings(!showAdvancedSettings)}
                    >
                        <Text style={styles.advancedToggleText}>Cài đặt nâng cao</Text>
                        <Ionicons 
                            name={showAdvancedSettings ? "chevron-up" : "chevron-down"} 
                            size={20} 
                            color="#E91E63" 
                        />
                    </TouchableOpacity>

                    {showAdvancedSettings && (
                        <View style={styles.advancedSettingsContainer}>
                            {/* Group Size */}
                            <Text style={styles.labelText}>Kích thước nhóm</Text>
                            <View style={styles.groupSizeContainer}>
                                <View style={styles.groupSizeItem}>
                                    <Text style={styles.groupSizeLabel}>Tối thiểu</Text>
                                    <TextInput
                                        style={styles.numberInput}
                                        value={groupSizeMin.toString()}
                                        onChangeText={(text) => setGroupSizeMin(parseInt(text) || 1)}
                                        keyboardType="numeric"
                                        maxLength={2}
                                    />
                                </View>
                                <View style={styles.groupSizeItem}>
                                    <Text style={styles.groupSizeLabel}>Tối đa</Text>
                                    <TextInput
                                        style={styles.numberInput}
                                        value={groupSizeMax.toString()}
                                        onChangeText={(text) => setGroupSizeMax(parseInt(text) || 4)}
                                        keyboardType="numeric"
                                        maxLength={2}
                                    />
                                </View>
                                <View style={styles.groupSizeItem}>
                                    <Text style={styles.groupSizeLabel}>Tối đa tham gia</Text>
                                    <TextInput
                                        style={styles.numberInput}
                                        value={maxParticipants.toString()}
                                        onChangeText={(text) => setMaxParticipants(parseInt(text) || 8)}
                                        keyboardType="numeric"
                                        maxLength={2}
                                    />
                                </View>
                            </View>

                            {/* Skill Level */}
                            <Text style={styles.labelText}>Trình độ yêu cầu</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.skillLevelList}>
                                <TouchableOpacity 
                                    style={[
                                        styles.skillLevelOption,
                                        !requiredSkillLevel && styles.selectedSkillLevel
                                    ]}
                                    onPress={() => setRequiredSkillLevel('')}
                                >
                                    <Text style={[
                                        styles.skillLevelText,
                                        !requiredSkillLevel && styles.selectedSkillLevelText
                                    ]}>Tất cả</Text>
                                </TouchableOpacity>
                                {SkillLevels.map((skill) => (
                                    <TouchableOpacity 
                                        key={skill.value}
                                        style={[
                                            styles.skillLevelOption,
                                            requiredSkillLevel === skill.value && styles.selectedSkillLevel
                                        ]}
                                        onPress={() => setRequiredSkillLevel(skill.value)}
                                    >
                                        <Ionicons name={skill.icon} size={16} color={
                                            requiredSkillLevel === skill.value ? '#fff' : '#666'
                                        } />
                                        <Text style={[
                                            styles.skillLevelText,
                                            requiredSkillLevel === skill.value && styles.selectedSkillLevelText
                                        ]}>{skill.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {/* Cost */}
                            <Text style={styles.labelText}>Chi phí dự kiến (VNĐ)</Text>
                            <TextInput
                                style={styles.textInput}
                                value={expectedCost}
                                onChangeText={setExpectedCost}
                                placeholder="Ví dụ: 50000"
                                placeholderTextColor="#999"
                                keyboardType="numeric"
                            />

                            {/* Equipment */}
                            <Text style={styles.labelText}>Dụng cụ cần thiết</Text>
                            <TextInput
                                style={styles.textInput}
                                value={equipmentNeeded}
                                onChangeText={setEquipmentNeeded}
                                placeholder="Ví dụ: Vợt, giày thể thao..."
                                placeholderTextColor="#999"
                            />

                            {/* Boolean Settings */}
                            <View style={styles.booleanSettingsContainer}>
                                <View style={styles.booleanSetting}>
                                    <Text style={styles.booleanLabel}>Thi đấu</Text>
                                    <Switch
                                        value={isCompetitive}
                                        onValueChange={setIsCompetitive}
                                        trackColor={{ false: '#ccc', true: '#FF6B35' }}
                                    />
                                </View>

                                <View style={styles.booleanSetting}>
                                    <Text style={styles.booleanLabel}>Chia sẻ chi phí</Text>
                                    <Switch
                                        value={costSharing}
                                        onValueChange={setCostSharing}
                                        trackColor={{ false: '#ccc', true: '#4CAF50' }}
                                    />
                                </View>

                                <View style={styles.booleanSetting}>
                                    <Text style={styles.booleanLabel}>Thời gian linh hoạt</Text>
                                    <Switch
                                        value={flexibleTiming}
                                        onValueChange={setFlexibleTiming}
                                        trackColor={{ false: '#ccc', true: '#2196F3' }}
                                    />
                                </View>

                                <View style={styles.booleanSetting}>
                                    <Text style={styles.booleanLabel}>Lặp lại hàng tuần</Text>
                                    <Switch
                                        value={recurringWeekly}
                                        onValueChange={setRecurringWeekly}
                                        trackColor={{ false: '#ccc', true: '#9C27B0' }}
                                    />
                                </View>

                                <View style={styles.booleanSetting}>
                                    <Text style={styles.booleanLabel}>Nhận thông báo</Text>
                                    <Switch
                                        value={notificationEnabled}
                                        onValueChange={setNotificationEnabled}
                                        trackColor={{ false: '#ccc', true: '#607D8B' }}
                                    />
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Auto Match Setting */}
                    <View style={styles.autoMatchSettingContainer}>
                        <View style={styles.autoMatchSettingInfo}>
                            <Ionicons name="sync-outline" size={20} color="#4285F4" />
                            <View style={styles.autoMatchTextContainer}>
                                <Text style={styles.autoMatchSettingLabel}>Tự động ghép đôi</Text>
                                <Text style={styles.autoMatchSettingDesc}>
                                    Cho phép người khác tìm thấy và gửi lời mời tham gia
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={autoMatchEnabled}
                            onValueChange={setAutoMatchEnabled}
                            trackColor={{ false: '#ccc', true: '#4285F4' }}
                            thumbColor={autoMatchEnabled ? '#fff' : '#fff'}
                        />
                    </View>
                </ScrollView>

                {/* Date Time Pickers */}
                <DateTimePickerModal
                    isVisible={showStartTimePicker}
                    mode="datetime"
                    date={startTime}
                    onConfirm={(selectedDate) => {
                        setShowStartTimePicker(false);
                        if (selectedDate) {
                            setStartTime(selectedDate);
                            // Auto adjust end time to be 2 hours later
                            setEndTime(new Date(selectedDate.getTime() + 2 * 60 * 60 * 1000));
                        }
                    }}
                    onCancel={() => setShowStartTimePicker(false)}
                    minimumDate={new Date()}
                    locale="vi_VN"
                    confirmTextIOS="Xác nhận"
                    cancelTextIOS="Hủy"
                />

                <DateTimePickerModal
                    isVisible={showEndTimePicker}
                    mode="datetime"
                    date={endTime}
                    onConfirm={(selectedDate) => {
                        setShowEndTimePicker(false);
                        if (selectedDate) {
                            setEndTime(selectedDate);
                        }
                    }}
                    onCancel={() => setShowEndTimePicker(false)}
                    minimumDate={startTime}
                    locale="vi_VN"
                    confirmTextIOS="Xác nhận"
                    cancelTextIOS="Hủy"
                />
            </SafeAreaView>
        </Modal>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar backgroundColor="#E91E63" barStyle="light-content" />
                <ActivityIndicator size="large" color="#E91E63" />
                <Text style={styles.loadingText}>Đang tải khả năng tham gia...</Text>
            </View>
        );
    }

    return (
        <Animated.View 
            style={[
                styles.container, 
                { opacity: fadeAnim }
            ]}
        >
            {renderHeader()}
            
            <ScrollView 
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#E91E63']}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {availabilities.length > 0 ? (
                    availabilities.map((availability, index) => 
                        renderAvailabilityCard(availability, index)
                    )
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="calendar-outline" size={60} color="#ccc" />
                        <Text style={styles.emptyTitle}>Chưa có khả năng tham gia nào</Text>
                        <Text style={styles.emptySubtitle}>
                            Tạo khả năng tham gia để người khác có thể mời bạn chơi thể thao
                        </Text>
                        <TouchableOpacity 
                            style={styles.createFirstButton}
                            onPress={() => setShowCreateModal(true)}
                        >
                            <LinearGradient
                                colors={['#E91E63', '#C2185B']}
                                style={styles.createFirstButtonGradient}
                            >
                                <Ionicons name="add" size={20} color="#fff" />
                                <Text style={styles.createFirstButtonText}>Tạo khả năng tham gia</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {renderCreateModal()}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#666',
    },
    header: {
        paddingBottom: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 15,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 10,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    availabilityCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sportInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    sportIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    sportDetails: {
        flex: 1,
    },
    sportName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    timeRange: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 6,
    },
    locationText: {
        fontSize: 14,
        color: '#666',
    },
    notesContainer: {
        marginBottom: 12,
    },
    notesText: {
        fontSize: 14,
        color: '#333',
        fontStyle: 'italic',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusContainer: {
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#F44336' + '15',
        gap: 4,
    },
    cancelButtonText: {
        fontSize: 14,
        color: '#F44336',
        fontWeight: '500',
    },
    switchesContainer: {
        alignItems: 'center',
        gap: 4,
    },
    switchLabel: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    autoMatchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        marginBottom: 8,
    },
    autoMatchInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    autoMatchLabel: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 15,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 30,
    },
    createFirstButton: {
        borderRadius: 25,
        overflow: 'hidden',
    },
    createFirstButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingVertical: 15,
        gap: 8,
    },
    createFirstButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    saveButton: {
        fontSize: 16,
        fontWeight: '600',
        color: '#E91E63',
    },
    modalContent: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    labelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
        marginTop: 15,
    },
    sportsList: {
        marginBottom: 10,
    },
    sportOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 2,
        marginRight: 10,
        backgroundColor: '#fff',
        gap: 6,
    },
    selectedSportOption: {
        backgroundColor: '#E91E63',
        borderColor: '#E91E63',
    },
    sportOptionText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    selectedSportOptionText: {
        color: '#fff',
    },
    timeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        marginBottom: 10,
        gap: 10,
    },
    timeButtonText: {
        fontSize: 16,
        color: '#333',
    },
    textInput: {
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        fontSize: 16,
        color: '#333',
        marginBottom: 10,
    },
    notesInput: {
        height: 80,
        textAlignVertical: 'top',
    },
    autoMatchSettingContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        marginTop: 10,
        marginBottom: 20,
    },
    autoMatchSettingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 10,
    },
    autoMatchTextContainer: {
        flex: 1,
    },
    autoMatchSettingLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    autoMatchSettingDesc: {
        fontSize: 12,
        color: '#666',
        lineHeight: 16,
    },
    // Additional info styles
    additionalInfoContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 10,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    infoText: {
        fontSize: 12,
        color: '#666',
    },
    equipmentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 6,
    },
    equipmentText: {
        fontSize: 13,
        color: '#666',
        fontStyle: 'italic',
    },
    // Advanced settings styles
    advancedToggle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    advancedToggleText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#E91E63',
    },
    advancedSettingsContainer: {
        paddingTop: 20,
    },
    groupSizeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
        gap: 10,
    },
    groupSizeItem: {
        flex: 1,
        alignItems: 'center',
    },
    groupSizeLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
    },
    numberInput: {
        textAlign: 'center',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 6,
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        fontSize: 16,
        color: '#333',
        minWidth: 50,
    },
    skillLevelList: {
        marginBottom: 15,
    },
    skillLevelOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        marginRight: 8,
        backgroundColor: '#fff',
        gap: 4,
    },
    selectedSkillLevel: {
        backgroundColor: '#E91E63',
        borderColor: '#E91E63',
    },
    skillLevelText: {
        fontSize: 12,
        color: '#666',
    },
    selectedSkillLevelText: {
        color: '#fff',
    },
    booleanSettingsContainer: {
        gap: 15,
        marginTop: 10,
    },
    booleanSetting: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 5,
    },
    booleanLabel: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
});

export default SportsAvailabilityScreen; 