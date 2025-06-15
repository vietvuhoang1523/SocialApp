// src/screens/NotificationsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { MaterialIcons, Ionicons } from 'react-native-vector-icons';
import { useNotifications } from '../components/NotificationContext';
import moment from 'moment';
import 'moment/locale/vi';

moment.locale('vi'); // Set locale to Vietnamese

const NotificationsScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('all'); // 'all' or 'you'

    // Use the notification context
    const { 
        notifications, 
        loading, 
        hasMore,
        unreadCount,
        fetchNotifications,
        markAsRead, 
        markAllAsRead,
        deleteNotification,
        refreshNotifications
    } = useNotifications();
    
    // Load notifications when the screen is first rendered
    useEffect(() => {
        fetchNotifications(true);
    }, []);

    // Handle mark all as read
    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
            Alert.alert('Thành công', 'Đã đánh dấu tất cả thông báo là đã đọc');
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể đánh dấu tất cả thông báo là đã đọc');
        }
    };
    
    // Handle notification press
    const handleNotificationPress = async (notification) => {
        // Mark notification as read
        if (!notification.read) {
            await markAsRead(notification.id);
        }
        
        // Navigate based on notification type
        switch (notification.type) {
            case 'LIKE_POST':
                navigation.navigate('Post', { postId: notification.referenceId });
                break;
            case 'COMMENT':
                navigation.navigate('Comments', { postId: notification.referenceId });
                break;
            case 'FOLLOW':
            case 'FOLLOW_REQUEST':
                navigation.navigate('UserProfileScreen', { userId: notification.actorId });
                break;
            case 'MESSAGE':
                navigation.navigate('NewChatScreen', { userId: notification.actorId });
                break;
            case 'SPORTS_EVENT':
                navigation.navigate('SportsPostDetailScreen', { postId: notification.referenceId });
                break;
            case 'SPORTS_MATCH':
                navigation.navigate('SportsAvailabilityDetail', { availabilityId: notification.referenceId });
                break;
            default:
                // Default action if type is not recognized
                console.log('No specific action for notification type:', notification.type);
        }
    };
    
    // Handle notification delete
    const handleNotificationDelete = async (notificationId) => {
        Alert.alert(
            'Xác nhận',
            'Bạn có chắc chắn muốn xóa thông báo này?',
            [
                {
                    text: 'Hủy',
                    style: 'cancel'
                },
                {
                    text: 'Xóa',
                    onPress: async () => {
                        try {
                            await deleteNotification(notificationId);
                        } catch (error) {
                            Alert.alert('Lỗi', 'Không thể xóa thông báo');
                        }
                    },
                    style: 'destructive'
                }
            ]
        );
    };
    
    // Convert API notification to UI format
    const formatNotification = (notification) => {
        const { id, type, actorName, actorAvatar, content, createdAt, read } = notification;
        
        return {
            id,
            type,
            user: {
                id: notification.actorId,
                username: actorName,
                profilePicture: actorAvatar || 'https://randomuser.me/api/portraits/men/1.jpg'
            },
            content: content || getDefaultContent(type),
            postImage: notification.imageUrl,
            time: moment(createdAt).fromNow(),
            isNew: !read,
            referenceId: notification.referenceId,
            actorId: notification.actorId
        };
    };
    
    // Get default content based on notification type
    const getDefaultContent = (type) => {
        switch (type) {
            case 'LIKE_POST':
                return 'đã thích bài viết của bạn';
            case 'COMMENT':
                return 'đã bình luận về bài viết của bạn';
            case 'FOLLOW':
                return 'đã bắt đầu theo dõi bạn';
            case 'FOLLOW_REQUEST':
                return 'đã yêu cầu theo dõi bạn';
            case 'MESSAGE':
                return 'đã gửi cho bạn một tin nhắn';
            case 'SPORTS_EVENT':
                return 'đã mời bạn tham gia sự kiện thể thao';
            case 'SPORTS_MATCH':
                return 'đã khớp với lịch chơi thể thao của bạn';
            default:
                return 'đã tương tác với bạn';
        }
    };
    
    // Load more notifications when reaching the end
    const handleLoadMore = () => {
        if (!loading && hasMore) {
            fetchNotifications();
        }
    };
    
    // Refresh notifications
    const handleRefresh = () => {
        refreshNotifications();
    };
    
    // Render a notification item
    const renderNotification = ({ item }) => {
        const formattedItem = item.user ? item : formatNotification(item);
        
        return (
            <TouchableOpacity
                style={[styles.notificationItem, formattedItem.isNew && styles.newNotification]}
                onPress={() => handleNotificationPress(item)}
                onLongPress={() => handleNotificationDelete(item.id)}
            >
                <Image source={{ uri: formattedItem.user.profilePicture }} style={styles.userImage} />

                <View style={styles.notificationContent}>
                    <Text style={styles.notificationText}>
                        <Text style={styles.username}>{formattedItem.user.username}</Text> {formattedItem.content}
                    </Text>
                    <Text style={styles.timeText}>{formattedItem.time}</Text>
                </View>

                {formattedItem.postImage && (
                    <Image source={{ uri: formattedItem.postImage }} style={styles.postThumbnail} />
                )}

                {formattedItem.type === 'FOLLOW' && (
                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('UserProfileScreen', { userId: formattedItem.actorId })}
                    >
                        <Text style={styles.actionButtonText}>Xem hồ sơ</Text>
                    </TouchableOpacity>
                )}

                {formattedItem.type === 'FOLLOW_REQUEST' && (
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

    // Header with tabs
    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <View style={styles.headerTitleRow}>
            <Text style={styles.title}>Thông báo</Text>
                {unreadCount > 0 && (
                    <TouchableOpacity 
                        style={styles.markReadButton}
                        onPress={handleMarkAllAsRead}
                    >
                        <Text style={styles.markReadText}>Đánh dấu tất cả đã đọc</Text>
                    </TouchableOpacity>
                )}
            </View>
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

    // Empty state
    const renderEmptyState = () => {
        if (loading) {
            return (
                <View style={styles.emptyContainer}>
                    <ActivityIndicator size="large" color="#E91E63" />
                    <Text style={styles.emptyText}>Đang tải thông báo...</Text>
                </View>
            );
        }
        
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={60} color="#bbb" />
                <Text style={styles.emptyTitle}>Không có thông báo</Text>
                <Text style={styles.emptyText}>Bạn chưa có thông báo nào.</Text>
            </View>
        );
    };
    
    // Render footer loader
    const renderFooter = () => {
        if (!loading || notifications.length === 0) return null;
        
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#E91E63" />
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {renderHeader()}

            <FlatList
                data={notifications}
                renderItem={renderNotification}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={notifications.length === 0 ? styles.emptyList : styles.notificationsList}
                ListEmptyComponent={renderEmptyState}
                ListFooterComponent={renderFooter}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                refreshControl={
                    <RefreshControl 
                        refreshing={loading && notifications.length > 0}
                        onRefresh={handleRefresh}
                        colors={["#E91E63"]}
                    />
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    headerContainer: {
        backgroundColor: 'white',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    markReadButton: {
        padding: 5,
    },
    markReadText: {
        fontSize: 12,
        color: '#2196F3',
    },
    tabsContainer: {
        flexDirection: 'row',
    },
    tab: {
        marginRight: 16,
        paddingBottom: 8,
        paddingHorizontal: 4,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#E91E63',
    },
    tabText: {
        fontSize: 16,
        color: '#666',
    },
    activeTabText: {
        color: '#E91E63',
        fontWeight: 'bold',
    },
    notificationsList: {
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    emptyList: {
        flexGrow: 1,
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: 'white',
        borderRadius: 8,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
        elevation: 1,
    },
    newNotification: {
        backgroundColor: '#F8F1F6',
    },
    userImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    notificationContent: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    notificationText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    username: {
        fontWeight: 'bold',
    },
    timeText: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    postThumbnail: {
        width: 44,
        height: 44,
        borderRadius: 4,
        marginLeft: 8,
    },
    actionButton: {
        backgroundColor: '#E91E63',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'center',
        marginLeft: 8,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    requestButtonsContainer: {
        alignItems: 'center',
        marginLeft: 8,
    },
    acceptButton: {
        backgroundColor: '#E91E63',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 6,
    },
    acceptButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    declineButton: {
        backgroundColor: '#eee',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    declineButtonText: {
        color: '#666',
        fontSize: 12,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 12,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
        marginTop: 8,
    },
    footerLoader: {
        paddingVertical: 20,
        alignItems: 'center',
    },
});

export default NotificationsScreen;
