import React, { useRef, useEffect } from 'react';
import { View, Image, TouchableOpacity, Text, ImageBackground, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles } from './styles';

const ImageSection = ({ coverImage, profilePicture, onProfileImagePress, onCoverImagePress }) => {
    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const slideUpAnim = useRef(new Animated.Value(50)).current;

    // URLs mặc định
    const defaultCoverImage = "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80";
    const defaultProfilePicture = "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&q=80";

    // ✨ Entrance animations
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(slideUpAnim, {
                toValue: 0,
                duration: 600,
                delay: 200,
                useNativeDriver: true,
            })
        ]).start();

        // ✨ Pulse animation for online indicator
        const createPulseAnimation = () => {
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.3,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                })
            ]).start(() => createPulseAnimation());
        };

        createPulseAnimation();
    }, []);

    // ✨ Handle press animations
    const handleCoverPress = () => {
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            })
        ]).start();
        onCoverImagePress();
    };

    const handleProfilePress = () => {
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            })
        ]).start();
        onProfileImagePress();
    };

    return (
        <Animated.View 
            style={[
                styles.imageSection, 
                { 
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }]
                }
            ]}
        >
            {/* ✨ Enhanced Cover Image with Gradient Overlay */}
            <View style={styles.coverImageContainer}>
                <ImageBackground
                    source={{
                        uri: coverImage || defaultCoverImage
                    }}
                    style={styles.coverImage}
                    imageStyle={styles.coverImageStyle}
                >
                    {/* Gradient Overlay for better text visibility */}
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.7)']}
                        style={styles.coverGradient}
                    >
                        {/* Edit Cover Button */}
                        <TouchableOpacity
                            style={styles.editCoverButton}
                            onPress={handleCoverPress}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#FF6B6B', '#E91E63', '#C2185B']}
                                style={styles.editButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Icon name="camera-outline" size={20} color="white" />
                                <Text style={styles.editCoverText}>Đổi ảnh bìa</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </LinearGradient>
                </ImageBackground>
            </View>

            {/* ✨ Enhanced Profile Picture with Floating Effect */}
            <Animated.View 
                style={[
                    styles.profilePictureWrapper,
                    {
                        transform: [{ translateY: slideUpAnim }],
                        opacity: fadeAnim,
                    }
                ]}
            >
                <TouchableOpacity
                    style={styles.profilePictureContainer}
                    onPress={handleProfilePress}
                    activeOpacity={0.9}
                >
                    {/* Profile Picture with Border Ring */}
                    <View style={styles.profilePictureRing}>
                        <Image
                            source={{
                                uri: profilePicture || defaultProfilePicture
                            }}
                            style={styles.profilePicture}
                        />
                        
                        {/* Status Ring Animation Effect */}
                        <Animated.View 
                            style={[
                                styles.statusRing,
                                {
                                    transform: [{ scale: pulseAnim }],
                                    opacity: pulseAnim.interpolate({
                                        inputRange: [1, 1.3],
                                        outputRange: [0.7, 0.3]
                                    })
                                }
                            ]} 
                        />
                        
                        {/* Camera Icon with Gradient */}
                        <View style={styles.cameraIconWrapper}>
                            <LinearGradient
                                colors={['#4CAF50', '#2E7D32', '#1B5E20']}
                                style={styles.cameraIconContainer}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Icon name="camera" size={18} color="white" />
                            </LinearGradient>
                        </View>
                    </View>

                    {/* Online Status Indicator */}
                    <Animated.View 
                        style={[
                            styles.onlineIndicator,
                            {
                                transform: [{ scale: pulseAnim }]
                            }
                        ]}
                    >
                        <View style={styles.onlineDot} />
                    </Animated.View>
                </TouchableOpacity>
                
                {/* Floating Action Hint */}
                <Animated.View 
                    style={[
                        styles.floatingHint,
                        {
                            opacity: fadeAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 0.8]
                            }),
                            transform: [{ translateY: slideUpAnim }]
                        }
                    ]}
                >
                    <Text style={styles.hintText}>✨ Tap để thay đổi</Text>
                </Animated.View>
            </Animated.View>
        </Animated.View>
    );
};

export default ImageSection;
