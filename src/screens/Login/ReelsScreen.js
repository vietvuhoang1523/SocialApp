import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    FlatList,
    Image,
    Animated
} from 'react-native';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');

// Mock data for reels
const REELS_DATA = [
    {
        id: '1',
        video: 'https://example.com/video1.mp4', // Replace with real video URLs
        user: {
            username: 'user1',
            profilePic: 'https://randomuser.me/api/portraits/women/43.jpg',
        },
        description: 'This is my first reel! #fun #reels',
        likes: '10.5K',
        comments: '234',
        music: 'Original Sound - user1',
    },
    {
        id: '2',
        video: 'https://example.com/video2.mp4',
        user: {
            username: 'user2',
            profilePic: 'https://randomuser.me/api/portraits/men/22.jpg',
        },
        description: 'Check out this cool effect! #trending',
        likes: '45.2K',
        comments: '1.2K',
        music: 'Popular Song - Famous Artist',
    },
    {
        id: '3',
        video: 'https://example.com/video3.mp4',
        user: {
            username: 'user3',
            profilePic: 'https://randomuser.me/api/portraits/women/65.jpg',
        },
        description: 'Just a day in my life ✨ #dailyvlog',
        likes: '8.7K',
        comments: '456',
        music: 'Trending Sound - user3',
    },
];

const ReelsScreen = () => {
    const [activeReelIndex, setActiveReelIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isLiked, setIsLiked] = useState({});
    const [isBookmarked, setIsBookmarked] = useState({});

    const flatListRef = useRef();

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setActiveReelIndex(viewableItems[0].index);
        }
    }).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50
    }).current;

    const toggleLike = (id) => {
        setIsLiked(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const toggleBookmark = (id) => {
        setIsBookmarked(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const renderReel = ({ item, index }) => {
        const isActive = index === activeReelIndex;

        return (
            <View style={styles.reelContainer}>
                {/* Video */}
                <Video
                    source={{ uri: item.video }}
                    rate={1.0}
                    volume={isMuted ? 0 : 1.0}
                    isMuted={isMuted}
                    resizeMode="cover"
                    shouldPlay={isActive}
                    isLooping
                    style={styles.video}
                />

                {/* Gradient overlay for better text visibility */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.5)']}
                    style={styles.gradient}
                />

                {/* Right side actions */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity onPress={() => toggleLike(item.id)}>
                        <Icon
                            name={isLiked[item.id] ? 'heart' : 'heart-outline'}
                            size={28}
                            color={isLiked[item.id] ? '#FF3040' : 'white'}
                        />
                        <Text style={styles.actionText}>{item.likes}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton}>
                        <Icon name="comment-outline" size={28} color="white" />
                        <Text style={styles.actionText}>{item.comments}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton}>
                        <Icon name="send-outline" size={28} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton}>
                        <Icon name="dots-vertical" size={28} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => toggleBookmark(item.id)}>
                        <Icon
                            name={isBookmarked[item.id] ? 'bookmark' : 'bookmark-outline'}
                            size={28}
                            color="white"
                        />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.audioButton}>
                        <Image
                            source={{ uri: item.user.profilePic }}
                            style={styles.audioImage}
                        />
                    </TouchableOpacity>
                </View>

                {/* Bottom Info */}
                <View style={styles.bottomContainer}>
                    {/* User info */}
                    <View style={styles.userContainer}>
                        <Image
                            source={{ uri: item.user.profilePic }}
                            style={styles.profilePic}
                        />
                        <Text style={styles.username}>{item.user.username}</Text>
                        <TouchableOpacity style={styles.followButton}>
                            <Text style={styles.followText}>Follow</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Description */}
                    <Text style={styles.description}>{item.description}</Text>

                    {/* Music */}
                    <View style={styles.musicContainer}>
                        <Icon name="music-note" size={14} color="white" />
                        <Text style={styles.musicText} numberOfLines={1}>{item.music}</Text>
                    </View>
                </View>

                {/* Mute button */}
                <TouchableOpacity
                    style={styles.muteButton}
                    onPress={() => setIsMuted(!isMuted)}
                >
                    <Icon
                        name={isMuted ? 'volume-off' : 'volume-high'}
                        size={20}
                        color="white"
                    />
                </TouchableOpacity>

                {/* Camera button */}
                <TouchableOpacity style={styles.cameraButton}>
                    <Icon name="camera" size={24} color="white" />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Reels</Text>
                <TouchableOpacity>
                    <Icon name="camera" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {/* Reels FlatList */}
            <FlatList
                ref={flatListRef}
                data={REELS_DATA}
                renderItem={renderReel}
                keyExtractor={(item) => item.id}
                pagingEnabled
                showsVerticalScrollIndicator={false}
                snapToInterval={height}
                snapToAlignment="start"
                decelerationRate="fast"
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: 40,
        paddingBottom: 10,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1,
    },
    headerTitle: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
    reelContainer: {
        width,
        height,
        position: 'relative',
    },
    video: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 300,
    },
    actionsContainer: {
        position: 'absolute',
        right: 10,
        bottom: 150,
        alignItems: 'center',
    },
    actionButton: {
        marginVertical: 10,
        alignItems: 'center',
    },
    actionText: {
        color: 'white',
        fontSize: 12,
        marginTop: 3,
    },
    audioButton: {
        marginTop: 15,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'white',
    },
    audioImage: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 30,
        left: 10,
        right: 80,
    },
    userContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    profilePic: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
    },
    username: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
        marginRight: 10,
    },
    followButton: {
        borderColor: 'white',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    followText: {
        color: 'white',
        fontSize: 12,
    },
    description: {
        color: 'white',
        fontSize: 14,
        marginBottom: 10,
    },
    musicContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    musicText: {
        color: 'white',
        fontSize: 12,
        marginLeft: 5,
    },
    muteButton: {
        position: 'absolute',
        right: 10,
        bottom: 100,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 5,
        borderRadius: 20,
    },
    cameraButton: {
        position: 'absolute',
        top: 80,
        right: 15,
    },
});

export default ReelsScreen;
