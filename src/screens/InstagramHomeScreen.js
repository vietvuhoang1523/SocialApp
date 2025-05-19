import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// Bạn không cần import này nếu đã dùng Tab Navigator
// import ReelsScreen from "./ReelsScreen";

// Mock Data
const MOCK_CURRENT_USER = {
    id: '1',
    username: 'your_username',
    profilePicture: 'https://randomuser.me/api/portraits/men/1.jpg'
};

const MOCK_STORIES = [
    {
        id: '2',
        username: 'friend1',
        profilePicture: 'https://randomuser.me/api/portraits/women/1.jpg'
    },
    {
        id: '3',
        username: 'friend2',
        profilePicture: 'https://randomuser.me/api/portraits/women/2.jpg'
    },
    {
        id: '4',
        username: 'friend3',
        profilePicture: 'https://randomuser.me/api/portraits/men/2.jpg'
    },
    {
        id: '5',
        username: 'friend4',
        profilePicture: 'https://randomuser.me/api/portraits/men/3.jpg'
    }
];

const MOCK_POSTS = [
    {
        id: '1',
        user: {
            username: 'friend1',
            profilePicture: 'https://randomuser.me/api/portraits/women/1.jpg'
        },
        imageUrl: 'https://picsum.photos/seed/1/500/500',
        likes: 234,
        caption: 'Amazing day out! 🌞',
        comments: 45,
        timeAgo: '2 hours ago'
    },
    {
        id: '2',
        user: {
            username: 'friend2',
            profilePicture: 'https://randomuser.me/api/portraits/women/2.jpg'
        },
        imageUrl: 'https://picsum.photos/seed/2/500/500',
        likes: 156,
        caption: 'Loving the sunset views 🌅',
        comments: 22,
        timeAgo: '5 hours ago'
    }
];

const { width } = Dimensions.get('window');

const InstagramHomeScreen = ({ navigation }) => {
    const [stories, setStories] = useState([]);
    const [posts, setPosts] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        // Simulate data fetching
        fetchData();
    }, []);

    const fetchData = () => {
        // In a real app, this would be an async call to your services
        setCurrentUser(MOCK_CURRENT_USER);
        setStories(MOCK_STORIES);
        setPosts(MOCK_POSTS);
    };

    const renderStory = ({ item, index }) => (
        <TouchableOpacity
            style={styles.storyContainer}
            onPress={() => navigation.navigate('StoryView', { stories, initialIndex: index })}
        >
            <View style={styles.storyImageWrapper}>
                <Image
                    source={{ uri: item.profilePicture }}
                    style={styles.storyImage}
                />
                {index === 0 && currentUser && (
                    <View style={styles.addStoryIcon}>
                        <Icon name="plus" size={16} color="white" />
                    </View>
                )}
            </View>
            <Text style={styles.storyUsername} numberOfLines={1}>
                {index === 0 ? 'Your Story' : item.username}
            </Text>
        </TouchableOpacity>
    );

    const renderPost = ({ item }) => (
        <View style={styles.postContainer}>
            {/* Post Header */}
            <View style={styles.postHeader}>
                <TouchableOpacity
                    style={styles.postHeaderLeft}
                    onPress={() => navigation.navigate('Profile', { user: item.user })}
                >
                    <Image
                        source={{ uri: item.user.profilePicture }}
                        style={styles.postUserImage}
                    />
                    <Text style={styles.postUsername}>{item.user.username}</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                    <Icon name="dots-horizontal" size={24} color="black" />
                </TouchableOpacity>
            </View>

            {/* Post Image */}
            <Image
                source={{ uri: item.imageUrl }}
                style={styles.postImage}
                resizeMode="cover"
            />

            {/* Post Actions */}
            <View style={styles.postActions}>
                <View style={styles.postActionsLeft}>
                    <TouchableOpacity style={styles.actionIcon}>
                        <Icon name="heart-outline" size={24} color="black" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIcon}>
                        <Icon name="comment-outline" size={24} color="black" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIcon}>
                        <Icon name="send" size={24} color="black" />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity>
                    <Icon name="bookmark-outline" size={24} color="black" />
                </TouchableOpacity>
            </View>

            {/* Post Likes and Caption */}
            <View style={styles.postDetailsContainer}>
                <Text style={styles.postLikes}>{item.likes} likes</Text>
                <Text style={styles.postCaption}>
                    <Text style={styles.postUsername}>{item.user.username} </Text>
                    {item.caption}
                </Text>
                {item.comments > 0 && (
                    <Text style={styles.postComments}>
                        View all {item.comments} comments
                    </Text>
                )}
                <Text style={styles.postTime}>{item.timeAgo}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity>
                    <Icon name="camera" size={24} color="black" />
                </TouchableOpacity>
                <Image
                    // source={require('../assets/instagram-logo.png')}
                    style={styles.logoImage}
                />
                <TouchableOpacity onPress={() => navigation.navigate('Messages')}>
                    <Icon name="message-outline" size={24} color="black" />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <FlatList
                ListHeaderComponent={
                    <FlatList
                        data={[
                            { id: 'currentUser', profilePicture: currentUser?.profilePicture },
                            ...stories
                        ]}
                        renderItem={renderStory}
                        keyExtractor={(item) => item.id.toString()}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.storiesContainer}
                    />
                }
                data={posts}
                renderItem={renderPost}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
            />

            {/* Bottom Navigation */}
            {/*/!* Phần này nên được xóa vì đã có MainTabNavigator xử lý việc này *!/*/}
            <View style={styles.bottomNavigation}>
                <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                    <Icon name="home" size={24} color="black" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('FriendSearch')}>
                    <Icon name="magnify" size={24} color="black" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('CreatePost')}>
                    <Icon name="plus-box-outline" size={24} color="black" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('FriendRequests')}>
                    <Icon name="heart-outline" size={24} color="black" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Profile', { user: currentUser })}>
                    <Image
                        source={{ uri: currentUser?.profilePicture }}
                        style={styles.profileThumb}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: '#DEDEDE',
    },
    logoImage: {
        width: 110,
        height: 40,
        resizeMode: 'contain',
    },
    storiesContainer: {
        paddingHorizontal: 10,
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: '#DEDEDE',
    },
    storyContainer: {
        alignItems: 'center',
        marginRight: 15,
    },
    storyImageWrapper: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 2,
        borderColor: '#FF4500',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
    },
    storyImage: {
        width: 64,
        height: 64,
        borderRadius: 32,
    },
    addStoryIcon: {
        position: 'absolute',
        bottom: -3,
        right: -3,
        backgroundColor: '#0095F6',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    storyUsername: {
        fontSize: 12,
        maxWidth: 70,
        textAlign: 'center',
    },
    postContainer: {
        marginBottom: 20,
    },
    postHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    postHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    postUserImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    postUsername: {
        fontWeight: 'bold',
    },
    postImage: {
        width: width,
        height: width,
    },
    postActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    postActionsLeft: {
        flexDirection: 'row',
    },
    actionIcon: {
        marginRight: 15,
    },
    postDetailsContainer: {
        paddingHorizontal: 15,
    },
    postLikes: {
        fontWeight: 'bold',
        marginBottom: 5,
    },
    postCaption: {
        marginBottom: 5,
    },
    postComments: {
        color: 'gray',
        marginBottom: 5,
    },
    postTime: {
        color: 'gray',
        fontSize: 12,
    },
    bottomNavigation: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderTopWidth: 0.5,
        borderTopColor: '#DEDEDE',
    },
    profileThumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
});

export default InstagramHomeScreen;
