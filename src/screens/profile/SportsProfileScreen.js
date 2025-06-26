import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Alert,
    ActivityIndicator,
    Dimensions,
    Switch,
    Modal,
    Animated
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';

// Services
import sportsProfileService from '../../services/sportsProfileService';
// Add ProfileContext import
import { useProfileContext } from '../../components/ProfileContext';

const { width: screenWidth } = Dimensions.get('window');

// Enums matching backend
const SportType = {
    FOOTBALL: { name: 'FOOTBALL', display: 'Bóng đá', icon: 'football' },
    BASKETBALL: { name: 'BASKETBALL', display: 'Bóng rổ', icon: 'basketball' },
    TENNIS: { name: 'TENNIS', display: 'Tennis', icon: 'tennisball' },
    BADMINTON: { name: 'BADMINTON', display: 'Cầu lông', icon: 'fitness' },
    VOLLEYBALL: { name: 'VOLLEYBALL', display: 'Bóng chuyền', icon: 'american-football' },
    SWIMMING: { name: 'SWIMMING', display: 'Bơi lội', icon: 'water' },
    RUNNING: { name: 'RUNNING', display: 'Chạy bộ', icon: 'walk' },
    GYM: { name: 'GYM', display: 'Gym', icon: 'barbell' },
    CYCLING: { name: 'CYCLING', display: 'Đạp xe', icon: 'bicycle' },
    YOGA: { name: 'YOGA', display: 'Yoga', icon: 'leaf' }
};

const SkillLevel = {
    BEGINNER: { name: 'BEGINNER', display: 'Mới bắt đầu', color: '#4CAF50' },
    INTERMEDIATE: { name: 'INTERMEDIATE', display: 'Trung bình', color: '#FF9800' },
    ADVANCED: { name: 'ADVANCED', display: 'Nâng cao', color: '#F44336' },
    PROFESSIONAL: { name: 'PROFESSIONAL', display: 'Chuyên nghiệp', color: '#9C27B0' }
};

const ActivityLevel = {
    LOW: { name: 'LOW', display: 'Thấp (1-2 lần/tuần)', color: '#E0E0E0' },
    MODERATE: { name: 'MODERATE', display: 'Vừa phải (3-4 lần/tuần)', color: '#FFEB3B' },
    HIGH: { name: 'HIGH', display: 'Cao (5-6 lần/tuần)', color: '#FF9800' },
    VERY_HIGH: { name: 'VERY_HIGH', display: 'Rất cao (hàng ngày)', color: '#F44336' }
};

const PlayingTime = {
    MORNING: 'Buổi sáng (6-12h)',
    AFTERNOON: 'Buổi chiều (12-18h)',
    EVENING: 'Buổi tối (18-22h)',
    NIGHT: 'Buổi khuya (22-6h)'
};

const DominantHand = {
    LEFT: 'Tay trái',
    RIGHT: 'Tay phải',
    BOTH: 'Cả hai tay'
};

const SportsProfileScreen = ({ navigation, route }) => {
    const currentUser = route.params?.currentUser;
    const isViewMode = route.params?.isViewMode || false;
    const userId = route.params?.userId || currentUser?.id;

    // Use ProfileContext for enhanced sports profile management
    const { 
        sportsProfile, 
        sportsLoading, 
        createOrUpdateSportsProfile, 
        refreshSportsProfile,
        hasSportsProfile,
        getSportsStats,
        error,
        clearError 
    } = useProfileContext();

    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    // State for profile data
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profileData, setProfileData] = useState({
        favoriteSports: [],
        skillLevel: null,
        activityLevel: null,
        primarySport: '',
        yearsOfExperience: '',
        coachingCertifications: '',
        achievements: '',
        height: '',
        weight: '',
        dominantHand: null,
        preferredPlayingTime: null,
        openToCoaching: false,
        availableForTraining: false,
        lookingForPartner: false,
        lookingForTeam: false,
        homeGym: '',
        preferredLocations: '',
        maxTravelDistance: '',
        fitnessGoals: '',
        competitionGoals: '',
        allowTrainingInvites: true,
        allowEventInvites: true,
        allowMatchRequests: true
    });

    // UI State
    const [showSportPicker, setShowSportPicker] = useState(false);
    const [activeSection, setActiveSection] = useState('basic');

    // Entrance animation
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    // Load profile data
    useEffect(() => {
        try {
            loadSportsProfile();
        } catch (error) {
            console.error('Error in profile loading effect:', error);
            setLoading(false);
            Alert.alert('Lỗi', 'Có lỗi xảy ra khi tải thông tin profile');
        }
    }, [userId]);

    const loadSportsProfile = async () => {
        try {
            setLoading(true);
            let response;
            
            if (userId === currentUser?.id) {
                // Fetching current user's profile
                response = await sportsProfileService.getMyProfile();
            } else {
                // Fetching another user's profile
                response = await sportsProfileService.getProfileByUserId(userId);
            }
            
            if (response) {
                // Profile exists, load it
                setProfileData(response);
            } else if (!isViewMode) {
                // No profile found for current user in edit mode
                // Keep default empty profile data
                console.log('No existing sports profile found, ready to create new profile');
                // Can show a message to the user if needed
                Alert.alert(
                    'Thông báo',
                    'Bạn chưa có hồ sơ thể thao. Hãy tạo hồ sơ mới!',
                    [{ text: 'OK' }]
                );
            } else {
                // No profile found for other user in view mode
                Alert.alert('Thông báo', 'Người dùng này chưa có hồ sơ thể thao');
                navigation.goBack();
            }
            
            setLoading(false);
        } catch (error) {
            console.error('Error loading sports profile:', error);
            Alert.alert('Lỗi', 'Không thể tải thông tin profile thể thao');
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            // Validate the data before sending
            const errors = sportsProfileService.validateProfileData(profileData);
            if (errors.length > 0) {
                Alert.alert('Lỗi Dữ Liệu', errors.join('\n'));
                return;
            }
            
            // Format the data for backend
            const formattedData = sportsProfileService.formatProfileDataForBackend(profileData);
            
            setSaving(true);
            
            // Determine if this is a create or update operation
            if (profileData.id) {
                // Update existing profile
                await sportsProfileService.updateProfile(profileData.id, formattedData);
            } else {
                // Create new profile
                await sportsProfileService.createOrUpdateProfile(formattedData);
            }
            
            setSaving(false);
            Alert.alert('Thành công', 'Đã cập nhật profile thể thao', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Error saving sports profile:', error);
            Alert.alert('Lỗi', 'Không thể lưu thông tin profile');
            setSaving(false);
        }
    };

    const toggleFavoriteSport = (sport) => {
        const sportName = sport.name;
        const currentSports = profileData.favoriteSports || [];
        
        if (currentSports.includes(sportName)) {
            setProfileData({
                ...profileData,
                favoriteSports: currentSports.filter(s => s !== sportName)
            });
        } else {
            setProfileData({
                ...profileData,
                favoriteSports: [...currentSports, sportName]
            });
        }
    };

    const renderSectionHeader = (title, icon, sectionKey) => (
        <TouchableOpacity
            style={[styles.sectionHeader, activeSection === sectionKey && styles.activeSectionHeader]}
            onPress={() => setActiveSection(activeSection === sectionKey ? null : sectionKey)}
        >
            <LinearGradient
                colors={activeSection === sectionKey ? ['#E91E63', '#C2185B'] : ['#f5f5f5', '#e0e0e0']}
                style={styles.sectionHeaderGradient}
            >
                <Ionicons 
                    name={icon} 
                    size={20} 
                    color={activeSection === sectionKey ? '#fff' : '#666'} 
                />
                <Text style={[
                    styles.sectionHeaderText, 
                    activeSection === sectionKey && styles.activeSectionHeaderText
                ]}>
                    {title}
                </Text>
                <Ionicons 
                    name={activeSection === sectionKey ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={activeSection === sectionKey ? '#fff' : '#666'} 
                />
            </LinearGradient>
        </TouchableOpacity>
    );

    const renderBasicInfo = () => (
        <View style={styles.sectionContent}>
            {/* Favorite Sports */}
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Môn thể thao yêu thích *</Text>
                <View style={styles.sportsGrid}>
                    {Object.values(SportType).map((sport) => (
                        <TouchableOpacity
                            key={sport.name}
                            style={[
                                styles.sportChip,
                                profileData.favoriteSports?.includes(sport.name) && styles.sportChipSelected
                            ]}
                            onPress={() => !isViewMode && toggleFavoriteSport(sport)}
                            disabled={isViewMode}
                        >
                            <Ionicons 
                                name={sport.icon} 
                                size={16} 
                                color={profileData.favoriteSports?.includes(sport.name) ? '#fff' : '#666'} 
                            />
                            <Text style={[
                                styles.sportChipText,
                                profileData.favoriteSports?.includes(sport.name) && styles.sportChipTextSelected
                            ]}>
                                {sport.display}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Primary Sport */}
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Môn thể thao chính</Text>
                <TextInput
                    style={styles.textInput}
                    value={profileData.primarySport}
                    onChangeText={(text) => setProfileData({...profileData, primarySport: text})}
                    placeholder="Ví dụ: Bóng đá"
                    placeholderTextColor="#999"
                    editable={!isViewMode}
                />
            </View>

            {/* Skill Level */}
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Trình độ kỹ năng *</Text>
                <View style={styles.skillLevelContainer}>
                    {Object.values(SkillLevel).map((level) => (
                        <TouchableOpacity
                            key={level.name}
                            style={[
                                styles.skillLevelChip,
                                { borderColor: level.color },
                                profileData.skillLevel === level.name && { backgroundColor: level.color }
                            ]}
                            onPress={() => !isViewMode && setProfileData({...profileData, skillLevel: level.name})}
                            disabled={isViewMode}
                        >
                            <Text style={[
                                styles.skillLevelText,
                                profileData.skillLevel === level.name && styles.skillLevelTextSelected
                            ]}>
                                {level.display}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Activity Level */}
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mức độ hoạt động *</Text>
                <View style={styles.activityLevelContainer}>
                    {Object.values(ActivityLevel).map((level) => (
                        <TouchableOpacity
                            key={level.name}
                            style={[
                                styles.activityLevelChip,
                                { borderColor: level.color },
                                profileData.activityLevel === level.name && { backgroundColor: level.color }
                            ]}
                            onPress={() => !isViewMode && setProfileData({...profileData, activityLevel: level.name})}
                            disabled={isViewMode}
                        >
                            <Text style={[
                                styles.activityLevelText,
                                profileData.activityLevel === level.name && styles.activityLevelTextSelected
                            ]}>
                                {level.display}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Years of Experience */}
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Số năm kinh nghiệm</Text>
                <TextInput
                    style={styles.textInput}
                    value={profileData.yearsOfExperience}
                    onChangeText={(text) => setProfileData({...profileData, yearsOfExperience: text})}
                    placeholder="Ví dụ: 5"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    editable={!isViewMode}
                />
            </View>
        </View>
    );

    const renderPhysicalStats = () => (
        <View style={styles.sectionContent}>
            {/* Height & Weight */}
            <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                    <Text style={styles.inputLabel}>Chiều cao (cm)</Text>
                    <TextInput
                        style={styles.textInput}
                        value={profileData.height}
                        onChangeText={(text) => setProfileData({...profileData, height: text})}
                        placeholder="175"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                        editable={!isViewMode}
                    />
                </View>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                    <Text style={styles.inputLabel}>Cân nặng (kg)</Text>
                    <TextInput
                        style={styles.textInput}
                        value={profileData.weight}
                        onChangeText={(text) => setProfileData({...profileData, weight: text})}
                        placeholder="70"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                        editable={!isViewMode}
                    />
                </View>
            </View>

            {/* Dominant Hand */}
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tay thuận</Text>
                <View style={styles.dominantHandContainer}>
                    {Object.entries(DominantHand).map(([key, value]) => (
                        <TouchableOpacity
                            key={key}
                            style={[
                                styles.dominantHandChip,
                                profileData.dominantHand === value && styles.dominantHandChipSelected
                            ]}
                            onPress={() => !isViewMode && setProfileData({...profileData, dominantHand: value})}
                            disabled={isViewMode}
                        >
                            <Text style={[
                                styles.dominantHandText,
                                profileData.dominantHand === value && styles.dominantHandTextSelected
                            ]}>
                                {value}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
    );

    const renderPreferences = () => (
        <View style={styles.sectionContent}>
            {/* Preferred Playing Time */}
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Thời gian chơi ưa thích</Text>
                <View style={styles.playingTimeContainer}>
                    {Object.entries(PlayingTime).map(([key, value]) => (
                        <TouchableOpacity
                            key={key}
                            style={[
                                styles.playingTimeChip,
                                profileData.preferredPlayingTime === value && styles.playingTimeChipSelected
                            ]}
                            onPress={() => !isViewMode && setProfileData({...profileData, preferredPlayingTime: value})}
                            disabled={isViewMode}
                        >
                            <Text style={[
                                styles.playingTimeText,
                                profileData.preferredPlayingTime === value && styles.playingTimeTextSelected
                            ]}>
                                {value}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Preferences Switches */}
            <View style={styles.switchGroup}>
                <View style={styles.switchItem}>
                    <Text style={styles.switchLabel}>Sẵn sàng được huấn luyện</Text>
                    <Switch
                        value={profileData.openToCoaching}
                        onValueChange={(value) => !isViewMode && setProfileData({...profileData, openToCoaching: value})}
                        trackColor={{ false: '#E0E0E0', true: '#E91E63' }}
                        thumbColor={profileData.openToCoaching ? '#fff' : '#f4f3f4'}
                        disabled={isViewMode}
                    />
                </View>
                <View style={styles.switchItem}>
                    <Text style={styles.switchLabel}>Có thể tập luyện</Text>
                    <Switch
                        value={profileData.availableForTraining}
                        onValueChange={(value) => !isViewMode && setProfileData({...profileData, availableForTraining: value})}
                        trackColor={{ false: '#E0E0E0', true: '#E91E63' }}
                        thumbColor={profileData.availableForTraining ? '#fff' : '#f4f3f4'}
                        disabled={isViewMode}
                    />
                </View>
                <View style={styles.switchItem}>
                    <Text style={styles.switchLabel}>Tìm kiếm đối tác</Text>
                    <Switch
                        value={profileData.lookingForPartner}
                        onValueChange={(value) => !isViewMode && setProfileData({...profileData, lookingForPartner: value})}
                        trackColor={{ false: '#E0E0E0', true: '#E91E63' }}
                        thumbColor={profileData.lookingForPartner ? '#fff' : '#f4f3f4'}
                        disabled={isViewMode}
                    />
                </View>
                <View style={styles.switchItem}>
                    <Text style={styles.switchLabel}>Tìm kiếm đội nhóm</Text>
                    <Switch
                        value={profileData.lookingForTeam}
                        onValueChange={(value) => !isViewMode && setProfileData({...profileData, lookingForTeam: value})}
                        trackColor={{ false: '#E0E0E0', true: '#E91E63' }}
                        thumbColor={profileData.lookingForTeam ? '#fff' : '#f4f3f4'}
                        disabled={isViewMode}
                    />
                </View>
            </View>
        </View>
    );

    const renderLocationGoals = () => (
        <View style={styles.sectionContent}>
            {/* Home Gym */}
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phòng gym chính</Text>
                <TextInput
                    style={styles.textInput}
                    value={profileData.homeGym}
                    onChangeText={(text) => setProfileData({...profileData, homeGym: text})}
                    placeholder="Ví dụ: California Fitness"
                    placeholderTextColor="#999"
                    editable={!isViewMode}
                />
            </View>

            {/* Preferred Locations */}
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Địa điểm ưa thích</Text>
                <TextInput
                    style={styles.textArea}
                    value={profileData.preferredLocations}
                    onChangeText={(text) => setProfileData({...profileData, preferredLocations: text})}
                    placeholder="Ví dụ: Quận 1, Quận 3, Quận 7"
                    placeholderTextColor="#999"
                    multiline={true}
                    numberOfLines={3}
                    editable={!isViewMode}
                />
            </View>

            {/* Max Travel Distance */}
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Khoảng cách di chuyển tối đa (km)</Text>
                <TextInput
                    style={styles.textInput}
                    value={profileData.maxTravelDistance}
                    onChangeText={(text) => setProfileData({...profileData, maxTravelDistance: text})}
                    placeholder="10"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    editable={!isViewMode}
                />
            </View>

            {/* Fitness Goals */}
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mục tiêu thể chất</Text>
                <TextInput
                    style={styles.textArea}
                    value={profileData.fitnessGoals}
                    onChangeText={(text) => setProfileData({...profileData, fitnessGoals: text})}
                    placeholder="Ví dụ: Tăng cường thể lực, giảm cân, tăng cơ bắp..."
                    placeholderTextColor="#999"
                    multiline={true}
                    numberOfLines={3}
                    editable={!isViewMode}
                />
            </View>

            {/* Competition Goals */}
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mục tiêu thi đấu</Text>
                <TextInput
                    style={styles.textArea}
                    value={profileData.competitionGoals}
                    onChangeText={(text) => setProfileData({...profileData, competitionGoals: text})}
                    placeholder="Ví dụ: Tham gia giải đấu địa phương, cải thiện thành tích cá nhân..."
                    placeholderTextColor="#999"
                    multiline={true}
                    numberOfLines={3}
                    editable={!isViewMode}
                />
            </View>
        </View>
    );

    const renderPrivacySettings = () => (
        <View style={styles.sectionContent}>
            <Text style={styles.privacyNote}>
                Điều chỉnh quyền riêng tư và cho phép người khác liên hệ với bạn
            </Text>
            
            <View style={styles.switchGroup}>
                <View style={styles.switchItem}>
                    <View style={styles.switchLabelContainer}>
                        <Text style={styles.switchLabel}>Cho phép lời mời tập luyện</Text>
                        <Text style={styles.switchDescription}>Người khác có thể mời bạn tập luyện cùng</Text>
                    </View>
                    <Switch
                        value={profileData.allowTrainingInvites}
                        onValueChange={(value) => !isViewMode && setProfileData({...profileData, allowTrainingInvites: value})}
                        trackColor={{ false: '#E0E0E0', true: '#E91E63' }}
                        thumbColor={profileData.allowTrainingInvites ? '#fff' : '#f4f3f4'}
                        disabled={isViewMode}
                    />
                </View>
                <View style={styles.switchItem}>
                    <View style={styles.switchLabelContainer}>
                        <Text style={styles.switchLabel}>Cho phép lời mời sự kiện</Text>
                        <Text style={styles.switchDescription}>Người khác có thể mời bạn tham gia sự kiện</Text>
                    </View>
                    <Switch
                        value={profileData.allowEventInvites}
                        onValueChange={(value) => !isViewMode && setProfileData({...profileData, allowEventInvites: value})}
                        trackColor={{ false: '#E0E0E0', true: '#E91E63' }}
                        thumbColor={profileData.allowEventInvites ? '#fff' : '#f4f3f4'}
                        disabled={isViewMode}
                    />
                </View>
                <View style={styles.switchItem}>
                    <View style={styles.switchLabelContainer}>
                        <Text style={styles.switchLabel}>Cho phép yêu cầu kết đôi</Text>
                        <Text style={styles.switchDescription}>Người khác có thể gửi yêu cầu kết đôi thể thao</Text>
                    </View>
                    <Switch
                        value={profileData.allowMatchRequests}
                        onValueChange={(value) => !isViewMode && setProfileData({...profileData, allowMatchRequests: value})}
                        trackColor={{ false: '#E0E0E0', true: '#E91E63' }}
                        thumbColor={profileData.allowMatchRequests ? '#fff' : '#f4f3f4'}
                        disabled={isViewMode}
                    />
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#E91E63" />
                <LinearGradient colors={['#E91E63', '#C2185B']} style={styles.header}>
                    <Text style={styles.headerTitle}>Sports Profile</Text>
                </LinearGradient>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#E91E63" />
                    <Text style={styles.loadingText}>Đang tải thông tin...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#E91E63" />
            
            {/* Header */}
            <LinearGradient colors={['#E91E63', '#C2185B', '#AD1457']} style={styles.header}>
                <Animated.View 
                    style={[
                        styles.headerContent,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    
                    <Text style={styles.headerTitle}>
                        {isViewMode ? 'Xem Sports Profile' : 'Sports Profile của tôi'}
                    </Text>
                    
                    {!isViewMode && (
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons name="save" size={24} color="#fff" />
                            )}
                        </TouchableOpacity>
                    )}
                </Animated.View>
            </LinearGradient>

            {/* Content */}
            <Animated.View 
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}
            >
                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Basic Information */}
                    {renderSectionHeader('Thông tin cơ bản', 'information-circle', 'basic')}
                    {activeSection === 'basic' && renderBasicInfo()}

                    {/* Physical Stats */}
                    {renderSectionHeader('Thông số cơ thể', 'fitness', 'physical')}
                    {activeSection === 'physical' && renderPhysicalStats()}

                    {/* Preferences */}
                    {renderSectionHeader('Sở thích & Mục tiêu', 'heart', 'preferences')}
                    {activeSection === 'preferences' && renderPreferences()}

                    {/* Location & Goals */}
                    {renderSectionHeader('Địa điểm & Mục tiêu', 'location', 'location')}
                    {activeSection === 'location' && renderLocationGoals()}

                    {/* Privacy Settings */}
                    {!isViewMode && renderSectionHeader('Cài đặt riêng tư', 'shield', 'privacy')}
                    {!isViewMode && activeSection === 'privacy' && renderPrivacySettings()}

                    <View style={styles.bottomPadding} />
                </ScrollView>
            </Animated.View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        paddingTop: 20,
        paddingBottom: 15,
        paddingHorizontal: 20,
        elevation: 8,
        shadowColor: '#E91E63',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 15,
    },
    saveButton: {
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
    },
    content: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#E91E63',
        fontWeight: '600',
    },
    sectionHeader: {
        marginHorizontal: 15,
        marginTop: 15,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
    },
    activeSectionHeader: {
        elevation: 4,
    },
    sectionHeaderGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    sectionHeaderText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
        marginLeft: 10,
    },
    activeSectionHeaderText: {
        color: '#fff',
    },
    sectionContent: {
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginBottom: 5,
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        elevation: 1,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    textArea: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        minHeight: 80,
        textAlignVertical: 'top',
    },
    sportsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    sportChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    sportChipSelected: {
        backgroundColor: '#E91E63',
        borderColor: '#E91E63',
    },
    sportChipText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 5,
        fontWeight: '500',
    },
    sportChipTextSelected: {
        color: '#fff',
        fontWeight: '600',
    },
    skillLevelContainer: {
        gap: 8,
    },
    skillLevelChip: {
        borderWidth: 2,
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 15,
        marginBottom: 8,
        backgroundColor: '#fff',
    },
    skillLevelText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        textAlign: 'center',
    },
    skillLevelTextSelected: {
        color: '#fff',
    },
    activityLevelContainer: {
        gap: 8,
    },
    activityLevelChip: {
        borderWidth: 2,
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 15,
        marginBottom: 8,
        backgroundColor: '#fff',
    },
    activityLevelText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        textAlign: 'center',
    },
    activityLevelTextSelected: {
        color: '#fff',
    },
    row: {
        flexDirection: 'row',
        gap: 15,
    },
    halfWidth: {
        flex: 1,
    },
    dominantHandContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    dominantHandChip: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        paddingVertical: 12,
        backgroundColor: '#f8f9fa',
    },
    dominantHandChipSelected: {
        backgroundColor: '#E91E63',
        borderColor: '#E91E63',
    },
    dominantHandText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        textAlign: 'center',
    },
    dominantHandTextSelected: {
        color: '#fff',
    },
    playingTimeContainer: {
        gap: 8,
    },
    playingTimeChip: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 15,
        backgroundColor: '#f8f9fa',
        marginBottom: 8,
    },
    playingTimeChipSelected: {
        backgroundColor: '#E91E63',
        borderColor: '#E91E63',
    },
    playingTimeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        textAlign: 'center',
    },
    playingTimeTextSelected: {
        color: '#fff',
    },
    switchGroup: {
        gap: 15,
    },
    switchItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 5,
    },
    switchLabelContainer: {
        flex: 1,
        marginRight: 15,
    },
    switchLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    switchDescription: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    privacyNote: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    bottomPadding: {
        height: 50,
    },
});

export default SportsProfileScreen; 