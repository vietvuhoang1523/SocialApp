// NewChatHeader.js - Header chat mới với UI hiện đại
import React, { memo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    Animated,
    Alert,
    Image
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Import video call service
import videoCallService from '../../services/videoCallService';
// Import image utils
import { getAvatarFromUser } from '../../utils/ImageUtils';

const NewChatHeader = memo(({
    navigation,
    user,
    currentUser,
    isTyping = false,
    isConnected = false,
    connectionStatus = 'disconnected',
    onReconnect,
    onVideoCallStart,  // New prop for handling video call start
    onAudioCallStart   // New prop for handling audio call start
}) => {
    // 📱 Back button handler
    const handleBack = () => {
        navigation.goBack();
    };

    // 🎥 Video call handler
    const handleVideoCall = async () => {
        try {
            if (!user?.id) {
                Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng');
                return;
            }

            console.log('🎥 Starting video call with:', user.fullName);
            
            // Show loading
            Alert.alert(
                'Đang kết nối...', 
                'Đang khởi tạo cuộc gọi video',
                [],
                { cancelable: false }
            );

            const callResponse = await videoCallService.initiateCall(user.id, 'VIDEO');
            
            console.log('✅ Video call initiated:', callResponse);

            // Call parent handler if provided
            if (onVideoCallStart) {
                onVideoCallStart(callResponse);
            } else {
                // Default navigation - you can customize this
                navigation.navigate('VideoCallScreen', {
                    roomId: callResponse.roomId,
                    callType: 'VIDEO',
                    isOutgoing: true,
                    callee: user,
                    caller: currentUser,
                    callData: callResponse
                });
            }

        } catch (error) {
            console.error('❌ Error starting video call:', error);
            Alert.alert(
                'Lỗi cuộc gọi video', 
                'Không thể khởi tạo cuộc gọi video. Vui lòng thử lại.',
                [{ text: 'OK' }]
            );
        }
    };

    // 📞 Audio call handler
    const handleAudioCall = async () => {
        try {
            if (!user?.id) {
                Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng');
                return;
            }

            console.log('📞 Starting audio call with:', user.fullName);
            
            // Show loading
            Alert.alert(
                'Đang kết nối...', 
                'Đang khởi tạo cuộc gọi thoại',
                [],
                { cancelable: false }
            );

            const callResponse = await videoCallService.initiateCall(user.id, 'AUDIO');
            
            console.log('✅ Audio call initiated:', callResponse);

            // Call parent handler if provided
            if (onAudioCallStart) {
                onAudioCallStart(callResponse);
            } else {
                // Default navigation - you can customize this
                navigation.navigate('AudioCallScreen', {
                    roomId: callResponse.roomId,
                    callType: 'AUDIO',
                    isOutgoing: true,
                    callee: user,
                    caller: currentUser,
                    callData: callResponse
                });
            }

        } catch (error) {
            console.error('❌ Error starting audio call:', error);
            Alert.alert(
                'Lỗi cuộc gọi thoại', 
                'Không thể khởi tạo cuộc gọi thoại. Vui lòng thử lại.',
                [{ text: 'OK' }]
            );
        }
    };

    // 📱 More options handler
    const handleMoreOptions = () => {
        Alert.alert(
            'Tùy chọn thêm',
            'Chọn một tùy chọn',
            [
                { text: 'Xem thông tin', onPress: () => console.log('View profile') },
                { text: 'Lịch sử cuộc gọi', onPress: () => console.log('Call history') },
                { text: 'Chặn người dùng', onPress: () => console.log('Block user'), style: 'destructive' },
                { text: 'Hủy', style: 'cancel' }
            ]
        );
    };

    // 🔧 Connection status text
    const getConnectionStatusText = () => {
        if (isConnected) {
            return 'Đang hoạt động';
        } else if (connectionStatus === 'connecting') {
            return 'Đang kết nối...';
        } else if (connectionStatus === 'reconnecting') {
            return 'Đang kết nối lại...';
        } else {
            return 'Ngoại tuyến';
        }
    };

    // 🎨 Connection status color
    const getConnectionStatusColor = () => {
        if (isConnected) {
            return '#4CAF50';
        } else if (connectionStatus === 'connecting' || connectionStatus === 'reconnecting') {
            return '#FF9800';
        } else {
            return '#F44336';
        }
    };

    return (
        <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.header}
        >
            <StatusBar barStyle="light-content" backgroundColor="#667eea" />
            
            <View style={styles.headerContent}>
                {/* Back Button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleBack}
                    activeOpacity={0.8}
                >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>

                {/* User Info */}
                <View style={styles.userInfo}>
                    {/* Avatar */}
                    <View style={styles.avatarContainer}>
                        {(() => {
                            const avatarUrl = getAvatarFromUser(user);
                            console.log('🔍 Header Avatar URL:', avatarUrl, 'from user:', user);
                            
                            return avatarUrl ? (
                                <Image
                                    source={{ uri: avatarUrl }}
                                    style={styles.avatarImage}
                                    defaultSource={{ uri: 'https://via.placeholder.com/40' }}
                                    onError={() => {
                                        console.log('❌ Avatar image failed to load:', avatarUrl);
                                    }}
                                />
                            ) : (
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>
                                        {user?.fullName?.charAt(0)?.toUpperCase() || '?'}
                                    </Text>
                                </View>
                            );
                        })()}
                        
                        {/* Online indicator */}
                        <View
                            style={[
                                styles.onlineIndicator,
                                { backgroundColor: getConnectionStatusColor() }
                            ]}
                        />
                    </View>

                    {/* Name and Status */}
                    <View style={styles.nameContainer}>
                        <Text style={styles.userName} numberOfLines={1}>
                            {user?.fullName || 'Người dùng'}
                        </Text>
                        
                        <View style={styles.statusContainer}>
                            {isTyping ? (
                                <View style={styles.typingContainer}>
                                    <View style={styles.typingDots}>
                                        <Animated.View style={[styles.typingDot, styles.dot1]} />
                                        <Animated.View style={[styles.typingDot, styles.dot2]} />
                                        <Animated.View style={[styles.typingDot, styles.dot3]} />
                                    </View>
                                    <Text style={styles.typingText}>đang nhập...</Text>
                                </View>
                            ) : (
                                <View style={styles.connectionContainer}>
                                    <View
                                        style={[
                                            styles.connectionDot,
                                            { backgroundColor: getConnectionStatusColor() }
                                        ]}
                                    />
                                    <Text style={styles.statusText}>
                                        {getConnectionStatusText()}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    {/* Video Call */}
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleVideoCall}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="videocam" size={20} color="#fff" />
                    </TouchableOpacity>

                    {/* Voice Call */}
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleAudioCall}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="call" size={20} color="#fff" />
                    </TouchableOpacity>

                    {/* More Options */}
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleMoreOptions}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Connection Error Banner */}
            {!isConnected && connectionStatus === 'error' && (
                <View style={styles.errorBanner}>
                    <Ionicons name="warning-outline" size={16} color="#FF9800" />
                    <Text style={styles.errorText}>
                        Kết nối bị gián đoạn
                    </Text>
                    {onReconnect && (
                        <TouchableOpacity
                            style={styles.reconnectButton}
                            onPress={onReconnect}
                        >
                            <Text style={styles.reconnectText}>Kết nối lại</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </LinearGradient>
    );
});

// 🎨 Typing animation component
const TypingAnimation = memo(() => {
    const dot1Anim = new Animated.Value(0);
    const dot2Anim = new Animated.Value(0);
    const dot3Anim = new Animated.Value(0);

    React.useEffect(() => {
        const animateDots = () => {
            const animations = [
                Animated.timing(dot1Anim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(dot2Anim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(dot3Anim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ];

            Animated.sequence([
                Animated.stagger(200, animations),
                Animated.delay(400),
            ]).start(() => {
                dot1Anim.setValue(0);
                dot2Anim.setValue(0);
                dot3Anim.setValue(0);
                animateDots();
            });
        };

        animateDots();
    }, []);

    return (
        <View style={styles.typingDots}>
            <Animated.View
                style={[
                    styles.typingDot,
                    {
                        opacity: dot1Anim,
                        transform: [
                            {
                                scale: dot1Anim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.5, 1],
                                }),
                            },
                        ],
                    },
                ]}
            />
            <Animated.View
                style={[
                    styles.typingDot,
                    {
                        opacity: dot2Anim,
                        transform: [
                            {
                                scale: dot2Anim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.5, 1],
                                }),
                            },
                        ],
                    },
                ]}
            />
            <Animated.View
                style={[
                    styles.typingDot,
                    {
                        opacity: dot3Anim,
                        transform: [
                            {
                                scale: dot3Anim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.5, 1],
                                }),
                            },
                        ],
                    },
                ]}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    header: {
        paddingTop: StatusBar.currentHeight || 0,
        paddingBottom: 10,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    userInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    avatarImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    avatarText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#fff',
    },
    nameContainer: {
        flex: 1,
    },
    userName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 2,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    typingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    typingDots: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 5,
    },
    typingDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#fff',
        marginHorizontal: 1,
    },
    typingText: {
        color: '#fff',
        fontSize: 14,
        fontStyle: 'italic',
        opacity: 0.9,
    },
    connectionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    connectionDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 5,
    },
    statusText: {
        color: '#fff',
        fontSize: 14,
        opacity: 0.9,
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    errorBanner: {
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 152, 0, 0.3)',
    },
    errorText: {
        flex: 1,
        color: '#fff',
        fontSize: 14,
        marginLeft: 8,
        opacity: 0.9,
    },
    reconnectButton: {
        backgroundColor: 'rgba(255, 152, 0, 0.3)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 152, 0, 0.5)',
    },
    reconnectText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
});

export default NewChatHeader; 