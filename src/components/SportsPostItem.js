import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Alert,
    Dimensions,
    ScrollView
} from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import moment from 'moment';
import 'moment/locale/vi';
import SportsPostService from '../services/SportsPostService';

const { width } = Dimensions.get('window');

const SportsPostItem = ({ item, navigation, currentUserId }) => {
    const [isJoined, setIsJoined] = useState(item.isParticipant || false);
    const [participantCount, setParticipantCount] = useState(item.participantCount || 0);
    const [loading, setLoading] = useState(false);

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

    // Handle joining/leaving event
    const handleJoinPress = async () => {
        try {
            setLoading(true);
            const response = await SportsPostService.toggleJoin(item.id);
            setIsJoined(!isJoined);
            
            // Update participant count
            if (isJoined) {
                setParticipantCount(Math.max(0, participantCount - 1));
                Alert.alert('Thành công', 'Bạn đã rời khỏi sự kiện thể thao này');
            } else {
                setParticipantCount(participantCount + 1);
                Alert.alert('Thành công', 'Bạn đã tham gia sự kiện thể thao này');
            }
        } catch (error) {
            console.error('Lỗi khi tham gia/rời khỏi sự kiện:', error);
            Alert.alert('Lỗi', 'Không thể thực hiện thao tác này. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    // Handle view details
    const handleViewDetails = () => {
        navigation.navigate('SportsPostDetail', { postId: item.id });
    };

    // Get main image URL
    const getMainImageUrl = () => {
        if (item.fullImageUrl) return item.fullImageUrl;
        if (item.processedImageUrls && item.processedImageUrls.length > 0) return item.processedImageUrls[0];
        if (item.processedImages && item.processedImages.length > 0) return item.processedImages[0].fullUrl;
        return 'https://via.placeholder.com/400x300/E91E63/FFFFFF?text=No+Image';
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    <Image 
                        source={{ uri: item.userRes?.profilePictureUrl || 'https://randomuser.me/api/portraits/men/1.jpg' }} 
                        style={styles.avatar} 
                    />
                    <View style={styles.nameTimeContainer}>
                        <Text style={styles.username}>{item.userRes?.fullName || 'Unknown User'}</Text>
                        <Text style={styles.timeAgo}>Đăng lúc {moment(item.createdAt).fromNow()}</Text>
                    </View>
                </View>
                
                <View style={styles.sportTypeContainer}>
                    <FontAwesome5 name={getSportIcon(item.sportType)} size={16} color="#E91E63" />
                    <Text style={styles.sportType}>{item.sportType}</Text>
                </View>
            </View>

            {/* Title and Image */}
            <Text style={styles.title}>{item.title}</Text>
            
            <TouchableOpacity onPress={handleViewDetails}>
                <Image source={{ uri: getMainImageUrl() }} style={styles.image} />
            </TouchableOpacity>

            {/* Info Cards */}
            <View style={styles.infoContainer}>
                <View style={styles.infoCard}>
                    <MaterialIcons name="event" size={18} color="#E91E63" />
                    <Text style={styles.infoText}>{formatDateTime(item.eventTime)}</Text>
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

            {/* Actions */}
            <View style={styles.actions}>
                <TouchableOpacity 
                    style={[styles.actionButton, isJoined ? styles.joinedButton : styles.joinButton]}
                    onPress={handleJoinPress}
                    disabled={loading}
                >
                    <MaterialIcons name={isJoined ? "check-circle" : "add-circle"} size={20} color={isJoined ? "#fff" : "#fff"} />
                    <Text style={[styles.actionButtonText, {color: '#fff'}]}>
                        {isJoined ? 'Đã tham gia' : 'Tham gia'}
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.actionButton, styles.detailsButton]}
                    onPress={handleViewDetails}
                >
                    <MaterialIcons name="info-outline" size={20} color="#444" />
                    <Text style={styles.actionButtonText}>Chi tiết</Text>
                </TouchableOpacity>
            </View>
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
        justifyContent: 'space-between',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 25,
        flex: 1,
        marginHorizontal: 5,
    },
    joinButton: {
        backgroundColor: '#4CAF50',
    },
    joinedButton: {
        backgroundColor: '#E91E63',
    },
    detailsButton: {
        backgroundColor: '#f0f0f0',
    },
    actionButtonText: {
        marginLeft: 5,
        fontWeight: '600',
        fontSize: 14,
        color: '#444',
    },
});

export default SportsPostItem; 