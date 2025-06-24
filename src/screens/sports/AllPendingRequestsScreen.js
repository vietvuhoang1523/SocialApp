import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    RefreshControl,
    Image,
    ActivityIndicator,
    Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import moment from 'moment';
import 'moment/locale/vi';
import * as ParticipantService from '../../services/SportsPostParticipantService';
import sportsService from '../../services/sportsService';

const { width } = Dimensions.get('window');
moment.locale('vi');

const AllPendingRequestsScreen = ({ navigation }) => {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        navigation.setOptions({
            title: 'Yêu cầu tham gia',
            headerStyle: {
                backgroundColor: '#E91E63',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
                fontWeight: 'bold',
            },
        });
        
        loadPendingRequests();
    }, []);

    const loadPendingRequests = async (pageNum = 0, isRefresh = false) => {
        try {
            if (pageNum === 0) setLoading(true);
            
            const response = await ParticipantService.getAllPendingRequestsForCurrentUser(pageNum, 20);
            const newRequests = response.content || response;
            
            if (isRefresh || pageNum === 0) {
                setPendingRequests(newRequests);
            } else {
                setPendingRequests(prev => [...prev, ...newRequests]);
            }
            
            setHasMore(newRequests.length === 20);
            setPage(pageNum);
            
        } catch (error) {
            console.error('Error loading pending requests:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách yêu cầu');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadPendingRequests(0, true);
    }, []);

    const loadMore = () => {
        if (!loading && hasMore) {
            loadPendingRequests(page + 1);
        }
    };

    const handleResponse = async (participant, approve) => {
        try {
            setProcessingId(participant.id);
            
            const message = approve ? 'Chào mừng bạn tham gia!' : 'Xin lỗi, yêu cầu không phù hợp.';
            
            await ParticipantService.respondToJoinRequest(
                participant.sportsPost?.id || participant.postId,
                participant.id,
                approve,
                message
            );

            Alert.alert(
                'Thành công',
                `Đã ${approve ? 'chấp nhận' : 'từ chối'} yêu cầu của ${participant.user?.fullName || participant.fullName}`
            );

            // Remove from list
            setPendingRequests(prev => prev.filter(req => req.id !== participant.id));
            
        } catch (error) {
            console.error('Error responding to request:', error);
            Alert.alert('Lỗi', error.message || 'Không thể xử lý yêu cầu');
        } finally {
            setProcessingId(null);
        }
    };

    const navigateToPostDetail = (postId) => {
        navigation.navigate('SportsPostDetail', { postId });
    };

    const navigateToManagePost = (postId, postTitle) => {
        navigation.navigate('ManageParticipants', { postId, postTitle });
    };

    const getProfilePictureUrl = (participant) => {
        const user = participant.user || participant;
        if (user.profilePictureUrl) {
            if (user.profilePictureUrl.startsWith('http://') || user.profilePictureUrl.startsWith('https://')) {
                return user.profilePictureUrl;
            }
            return sportsService.createImageUrl(user.profilePictureUrl);
        }
        return 'https://randomuser.me/api/portraits/men/1.jpg';
    };

    const renderRequestItem = ({ item }) => {
        const user = item.user || item;
        const post = item.sportsPost || item.post;
        const isProcessing = processingId === item.id;
        
        return (
            <View style={styles.requestCard}>
                {/* Post Info */}
                <TouchableOpacity 
                    style={styles.postHeader}
                    onPress={() => post?.id && navigateToPostDetail(post.id)}
                >
                    <Text style={styles.postTitle} numberOfLines={2}>
                        {post?.title || 'Bài đăng thể thao'}
                    </Text>
                    <Text style={styles.postSport}>
                        {post?.sportType || 'SPORT'} • {moment(post?.eventTime).format('DD/MM HH:mm')}
                    </Text>
                </TouchableOpacity>

                {/* User Info */}
                <View style={styles.userInfo}>
                    <Image 
                        source={{ uri: getProfilePictureUrl(item) }} 
                        style={styles.avatar} 
                    />
                    <View style={styles.userDetails}>
                        <Text style={styles.userName}>{user.fullName || 'Unknown User'}</Text>
                        <Text style={styles.userEmail}>{user.email || ''}</Text>
                        {item.joinMessage && (
                            <Text style={styles.joinMessage}>"{item.joinMessage}"</Text>
                        )}
                        <Text style={styles.requestTime}>
                            {moment(item.createdAt || item.requestedAt).fromNow()}
                        </Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity 
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={() => handleResponse(item, true)}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <MaterialIcons name="check" size={18} color="#fff" />
                        )}
                        <Text style={styles.actionButtonText}>Chấp nhận</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.actionButton, styles.declineButton]}
                        onPress={() => handleResponse(item, false)}
                        disabled={isProcessing}
                    >
                        <MaterialIcons name="close" size={18} color="#fff" />
                        <Text style={styles.actionButtonText}>Từ chối</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.actionButton, styles.manageButton]}
                        onPress={() => post?.id && navigateToManagePost(post.id, post.title)}
                    >
                        <MaterialIcons name="settings" size={18} color="#666" />
                        <Text style={[styles.actionButtonText, { color: '#666' }]}>Quản lý</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderFooter = () => {
        if (!loading) return null;
        
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#E91E63" />
            </View>
        );
    };

    if (loading && page === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#E91E63" />
                <Text style={styles.loadingText}>Đang tải yêu cầu...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={pendingRequests}
                renderItem={renderRequestItem}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#E91E63']}
                    />
                }
                onEndReached={loadMore}
                onEndReachedThreshold={0.1}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="check-circle-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>Không có yêu cầu nào đang chờ duyệt</Text>
                        <Text style={styles.emptySubText}>Tất cả yêu cầu đã được xử lý</Text>
                    </View>
                }
                contentContainerStyle={styles.listContainer}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    listContainer: {
        padding: 15,
    },
    requestCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    postHeader: {
        marginBottom: 12,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    postTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    postSport: {
        fontSize: 14,
        color: '#E91E63',
        fontWeight: '600',
    },
    userInfo: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    userDetails: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    joinMessage: {
        fontSize: 14,
        color: '#333',
        fontStyle: 'italic',
        marginBottom: 4,
        backgroundColor: '#f8f8f8',
        padding: 8,
        borderRadius: 8,
    },
    requestTime: {
        fontSize: 12,
        color: '#999',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        flex: 0.32,
    },
    approveButton: {
        backgroundColor: '#4CAF50',
    },
    declineButton: {
        backgroundColor: '#F44336',
    },
    manageButton: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: '600',
        marginLeft: 4,
        fontSize: 12,
    },
    footerLoader: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        fontSize: 18,
        color: '#999',
        marginTop: 15,
        fontWeight: '600',
    },
    emptySubText: {
        fontSize: 14,
        color: '#ccc',
        marginTop: 5,
    },
});

export default AllPendingRequestsScreen; 