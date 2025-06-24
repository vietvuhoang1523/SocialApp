import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
    Alert
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import 'moment/locale/vi';
import * as ParticipantService from '../../services/SportsPostParticipantService';
import SportsPostItem from '../../components/SportsPostItem';

moment.locale('vi');

const MyJoinedPostsScreen = ({ navigation }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMoreData, setHasMoreData] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Setup navigation header
    useEffect(() => {
        navigation.setOptions({
            title: 'Bài đăng đã tham gia',
            headerStyle: {
                backgroundColor: '#E91E63',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
                fontWeight: 'bold',
            },
        });
    }, [navigation]);

    // Load joined posts data
    const loadJoinedPosts = useCallback(async (page = 0, isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else if (page === 0) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            console.log(`📋 Loading joined posts - Page: ${page}`);
            
            // ✅ SỬ DỤNG ĐÚNG SERVICE: SportsPostParticipantService thay vì SportsPostService
            const response = await ParticipantService.getUserJoinedPosts(page, 10);
            
            console.log('📄 Joined posts response:', response);

            let newPosts = [];
            let isLastPage = true;
            let total = 0;

            if (response) {
                if (response.content && Array.isArray(response.content)) {
                    // Response có cấu trúc pagination
                    newPosts = response.content.map(item => ({
                        ...item.sportsPost,
                        participantInfo: item // Thông tin participant
                    }));
                    isLastPage = response.last || false;
                    total = response.totalElements || 0;
                } else if (Array.isArray(response)) {
                    // Response là array trực tiếp
                    newPosts = response.map(item => ({
                        ...item.sportsPost,
                        participantInfo: item
                    }));
                    isLastPage = true;
                    total = newPosts.length;
                }
            }

            if (isRefresh || page === 0) {
                setPosts(newPosts);
                setCurrentPage(0);
            } else {
                setPosts(prevPosts => [...prevPosts, ...newPosts]);
                setCurrentPage(page);
            }

            setHasMoreData(!isLastPage && newPosts.length > 0);
            setTotalElements(total);

            console.log(`✅ Loaded ${newPosts.length} joined posts. Total: ${total}`);
            
        } catch (error) {
            console.error('❌ Error loading joined posts:', error);
            Alert.alert(
                'Lỗi', 
                error.message || 'Không thể tải danh sách bài đăng đã tham gia'
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        loadJoinedPosts(0, false);
    }, [loadJoinedPosts]);

    // Handle refresh
    const handleRefresh = useCallback(() => {
        loadJoinedPosts(0, true);
    }, [loadJoinedPosts]);

    // Handle load more
    const handleLoadMore = useCallback(() => {
        if (!loadingMore && hasMoreData) {
            loadJoinedPosts(currentPage + 1, false);
        }
    }, [loadingMore, hasMoreData, currentPage, loadJoinedPosts]);

    // Render post item
    const renderPostItem = ({ item }) => (
        <View style={styles.postItemWrapper}>
            <SportsPostItem
                item={item}
                navigation={navigation}
                currentUserId={null} // Sẽ được set trong SportsPostItem
            />
            
            {/* Hiển thị thông tin participant */}
            {item.participantInfo && (
                <View style={styles.participantInfoBanner}>
                    <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
                    <Text style={styles.participantInfoText}>
                        Đã tham gia từ {moment(item.participantInfo.createdAt).format('DD/MM/YYYY')}
                    </Text>
                    {item.participantInfo.status && (
                        <View style={[styles.statusBadge, getStatusBadgeStyle(item.participantInfo.status)]}>
                            <Text style={[styles.statusText, getStatusTextStyle(item.participantInfo.status)]}>
                                {getStatusLabel(item.participantInfo.status)}
                            </Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );

    // Helper functions for status
    const getStatusLabel = (status) => {
        const labels = {
            PENDING: 'Chờ duyệt',
            ACCEPTED: 'Đã chấp nhận',
            REJECTED: 'Đã từ chối'
        };
        return labels[status] || status;
    };

    const getStatusBadgeStyle = (status) => {
        const styles = {
            PENDING: { backgroundColor: '#FFC107' },
            ACCEPTED: { backgroundColor: '#4CAF50' },
            REJECTED: { backgroundColor: '#F44336' }
        };
        return styles[status] || { backgroundColor: '#757575' };
    };

    const getStatusTextStyle = (status) => {
        return { color: '#fff' };
    };

    // Render empty state
    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <MaterialIcons name="event-busy" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>Chưa tham gia bài đăng nào</Text>
            <Text style={styles.emptySubtitle}>
                Tham gia các hoạt động thể thao để xem chúng xuất hiện ở đây
            </Text>
            <TouchableOpacity 
                style={styles.exploreButton}
                onPress={() => navigation.navigate('InstagramHome')}
            >
                <MaterialIcons name="explore" size={20} color="#fff" />
                <Text style={styles.exploreButtonText}>Khám phá hoạt động</Text>
            </TouchableOpacity>
        </View>
    );

    // Render footer (loading more indicator)
    const renderFooter = () => {
        if (!loadingMore) return null;
        
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#E91E63" />
                <Text style={styles.footerLoaderText}>Đang tải thêm...</Text>
            </View>
        );
    };

    // Main loading state
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#E91E63" />
                <Text style={styles.loadingText}>Đang tải bài đăng đã tham gia...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header stats */}
            <View style={styles.statsHeader}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{totalElements}</Text>
                    <Text style={styles.statLabel}>Đã tham gia</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{posts.filter(p => p.participantInfo?.status === 'ACCEPTED').length}</Text>
                    <Text style={styles.statLabel}>Đã được duyệt</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{posts.filter(p => p.participantInfo?.status === 'PENDING').length}</Text>
                    <Text style={styles.statLabel}>Chờ duyệt</Text>
                </View>
            </View>

            {/* Posts list */}
            <FlatList
                data={posts}
                renderItem={renderPostItem}
                keyExtractor={(item, index) => `${item.id || index}-${item.participantInfo?.id || ''}`}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#E91E63']}
                    />
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.1}
                ListEmptyComponent={renderEmptyState}
                ListFooterComponent={renderFooter}
                contentContainerStyle={posts.length === 0 ? styles.emptyListContainer : styles.listContainer}
                showsVerticalScrollIndicator={false}
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
    statsHeader: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingVertical: 15,
        paddingHorizontal: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#E91E63',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    listContainer: {
        padding: 10,
    },
    emptyListContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    postItemWrapper: {
        marginBottom: 10,
    },
    participantInfoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E8',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
    },
    participantInfoText: {
        marginLeft: 6,
        fontSize: 13,
        color: '#2E7D32',
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginLeft: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 25,
        paddingHorizontal: 40,
        lineHeight: 20,
    },
    exploreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E91E63',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    exploreButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    footerLoader: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 15,
    },
    footerLoaderText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
    },
});

export default MyJoinedPostsScreen; 