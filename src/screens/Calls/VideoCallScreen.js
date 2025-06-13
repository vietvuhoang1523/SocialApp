// VideoCallScreen.js - Màn hình cuộc gọi video
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

const VideoCallScreen = ({ route, navigation }) => {
    const {
        roomId,
        callType = 'VIDEO',
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
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [connectionQuality, setConnectionQuality] = useState('good');

    // 📝 References
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const controlsAnim = useRef(new Animated.Value(1)).current;
    const callTimer = useRef(null);
    const startTime = useRef(null);
    const controlsTimeout = useRef(null);

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

    // 🎮 Hide controls after inactivity
    useEffect(() => {
        if (callStatus === 'connected') {
            resetControlsTimeout();
        }
    }, [callStatus]);

    const resetControlsTimeout = () => {
        if (controlsTimeout.current) {
            clearTimeout(controlsTimeout.current);
        }
        
        // Show controls
        Animated.timing(controlsAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();

        // Hide after 5 seconds
        controlsTimeout.current = setTimeout(() => {
            if (callStatus === 'connected') {
                Animated.timing(controlsAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }).start();
            }
        }, 5000);
    };

    // 📞 Call actions
    const acceptCall = async () => {
        try {
            setCallStatus('connecting');
            console.log('✅ Accepting video call:', roomId);

            await videoCallService.acceptCall(roomId);
            setCallStatus('connected');
            
            console.log('✅ Video call accepted successfully');
        } catch (error) {
            console.error('❌ Error accepting video call:', error);
            Alert.alert('Lỗi', 'Không thể nhận cuộc gọi video');
            endCall();
        }
    };

    const rejectCall = async () => {
        try {
            console.log('❌ Rejecting video call:', roomId);
            await videoCallService.rejectCall(roomId);
            navigation.goBack();
        } catch (error) {
            console.error('❌ Error rejecting video call:', error);
            navigation.goBack();
        }
    };

    const endCall = async () => {
        try {
            console.log('📞 Ending video call:', roomId);
            
            if (callTimer.current) {
                clearInterval(callTimer.current);
            }

            if (controlsTimeout.current) {
                clearTimeout(controlsTimeout.current);
            }

            await videoCallService.endCall(roomId);
            
            // Navigate back to chat
            navigation.goBack();
        } catch (error) {
            console.error('❌ Error ending video call:', error);
            navigation.goBack();
        }
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
        resetControlsTimeout();
        console.log('🎤', isMuted ? 'Unmuted' : 'Muted');
    };

    const toggleVideo = () => {
        setIsVideoOn(!isVideoOn);
        resetControlsTimeout();
        console.log('📹', isVideoOn ? 'Video Off' : 'Video On');
    };

    const toggleSpeaker = () => {
        setIsSpeakerOn(!isSpeakerOn);
        resetControlsTimeout();
        console.log('🔊', isSpeakerOn ? 'Speaker Off' : 'Speaker On');
    };

    const flipCamera = () => {
        resetControlsTimeout();
        console.log('🔄 Camera flipped');
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
                return { text: 'Cuộc gọi video đến...', color: '#4CAF50' };
            case 'calling':
                return { text: 'Đang gọi video...', color: '#2196F3' };
            case 'connecting':
                return { text: 'Đang kết nối...', color: '#FF9800' };
            case 'connected':
                return { text: formatDuration(callDuration), color: '#4CAF50' };
            default:
                return { text: 'Cuộc gọi video', color: '#666' };
        }
    };

    const statusInfo = getCallStatusInfo();

    // 📱 Render video preview (mock)
    const renderVideoPreview = () => {
        if (callStatus === 'connected' && isVideoOn) {
            return (
                <View style={styles.videoContainer}>
                    {/* Remote video (main) */}
                    <View style={styles.remoteVideo}>
                        {otherUser?.profilePictureUrl ? (
                            <Image
                                source={{ uri: otherUser.profilePictureUrl }}
                                style={styles.remoteVideoImage}
                            />
                        ) : (
                            <View style={styles.remoteVideoPlaceholder}>
                                <Ionicons name="person" size={80} color="#666" />
                                <Text style={styles.videoOffText}>Video tắt</Text>
                            </View>
                        )}
                    </View>

                    {/* Local video (pip) */}
                    <TouchableOpacity
                        style={styles.localVideo}
                        onPress={() => {
                            // Switch cameras or fullscreen toggle
                            console.log('📱 Local video tapped');
                        }}
                    >
                        {currentUser?.profilePictureUrl ? (
                            <Image
                                source={{ uri: currentUser.profilePictureUrl }}
                                style={styles.localVideoImage}
                            />
                        ) : (
                            <View style={styles.localVideoPlaceholder}>
                                <Ionicons name="person" size={40} color="#fff" />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            );
        }

        // Non-video state
        return (
            <View style={styles.avatarSection}>
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
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            
            <TouchableOpacity
                style={styles.background}
                activeOpacity={1}
                onPress={resetControlsTimeout}
            >
                <LinearGradient
                    colors={callStatus === 'connected' && isVideoOn ? 
                        ['transparent', 'transparent'] : 
                        ['#1a1a1a', '#2d2d2d', '#1a1a1a']
                    }
                    style={styles.backgroundGradient}
                >
                    {/* Video or Avatar Section */}
                    {renderVideoPreview()}

                    {/* Controls Overlay */}
                    <Animated.View style={[
                        styles.controlsOverlay,
                        { opacity: controlsAnim }
                    ]}>
                        {/* Header */}
                        <View style={styles.header}>
                            <TouchableOpacity
                                style={styles.minimizeButton}
                                onPress={() => {
                                    console.log('📱 Minimize video call');
                                    navigation.goBack();
                                }}
                            >
                                <Ionicons name="chevron-down" size={24} color="#fff" />
                            </TouchableOpacity>

                            <View style={styles.callTypeIndicator}>
                                <Ionicons name="videocam" size={16} color="#2196F3" />
                                <Text style={styles.callTypeText}>Cuộc gọi video</Text>
                            </View>

                            <View style={styles.qualityIndicator}>
                                <View style={[styles.qualityDot, 
                                    { backgroundColor: connectionQuality === 'good' ? '#4CAF50' : 
                                      connectionQuality === 'fair' ? '#FF9800' : '#F44336' }
                                ]} />
                            </View>
                        </View>

                        {/* Bottom Controls */}
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

                                {/* Video Toggle */}
                                <TouchableOpacity
                                    style={[styles.actionButton, !isVideoOn && styles.actionButtonActive]}
                                    onPress={toggleVideo}
                                >
                                    <Ionicons 
                                        name={isVideoOn ? "videocam" : "videocam-off"} 
                                        size={28} 
                                        color={!isVideoOn ? "#F44336" : "#fff"} 
                                    />
                                </TouchableOpacity>

                                {/* Flip Camera */}
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={flipCamera}
                                >
                                    <Ionicons name="camera-reverse" size={28} color="#fff" />
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
                                            <Ionicons name="videocam" size={32} color="#fff" />
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
                    </Animated.View>
                </LinearGradient>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    background: {
        flex: 1,
    },
    backgroundGradient: {
        flex: 1,
    },
    videoContainer: {
        flex: 1,
        position: 'relative',
    },
    remoteVideo: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    remoteVideoImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    remoteVideoPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoOffText: {
        color: '#666',
        fontSize: 16,
        marginTop: 10,
    },
    localVideo: {
        position: 'absolute',
        top: 60,
        right: 20,
        width: 120,
        height: 160,
        borderRadius: 12,
        backgroundColor: '#333',
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#fff',
    },
    localVideoImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    localVideoPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#333',
    },
    avatarSection: {
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
        width: 200,
        height: 200,
        borderRadius: 100,
    },
    avatarPlaceholder: {
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 72,
        fontWeight: 'bold',
    },
    statusRing: {
        position: 'absolute',
        top: -5,
        left: -5,
        right: -5,
        bottom: -5,
        borderRadius: 105,
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
    controlsOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'space-between',
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
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    callTypeIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(33, 150, 243, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    callTypeText: {
        color: '#2196F3',
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
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
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

export default VideoCallScreen; 