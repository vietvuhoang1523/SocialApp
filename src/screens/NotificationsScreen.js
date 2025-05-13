// src/screens/NotificationsScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    SafeAreaView
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Dữ liệu mẫu cho các thông báo
const MOCK_NOTIFICATIONS = [
    {
        id: '1',
        type: 'like',
        user: {
            id: '1',
            username: 'sarah_designs',
            profilePicture: 'https://randomuser.me/api/portraits/women/12.jpg'
        },
        content: 'đã thích ảnh của bạn',
        postImage: 'https://picsum.photos/id/237/200/200',
        time: '5 phút trước',
        isNew: true
    },
    {
        id: '2',
        type: 'follow',
        user: {
            id: '2',
            username: 'john_doe',
            profilePicture: 'https://randomuser.me/api/portraits/men/32.jpg'
        },
        content: 'đã bắt đầu theo dõi bạn',
        time: '15 phút trước',
        isNew: true
    },
    {
        id: '3',
        type: 'comment',
        user: {
            id: '3',
            username: 'travel_lover',
            profilePicture: 'https://randomuser.me/api/portraits/women/68.jpg'
        },
        content: 'đã bình luận: "Tuyệt vời quá! 😍"',
        postImage: 'https://picsum.photos/id/430/200/200',
        time: '1 giờ trước',
        isNew: true
    },
    {
        id: '4',
        type: 'mention',
        user: {
            id: '4',
            username: 'mike_photo',
            profilePicture: 'https://randomuser.me/api/portraits/men/44.jpg'
        },
        content: 'đã nhắc đến bạn trong một bình luận',
        time: '2 giờ trước',
        isNew: false
    },
    {
        id: '5',
        type: 'like_comment',
        user: {
            id: '5',
            username: 'foodie_girl',
            profilePicture: 'https://randomuser.me/api/portraits/women/65.jpg'
        },
        content: 'đã thích bình luận của bạn',
        time: '3 giờ trước',
        isNew: false
    },
    {
        id: '6',
        type: 'follow_request',
        user: {
            id: '6',
            username: 'fitness_coach',
            profilePicture: 'https://randomuser.me/api/portraits/men/29.jpg'
        },
        content: 'đã yêu cầu theo dõi bạn',
        time: '5 giờ trước',
        isNew: false
    },
    {
        id: '7',
        type: 'suggestion',
        title: 'Gợi ý cho bạn',
        users: [
            {
                id: '7',
                username: 'art_gallery',
                profilePicture: 'https://randomuser.me/api/portraits/women/22.jpg'
            },
            {
                id: '8',
                username: 'tech_geek',
                profilePicture: 'https://randomuser.me/api/portraits/men/67.jpg'
            },
            {
                id: '9',
                username: 'nature_pics',
                profilePicture: 'https://randomuser.me/api/portraits/women/17.jpg'
            }
        ],
        time: 'Hôm nay',
        isNew: false
    },
    {
        id: '8',
        type: 'like',
        user: {
            id: '10',
            username: 'music_lover',
            profilePicture: 'https://randomuser.me/api/portraits/women/89.jpg'
        },
        content: 'và 25 người khác đã thích ảnh của bạn',
        postImage: 'https://picsum.photos/id/1005/200/200',
        time: '1 ngày trước',
        isNew: false
    },
    {
        id: '9',
        type: 'tag',
        user: {
            id: '11',
            username: 'world_traveler',
            profilePicture: 'https://randomuser.me/api/portraits/men/55.jpg'
        },
        content: 'đã gắn thẻ bạn trong một bài viết',
        postImage: 'https://picsum.photos/id/177/200/200',
        time: '2 ngày trước',
        isNew: false
    }
];

// Component chính
const NotificationsScreen = ({ navigation }) => {
    const [notifications, setNotifications] = useState([]);
    const [activeTab, setActiveTab] = useState('all'); // 'all' hoặc 'you'

    useEffect(() => {
        // Trong ứng dụng thực tế, bạn sẽ lấy thông báo từ API
        setNotifications(MOCK_NOTIFICATIONS);
    }, []);

    // Hiển thị từng thông báo dựa trên loại
    const renderNotification = ({ item }) => {
        // Nếu là thông báo loại gợi ý
        if (item.type === 'suggestion') {
            return (
                <View style={styles.suggestionContainer}>
                    <Text style={styles.suggestionTitle}>{item.title}</Text>
                    <FlatList
                        horizontal
                        data={item.users}
                        keyExtractor={(user) => user.id}
                        renderItem={({ item: user }) => (
                            <View style={styles.suggestionUser}>
                                <Image source={{ uri: user.profilePicture }} style={styles.suggestionUserImage} />
                                <Text style={styles.suggestionUsername}>{user.username}</Text>
                                <TouchableOpacity style={styles.followButton}>
                                    <Text style={styles.followButtonText}>Theo dõi</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        showsHorizontalScrollIndicator={false}
                    />
                </View>
            );
        }

        // Thông báo thông thường
        return (
            <TouchableOpacity
                style={[styles.notificationItem, item.isNew && styles.newNotification]}
                onPress={() => {
                    // Xử lý khi người dùng nhấn vào thông báo
                    // Ví dụ: navigation.navigate('Post', { postId: ... })
                }}
            >
                <Image source={{ uri: item.user.profilePicture }} style={styles.userImage} />

                <View style={styles.notificationContent}>
                    <Text style={styles.notificationText}>
                        <Text style={styles.username}>{item.user.username}</Text> {item.content}
                    </Text>
                    <Text style={styles.timeText}>{item.time}</Text>
                </View>

                {item.postImage && (
                    <Image source={{ uri: item.postImage }} style={styles.postThumbnail} />
                )}

                {item.type === 'follow' && (
                    <TouchableOpacity style={styles.actionButton}>
                        <Text style={styles.actionButtonText}>Theo dõi lại</Text>
                    </TouchableOpacity>
                )}

                {item.type === 'follow_request' && (
                    <View style={styles.requestButtonsContainer}>
                        <TouchableOpacity style={styles.acceptButton}>
                            <Text style={styles.acceptButtonText}>Chấp nhận</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.declineButton}>
                            <Text style={styles.declineButtonText}>Từ chối</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    // Header với các tab
    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <Text style={styles.title}>Thông báo</Text>
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'all' && styles.activeTab]}
                    onPress={() => setActiveTab('all')}
                >
                    <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>Tất cả</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'you' && styles.activeTab]}
                    onPress={() => setActiveTab('you')}
                >
                    <Text style={[styles.tabText, activeTab === 'you' && styles.activeTabText]}>Bạn</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {renderHeader()}

            <FlatList
                data={notifications}
                renderItem={renderNotification}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.notificationsList}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    headerContainer: {
        paddingTop: 10,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#EFEFEF',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    tabsContainer: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    tab: {
        marginRight: 20,
        paddingBottom: 10,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: 'black',
    },
    tabText: {
        fontSize: 16,
        color: '#999',
    },
    activeTabText: {
        color: 'black',
        fontWeight: 'bold',
    },
    notificationsList: {
        paddingTop: 10,
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
    },
    newNotification: {
        backgroundColor: '#FAFAFA',
    },
    userImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12,
    },
    notificationContent: {
        flex: 1,
        marginRight: 10,
    },
    notificationText: {
        fontSize: 14,
        lineHeight: 20,
    },
    username: {
        fontWeight: 'bold',
    },
    timeText: {
        fontSize: 12,
        color: '#999',
        marginTop: 3,
    },
    postThumbnail: {
        width: 44,
        height: 44,
    },
    actionButton: {
        backgroundColor: '#0095F6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
    },
    actionButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    requestButtonsContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    acceptButton: {
        backgroundColor: '#0095F6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        marginBottom: 6,
    },
    acceptButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    declineButton: {
        backgroundColor: '#EFEFEF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
    },
    declineButtonText: {
        fontSize: 12,
    },
    suggestionContainer: {
        paddingHorizontal: 15,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#EFEFEF',
    },
    suggestionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    suggestionUser: {
        alignItems: 'center',
        marginRight: 20,
        width: 100,
    },
    suggestionUserImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: 8,
    },
    suggestionUsername: {
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    followButton: {
        backgroundColor: '#0095F6',
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 4,
        width: '100%',
        alignItems: 'center',
    },
    followButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
});

export default NotificationsScreen;
