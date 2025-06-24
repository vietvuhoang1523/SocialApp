import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Alert,
    Dimensions,
    ScrollView,
    Modal
} from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import moment from 'moment';
import 'moment/locale/vi';
import SportsPostService from '../services/SportsPostService';
import sportsService from '../services/sportsService';
import * as ParticipantService from '../services/SportsPostParticipantService';
import { createAvatarUrl, getAvatarFromUser } from '../utils/ImageUtils';
import SafeImage from './common/SafeImage';

const { width } = Dimensions.get('window');

const SportsPostItem = ({ item, navigation, currentUserId }) => {
    // Debug logging for item structure
    console.log('🏷️ SportsPostItem props:', {
        itemId: item?.id,
        itemTitle: item?.title,
        hasItem: !!item,
        itemKeys: item ? Object.keys(item) : [],
        currentUserId
    });
    
    // Chỉ coi là đã tham gia nếu status là ACCEPTED
    const [isJoined, setIsJoined] = useState(
        (item.isParticipant && item.participantStatus === 'ACCEPTED') || 
        (item.hasJoined && item.participantStatus === 'ACCEPTED') || 
        false
    );
    // Kiểm tra có yêu cầu đang chờ phê duyệt không
    const [hasPendingRequest, setHasPendingRequest] = useState(
        (item.isParticipant && item.participantStatus === 'PENDING') ||
        (item.hasJoined && item.participantStatus === 'PENDING') ||
        false
    );
    const [participantCount, setParticipantCount] = useState(item.currentParticipants || item.participantCount || 0);
    const [participants, setParticipants] = useState([]);
    const [participantsLoading, setParticipantsLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showImageViewer, setShowImageViewer] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    // Fetch participants on component mount
    React.useEffect(() => {
        // Only fetch if item.id is valid
        if (item.id && item.id !== 'undefined' && item.id !== undefined) {
            fetchParticipants();
        } else {
            console.warn(`⚠️ Skipping participants fetch for invalid post ID: ${item.id}`);
        }
    }, [item.id]);

    // Fetch participants list
    const fetchParticipants = async () => {
        try {
            setParticipantsLoading(true);
            console.log(`🔄 Fetching participants for post ${item.id}...`);
            
            // Validate item.id before making API call
            if (!item.id || item.id === 'undefined' || item.id === undefined) {
                console.error(`❌ Cannot fetch participants: invalid post ID: ${item.id}`);
                setParticipants([]);
                return;
            }
            
            const participantsData = await sportsService.getParticipants(item.id, 0, 5); // Get first 5 participants
            
            let participantsList = [];
            if (Array.isArray(participantsData)) {
                participantsList = participantsData;
            } else if (participantsData.content && Array.isArray(participantsData.content)) {
                participantsList = participantsData.content;
            }
            
            console.log(`👥 Successfully fetched ${participantsList.length} participants for post ${item.id}`);
            console.log('📊 Participants data:', participantsList.map(p => ({
                id: p.id,
                userName: p.user?.fullName,
                status: p.status,
                isCreator: p.isCreator
            })));
            
            setParticipants(participantsList);
        } catch (error) {
            console.error(`❌ Error fetching participants for post ${item.id}:`, error);
            setParticipants([]);
        } finally {
            setParticipantsLoading(false);
        }
    };

    // Format date and time
    const formatDateTime = (dateTimeString) => {
        moment.locale('vi');
        return moment(dateTimeString).format('HH:mm - DD/MM/YYYY');
    };

    // Get skill level label
    const getSkillLevelLabel = (level) => {
        const levels = {
            BEGINNER: 'Người mới',
            NOVICE: 'Cơ bản',
            INTERMEDIATE: 'Trung cấp',
            ADVANCED: 'Nâng cao',
            EXPERT: 'Chuyên nghiệp',
            MASTER: 'Chuyên gia'
        };
        return levels[level] || level;
    };

    // Get sport type icon
    const getSportIcon = (type) => {
        const icons = {
            FOOTBALL: 'soccer-ball-o',
            BASKETBALL: 'basketball-ball',
            TENNIS: 'tennis-ball',
            VOLLEYBALL: 'volleyball-ball',
            BADMINTON: 'shuttlecock',
            RUNNING: 'running',
            CYCLING: 'biking',
            SWIMMING: 'swimmer',
            YOGA: 'mandala',
            GYM: 'dumbbell',
            HIKING: 'hiking',
            GOLF: 'golf-ball',
            TABLE_TENNIS: 'table-tennis',
            BOXING: 'boxing-glove',
            MARTIAL_ARTS: 'karate',
            OTHER: 'running'
        };
        return icons[type] || 'running';
    };

    // Check if event is expired
    const isEventExpired = () => {
        if (!item.eventTime) return false;
        const eventTime = new Date(item.eventTime);
        const now = new Date();
        return eventTime < now;
    };

    // Handle joining/leaving event
    const handleJoinPress = async () => {
        console.log('🔥 handleJoinPress called for post:', item.id);
        console.log('🔥 Current state:', { 
            isJoined, 
            hasPendingRequest, 
            loading, 
            currentUserId,
            isCreator: isCurrentUserCreator()
        });

        if (loading) {
            console.log('⚠️ Already loading, skipping');
            return;
        }

        // Ngăn người tạo bài viết tham gia vào bài viết của chính họ
        if (isCurrentUserCreator()) {
            Alert.alert(
                'Không thể tham gia',
                'Bạn không thể tham gia vào bài viết do chính bạn tạo ra.',
                [{ text: 'OK' }]
            );
            return;
        }

        try {
            setLoading(true);
            console.log('🔄 Starting join/leave process...');

            if (isJoined || hasPendingRequest) {
                console.log('🚪 Leaving sports post...');
                await ParticipantService.leaveSportsPost(item.id);
                setIsJoined(false);
                setHasPendingRequest(false);
                if (isJoined) {
                    setParticipantCount(prev => Math.max(0, prev - 1));
                }
                Alert.alert('Thành công', isJoined ? 'Đã hủy tham gia bài viết' : 'Đã hủy yêu cầu tham gia');
            } else {
                // Kiểm tra bài viết đã hết thời gian chưa
                if (isEventExpired()) {
                    Alert.alert(
                        'Không thể tham gia', 
                        'Bài viết này đã hết thời gian tham gia. Thời gian sự kiện đã qua.',
                        [{ text: 'OK' }]
                    );
                    return;
                }

                console.log('🚀 Joining sports post...');
                console.log('📝 Post details:', {
                    postId: item.id,
                    title: item.title,
                    autoApprove: item.autoApprove,
                    eventTime: item.eventTime,
                    isExpired: isEventExpired()
                });

                // Gửi yêu cầu tham gia
                const joinMessage = 'Tôi muốn tham gia bài đăng này!';
                console.log('📨 Calling ParticipantService.joinSportsPost...');
                
                const response = await ParticipantService.joinSportsPost(item.id, joinMessage);
                
                console.log('✅ Join response received:', response);
                console.log('📊 Response status:', response?.status);
                
                // Kiểm tra trạng thái thực tế từ response
                if (response && response.status === 'ACCEPTED') {
                    console.log('🎉 Request accepted immediately');
                    // Được chấp nhận ngay lập tức (auto-approve)
                    setIsJoined(true);
                    setHasPendingRequest(false);
                    setParticipantCount(prev => prev + 1);
                    Alert.alert('Thành công', 'Đã tham gia thành công!');
                } else if (response && response.status === 'PENDING') {
                    console.log('⏳ Request pending approval');
                    // Đang chờ phê duyệt
                    setIsJoined(false);
                    setHasPendingRequest(true);
                    // KHÔNG cập nhật participantCount
                    Alert.alert('Thành công', 'Đã gửi yêu cầu tham gia. Chờ người tạo bài viết phê duyệt.');
                } else {
                    console.log('🔄 Fallback logic - checking autoApprove:', item.autoApprove);
                    // Fallback: kiểm tra autoApprove từ item (nếu response không có status)
                    if (item.autoApprove === true) {
                        console.log('✅ Auto-approve enabled');
                        setIsJoined(true);
                        setHasPendingRequest(false);
                        setParticipantCount(prev => prev + 1);
                        Alert.alert('Thành công', 'Đã tham gia thành công!');
                    } else {
                        console.log('⏳ Manual approval required');
                        setIsJoined(false);
                        setHasPendingRequest(true);
                        Alert.alert('Thành công', 'Đã gửi yêu cầu tham gia. Chờ người tạo bài viết phê duyệt.');
                    }
                }
            }
            
            // Refresh participants list after join/leave
            fetchParticipants();
        } catch (error) {
            console.error('❌ Error handling join/leave:', error);
            console.error('❌ Error details:', {
                message: error.message,
                stack: error.stack,
                response: error.response?.data
            });
            Alert.alert('Lỗi', error.message || 'Không thể thực hiện thao tác');
        } finally {
            console.log('🏁 Join process finished');
            setLoading(false);
        }
    };

    // Handle view details
    const handleViewDetails = () => {
        navigation.navigate('SportsPostDetail', { postId: item.id });
    };

    // Handle manage participants (for creators)
    const handleManageParticipants = () => {
        navigation.navigate('ManageParticipants', { 
            postId: item.id, 
            postTitle: item.title 
        });
    };

    // Handle image tap
    const handleImageTap = (imageIndex = 0) => {
        setSelectedImageIndex(imageIndex);
        setShowImageViewer(true);
    };

    // Get all image URLs for display
    const getAllImageUrls = () => {
        console.log(`🖼️ Getting all image URLs for post ${item.id}:`, {
            hasImageUrls: !!item.imageUrls,
            hasImages: !!item.images,
            hasImagePaths: !!item.imagePaths,
            hasPostImages: !!item.postImages,
            hasFullImageUrl: !!item.fullImageUrl,
            hasProcessedImageUrls: !!item.processedImageUrls,
            hasProcessedImages: !!item.processedImages,
            imageUrlsLength: item.imageUrls?.length || 0,
            imagesLength: item.images?.length || 0
        });

        let imageUrls = [];

        // Priority 1: Check for already processed image URLs
        if (item.imageUrls && Array.isArray(item.imageUrls) && item.imageUrls.length > 0) {
            console.log(`✅ Processing ${item.imageUrls.length} imageUrls`);
            imageUrls = item.imageUrls.map(imageUrl => {
                // If it's already a full URL, use it
                if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                    return imageUrl;
                }
                // Otherwise, process it
                return sportsService.createImageUrl(imageUrl);
            }).filter(Boolean); // Remove null URLs
            
            if (imageUrls.length > 0) {
                console.log(`✅ Found ${imageUrls.length} processed imageUrls`);
                return imageUrls;
            }
        }
        
        // Priority 2: Check for images array
        if (item.images && Array.isArray(item.images) && item.images.length > 0) {
            console.log(`✅ Processing ${item.images.length} images`);
            imageUrls = item.images.map(imageUrl => {
                if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                    return imageUrl;
                }
                return sportsService.createImageUrl(imageUrl);
            }).filter(Boolean);
            
            if (imageUrls.length > 0) {
                console.log(`✅ Found ${imageUrls.length} processed images`);
                return imageUrls;
            }
        }
        
        // Priority 3: Check for imagePaths
        if (item.imagePaths && Array.isArray(item.imagePaths) && item.imagePaths.length > 0) {
            console.log(`✅ Processing ${item.imagePaths.length} imagePaths`);
            imageUrls = item.imagePaths.map(imgPath => sportsService.createImageUrl(imgPath)).filter(Boolean);
            
            if (imageUrls.length > 0) {
                console.log(`✅ Found ${imageUrls.length} processed imagePaths`);
                return imageUrls;
            }
        }
        
        // Priority 4: Check for postImages
        if (item.postImages && Array.isArray(item.postImages) && item.postImages.length > 0) {
            console.log(`✅ Processing ${item.postImages.length} postImages`);
            imageUrls = item.postImages.map(imgPath => sportsService.createImageUrl(imgPath)).filter(Boolean);
            
            if (imageUrls.length > 0) {
                console.log(`✅ Found ${imageUrls.length} processed postImages`);
                return imageUrls;
            }
        }
        
        // Priority 5: Legacy support for old formats
        if (item.fullImageUrl) {
            console.log(`✅ Using fullImageUrl: ${item.fullImageUrl}`);
            return [item.fullImageUrl];
        }
        
        if (item.processedImageUrls && Array.isArray(item.processedImageUrls) && item.processedImageUrls.length > 0) {
            console.log(`✅ Using ${item.processedImageUrls.length} processedImageUrls`);
            return item.processedImageUrls;
        }
        
        if (item.processedImages && Array.isArray(item.processedImages) && item.processedImages.length > 0) {
            console.log(`✅ Using ${item.processedImages.length} processedImages`);
            return item.processedImages.map(img => img.fullUrl).filter(Boolean);
        }
        
        // Priority 6: Check for single imageUrl and process it
        if (item.imageUrl) {
            const processedUrl = sportsService.createImageUrl(item.imageUrl);
            console.log(`✅ Using single imageUrl processed: ${processedUrl}`);
            return [processedUrl];
        }
        
        console.log(`❌ No image found for post ${item.id}, using sport-specific placeholder`);
        
        // Create sport-specific placeholder
        const sportType = item.sportType || 'SPORT';
        const placeholderText = encodeURIComponent(sportType);
        const placeholderUrl = `https://via.placeholder.com/400x300/E91E63/FFFFFF?text=${placeholderText}`;
        
        console.log(`🖼️ Generated placeholder URL for post ${item.id}: ${placeholderUrl}`);
        return [placeholderUrl];
    };

    // Get main image URL (first image)
    const getMainImageUrl = () => {
        const allImages = getAllImageUrls();
        return allImages[0] || `https://via.placeholder.com/400x300/E91E63/FFFFFF?text=${encodeURIComponent(item.sportType || 'SPORT')}`;
    };

    // Render images based on count
    const renderImages = () => {
        const allImages = getAllImageUrls();
        const imageCount = allImages.length;

        console.log(`🖼️ Rendering ${imageCount} images for post ${item.id}`);

        if (imageCount === 0) {
            // No images, show placeholder
            return (
                <SafeImage 
                    source={{ uri: null }} 
                    style={styles.image}
                    sportType={item.sportType}
                    postId={item.id}
                />
            );
        } else if (imageCount === 1) {
            // Single image
            return (
                <TouchableOpacity onPress={() => handleImageTap(0)}>
                    <SafeImage 
                        source={{ uri: allImages[0] }} 
                        style={styles.image}
                        sportType={item.sportType}
                        postId={item.id}
                    />
                </TouchableOpacity>
            );
        } else if (imageCount === 2) {
            // Two images side by side
            return (
                <View style={styles.twoImagesContainer}>
                    <TouchableOpacity onPress={() => handleImageTap(0)} style={styles.twoImagesLeft}>
                        <SafeImage 
                            source={{ uri: allImages[0] }} 
                            style={styles.twoImagesLeft}
                            sportType={item.sportType}
                            postId={item.id}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleImageTap(1)} style={styles.twoImagesRight}>
                        <SafeImage 
                            source={{ uri: allImages[1] }} 
                            style={styles.twoImagesRight}
                            sportType={item.sportType}
                            postId={item.id}
                        />
                    </TouchableOpacity>
                </View>
            );
        } else if (imageCount === 3) {
            // Three images: one large on left, two small on right
            return (
                <View style={styles.threeImagesContainer}>
                    <TouchableOpacity onPress={() => handleImageTap(0)} style={styles.threeImagesLeft}>
                        <Image source={{ uri: allImages[0] }} style={styles.threeImagesLeft} />
                    </TouchableOpacity>
                    <View style={styles.threeImagesRightContainer}>
                        <TouchableOpacity onPress={() => handleImageTap(1)} style={styles.threeImagesTopRight}>
                            <Image source={{ uri: allImages[1] }} style={styles.threeImagesTopRight} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleImageTap(2)} style={styles.threeImagesBottomRight}>
                            <Image source={{ uri: allImages[2] }} style={styles.threeImagesBottomRight} />
                        </TouchableOpacity>
                    </View>
                </View>
            );
        } else {
            // Four or more images: show first 3 and "+N more" overlay
            return (
                <View style={styles.multipleImagesContainer}>
                    <TouchableOpacity onPress={() => handleImageTap(0)} style={styles.multipleImagesLeft}>
                        <Image source={{ uri: allImages[0] }} style={styles.multipleImagesLeft} />
                    </TouchableOpacity>
                    <View style={styles.multipleImagesRightContainer}>
                        <TouchableOpacity onPress={() => handleImageTap(1)} style={styles.multipleImagesTopRight}>
                            <Image source={{ uri: allImages[1] }} style={styles.multipleImagesTopRight} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleImageTap(2)} style={styles.multipleImagesBottomRightContainer}>
                            <Image source={{ uri: allImages[2] }} style={styles.multipleImagesBottomRight} />
                            {imageCount > 3 && (
                                <View style={styles.moreImagesOverlay}>
                                    <Text style={styles.moreImagesText}>+{imageCount - 3}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }
    };

    // Get user profile picture URL
    const getUserProfilePictureUrl = () => {
        const user = item.creator || item.userRes;
        console.log(`👤 Getting profile picture for user:`, {
            hasCreator: !!item.creator,
            hasUserRes: !!item.userRes,
            userProfilePictureUrl: user?.profilePictureUrl,
            userFullName: user?.fullName
        });
        
        if (!user) {
            console.log('❌ No user found, using fallback avatar');
            return 'https://randomuser.me/api/portraits/men/1.jpg';
        }
        
        // Try to get avatar using ImageUtils
        const avatarUrl = getAvatarFromUser(user);
        if (avatarUrl) {
            console.log(`✅ Got avatar URL: ${avatarUrl}`);
            return avatarUrl;
        }
        
        console.log('❌ No avatar found, using fallback');
        return 'https://randomuser.me/api/portraits/men/1.jpg';
    };

    // Get user full name
    const getUserFullName = () => {
        const user = item.creator || item.userRes;
        return user?.fullName || 'Unknown User';
    };

    // Check if current user is the creator of the post
    const isCurrentUserCreator = () => {
        console.log(`🔍 Checking if user is creator for post ${item.id}:`, {
            currentUserId,
            isCreator: item.isCreator,
            createdByUser: item.createdByUser,
            canEdit: item.canEdit,
            creatorId: item.creator?.id,
            userResId: item.userRes?.id,
        });

        // Check multiple possible fields for creator identification
        if (item.isCreator === true) {
            console.log(`✅ User is creator (isCreator: true)`);
            return true;
        }
        
        if (item.createdByUser === true) {
            console.log(`✅ User is creator (createdByUser: true)`);
            return true;
        }
        
        // Check creator ID
        const creatorId = item.creator?.id || item.userRes?.id;
        if (creatorId && currentUserId && creatorId === currentUserId) {
            console.log(`✅ User is creator (ID match: ${creatorId} === ${currentUserId})`);
            return true;
        }
        
        // Check canEdit permission (usually creators can edit their posts)
        if (item.canEdit === true) {
            console.log(`✅ User is creator (canEdit: true)`);
            return true;
        }
        
        console.log(`❌ User is NOT creator`);
        return false;
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    <Image 
                        source={{ uri: getUserProfilePictureUrl() }} 
                        style={styles.avatar} 
                    />
                    <View style={styles.nameTimeContainer}>
                        <Text style={styles.username}>{getUserFullName()}</Text>
                        <Text style={styles.timeAgo}>Đăng lúc {moment(item.createdAt).fromNow()}</Text>
                    </View>
                </View>
                
                <View style={styles.sportTypeContainer}>
                    <FontAwesome5 name={getSportIcon(item.sportType)} size={16} color="#E91E63" />
                    <Text style={styles.sportType}>{item.sportType}</Text>
                </View>
            </View>

            {/* Title and Images */}
            <Text style={styles.title}>{item.title}</Text>
            
            {/* Multiple Images Display */}
            {renderImages()}

            {/* Info Cards */}
            <View style={styles.infoContainer}>
                <View style={styles.infoCard}>
                    <MaterialIcons 
                        name={isEventExpired() ? "event-busy" : "event"} 
                        size={18} 
                        color={isEventExpired() ? "#757575" : "#E91E63"} 
                    />
                    <Text style={[
                        styles.infoText,
                        isEventExpired() && { color: '#757575' }
                    ]}>
                        {isEventExpired() ? 'Đã hết hạn - ' : ''}{formatDateTime(item.eventTime)}
                    </Text>
                </View>
                
                <View style={styles.infoCard}>
                    <MaterialIcons name="location-on" size={18} color="#E91E63" />
                    <Text style={styles.infoText} numberOfLines={1}>{item.location}</Text>
                </View>
                
                <View style={styles.infoCard}>
                    <MaterialIcons name="group" size={18} color="#E91E63" />
                    <Text style={styles.infoText}>
                        {participantCount}/{item.maxParticipants} người tham gia
                    </Text>
                </View>
                
                <View style={styles.infoCard}>
                    <MaterialIcons name="fitness-center" size={18} color="#E91E63" />
                    <Text style={styles.infoText}>{getSkillLevelLabel(item.skillLevel)}</Text>
                </View>
            </View>

            {/* Description */}
            <Text style={styles.description} numberOfLines={3}>{item.description}</Text>

            {/* Participants Preview */}
            <View style={styles.participantsPreview}>
                <Text style={styles.participantsTitle}>
                    Người tham gia ({participants.length})
                </Text>
                {participantsLoading ? (
                    <Text style={styles.participantsLoading}>Đang tải...</Text>
                ) : participants.length > 0 ? (
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={styles.participantsScrollView}
                    >
                        {participants.slice(0, 5).map((participant, index) => {
                            const user = participant.user || participant;
                            const avatarUrl = getAvatarFromUser(user);
                            
                            return (
                                <TouchableOpacity
                                    key={participant.id || index}
                                    style={styles.participantPreviewItem}
                                    onPress={() => navigation.navigate('UserProfileScreen', { userId: user.id })}
                                >
                                    <Image
                                        source={{ 
                                            uri: avatarUrl || 'https://randomuser.me/api/portraits/men/1.jpg' 
                                        }}
                                        style={styles.participantPreviewAvatar}
                                    />
                                    <Text style={styles.participantPreviewName} numberOfLines={1}>
                                        {user.fullName || 'Unknown'}
                                    </Text>
                                    {participant.isCreator && (
                                        <View style={styles.creatorBadge}>
                                            <Text style={styles.creatorBadgeText}>Host</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                        {participants.length > 5 && (
                            <TouchableOpacity 
                                style={styles.moreParticipantsContainer}
                                onPress={handleViewDetails}
                            >
                                <View style={styles.moreParticipantsCircle}>
                                    <Text style={styles.moreParticipantsText}>
                                        +{participants.length - 5}
                                    </Text>
                                </View>
                                <Text style={styles.participantPreviewName} numberOfLines={1}>
                                    Xem thêm
                                </Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                ) : (
                    <Text style={styles.noParticipantsText}>
                        {isCurrentUserCreator() ? 
                            'Chưa có ai tham gia bài viết của bạn' : 
                            'Chưa có người tham gia'}
                    </Text>
                )}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                {/* Only show Join button if current user is NOT the creator */}
                {!isCurrentUserCreator() && (
                    <TouchableOpacity 
                        style={[
                            styles.actionButton, 
                            styles.joinButtonContainer, 
                            isJoined ? styles.joinedButton : 
                            hasPendingRequest ? styles.pendingButton : 
                            isEventExpired() && !isJoined && !hasPendingRequest ? styles.expiredButton :
                            styles.joinButton
                        ]}
                        onPress={handleJoinPress}
                        disabled={loading || (isEventExpired() && !isJoined && !hasPendingRequest)}
                    >
                        <MaterialIcons 
                            name={
                                isJoined ? "check-circle" : 
                                hasPendingRequest ? "schedule" : 
                                isEventExpired() && !isJoined && !hasPendingRequest ? "event-busy" :
                                "add-circle"
                            } 
                            size={20} 
                            color="#fff" 
                        />
                        <Text style={[styles.actionButtonText, {color: '#fff'}]}>
                            {isJoined ? 'Đã tham gia' : 
                             hasPendingRequest ? 'Chờ phê duyệt' : 
                             isEventExpired() && !isJoined && !hasPendingRequest ? 'Đã hết hạn' :
                             'Tham gia'}
                        </Text>
                    </TouchableOpacity>
                )}
                
                {/* Show creator-specific actions if user is the creator */}
                {isCurrentUserCreator() && (
                    <TouchableOpacity 
                        style={[styles.actionButton, styles.creatorButton, styles.creatorButtonContainer]}
                        onPress={handleManageParticipants}
                    >
                        <MaterialIcons name="people" size={20} color="#E91E63" />
                        <Text style={[styles.actionButtonText, {color: '#E91E63'}]}>
                            Quản lý tham gia
                        </Text>
                    </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                    style={[styles.actionButton, styles.detailsButton, styles.detailsButtonContainer]}
                    onPress={handleViewDetails}
                >
                    <MaterialIcons name="info-outline" size={20} color="#444" />
                    <Text style={styles.actionButtonText}>Chi tiết</Text>
                </TouchableOpacity>
            </View>

            {/* Image Viewer Modal */}
            <Modal
                visible={showImageViewer}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowImageViewer(false)}
            >
                <View style={styles.imageViewerContainer}>
                    <TouchableOpacity 
                        style={styles.imageViewerCloseButton}
                        onPress={() => setShowImageViewer(false)}
                    >
                        <MaterialIcons name="close" size={30} color="#fff" />
                    </TouchableOpacity>
                    
                    <ScrollView 
                        horizontal 
                        pagingEnabled 
                        showsHorizontalScrollIndicator={false}
                        contentOffset={{ x: selectedImageIndex * width, y: 0 }}
                        style={styles.imageViewerScrollView}
                    >
                        {getAllImageUrls().map((imageUrl, index) => (
                            <Image
                                key={index}
                                source={{ uri: imageUrl }}
                                style={styles.imageViewerImage}
                                resizeMode="contain"
                            />
                        ))}
                    </ScrollView>
                    
                    {getAllImageUrls().length > 1 && (
                        <View style={styles.imageViewerIndicator}>
                            <Text style={styles.imageViewerIndicatorText}>
                                {selectedImageIndex + 1} / {getAllImageUrls().length}
                            </Text>
                        </View>
                    )}
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 15,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    nameTimeContainer: {
        flexDirection: 'column',
    },
    username: {
        fontWeight: 'bold',
        fontSize: 15,
        color: '#333',
    },
    timeAgo: {
        fontSize: 12,
        color: '#999',
    },
    sportTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    sportType: {
        marginLeft: 5,
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    image: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginBottom: 12,
    },
    // Two images layout
    twoImagesContainer: {
        flexDirection: 'row',
        height: 200,
        marginBottom: 12,
        borderRadius: 10,
        overflow: 'hidden',
    },
    twoImagesLeft: {
        flex: 1,
        height: '100%',
        marginRight: 2,
    },
    twoImagesRight: {
        flex: 1,
        height: '100%',
        marginLeft: 2,
    },
    // Three images layout
    threeImagesContainer: {
        flexDirection: 'row',
        height: 200,
        marginBottom: 12,
        borderRadius: 10,
        overflow: 'hidden',
    },
    threeImagesLeft: {
        flex: 2,
        height: '100%',
        marginRight: 2,
    },
    threeImagesRightContainer: {
        flex: 1,
        flexDirection: 'column',
        marginLeft: 2,
    },
    threeImagesTopRight: {
        flex: 1,
        width: '100%',
        marginBottom: 2,
    },
    threeImagesBottomRight: {
        flex: 1,
        width: '100%',
        marginTop: 2,
    },
    // Multiple images layout (4+)
    multipleImagesContainer: {
        flexDirection: 'row',
        height: 200,
        marginBottom: 12,
        borderRadius: 10,
        overflow: 'hidden',
    },
    multipleImagesLeft: {
        flex: 2,
        height: '100%',
        marginRight: 2,
    },
    multipleImagesRightContainer: {
        flex: 1,
        flexDirection: 'column',
        marginLeft: 2,
    },
    multipleImagesTopRight: {
        flex: 1,
        width: '100%',
        marginBottom: 2,
    },
    multipleImagesBottomRightContainer: {
        flex: 1,
        position: 'relative',
        marginTop: 2,
    },
    multipleImagesBottomRight: {
        width: '100%',
        height: '100%',
    },
    moreImagesOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    moreImagesText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    infoContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 10,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginRight: 8,
        marginBottom: 8,
    },
    infoText: {
        fontSize: 12,
        marginLeft: 5,
        color: '#666',
    },
    description: {
        fontSize: 14,
        color: '#666',
        marginBottom: 15,
        lineHeight: 20,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 25,
        minWidth: 120,
    },
    joinButton: {
        backgroundColor: '#4CAF50',
    },
    joinedButton: {
        backgroundColor: '#E91E63',
    },
    pendingButton: {
        backgroundColor: '#FF9800',
    },
    expiredButton: {
        backgroundColor: '#757575',
    },
    creatorButton: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#E91E63',
    },
    detailsButton: {
        backgroundColor: '#f0f0f0',
    },
    joinButtonContainer: {
        marginRight: 10,
    },
    creatorButtonContainer: {
        marginRight: 10,
    },
    detailsButtonContainer: {
        flex: 1,
    },
    actionButtonText: {
        marginLeft: 5,
        fontWeight: '600',
        fontSize: 14,
        color: '#444',
    },
    // Image Viewer styles
    imageViewerContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageViewerCloseButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 1,
        padding: 10,
    },
    imageViewerScrollView: {
        flex: 1,
        width: width,
    },
    imageViewerImage: {
        width: width,
        height: '100%',
    },
    imageViewerIndicator: {
        position: 'absolute',
        bottom: 50,
        alignSelf: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    imageViewerIndicatorText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    // Participants preview styles
    participantsPreview: {
        marginBottom: 15,
    },
    participantsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    participantsLoading: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },
    participantsScrollView: {
        flexDirection: 'row',
    },
    participantPreviewItem: {
        alignItems: 'center',
        marginRight: 12,
        width: 60,
    },
    participantPreviewAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginBottom: 4,
        borderWidth: 2,
        borderColor: '#E91E63',
    },
    participantPreviewName: {
        fontSize: 10,
        color: '#666',
        textAlign: 'center',
        fontWeight: '500',
    },
    creatorBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#FF6B35',
        borderRadius: 8,
        paddingHorizontal: 4,
        paddingVertical: 1,
    },
    creatorBadgeText: {
        fontSize: 8,
        color: 'white',
        fontWeight: 'bold',
    },
    moreParticipantsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 60,
    },
    moreParticipantsCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#E91E63',
    },
    moreParticipantsText: {
        fontSize: 10,
        color: '#E91E63',
        fontWeight: 'bold',
    },
    noParticipantsText: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },
});

export default SportsPostItem; 