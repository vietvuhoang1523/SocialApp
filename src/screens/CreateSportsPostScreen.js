import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    Image,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    ActivityIndicator,
    Platform,
    Animated,
    Switch,
    Modal,
    Button,
    FlatList
} from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import SportsPostService from '../services/SportsPostService';
import FriendService from '../services/FriendService';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import CustomDatePicker from '../components/CustomDatePicker';

// Enums from backend
const SportType = {
    FOOTBALL: 'FOOTBALL',
    BASKETBALL: 'BASKETBALL',
    VOLLEYBALL: 'VOLLEYBALL',
    TENNIS: 'TENNIS',
    BADMINTON: 'BADMINTON',
    SWIMMING: 'SWIMMING',
    RUNNING: 'RUNNING',
    CYCLING: 'CYCLING',
    YOGA: 'YOGA',
    GYM: 'GYM',
    OTHER: 'OTHER'
};

const SkillLevel = {
    BEGINNER: 'BEGINNER',
    NOVICE: 'NOVICE',
    INTERMEDIATE: 'INTERMEDIATE',
    ADVANCED: 'ADVANCED',
    EXPERT: 'EXPERT',
    MASTER: 'MASTER'
};

const PriceRange = {
    FREE: 'FREE',
    BUDGET: 'BUDGET',
    MODERATE: 'MODERATE',
    PREMIUM: 'PREMIUM',
    LUXURY: 'LUXURY'
};

const PostVisibility = {
    PUBLIC: 'PUBLIC',
    PRIVATE: 'PRIVATE',
    FRIENDS_ONLY: 'FRIENDS_ONLY'
};

// Cấu hình cho lặp lại sự kiện
const RepeatOptions = {
    NONE: 'NONE',
    DAILY: 'DAILY',
    WEEKLY: 'WEEKLY',
    MONTHLY: 'MONTHLY'
};

const CreateSportsPostScreen = ({ navigation }) => {
    // Basic post info
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [sportType, setSportType] = useState(SportType.FOOTBALL);
    const [skillLevel, setSkillLevel] = useState(SkillLevel.BEGINNER);
    const [maxParticipants, setMaxParticipants] = useState(2);
    
    // Event details
    const [eventDate, setEventDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000)); // Tomorrow
    const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
    const [tempDate, setTempDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
    const [durationHours, setDurationHours] = useState(1.0);
    
    // Location
    const [location, setLocation] = useState('');
    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);
    const [locationNotes, setLocationNotes] = useState('');
    const [showMap, setShowMap] = useState(false);
    
    // Cost
    const [estimatedCost, setEstimatedCost] = useState('0');
    const [priceRange, setPriceRange] = useState(PriceRange.FREE);
    const [costNotes, setCostNotes] = useState('');
    
    // Requirements
    const [requirements, setRequirements] = useState('');
    const [minAge, setMinAge] = useState('');
    const [maxAge, setMaxAge] = useState('');
    const [genderRequirement, setGenderRequirement] = useState(null);
    
    // Images and additional settings
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [tags, setTags] = useState([]);
    const [currentTag, setCurrentTag] = useState('');
    const [visibility, setVisibility] = useState(PostVisibility.PUBLIC);
    const [autoApprove, setAutoApprove] = useState(false);
    
    // UI state
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeSection, setActiveSection] = useState('basic');
    
    // Animation
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(50));

    // Days, months and hours for pickers
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() + i);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = [0, 15, 30, 45];

    // Tính năng mới: Lặp lại sự kiện
    const [repeatOption, setRepeatOption] = useState(RepeatOptions.NONE);
    const [repeatEndDate, setRepeatEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // 30 days from now
    const [showRepeatEndDatePicker, setShowRepeatEndDatePicker] = useState(false);
    
    // Tính năng mới: Mời bạn bè
    const [friends, setFriends] = useState([]);
    const [invitedFriends, setInvitedFriends] = useState([]);
    const [showFriendsModal, setShowFriendsModal] = useState(false);
    const [searchFriendText, setSearchFriendText] = useState('');
    
    // Tính năng mới: Trang thiết bị
    const [equipmentList, setEquipmentList] = useState([]);
    const [newEquipment, setNewEquipment] = useState('');
    const [autoSuggestEquipment, setAutoSuggestEquipment] = useState(true);
    
    // Tính năng mới: Preview
    const [showPreview, setShowPreview] = useState(false);
    
    // Tham chiếu đến ScrollView
    const scrollViewRef = useRef(null);

    // Init animations and permissions
    useEffect(() => {
        (async () => {
            try {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                console.log("Image permission status:", status);
                
                const locPermission = await Location.requestForegroundPermissionsAsync();
                console.log("Location permission status:", locPermission.status);
                
                // Load friends list
                loadFriends();
            } catch (err) {
                console.error("Error requesting permissions:", err);
            }
        })();

        // Entrance animations
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
    
    // Initialize location if possible
    useEffect(() => {
        // Try to get user's location at startup if they have given permission
        Location.getForegroundPermissionsAsync().then(status => {
            if (status.granted) {
                getCurrentLocation().catch(err => {
                    console.error("Error getting initial location:", err);
                });
            }
        }).catch(err => {
            console.error("Error checking location permissions:", err);
        });
    }, []);
    
    // Load user's friends
    const loadFriends = async () => {
        try {
            const response = await FriendService.getFriends();
            if (response && response.length > 0) {
                setFriends(response);
            }
        } catch (error) {
            console.error('Error loading friends:', error);
        }
    };
    
    // Handle friend invitation
    const toggleFriendInvitation = (friend) => {
        const isInvited = invitedFriends.some(f => f.id === friend.id);
        if (isInvited) {
            setInvitedFriends(invitedFriends.filter(f => f.id !== friend.id));
        } else {
            setInvitedFriends([...invitedFriends, friend]);
        }
    };
    
    // Filter friends based on search text
    const filteredFriends = searchFriendText 
        ? friends.filter(friend => 
            friend.displayName.toLowerCase().includes(searchFriendText.toLowerCase()))
        : friends;
    
    // Suggest equipment based on sport type
    useEffect(() => {
        if (autoSuggestEquipment) {
            suggestEquipment();
        }
    }, [sportType, autoSuggestEquipment]);
    
    const suggestEquipment = () => {
        let suggestions = [];
        switch(sportType) {
            case SportType.FOOTBALL:
                suggestions = ['Giày bóng đá', 'Quần áo thể thao', 'Bình nước'];
                break;
            case SportType.BASKETBALL:
                suggestions = ['Giày bóng rổ', 'Quần áo thể thao', 'Bình nước'];
                break;
            case SportType.VOLLEYBALL:
                suggestions = ['Giày thể thao', 'Quần áo thể thao', 'Bình nước', 'Băng bảo vệ đầu gối'];
                break;
            case SportType.TENNIS:
                suggestions = ['Vợt tennis', 'Giày tennis', 'Bóng tennis', 'Quần áo thể thao', 'Bình nước'];
                break;
            case SportType.BADMINTON:
                suggestions = ['Vợt cầu lông', 'Giày thể thao', 'Quả cầu', 'Quần áo thể thao', 'Bình nước'];
                break;
            case SportType.SWIMMING:
                suggestions = ['Đồ bơi', 'Kính bơi', 'Mũ bơi', 'Khăn tắm'];
                break;
            case SportType.RUNNING:
                suggestions = ['Giày chạy bộ', 'Quần áo thể thao thoáng khí', 'Bình nước', 'Đồng hồ theo dõi'];
                break;
            case SportType.CYCLING:
                suggestions = ['Xe đạp', 'Mũ bảo hiểm', 'Quần áo đạp xe', 'Bình nước', 'Bơm xe'];
                break;
            case SportType.YOGA:
                suggestions = ['Thảm yoga', 'Quần áo thoải mái', 'Khăn', 'Bình nước'];
                break;
            case SportType.GYM:
                suggestions = ['Giày thể thao', 'Quần áo tập gym', 'Găng tay', 'Bình nước', 'Khăn'];
                break;
            default:
                suggestions = ['Quần áo thể thao', 'Bình nước'];
        }
        
        // Reset equipment list if it's empty or requested
        if (equipmentList.length === 0) {
            setEquipmentList(suggestions);
        }
    };
    
    // Add new equipment item
    const addEquipment = () => {
        if (newEquipment.trim()) {
            if (!equipmentList.includes(newEquipment.trim())) {
                setEquipmentList([...equipmentList, newEquipment.trim()]);
                setNewEquipment('');
            } else {
                Alert.alert('Trùng lặp', 'Trang thiết bị này đã có trong danh sách');
            }
        }
    };
    
    // Remove equipment item
    const removeEquipment = (item) => {
        setEquipmentList(equipmentList.filter(equip => equip !== item));
    };
    
    // Format date for display
    const formatDate = (date) => {
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} - ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    };
    
    // Custom date time picker functions
    const openDatePicker = () => {
        setTempDate(eventDate);
        setShowCustomDatePicker(true);
    };
    
    const confirmDate = () => {
        setEventDate(tempDate);
        setShowCustomDatePicker(false);
    };
    
    const cancelDatePicker = () => {
        setShowCustomDatePicker(false);
    };
    
    // Handle day change
    const handleDayChange = (day) => {
        const newDate = new Date(tempDate);
        newDate.setDate(day);
        setTempDate(newDate);
    };
    
    // Handle month change
    const handleMonthChange = (month) => {
        const newDate = new Date(tempDate);
        newDate.setMonth(month - 1);
        setTempDate(newDate);
    };
    
    // Handle year change
    const handleYearChange = (year) => {
        const newDate = new Date(tempDate);
        newDate.setFullYear(year);
        setTempDate(newDate);
    };
    
    // Handle hour change
    const handleHourChange = (hour) => {
        const newDate = new Date(tempDate);
        newDate.setHours(hour);
        setTempDate(newDate);
    };
    
    // Handle minute change
    const handleMinuteChange = (minute) => {
        const newDate = new Date(tempDate);
        newDate.setMinutes(minute);
        setTempDate(newDate);
    };
    
    // Get current location
    const getCurrentLocation = async () => {
        try {
            setError('');
            const { status } = await Location.requestForegroundPermissionsAsync();
            
            if (status !== 'granted') {
                setError('Cần cấp quyền truy cập vị trí');
                return;
            }
            
            const position = await Location.getCurrentPositionAsync({});
            setLatitude(position.coords.latitude);
            setLongitude(position.coords.longitude);
            
            // Get address from coordinates
            const address = await Location.reverseGeocodeAsync({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            });
            
            if (address && address.length > 0) {
                const locationStr = `${address[0].street || ''}, ${address[0].district || ''}, ${address[0].city || ''}`;
                setLocation(locationStr.trim());
            }
            
            setShowMap(true);
        } catch (error) {
            console.error('Error getting location:', error);
            setError('Không thể lấy vị trí hiện tại');
        }
    };
    
    // Update location from map
    const updateLocationFromMap = (event) => {
        setLatitude(event.nativeEvent.coordinate.latitude);
        setLongitude(event.nativeEvent.coordinate.longitude);
    };
    
    // Add tag
    const addTag = () => {
        if (currentTag.trim() && !tags.includes(currentTag.trim())) {
            setTags([...tags, currentTag.trim()]);
            setCurrentTag('');
        }
    };
    
    // Remove tag
    const removeTag = (index) => {
        const newTags = [...tags];
        newTags.splice(index, 1);
        setTags(newTags);
    };
    
    // Handle multiple image upload
    const handleMultipleImageUpload = async () => {
        try {
            if (imageFiles.length >= 5) {
                setError('Chỉ được chọn tối đa 5 hình ảnh');
                return;
            }
            
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (status !== 'granted') {
                setError('Cần cấp quyền truy cập thư viện ảnh');
                return;
            }
            
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: "Images",
                quality: 0.8,
                allowsEditing: false,
                allowsMultipleSelection: true,
                selectionLimit: Math.min(5 - imageFiles.length, 5),
            });
            
            if (!result.canceled && result.assets && result.assets.length > 0) {
                const newImageFiles = [];
                const newImagePreviews = [];
                
                result.assets.forEach((selectedAsset, index) => {
                    const uriParts = selectedAsset.uri.split('/');
                    const fileName = uriParts[uriParts.length - 1];
                    const fileExtension = fileName.split('.').pop().toLowerCase();
                    const mimeType = getMimeType(fileExtension);
                    
                    const fileObject = {
                        uri: selectedAsset.uri,
                        type: mimeType,
                        name: fileName,
                        id: Date.now() + index,
                    };
                    
                    newImageFiles.push(fileObject);
                    newImagePreviews.push({
                        id: Date.now() + index,
                        uri: selectedAsset.uri
                    });
                });
                
                setImageFiles(prev => [...prev, ...newImageFiles]);
                setImagePreviews(prev => [...prev, ...newImagePreviews]);
                setError('');
            }
        } catch (error) {
            console.error("Image upload error:", error);
            setError(`Lỗi khi chọn ảnh: ${error.message}`);
        }
    };
    
    // Helper to get MIME type
    const getMimeType = (extension) => {
        switch (extension) {
            case 'jpg':
            case 'jpeg':
                return 'image/jpeg';
            case 'png':
                return 'image/png';
            case 'gif':
                return 'image/gif';
            case 'webp':
                return 'image/webp';
            default:
                return 'image/jpeg';
        }
    };
    
    // Remove image
    const handleRemoveImageFromList = (imageId) => {
        setImageFiles(prev => prev.filter(img => img.id !== imageId));
        setImagePreviews(prev => prev.filter(img => img.id !== imageId));
    };
    
    // Remove all images
    const handleRemoveAllImages = () => {
        setImageFiles([]);
        setImagePreviews([]);
    };
    
    // Submit the sports post
    const handleSubmitPost = async () => {
        try {
            // Validate form
            if (!title.trim()) {
                setError('Vui lòng nhập tiêu đề');
                setActiveSection('basic');
                return;
            }
            
            if (!description.trim()) {
                setError('Vui lòng nhập mô tả');
                setActiveSection('basic');
                return;
            }
            
            if (!location.trim()) {
                setError('Vui lòng nhập địa điểm');
                setActiveSection('location');
                return;
            }
            
            // Start loading
            setIsLoading(true);
            
            // Create a sports post data object using the helper method
            const sportsPostData = {
                title: title.trim(),
                description: description.trim(),
                sportType: sportType,
                skillLevel: skillLevel,
                maxParticipants: parseInt(maxParticipants),
                eventTime: eventDate.toISOString(),
                durationHours: parseFloat(durationHours),
                location: location.trim(),
                latitude: latitude,
                longitude: longitude,
                locationNotes: locationNotes.trim(),
                estimatedCost: parseFloat(estimatedCost) || 0,
                priceRange: priceRange,
                costNotes: costNotes.trim(),
                requirements: requirements.trim(),
                minAge: minAge ? parseInt(minAge) : null,
                maxAge: maxAge ? parseInt(maxAge) : null,
                genderRequirement: genderRequirement,
                tags: tags.length > 0 ? tags : [],
                visibility: visibility,
                autoApprove: autoApprove,
                imageFiles: imageFiles.length > 0 ? imageFiles : []
            };
            
            // Validate the data using the service's validation method
            const validationErrors = SportsPostService.validateSportsPostData ?
                SportsPostService.validateSportsPostData(sportsPostData) : [];
                
            if (validationErrors && validationErrors.length > 0) {
                setError(validationErrors.join('\n'));
                setIsLoading(false);
                return;
            }
            
            console.log('Creating sports post with data:', sportsPostData);
            
            // Call API to create sports post
            const response = await SportsPostService.createSportsPost(sportsPostData);
            
            console.log('Sports post created:', response);
            
            // Success, reset form and navigate back
            Alert.alert(
                'Thành công',
                'Đã tạo bài đăng thể thao thành công!',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
            
            setIsLoading(false);
        } catch (error) {
            console.error('Error creating sports post:', error);
            setError(error.message || 'Đã có lỗi xảy ra khi tạo bài đăng');
            setIsLoading(false);
        }
    };
    
    // Helper to check if can submit
    const canSubmit = () => {
        return (
            title.trim() && 
            description.trim() && 
            location.trim() && 
            !isLoading
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tạo hoạt động thể thao</Text>
                <View style={styles.placeholder} />
            </View>
            
            {/* Main content */}
            <ScrollView 
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                ref={scrollViewRef}
            >
                {/* Form sections navigation */}
                <View style={styles.formNav}>
                    {[
                        { id: 'basic', label: 'Thông tin cơ bản', icon: 'info' },
                        { id: 'event', label: 'Sự kiện', icon: 'event' },
                        { id: 'location', label: 'Địa điểm', icon: 'place' },
                        { id: 'requirements', label: 'Yêu cầu', icon: 'assignment' },
                        { id: 'media', label: 'Hình ảnh', icon: 'photo-library' },
                    ].map(section => (
                        <TouchableOpacity
                            key={section.id}
                            style={[
                                styles.navItem,
                                activeSection === section.id && styles.navItemActive
                            ]}
                            onPress={() => setActiveSection(section.id)}
                        >
                            <MaterialIcons 
                                name={section.icon} 
                                size={22} 
                                color={activeSection === section.id ? '#6c7ce7' : '#888'} 
                            />
                            <Text style={[
                                styles.navItemText,
                                activeSection === section.id && styles.navItemTextActive
                            ]}>
                                {section.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                
                {/* Error message if any */}
                {error ? (
                    <View style={styles.errorContainer}>
                        <MaterialIcons name="error-outline" size={20} color="#ff6b6b" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}
                
                {/* Basic information section */}
                {activeSection === 'basic' && (
                    <Animated.View 
                        style={[
                            styles.formSection,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }]
                            }
                        ]}
                    >
                        <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
                        
                        {/* Title */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Tiêu đề *</Text>
                            <TextInput
                                style={styles.textInput}
                                value={title}
                                onChangeText={setTitle}
                                placeholder="Nhập tiêu đề bài đăng"
                                maxLength={200}
                            />
                            <Text style={styles.charCounter}>{title.length}/200</Text>
                        </View>
                        
                        {/* Description */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Mô tả *</Text>
                            <TextInput
                                style={[styles.textInput, styles.textArea]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Mô tả chi tiết về hoạt động thể thao"
                                multiline
                                numberOfLines={4}
                                maxLength={2000}
                            />
                            <Text style={styles.charCounter}>{description.length}/2000</Text>
                        </View>
                        
                        {/* Sport type */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Loại thể thao *</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={sportType}
                                    onValueChange={(itemValue) => setSportType(itemValue)}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Bóng đá" value={SportType.FOOTBALL} />
                                    <Picker.Item label="Bóng rổ" value={SportType.BASKETBALL} />
                                    <Picker.Item label="Bóng chuyền" value={SportType.VOLLEYBALL} />
                                    <Picker.Item label="Tennis" value={SportType.TENNIS} />
                                    <Picker.Item label="Cầu lông" value={SportType.BADMINTON} />
                                    <Picker.Item label="Bơi lội" value={SportType.SWIMMING} />
                                    <Picker.Item label="Chạy bộ" value={SportType.RUNNING} />
                                    <Picker.Item label="Đạp xe" value={SportType.CYCLING} />
                                    <Picker.Item label="Yoga" value={SportType.YOGA} />
                                    <Picker.Item label="Gym" value={SportType.GYM} />
                                    <Picker.Item label="Khác" value={SportType.OTHER} />
                                </Picker>
                            </View>
                        </View>
                        
                        {/* Skill level */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Trình độ</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={skillLevel}
                                    onValueChange={(itemValue) => setSkillLevel(itemValue)}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Bất kỳ" value={SkillLevel.BEGINNER} />
                                    <Picker.Item label="Mới bắt đầu" value={SkillLevel.BEGINNER} />
                                    <Picker.Item label="Trung bình" value={SkillLevel.INTERMEDIATE} />
                                    <Picker.Item label="Nâng cao" value={SkillLevel.ADVANCED} />
                                    <Picker.Item label="Chuyên nghiệp" value={SkillLevel.EXPERT} />
                                </Picker>
                            </View>
                        </View>
                        
                        {/* Max participants */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Số người tham gia tối đa *</Text>
                            <TextInput
                                style={styles.textInput}
                                value={maxParticipants.toString()}
                                onChangeText={(text) => {
                                    const num = parseInt(text);
                                    if (!isNaN(num) && num >= 2 && num <= 50) {
                                        setMaxParticipants(num);
                                    } else if (text === '') {
                                        setMaxParticipants('');
                                    }
                                }}
                                keyboardType="numeric"
                                placeholder="Nhập số người (2-50)"
                            />
                        </View>
                        
                        {/* Next button */}
                        <TouchableOpacity
                            style={styles.nextButton}
                            onPress={() => setActiveSection('event')}
                        >
                            <Text style={styles.nextButtonText}>Tiếp theo</Text>
                            <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                        </TouchableOpacity>
                    </Animated.View>
                )}
                
                {/* Event details section */}
                {activeSection === 'event' && (
                    <Animated.View style={styles.formSection}>
                        <Text style={styles.sectionTitle}>Thông tin sự kiện</Text>
                        
                        {/* Event date and time */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Thời gian sự kiện *</Text>
                            <TouchableOpacity
                                style={styles.datePickerButton}
                                onPress={openDatePicker}
                            >
                                <MaterialIcons name="event" size={24} color="#6c7ce7" />
                                <Text style={styles.dateText}>{formatDate(eventDate)}</Text>
                            </TouchableOpacity>
                        </View>
                        
                        {/* Event duration */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Thời lượng (giờ) *</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={durationHours}
                                    onValueChange={(itemValue) => setDurationHours(itemValue)}
                                    style={styles.picker}
                                >
                                    {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8].map(hour => (
                                        <Picker.Item 
                                            key={hour}
                                            label={hour === 0.5 ? "30 phút" : `${hour} giờ`} 
                                            value={hour} 
                                        />
                                    ))}
                                </Picker>
                            </View>
                        </View>
                        
                        {/* NEW: Event Repeat Option */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Lặp lại sự kiện</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={repeatOption}
                                    onValueChange={(itemValue) => setRepeatOption(itemValue)}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Không lặp lại" value={RepeatOptions.NONE} />
                                    <Picker.Item label="Hàng ngày" value={RepeatOptions.DAILY} />
                                    <Picker.Item label="Hàng tuần" value={RepeatOptions.WEEKLY} />
                                    <Picker.Item label="Hàng tháng" value={RepeatOptions.MONTHLY} />
                                </Picker>
                            </View>
                        </View>
                        
                        {/* NEW: Repeat End Date (show only if repeat is enabled) */}
                        {repeatOption !== RepeatOptions.NONE && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Lặp lại đến ngày</Text>
                                <TouchableOpacity
                                    style={styles.datePickerButton}
                                    onPress={() => setShowRepeatEndDatePicker(true)}
                                >
                                    <MaterialIcons name="event" size={24} color="#6c7ce7" />
                                    <Text style={styles.dateText}>{formatDate(repeatEndDate)}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        
                        {/* Max participants */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Số người tham gia tối đa *</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={maxParticipants.toString()}
                                    onValueChange={(itemValue) => setMaxParticipants(parseInt(itemValue))}
                                    style={styles.picker}
                                >
                                    {[2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50].map(num => (
                                        <Picker.Item 
                                            key={num}
                                            label={`${num} người`} 
                                            value={num.toString()} 
                                        />
                                    ))}
                                </Picker>
                            </View>
                        </View>
                    </Animated.View>
                )}
                
                {/* Location section */}
                {activeSection === 'location' && (
                    <Animated.View style={styles.formSection}>
                        <Text style={styles.sectionTitle}>Thông tin địa điểm</Text>
                        
                        {/* Location */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Địa điểm *</Text>
                            <TextInput
                                style={styles.textInput}
                                value={location}
                                onChangeText={setLocation}
                                placeholder="Nhập địa chỉ nơi diễn ra hoạt động"
                                placeholderTextColor="#999"
                            />
                        </View>
                        
                        {/* Location notes */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Ghi chú địa điểm</Text>
                            <TextInput
                                style={[styles.textInput, styles.textArea]}
                                value={locationNotes}
                                onChangeText={setLocationNotes}
                                placeholder="Cung cấp thêm thông tin về địa điểm (vd: cách tìm, chỗ đậu xe...)"
                                placeholderTextColor="#999"
                                multiline
                                numberOfLines={3}
                            />
                        </View>
                        
                        {/* Map and current location */}
                        <View style={styles.inputGroup}>
                            <View style={styles.rowContainer}>
                                <TouchableOpacity
                                    style={styles.locationButton}
                                    onPress={getCurrentLocation}
                                >
                                    <MaterialIcons name="my-location" size={20} color="#6c7ce7" />
                                    <Text style={styles.locationButtonText}>Vị trí hiện tại</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity
                                    style={styles.locationButton}
                                    onPress={() => setShowMap(true)}
                                    disabled={!latitude || !longitude}
                                >
                                    <MaterialIcons name="map" size={20} color={latitude && longitude ? "#6c7ce7" : "#ccc"} />
                                    <Text style={[styles.locationButtonText, !latitude && {color: "#ccc"}]}>
                                        Xem bản đồ
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            
                            {latitude && longitude && (
                                <View style={styles.locationInfo}>
                                    <Text style={styles.locationInfoText}>
                                        Tọa độ: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                                    </Text>
                                </View>
                            )}
                        </View>
                        
                        {/* Cost information */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Chi phí ước tính (VNĐ)</Text>
                            <TextInput
                                style={styles.textInput}
                                value={estimatedCost}
                                onChangeText={(text) => {
                                    const numericText = text.replace(/[^0-9]/g, '');
                                    setEstimatedCost(numericText);
                                }}
                                keyboardType="numeric"
                                placeholder="Nhập chi phí ước tính"
                                placeholderTextColor="#999"
                            />
                        </View>
                        
                        {/* Price range */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Mức giá</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={priceRange}
                                    onValueChange={(itemValue) => setPriceRange(itemValue)}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Miễn phí" value={PriceRange.FREE} />
                                    <Picker.Item label="Giá rẻ" value={PriceRange.BUDGET} />
                                    <Picker.Item label="Trung bình" value={PriceRange.MODERATE} />
                                    <Picker.Item label="Cao cấp" value={PriceRange.PREMIUM} />
                                    <Picker.Item label="Sang trọng" value={PriceRange.LUXURY} />
                                </Picker>
                            </View>
                        </View>
                        
                        {/* Cost notes */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Ghi chú về chi phí</Text>
                            <TextInput
                                style={[styles.textInput, styles.textArea]}
                                value={costNotes}
                                onChangeText={setCostNotes}
                                placeholder="Chi tiết về các khoản chi phí (vd: phí sân, nước uống...)"
                                placeholderTextColor="#999"
                                multiline
                                numberOfLines={3}
                            />
                        </View>
                    </Animated.View>
                )}
                
                {/* Requirements section */}
                {activeSection === 'requirements' && (
                    <Animated.View style={styles.formSection}>
                        <Text style={styles.sectionTitle}>Yêu cầu</Text>
                        
                        {/* General requirements */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Yêu cầu chung</Text>
                            <TextInput
                                style={[styles.textInput, styles.textArea]}
                                value={requirements}
                                onChangeText={setRequirements}
                                placeholder="Các yêu cầu đối với người tham gia"
                                multiline
                                numberOfLines={3}
                                maxLength={500}
                            />
                            <Text style={styles.charCounter}>{requirements.length}/500</Text>
                        </View>
                        
                        {/* Equipment needed */}
                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Text style={styles.inputLabel}>Trang thiết bị cần mang theo</Text>
                                <Switch
                                    value={autoSuggestEquipment}
                                    onValueChange={setAutoSuggestEquipment}
                                    trackColor={{ false: '#d1d1d1', true: '#bac7fc' }}
                                    thumbColor={autoSuggestEquipment ? '#6c7ce7' : '#f4f3f4'}
                                />
                                <Text style={styles.switchLabel}>Gợi ý tự động</Text>
                            </View>
                            
                            {/* Equipment list */}
                            <View style={styles.tagContainer}>
                                {equipmentList.map((item, index) => (
                                    <View key={index} style={styles.tag}>
                                        <Text style={styles.tagText}>{item}</Text>
                                        <TouchableOpacity onPress={() => removeEquipment(item)}>
                                            <MaterialIcons name="close" size={16} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                            
                            {/* Add equipment */}
                            <View style={styles.rowContainer}>
                                <TextInput
                                    style={[styles.textInput, { flex: 1 }]}
                                    value={newEquipment}
                                    onChangeText={setNewEquipment}
                                    placeholder="Thêm trang thiết bị"
                                    maxLength={50}
                                />
                                <TouchableOpacity 
                                    style={[styles.addButton, { marginLeft: 10 }]}
                                    onPress={addEquipment}
                                >
                                    <MaterialIcons name="add" size={24} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                        
                        {/* Age range */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Độ tuổi (để trống nếu không yêu cầu)</Text>
                            <View style={styles.rowContainer}>
                                <TextInput
                                    style={[styles.textInput, { flex: 1, marginRight: 10 }]}
                                    value={minAge}
                                    onChangeText={(text) => {
                                        const num = text.replace(/[^0-9]/g, '');
                                        setMinAge(num);
                                    }}
                                    keyboardType="numeric"
                                    placeholder="Tuổi tối thiểu"
                                />
                                <TextInput
                                    style={[styles.textInput, { flex: 1 }]}
                                    value={maxAge}
                                    onChangeText={(text) => {
                                        const num = text.replace(/[^0-9]/g, '');
                                        setMaxAge(num);
                                    }}
                                    keyboardType="numeric"
                                    placeholder="Tuổi tối đa"
                                />
                            </View>
                        </View>
                        
                        {/* Gender requirement */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Giới tính</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={genderRequirement}
                                    onValueChange={(itemValue) => setGenderRequirement(itemValue)}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Không yêu cầu" value={null} />
                                    <Picker.Item label="Nam" value="MALE" />
                                    <Picker.Item label="Nữ" value="FEMALE" />
                                </Picker>
                            </View>
                        </View>
                        
                        {/* Auto approve setting */}
                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Text style={styles.inputLabel}>Chế độ duyệt tham gia</Text>
                                <Switch
                                    value={autoApprove}
                                    onValueChange={setAutoApprove}
                                    trackColor={{ false: '#ff7675', true: '#6c7ce7' }}
                                    thumbColor={autoApprove ? '#74b9ff' : '#e17055'}
                                />
                            </View>
                            <Text style={styles.helpText}>
                                {autoApprove 
                                    ? '🟢 Tự động duyệt - Người tham gia sẽ được chấp nhận ngay lập tức' 
                                    : '🔴 Duyệt thủ công - Bạn cần phê duyệt từng yêu cầu tham gia'}
                            </Text>
                        </View>
                        
                        {/* Invite friends */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Mời bạn bè tham gia</Text>
                            
                            {/* Show invited friends */}
                            {invitedFriends.length > 0 && (
                                <View style={styles.invitedFriendsContainer}>
                                    <FlatList
                                        data={invitedFriends}
                                        horizontal
                                        renderItem={({item}) => (
                                            <View style={styles.invitedFriend}>
                                                {item.avatar ? (
                                                    <Image 
                                                        source={{uri: item.avatar}} 
                                                        style={styles.friendAvatar} 
                                                    />
                                                ) : (
                                                    <View style={styles.friendAvatarPlaceholder}>
                                                        <Text style={styles.friendInitials}>
                                                            {item.displayName.charAt(0)}
                                                        </Text>
                                                    </View>
                                                )}
                                                <Text style={styles.friendName} numberOfLines={1}>
                                                    {item.displayName}
                                                </Text>
                                                <TouchableOpacity 
                                                    style={styles.removeFriendButton}
                                                    onPress={() => toggleFriendInvitation(item)}
                                                >
                                                    <MaterialIcons name="close" size={16} color="#fff" />
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                        keyExtractor={item => item.id.toString()}
                                    />
                                </View>
                            )}
                            
                            <TouchableOpacity 
                                style={styles.inviteFriendsButton}
                                onPress={() => setShowFriendsModal(true)}
                            >
                                <MaterialIcons name="person-add" size={20} color="#6c7ce7" />
                                <Text style={styles.inviteFriendsButtonText}>
                                    {invitedFriends.length > 0 
                                        ? 'Mời thêm bạn bè'
                                        : 'Mời bạn bè tham gia'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                )}
                
                {/* Media section */}
                {activeSection === 'media' && (
                    <Animated.View style={styles.formSection}>
                        <Text style={styles.sectionTitle}>Hình ảnh & Media</Text>
                        
                        {/* Image upload */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Hình ảnh minh họa (tối đa 5 ảnh)</Text>
                            
                            {/* Show image previews */}
                            {imagePreviews.length > 0 && (
                                <ScrollView 
                                    horizontal 
                                    showsHorizontalScrollIndicator={false}
                                    style={styles.imagePreviewScroll}
                                >
                                    {imagePreviews.map((image, index) => (
                                        <View key={index} style={styles.imagePreviewContainer}>
                                            <Image 
                                                source={{ uri: image.uri }} 
                                                style={styles.imagePreview} 
                                            />
                                            <TouchableOpacity
                                                style={styles.removeImageButton}
                                                onPress={() => handleRemoveImageFromList(image.id)}
                                            >
                                                <MaterialIcons name="close" size={20} color="#fff" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </ScrollView>
                            )}
                            
                            {/* Image upload buttons */}
                            <View style={styles.imageUploadButtons}>
                                <TouchableOpacity
                                    style={styles.uploadButton}
                                    onPress={handleMultipleImageUpload}
                                    disabled={imageFiles.length >= 5}
                                >
                                    <MaterialIcons 
                                        name="add-photo-alternate" 
                                        size={24} 
                                        color={imageFiles.length >= 5 ? "#ccc" : "#6c7ce7"} 
                                    />
                                    <Text 
                                        style={[
                                            styles.uploadButtonText, 
                                            imageFiles.length >= 5 && { color: "#ccc" }
                                        ]}
                                    >
                                        Thêm ảnh
                                    </Text>
                                </TouchableOpacity>
                                
                                {imagePreviews.length > 0 && (
                                    <TouchableOpacity
                                        style={styles.uploadButton}
                                        onPress={handleRemoveAllImages}
                                    >
                                        <MaterialIcons name="delete" size={24} color="#ff6b6b" />
                                        <Text style={[styles.uploadButtonText, { color: "#ff6b6b" }]}>
                                            Xóa tất cả
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                        
                        {/* Tags */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Tags</Text>
                            
                            {/* Show tags */}
                            <View style={styles.tagContainer}>
                                {tags.map((tag, index) => (
                                    <View key={index} style={styles.tag}>
                                        <Text style={styles.tagText}>#{tag}</Text>
                                        <TouchableOpacity onPress={() => removeTag(index)}>
                                            <MaterialIcons name="close" size={16} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                            
                            {/* Add tag */}
                            <View style={styles.rowContainer}>
                                <TextInput
                                    style={[styles.textInput, { flex: 1 }]}
                                    value={currentTag}
                                    onChangeText={setCurrentTag}
                                    placeholder="Thêm tag (không cần #)"
                                    maxLength={20}
                                />
                                <TouchableOpacity 
                                    style={[styles.addButton, { marginLeft: 10 }]}
                                    onPress={addTag}
                                >
                                    <MaterialIcons name="add" size={24} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                        
                        {/* Visibility */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Quyền riêng tư</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={visibility}
                                    onValueChange={(itemValue) => setVisibility(itemValue)}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Công khai" value={PostVisibility.PUBLIC} />
                                    <Picker.Item label="Chỉ bạn bè" value={PostVisibility.FRIENDS_ONLY} />
                                    <Picker.Item label="Riêng tư" value={PostVisibility.PRIVATE} />
                                </Picker>
                            </View>
                        </View>
                        
                        {/* Auto approve */}
                        <View style={styles.switchContainer}>
                            <View style={styles.switchLabelContainer}>
                                <Text style={styles.switchLabel}>Tự động chấp nhận người tham gia</Text>
                                <Text style={styles.switchDescription}>
                                    Khi bật, người dùng sẽ được tự động chấp nhận tham gia mà không cần phê duyệt
                                </Text>
                            </View>
                            <Switch
                                value={autoApprove}
                                onValueChange={setAutoApprove}
                                trackColor={{ false: '#d1d1d1', true: '#bac7fc' }}
                                thumbColor={autoApprove ? '#6c7ce7' : '#f4f3f4'}
                            />
                        </View>
                    </Animated.View>
                )}
                
                {/* Submit button at the bottom */}
                <View style={styles.submitButtonContainer}>
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            canSubmit() ? styles.submitButtonActive : styles.submitButtonDisabled
                        ]}
                        onPress={handleSubmitPost}
                        disabled={!canSubmit() || isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <MaterialIcons name="sports-handball" size={24} color="#fff" />
                                <Text style={styles.submitButtonText}>Tạo hoạt động thể thao</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
            
            {/* Map modal */}
            <Modal
                visible={showMap}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowMap(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Chọn vị trí</Text>
                        
                        <View style={styles.mapContainer}>
                            {latitude && longitude && (
                                <MapView
                                    style={styles.map}
                                    initialRegion={{
                                        latitude: latitude,
                                        longitude: longitude,
                                        latitudeDelta: 0.005,
                                        longitudeDelta: 0.005,
                                    }}
                                >
                                    <Marker
                                        coordinate={{ latitude, longitude }}
                                        draggable
                                        onDragEnd={updateLocationFromMap}
                                    />
                                </MapView>
                            )}
                        </View>
                        
                        <View style={styles.modalButtonsContainer}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalCancelButton]}
                                onPress={() => setShowMap(false)}
                            >
                                <Text style={[styles.modalButtonText, styles.modalCancelText]}>Hủy</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalSubmitButton]}
                                onPress={() => setShowMap(false)}
                            >
                                <Text style={[styles.modalButtonText, styles.modalSubmitText]}>Xác nhận</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            
            {/* Date Picker Modal */}
            {showCustomDatePicker && (
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={showCustomDatePicker}
                    onRequestClose={() => setShowCustomDatePicker(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Chọn thời gian sự kiện</Text>
                            
                            <CustomDatePicker
                                value={tempDate}
                                mode="datetime"
                                onChange={(selectedDate) => {
                                    setTempDate(selectedDate);
                                }}
                                placeholder="Chọn thời gian"
                            />
                            
                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => setShowCustomDatePicker(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Hủy</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.confirmButton]}
                                    onPress={() => {
                                        setEventDate(tempDate);
                                        setShowCustomDatePicker(false);
                                    }}
                                >
                                    <Text style={styles.confirmButtonText}>Xác nhận</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
            
            {/* Repeat End Date Picker Modal */}
            {showRepeatEndDatePicker && (
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={showRepeatEndDatePicker}
                    onRequestClose={() => setShowRepeatEndDatePicker(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Chọn ngày kết thúc lặp lại</Text>
                            
                            <CustomDatePicker
                                value={repeatEndDate}
                                mode="date"
                                onChange={(selectedDate) => {
                                    setRepeatEndDate(selectedDate);
                                }}
                                minimumDate={new Date()} // Phải là ngày trong tương lai
                                placeholder="Chọn ngày kết thúc"
                            />
                            
                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => setShowRepeatEndDatePicker(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Hủy</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.confirmButton]}
                                    onPress={() => setShowRepeatEndDatePicker(false)}
                                >
                                    <Text style={styles.confirmButtonText}>Xác nhận</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
            
            {/* Friends Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showFriendsModal}
                onRequestClose={() => setShowFriendsModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={[styles.modalContent, styles.friendsModalContent]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Mời bạn bè tham gia</Text>
                            <TouchableOpacity
                                onPress={() => setShowFriendsModal(false)}
                            >
                                <MaterialIcons name="close" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>
                        
                        {/* Search bar */}
                        <View style={styles.searchBar}>
                            <MaterialIcons name="search" size={24} color="#6c7ce7" />
                            <TextInput
                                style={styles.searchInput}
                                value={searchFriendText}
                                onChangeText={setSearchFriendText}
                                placeholder="Tìm kiếm bạn bè"
                            />
                            {searchFriendText !== '' && (
                                <TouchableOpacity
                                    onPress={() => setSearchFriendText('')}
                                >
                                    <MaterialIcons name="clear" size={20} color="#888" />
                                </TouchableOpacity>
                            )}
                        </View>
                        
                        {/* Friends list */}
                        {friends.length > 0 ? (
                            <FlatList
                                data={filteredFriends}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={({item}) => (
                                    <TouchableOpacity
                                        style={styles.friendItem}
                                        onPress={() => toggleFriendInvitation(item)}
                                    >
                                        {item.avatar ? (
                                            <Image 
                                                source={{uri: item.avatar}} 
                                                style={styles.friendAvatar} 
                                            />
                                        ) : (
                                            <View style={styles.friendAvatarPlaceholder}>
                                                <Text style={styles.friendInitials}>
                                                    {item.displayName.charAt(0)}
                                                </Text>
                                            </View>
                                        )}
                                        <Text style={styles.friendItemName}>{item.displayName}</Text>
                                        <MaterialIcons 
                                            name={invitedFriends.some(f => f.id === item.id) ? "check-circle" : "radio-button-unchecked"} 
                                            size={24} 
                                            color={invitedFriends.some(f => f.id === item.id) ? "#6c7ce7" : "#ccc"} 
                                        />
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={
                                    <Text style={styles.emptyListText}>
                                        {searchFriendText 
                                            ? `Không tìm thấy bạn bè với từ khóa "${searchFriendText}"` 
                                            : 'Không có bạn bè'}
                                    </Text>
                                }
                            />
                        ) : (
                            <View style={styles.emptyFriendsList}>
                                <MaterialIcons name="people" size={64} color="#ccc" />
                                <Text style={styles.emptyFriendsListText}>
                                    Bạn chưa có bạn bè nào
                                </Text>
                            </View>
                        )}
                        
                        {/* Button to save selection */}
                        <TouchableOpacity
                            style={styles.saveFriendsButton}
                            onPress={() => setShowFriendsModal(false)}
                        >
                            <Text style={styles.saveFriendsButtonText}>
                                Xác nhận ({invitedFriends.length} người được mời)
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6c7ce7',
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingBottom: 15,
        paddingHorizontal: 20,
        elevation: 8,
        shadowColor: '#6c7ce7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
        marginLeft: -40, // Compensate for back button
    },
    placeholder: {
        width: 40,
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100, // Space for bottom bar
    },
    formNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    navItem: {
        flexDirection: 'column',
        alignItems: 'center',
        padding: 8,
    },
    navItemActive: {
        borderBottomWidth: 2,
        borderBottomColor: '#6c7ce7',
    },
    navItemText: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
    },
    navItemTextActive: {
        fontWeight: 'bold',
        color: '#6c7ce7',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderWidth: 1,
        borderColor: '#ff6b6b',
        borderRadius: 5,
        marginBottom: 10,
    },
    errorText: {
        color: '#ff6b6b',
        marginLeft: 10,
    },
    formSection: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
    },
    inputGroup: {
        marginBottom: 10,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
    },
    textArea: {
        height: 100,
    },
    charCounter: {
        alignSelf: 'flex-end',
        color: '#888',
    },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
    },
    dateText: {
        marginLeft: 10,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
    },
    picker: {
        padding: 10,
    },
    navButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
    },
    backBtnText: {
        marginLeft: 10,
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
    },
    nextButtonText: {
        marginRight: 10,
    },
    submitButtonContainer: {
        backgroundColor: '#6c7ce7',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 10,
    },
    submitButton: {
        backgroundColor: '#6c7ce7',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    submitButtonActive: {
        backgroundColor: '#4caf50',
    },
    submitButtonDisabled: {
        backgroundColor: '#ccc',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: '90%',
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    mapContainer: {
        height: 200,
        marginBottom: 10,
    },
    map: {
        flex: 1,
    },
    modalButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    modalButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        margin: 5,
        alignItems: 'center',
    },
    modalCancelButton: {
        backgroundColor: '#ff6b6b',
    },
    modalCancelText: {
        color: '#fff',
    },
    modalSubmitButton: {
        backgroundColor: '#4caf50',
    },
    modalSubmitText: {
        color: '#fff',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    cancelButton: {
        backgroundColor: '#ff6b6b',
    },
    confirmButton: {
        backgroundColor: '#4caf50',
    },
    cancelButtonText: {
        color: '#fff',
    },
    confirmButtonText: {
        color: '#fff',
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    switchLabel: {
        marginLeft: 10,
    },
    tagContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    tag: {
        backgroundColor: '#6c7ce7',
        padding: 5,
        borderRadius: 5,
        marginRight: 5,
    },
    tagText: {
        color: '#fff',
    },
    rowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    addButton: {
        backgroundColor: '#6c7ce7',
        padding: 5,
        borderRadius: 5,
    },
    invitedFriendsContainer: {
        marginBottom: 10,
    },
    invitedFriend: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
    },
    friendAvatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: 5,
    },
    friendAvatarPlaceholder: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    friendInitials: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
    },
    friendName: {
        flex: 1,
    },
    removeFriendButton: {
        padding: 5,
    },
    inviteFriendsButton: {
        backgroundColor: '#6c7ce7',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    inviteFriendsButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
    },
    searchInput: {
        flex: 1,
        padding: 10,
    },
    friendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
    },
    friendItemName: {
        flex: 1,
    },
    emptyListText: {
        color: '#888',
        textAlign: 'center',
    },
    emptyFriendsList: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyFriendsListText: {
        color: '#888',
        textAlign: 'center',
    },
    saveFriendsButton: {
        backgroundColor: '#6c7ce7',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    saveFriendsButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    friendsModalContent: {
        height: '80%',
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
    },
    locationButtonText: {
        marginLeft: 10,
    },
    locationInfo: {
        marginTop: 10,
    },
    locationInfoText: {
        color: '#888',
    },
    imagePreviewScroll: {
        height: 100,
        marginBottom: 10,
    },
    imagePreviewContainer: {
        width: 100,
        height: 100,
        marginRight: 10,
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        borderRadius: 5,
    },
    removeImageButton: {
        position: 'absolute',
        top: 5,
        right: 5,
        padding: 5,
        borderRadius: 15,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    imageUploadButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    uploadButton: {
        backgroundColor: '#6c7ce7',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    uploadButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    switchLabelContainer: {
        flex: 1,
    },
    switchLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    switchDescription: {
        color: '#888',
    },
    helpText: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
        marginTop: 5,
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: '#f8f9fa',
        borderRadius: 6,
        borderLeftWidth: 3,
        borderLeftColor: '#6c7ce7',
    },
});

export default CreateSportsPostScreen; 