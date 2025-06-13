import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    SafeAreaView,
    Share,
    Dimensions,
    Linking,
    FlatList,
    Platform
} from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import SportsPostService from '../services/SportsPostService';
import MapView, { Marker } from 'react-native-maps';
import moment from 'moment';
import 'moment/locale/vi';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const SportsPostDetailScreen = ({ route, navigation }) => {
    const { postId } = route.params;
    const [post, setPost] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isJoined, setIsJoined] = useState(false);
    const [participantCount, setParticipantCount] = useState(0);
    const [actionLoading, setActionLoading] = useState(false);
    const [showFullDescription, setShowFullDescription] = useState(false);

    useEffect(() => {
        fetchSportsPostData();
    }, []);

    const fetchSportsPostData = async () => {
        try {
            setLoading(true);
            const response = await SportsPostService.getSportsPostById(postId);
            setPost(response);
            setIsJoined(response.isParticipant || false);
            setParticipantCount(response.participantCount || 0);
            
            // Also fetch participants
            const participantsData = await SportsPostService.getParticipants(postId);
            setParticipants(participantsData || []);
        } catch (error) {
            console.error('Lỗi khi tải bài đăng thể thao:', error);
            Alert.alert('Lỗi', 'Không thể tải thông tin bài đăng. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinPress = async () => {
        try {
            setActionLoading(true);
            const response = await SportsPostService.toggleJoin(postId);
            setIsJoined(!isJoined);
            
            // Update participant count
            if (isJoined) {
                setParticipantCount(Math.max(0, participantCount - 1));
            } else {
                setParticipantCount(participantCount + 1);
            }
            
            // Refresh participants list
            const participantsData = await SportsPostService.getParticipants(postId);
            setParticipants(participantsData || []);
            
            Alert.alert(
                'Thành công', 
                isJoined ? 'Bạn đã rời khỏi sự kiện thể thao này' : 'Bạn đã tham gia sự kiện thể thao này'
            );
        } catch (error) {
            console.error('Lỗi khi tham gia/rời khỏi sự kiện:', error);
            Alert.alert('Lỗi', 'Không thể thực hiện thao tác này. Vui lòng thử lại sau.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSharePress = async () => {
        if (!post) return;
        
        try {
            const result = await Share.share({
                message: `Tham gia cùng tôi: ${post.title} - ${post.location} vào ${moment(post.eventTime).format('HH:mm - DD/MM/YYYY')}`,
                title: post.title
            });
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể chia sẻ bài đăng.');
        }
    };

    const getOpenMapUrl = (lat, long, label) => {
        const scheme = Platform.OS === 'ios' ? 'maps:' : 'geo:';
        const latLng = `${lat},${long}`;
        const url = Platform.OS === 'ios' 
            ? `${scheme}?ll=${latLng}&q=${encodeURIComponent(label)}`
            : `${scheme}${latLng}?q=${encodeURIComponent(label)}`;
        return url;
    };

    const handleOpenMap = () => {
        if (!post || !post.latitude || !post.longitude) return;
        
        const url = getOpenMapUrl(
            post.latitude, 
            post.longitude, 
            post.location
        );
        
        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Alert.alert('Lỗi', 'Không thể mở bản đồ trên thiết bị của bạn.');
            }
        });
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

    // Get main image URL
    const getMainImageUrl = () => {
        if (!post) return null;
        if (post.fullImageUrl) return post.fullImageUrl;
        if (post.processedImageUrls && post.processedImageUrls.length > 0) return post.processedImageUrls[0];
        if (post.processedImages && post.processedImages.length > 0) return post.processedImages[0].fullUrl;
        return 'https://via.placeholder.com/400x300/E91E63/FFFFFF?text=No+Image';
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#E91E63" />
                <Text style={styles.loadingText}>Đang tải...</Text>
            </SafeAreaView>
        );
    }

    if (!post) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={60} color="#ff6b6b" />
                <Text style={styles.errorTitle}>Không tìm thấy</Text>
                <Text style={styles.errorText}>Không thể tìm thấy bài đăng thể thao này.</Text>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>Quay lại</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.headerButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chi tiết sự kiện</Text>
                <TouchableOpacity 
                    style={styles.headerButton}
                    onPress={handleSharePress}
                >
                    <Ionicons name="share-outline" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
                {/* Main Image */}
                <Image source={{ uri: getMainImageUrl() }} style={styles.mainImage} />
                
                {/* Title and Host Info */}
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>{post.title}</Text>
                    <View style={styles.hostInfo}>
                        <Image 
                            source={{ uri: post.userRes?.profilePictureUrl || 'https://randomuser.me/api/portraits/men/1.jpg' }} 
                            style={styles.hostAvatar} 
                        />
                        <View>
                            <Text style={styles.hostName}>Người tổ chức: {post.userRes?.fullName || 'Unknown'}</Text>
                            <Text style={styles.postedTime}>Đăng lúc {moment(post.createdAt).fromNow()}</Text>
                        </View>
                    </View>
                </View>
                
                {/* Key Info Cards */}
                <View style={styles.infoCardsContainer}>
                    <View style={styles.infoCard}>
                        <MaterialIcons name="event" size={22} color="#E91E63" />
                        <Text style={styles.infoCardText}>{formatDateTime(post.eventTime)}</Text>
                    </View>
                    
                    <View style={styles.infoCard}>
                        <MaterialIcons name="location-on" size={22} color="#E91E63" />
                        <Text style={styles.infoCardText}>{post.location}</Text>
                    </View>
                    
                    <View style={styles.infoCard}>
                        <MaterialIcons name="group" size={22} color="#E91E63" />
                        <Text style={styles.infoCardText}>
                            {participantCount}/{post.maxParticipants} người tham gia
                        </Text>
                    </View>
                    
                    <View style={styles.infoCard}>
                        <MaterialIcons name="fitness-center" size={22} color="#E91E63" />
                        <Text style={styles.infoCardText}>{getSkillLevelLabel(post.skillLevel)}</Text>
                    </View>
                </View>
                
                {/* Join button */}
                <TouchableOpacity 
                    style={[
                        styles.joinButton, 
                        isJoined ? styles.leaveButton : styles.participateButton
                    ]}
                    onPress={handleJoinPress}
                    disabled={actionLoading}
                >
                    {actionLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <MaterialIcons 
                                name={isJoined ? "close" : "check"} 
                                size={22} 
                                color="#fff" 
                            />
                            <Text style={styles.joinButtonText}>
                                {isJoined ? 'Hủy tham gia' : 'Tham gia ngay'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
                
                {/* Description */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Mô tả</Text>
                    <Text style={styles.description} numberOfLines={showFullDescription ? undefined : 5}>
                        {post.description}
                    </Text>
                    {post.description && post.description.length > 150 && (
                        <TouchableOpacity 
                            style={styles.showMoreButton}
                            onPress={() => setShowFullDescription(!showFullDescription)}
                        >
                            <Text style={styles.showMoreText}>
                                {showFullDescription ? 'Thu gọn' : 'Xem thêm'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
                
                {/* Location Map */}
                {post.latitude && post.longitude && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Vị trí</Text>
                        <View style={styles.mapContainer}>
                            <MapView
                                style={styles.map}
                                initialRegion={{
                                    latitude: post.latitude,
                                    longitude: post.longitude,
                                    latitudeDelta: 0.01,
                                    longitudeDelta: 0.01,
                                }}
                            >
                                <Marker
                                    coordinate={{
                                        latitude: post.latitude,
                                        longitude: post.longitude,
                                    }}
                                    title={post.location}
                                />
                            </MapView>
                            <TouchableOpacity 
                                style={styles.openMapButton}
                                onPress={handleOpenMap}
                            >
                                <MaterialIcons name="map" size={16} color="#fff" />
                                <Text style={styles.openMapButtonText}>Mở bản đồ</Text>
                            </TouchableOpacity>
                        </View>
                        
                        {post.locationNotes && (
                            <Text style={styles.locationNotes}>
                                <Text style={{fontWeight: 'bold'}}>Ghi chú: </Text>
                                {post.locationNotes}
                            </Text>
                        )}
                    </View>
                )}
                
                {/* Requirements */}
                {post.requirements && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Yêu cầu</Text>
                        <Text style={styles.requirementsText}>{post.requirements}</Text>
                        
                        {(post.minAge || post.maxAge) && (
                            <View style={styles.ageRequirement}>
                                <MaterialIcons name="person" size={18} color="#666" />
                                <Text style={styles.ageText}>
                                    Độ tuổi: {post.minAge ? `${post.minAge}` : ''}
                                    {post.minAge && post.maxAge ? ' - ' : ''}
                                    {post.maxAge ? `${post.maxAge}` : ''}
                                </Text>
                            </View>
                        )}
                    </View>
                )}
                
                {/* Participants */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Người tham gia ({participantCount})</Text>
                    {participants.length > 0 ? (
                        <FlatList
                            data={participants}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.participantItem}
                                    onPress={() => navigation.navigate('Profile', { userId: item.id })}
                                >
                                    <Image 
                                        source={{ uri: item.profilePictureUrl || 'https://randomuser.me/api/portraits/men/1.jpg' }} 
                                        style={styles.participantAvatar} 
                                    />
                                    <Text style={styles.participantName} numberOfLines={1}>
                                        {item.fullName || 'Unknown'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={() => (
                                <Text style={styles.noParticipantsText}>Chưa có người tham gia</Text>
                            )}
                            contentContainerStyle={styles.participantsList}
                        />
                    ) : (
                        <Text style={styles.noParticipantsText}>Chưa có người tham gia</Text>
                    )}
                </View>
                
                {/* Additional info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thông tin thêm</Text>
                    
                    <View style={styles.additionalInfoItem}>
                        <MaterialIcons name="schedule" size={18} color="#666" />
                        <Text style={styles.additionalInfoText}>
                            Thời gian: {post.durationHours} giờ
                        </Text>
                    </View>
                    
                    {post.estimatedCost > 0 && (
                        <View style={styles.additionalInfoItem}>
                            <MaterialIcons name="attach-money" size={18} color="#666" />
                            <Text style={styles.additionalInfoText}>
                                Chi phí ước tính: {post.estimatedCost.toLocaleString()} VND
                            </Text>
                        </View>
                    )}
                    
                    {post.costNotes && (
                        <Text style={styles.costNotes}>
                            <Text style={{fontWeight: 'bold'}}>Ghi chú về chi phí: </Text>
                            {post.costNotes}
                        </Text>
                    )}
                </View>
                
                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Thẻ</Text>
                        <View style={styles.tagsContainer}>
                            {post.tags.map((tag, index) => (
                                <View key={index} style={styles.tag}>
                                    <Text style={styles.tagText}>#{tag}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
                
                {/* Spacer at bottom */}
                <View style={styles.bottomSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 10,
        color: '#333',
    },
    errorText: {
        fontSize: 16,
        marginTop: 5,
        marginBottom: 20,
        textAlign: 'center',
        color: '#666',
    },
    backButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#E91E63',
        borderRadius: 25,
    },
    backButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    headerButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    scrollView: {
        flex: 1,
    },
    mainImage: {
        width: '100%',
        height: 250,
        resizeMode: 'cover',
    },
    titleContainer: {
        padding: 16,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    hostInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    hostAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
    },
    hostName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    postedTime: {
        fontSize: 12,
        color: '#999',
    },
    infoCardsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 10,
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        marginBottom: 10,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
        width: '48%',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    infoCardText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#333',
    },
    joinButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 16,
        marginBottom: 16,
        paddingVertical: 12,
        borderRadius: 25,
    },
    participateButton: {
        backgroundColor: '#E91E63',
    },
    leaveButton: {
        backgroundColor: '#666',
    },
    joinButtonText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    section: {
        padding: 16,
        backgroundColor: '#fff',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        color: '#333',
    },
    showMoreButton: {
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    showMoreText: {
        color: '#E91E63',
        fontWeight: '500',
    },
    mapContainer: {
        height: 200,
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 10,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    openMapButton: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.7)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    openMapButtonText: {
        color: '#fff',
        marginLeft: 4,
        fontSize: 12,
    },
    locationNotes: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    requirementsText: {
        fontSize: 15,
        color: '#333',
        marginBottom: 10,
    },
    ageRequirement: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    ageText: {
        marginLeft: 5,
        fontSize: 14,
        color: '#666',
    },
    participantsList: {
        paddingVertical: 10,
    },
    participantItem: {
        alignItems: 'center',
        marginRight: 15,
        width: 70,
    },
    participantAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginBottom: 5,
    },
    participantName: {
        fontSize: 12,
        textAlign: 'center',
        color: '#333',
    },
    noParticipantsText: {
        fontSize: 14,
        color: '#999',
        fontStyle: 'italic',
    },
    additionalInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    additionalInfoText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#333',
    },
    costNotes: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    tag: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
        marginRight: 8,
        marginBottom: 8,
    },
    tagText: {
        fontSize: 12,
        color: '#666',
    },
    bottomSpacer: {
        height: 50,
    },
});

export default SportsPostDetailScreen; 