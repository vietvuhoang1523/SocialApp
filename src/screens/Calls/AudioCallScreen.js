// AudioCallScreen.js - Màn hình cuộc gọi thoại
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Image,
    Alert,
    Animated,
    Dimensions,
    AppState
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Services
import videoCallService from '../../services/videoCallService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const AudioCallScreen = ({ route, navigation }) => {
    const {
        roomId,
        callType = 'AUDIO',
        isOutgoing = false,
        callee,
        caller,
        callData,
        chatUser,
        chatCurrentUser
    } = route.params;

    // 📱 State
    const [callStatus, setCallStatus] = useState(isOutgoing ? 'calling' : 'incoming');
    const [callDuration, setCallDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(false);
    const [connectionQuality, setConnectionQuality] = useState('good');

    // 📝 References
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const callTimer = useRef(null);
    const startTime = useRef(null);

    // 👤 User info
    const otherUser = isOutgoing ? callee : caller;
    const currentUser = isOutgoing ? caller : callee;

    // 🎨 Start pulse animation
    useEffect(() => {
        if (callStatus === 'calling' || callStatus === 'incoming') {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            );
            pulse.start();

            return () => pulse.stop();
        }
    }, [callStatus, pulseAnim]);

    // ⏱️ Call timer
    useEffect(() => {
        if (callStatus === 'connected') {
            startTime.current = Date.now();
            callTimer.current = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTime.current) / 1000);
                setCallDuration(elapsed);
            }, 1000);

            return () => {
                if (callTimer.current) {
                    clearInterval(callTimer.current);
                }
            };
        }
    }, [callStatus]);

    // 📱 App state change handler
    useEffect(() => {
        const handleAppStateChange = (nextAppState) => {
            if (nextAppState === 'background' && callStatus === 'connected') {
                // Keep call running in background
                console.log('🎵 Call continuing in background...');
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription?.remove();
    }, [callStatus]);

    // 📞 Call actions
    const acceptCall = async () => {
        try {
            setCallStatus('connecting');
            console.log('✅ Accepting call:', roomId);

            await videoCallService.acceptCall(roomId);
            setCallStatus('connected');
            
            console.log('✅ Call accepted successfully');
        } catch (error) {
            console.error('❌ Error accepting call:', error);
            Alert.alert('Lỗi', 'Không thể nhận cuộc gọi');
            endCall();
        }
    };

    const rejectCall = async () => {
        try {
            console.log('❌ Rejecting call:', roomId);
            await videoCallService.rejectCall(roomId);
            navigation.goBack();
        } catch (error) {
            console.error('❌ Error rejecting call:', error);
            navigation.goBack();
        }
    };

    const endCall = async () => {
        try {
            console.log('📞 Ending call:', roomId);
            
            if (callTimer.current) {
                clearInterval(callTimer.current);
            }

            await videoCallService.endCall(roomId);
            
            // Navigate back to chat
            navigation.goBack();
        } catch (error) {
            console.error('❌ Error ending call:', error);
            navigation.goBack();
        }
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
        console.log('🎤', isMuted ? 'Unmuted' : 'Muted');
    };

    const toggleSpeaker = () => {
        setIsSpeakerOn(!isSpeakerOn);
        console.log('🔊', isSpeakerOn ? 'Speaker Off' : 'Speaker On');
    };

    // 🕐 Format call duration
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // 🎨 Get status text and color
    const getCallStatusInfo = () => {
        switch (callStatus) {
            case 'incoming':
                return { text: 'Cuộc gọi đến...', color: '#4CAF50' };
            case 'calling':
                return { text: 'Đang gọi...', color: '#2196F3' };
            case 'connecting':
                return { text: 'Đang kết nối...', color: '#FF9800' };
            case 'connected':
                return { text: formatDuration(callDuration), color: '#4CAF50' };
            default:
                return { text: 'Cuộc gọi', color: '#666' };
        }
    };

    const statusInfo = getCallStatusInfo();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
            
            <LinearGradient
                colors={['#1a1a1a', '#2d2d2d', '#1a1a1a']}
                style={styles.background}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.minimizeButton}
                        onPress={() => {
                            // Minimize to pip mode - for now just go back
                            console.log('📱 Minimize call');
                            navigation.goBack();
                        }}
                    >
                        <Ionicons name="chevron-down" size={24} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.callTypeIndicator}>
                        <Ionicons name="call" size={16} color="#4CAF50" />
                        <Text style={styles.callTypeText}>Cuộc gọi thoại</Text>
                    </View>

                    <View style={styles.qualityIndicator}>
                        <View style={[styles.qualityDot, 
                            { backgroundColor: connectionQuality === 'good' ? '#4CAF50' : 
                              connectionQuality === 'fair' ? '#FF9800' : '#F44336' }
                        ]} />
                    </View>
                </View>

                {/* User Info */}
                <View style={styles.userSection}>
                    <Animated.View style={[
                        styles.avatarContainer,
                        { transform: [{ scale: pulseAnim }] }
                    ]}>
                        {otherUser?.profilePictureUrl ? (
                            <Image
                                source={{ uri: otherUser.profilePictureUrl }}
                                style={styles.avatar}
                            />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>
                                    {otherUser?.fullName?.charAt(0)?.toUpperCase() || '?'}
                                </Text>
                            </View>
                        )}
                        
                        {/* Call status indicator */}
                        <View style={[styles.statusRing, { borderColor: statusInfo.color }]} />
                    </Animated.View>

                    <Text style={styles.userName}>
                        {otherUser?.fullName || 'Người dùng'}
                    </Text>
                    
                    <View style={styles.statusContainer}>
                        <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>
                            {statusInfo.text}
                        </Text>
                    </View>
                </View>

                {/* Controls */}
                <View style={styles.controlsContainer}>
                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        {/* Mute */}
                        <TouchableOpacity
                            style={[styles.actionButton, isMuted && styles.actionButtonActive]}
                            onPress={toggleMute}
                        >
                            <Ionicons 
                                name={isMuted ? "mic-off" : "mic"} 
                                size={28} 
                                color={isMuted ? "#F44336" : "#fff"} 
                            />
                        </TouchableOpacity>

                        {/* Speaker */}
                        <TouchableOpacity
                            style={[styles.actionButton, isSpeakerOn && styles.actionButtonActive]}
                            onPress={toggleSpeaker}
                        >
                            <Ionicons 
                                name={isSpeakerOn ? "volume-high" : "volume-medium"} 
                                size={28} 
                                color={isSpeakerOn ? "#2196F3" : "#fff"} 
                            />
                        </TouchableOpacity>

                        {/* More options */}
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => {
                                Alert.alert(
                                    'Tùy chọn cuộc gọi',
                                    'Chọn một tùy chọn',
                                    [
                                        { text: 'Thêm người', onPress: () => console.log('Add person') },
                                        { text: 'Ghi âm', onPress: () => console.log('Record') },
                                        { text: 'Hủy', style: 'cancel' }
                                    ]
                                );
                            }}
                        >
                            <Ionicons name="ellipsis-horizontal" size={28} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Call Buttons */}
                    <View style={styles.callButtons}>
                        {callStatus === 'incoming' ? (
                            <>
                                {/* Reject */}
                                <TouchableOpacity
                                    style={[styles.callButton, styles.rejectButton]}
                                    onPress={rejectCall}
                                >
                                    <Ionicons name="call" size={32} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
                                </TouchableOpacity>

                                {/* Accept */}
                                <TouchableOpacity
                                    style={[styles.callButton, styles.acceptButton]}
                                    onPress={acceptCall}
                                >
                                    <Ionicons name="call" size={32} color="#fff" />
                                </TouchableOpacity>
                            </>
                        ) : (
                            /* End Call */
                            <TouchableOpacity
                                style={[styles.callButton, styles.endCallButton]}
                                onPress={endCall}
                            >
                                <Ionicons name="call" size={32} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </LinearGradient>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    background: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    minimizeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    callTypeIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    callTypeText: {
        color: '#4CAF50',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 5,
    },
    qualityIndicator: {
        width: 40,
        alignItems: 'center',
    },
    qualityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    userSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 30,
    },
    avatar: {
        width: 180,
        height: 180,
        borderRadius: 90,
    },
    avatarPlaceholder: {
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 64,
        fontWeight: 'bold',
    },
    statusRing: {
        position: 'absolute',
        top: -5,
        left: -5,
        right: -5,
        bottom: -5,
        borderRadius: 95,
        borderWidth: 3,
    },
    userName: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusText: {
        fontSize: 18,
        fontWeight: '500',
    },
    controlsContainer: {
        paddingHorizontal: 40,
        paddingBottom: 50,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 40,
    },
    actionButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButtonActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    callButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    callButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 30,
    },
    acceptButton: {
        backgroundColor: '#4CAF50',
    },
    rejectButton: {
        backgroundColor: '#F44336',
    },
    endCallButton: {
        backgroundColor: '#F44336',
    },
});

export default AudioCallScreen; 