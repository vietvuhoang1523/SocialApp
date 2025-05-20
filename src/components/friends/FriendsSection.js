import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Image
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import FriendService from '../../services/FriendService';
import AsyncStorage from "@react-native-async-storage/async-storage";
import FriendCard from './FriendCard';
import FriendDetailModal from './FriendDetailModal';
import AllFriendsModal from './AllFriendsModal';
import FriendMessagingModal from './FriendMessagingModal';

// Initialize service
const friendService = new FriendService();

const FriendsSection = ({
                            onFindFriends,
                            onViewAllFriends,
                            userProfile = null
                        }) => {
    const navigation = useNavigation();
    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isAllFriendsModalVisible, setIsAllFriendsModalVisible] = useState(false);
    const [isChatModalVisible, setIsChatModalVisible] = useState(false);
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Get current user ID
    useEffect(() => {
        const getUserData = async () => {
            try {
                if (userProfile && userProfile.id) {
                    console.log('Setting currentUserId from userProfile:', userProfile.id);
                    setCurrentUserId(userProfile.id);
                    setCurrentUser(userProfile);
                } else {
                    const userProfileString = await AsyncStorage.getItem('userProfile');
                    const userData = await AsyncStorage.getItem('userData');

                    console.log('userProfile from AsyncStorage:', userProfileString);

                    if (userProfileString) {
                        const profile = JSON.parse(userProfileString);
                        console.log('Setting currentUserId from AsyncStorage:', profile.id);
                        setCurrentUserId(profile.id);
                        setCurrentUser(userData ? JSON.parse(userData) : profile);
                    } else {
                        console.warn('No userProfile found in AsyncStorage');
                        // Set default user ID
                        console.log('Setting default currentUserId: 2');
                        setCurrentUserId(2);

                        // Try to get user data
                        if (userData) {
                            setCurrentUser(JSON.parse(userData));
                        }
                    }
                }
            } catch (error) {
                console.error('Error getting userId:', error);
                setCurrentUserId(2); // Default ID if error
            }
        };
        getUserData();
    }, [userProfile]);

    // Load friend list whenever currentUserId changes
    useEffect(() => {
        if (currentUserId) {
            loadFriends();
        }
    }, [currentUserId]);

    // Load friend list
    const loadFriends = async () => {
        try {
            setLoading(true);
            const data = await friendService.getFriends();
            console.log('Friend data from API:', JSON.stringify(data, null, 2));

            // Check if data is an array
            if (Array.isArray(data)) {
                console.log('Data is an array with', data.length, 'elements');
                // Filter valid records
                const validFriends = data.filter(item => item && item.sender && item.receiver);
                console.log('Number of valid friends:', validFriends.length);
                if (validFriends.length > 0) {
                    // Log some examples to check structure
                    console.log('Friend sample:', JSON.stringify(validFriends[0], null, 2));
                }
                setFriends(validFriends);
            } else {
                // If not an array, check common structures
                if (data && data.content && Array.isArray(data.content)) {
                    console.log('Data is in data.content');
                    setFriends(data.content);
                } else if (data && data.data && Array.isArray(data.data)) {
                    console.log('Data is in data.data');
                    setFriends(data.data);
                } else if (data && typeof data === 'object') {
                    // Convert object to array if needed
                    const friendsArray = Object.values(data);
                    console.log('Converting object to array:', friendsArray.length);
                    setFriends(friendsArray);
                } else {
                    console.warn('Unknown data format:', typeof data);
                    setFriends([]);
                }
            }
            setError(null);
        } catch (err) {
            console.error('Error loading friend list:', err);
            setError('Could not load friend list. Please try again later.');
            setFriends([]);
        } finally {
            setLoading(false);
        }
    };

    // Handle friend press
    const handleFriendPress = (friend) => {
        setSelectedFriend(friend);
        setIsModalVisible(true);
    };

    // Close friend detail modal
    const handleCloseModal = () => {
        setIsModalVisible(false);
        setSelectedFriend(null);
    };

    // Open view all friends modal
    const handleViewAllFriends = () => {
        if (onViewAllFriends) {
            onViewAllFriends();
        } else {
            setIsAllFriendsModalVisible(true);
        }
    };

    // Close view all friends modal
    const handleCloseAllFriendsModal = () => {
        setIsAllFriendsModalVisible(false);
    };

    // Handle chat with friend
    const handleStartChat = (friendUser, currentUserData) => {
        // Navigate to ChatScreen with selected friend
        navigation.navigate('Chat', {
            user: friendUser,
            currentUser: currentUserData || currentUser
        });
        setIsChatModalVisible(false);
    };

    // Count friends
    const friendCount = Array.isArray(friends) ? friends.length : 0;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.headerContainer}>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.titleText}>Bạn bè</Text>
                    <Text style={styles.subtitleText}>
                        {friendCount} bạn bè
                    </Text>
                </View>

                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={styles.findFriendsButton}
                        onPress={onFindFriends}
                    >
                        <Ionicons name="person-add" size={20} color="#1877F2" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.searchFriendsButton}
                        onPress={() => setIsAllFriendsModalVisible(true)}
                    >
                        <Ionicons name="search" size={20} color="#1877F2" />
                    </TouchableOpacity>
                    {/* New Chat Button */}
                    <TouchableOpacity
                        style={styles.chatButton}
                        onPress={() => setIsChatModalVisible(true)}
                    >
                        <Ionicons name="chatbubble-outline" size={20} color="#1877F2" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Loading state */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1877F2" />
                    <Text style={styles.loadingText}>Đang tải danh sách bạn bè...</Text>
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={loadFriends}
                    >
                        <Text style={styles.retryButtonText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            ) : friends.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Bạn chưa có bạn bè nào</Text>
                    <TouchableOpacity
                        style={styles.findFriendsButtonLarge}
                        onPress={onFindFriends}
                    >
                        <Text style={styles.findFriendsButtonText}>Tìm bạn bè</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    {/* Friends list */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.friendsScrollContainer}
                    >
                        {friends.map((friend, index) => (
                            <FriendCard
                                key={friend.id || index}
                                friend={friend}
                                onPress={handleFriendPress}
                                currentUserId={currentUserId}
                            />
                        ))}
                    </ScrollView>

                    {/* View all friends button */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.viewAllButton}
                            onPress={handleViewAllFriends}
                        >
                            <Text style={styles.viewAllButtonText}>
                                Xem tất cả bạn bè
                            </Text>
                        </TouchableOpacity>

                        {/* Chat with friends button */}
                        <TouchableOpacity
                            style={styles.chatWithFriendsButton}
                            onPress={() => setIsChatModalVisible(true)}
                        >
                            <Ionicons name="chatbubble-outline" size={18} color="#1877F2" style={styles.chatButtonIcon} />
                            <Text style={styles.chatButtonText}>
                                Trò chuyện với bạn bè
                            </Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}

            {/* Friend detail modal */}
            <FriendDetailModal
                friend={selectedFriend}
                visible={isModalVisible}
                onClose={handleCloseModal}
                currentUserId={currentUserId}
            />

            {/* View all friends modal */}
            <AllFriendsModal
                visible={isAllFriendsModalVisible}
                friends={friends}
                onClose={handleCloseAllFriendsModal}
                onFriendPress={handleFriendPress}
                currentUserId={currentUserId}
            />

            {/* Friend messaging modal */}
            <FriendMessagingModal
                visible={isChatModalVisible}
                friends={friends}
                onClose={() => setIsChatModalVisible(false)}
                onFriendPress={handleStartChat}
                currentUserId={currentUserId}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        paddingVertical: 15,
        marginBottom: 10,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        marginBottom: 15,
    },
    headerTitleContainer: {
        flexDirection: 'column',
    },
    titleText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#050505',
    },
    subtitleText: {
        fontSize: 14,
        color: '#65676B',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    findFriendsButton: {
        marginRight: 15,
        padding: 5,
    },
    searchFriendsButton: {
        marginRight: 15,
        padding: 5,
    },
    chatButton: {
        padding: 5,
    },
    friendsScrollContainer: {
        paddingHorizontal: 15,
    },
    buttonContainer: {
        marginTop: 15,
        paddingHorizontal: 15,
    },
    viewAllButton: {
        backgroundColor: '#F0F2F5',
        paddingVertical: 10,
        borderRadius: 6,
        alignItems: 'center',
        marginBottom: 10,
    },
    viewAllButtonText: {
        color: '#1877F2',
        fontWeight: '600',
    },
    chatWithFriendsButton: {
        backgroundColor: '#E7F3FF',
        paddingVertical: 10,
        borderRadius: 6,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    chatButtonIcon: {
        marginRight: 5,
    },
    chatButtonText: {
        color: '#1877F2',
        fontWeight: '600',
    },
    // Loading styles
    loadingContainer: {
        paddingVertical: 30,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#65676B',
    },
    // Error styles
    errorContainer: {
        paddingVertical: 30,
        alignItems: 'center',
    },
    errorText: {
        color: 'red',
        marginBottom: 10,
    },
    retryButton: {
        backgroundColor: '#1877F2',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 5,
    },
    retryButtonText: {
        color: 'white',
        fontWeight: '600',
    },
    // Empty state styles
    emptyContainer: {
        paddingVertical: 30,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#65676B',
        marginBottom: 15,
    },
    findFriendsButtonLarge: {
        backgroundColor: '#1877F2',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 5,
    },
    findFriendsButtonText: {
        color: 'white',
        fontWeight: '600',
    },
});

export default FriendsSection;