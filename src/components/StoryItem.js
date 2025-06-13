import React, { useState } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Alert
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';

const StoryItem = ({ 
    story, 
    onPress, 
    createImageUrl, 
    currentUser 
}) => {
    const [scaleValue] = useState(new Animated.Value(1));

    const handlePressIn = () => {
        Animated.spring(scaleValue, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleValue, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    const handlePress = () => {
        if (story.isAddStory) {
            Alert.alert(
                "Tạo Story", 
                "Bạn có muốn tạo story mới không?",
                [
                    { text: "Hủy", style: "cancel" },
                    { text: "Tạo", onPress: () => console.log("Navigate to Create Story") }
                ]
            );
        } else {
            onPress && onPress(story);
        }
    };

    const getImageSource = () => {
        if (story.isAddStory) {
            return currentUser?.profilePictureUrl 
                ? { uri: createImageUrl(currentUser.profilePictureUrl) }
                : { uri: 'https://randomuser.me/api/portraits/men/1.jpg' };
        }
        return { uri: story.imageUrl };
    };

    const StoryWrapper = story.hasNewStory && !story.isAddStory ? LinearGradient : View;
    const wrapperProps = story.hasNewStory && !story.isAddStory 
        ? {
            colors: ['#E91E63', '#F06292', '#E91E63'],
            start: { x: 0, y: 0 },
            end: { x: 1, y: 1 },
            style: styles.gradientWrapper
          }
        : { style: story.isAddStory ? styles.addStoryWrapper : styles.normalWrapper };

    return (
        <TouchableOpacity
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.9}
        >
            <Animated.View 
                style={[
                    styles.storyContainer,
                    {
                        transform: [{ scale: scaleValue }],
                    }
                ]}
            >
                <StoryWrapper {...wrapperProps}>
                    <View style={styles.imageContainer}>
                        <Image
                            source={getImageSource()}
                            style={styles.storyImage}
                            resizeMode="cover"
                        />
                        {story.isAddStory && (
                            <View style={styles.addStoryIcon}>
                                <Ionicons name="add" size={16} color="white" />
                            </View>
                        )}
                        {story.hasNewStory && !story.isAddStory && (
                            <View style={styles.newIndicator}>
                                <View style={styles.newDot} />
                            </View>
                        )}
                    </View>
                </StoryWrapper>
                
                <Text style={styles.storyUsername} numberOfLines={1}>
                    {story.username}
                </Text>
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    storyContainer: {
        alignItems: 'center',
        marginHorizontal: 8,
        width: 80,
    },
    gradientWrapper: {
        width: 74,
        height: 74,
        borderRadius: 37,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 3,
    },
    normalWrapper: {
        width: 74,
        height: 74,
        borderRadius: 37,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addStoryWrapper: {
        width: 74,
        height: 74,
        borderRadius: 37,
        borderWidth: 2,
        borderColor: '#ddd',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageContainer: {
        position: 'relative',
        width: 68,
        height: 68,
        borderRadius: 34,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
    },
    storyImage: {
        width: '100%',
        height: '100%',
        borderRadius: 34,
    },
    addStoryIcon: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: '#E91E63',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    newIndicator: {
        position: 'absolute',
        top: 2,
        right: 2,
    },
    newDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: '#fff',
    },
    storyUsername: {
        fontSize: 12,
        textAlign: 'center',
        color: '#333',
        fontWeight: '500',
        marginTop: 8,
        maxWidth: 80,
    },
});

export default StoryItem; 