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

const MyCreatedPostsScreen = ({ navigation }) => {
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
            title: 'Bài đăng đã tạo',
            headerStyle: {
                backgroundColor: '#E91E63',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
                fontWeight: 'bold',
            },
            headerRight: () => (
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate('CreateSportsPost')}
                >
                    <MaterialIcons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    // Load created posts data using correct service
    const loadCreatedPosts = useCallback(async (page = 0, isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else if (page === 0) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            console.log(`📋 Loading created posts - Page: ${page}`);
            
            // ✅ SỬ DỤNG ĐÚNG SERVICE: SportsPostParticipantService
            const response = await ParticipantService.getUserCreatedPosts(page, 10);
            
            console.log('📄 Created posts response:', response);

            let newPosts = [];
            let isLastPage = true;
            let total = 0;

            if (response) {
                if (response.content && Array.isArray(response.content)) {
                    // Response có cấu trúc pagination
                    newPosts = response.content.map(item => ({
                        ...item.sportsPost,
                        creatorInfo: item // Thông tin creator
                    }));
                    isLastPage = response.last || false;
                    total = response.totalElements || 0;
                } else if (Array.isArray(response)) {
                    // Response là array trực tiếp
                    newPosts = response.map(item => ({
                        ...item.sportsPost,
                        creatorInfo: item
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

            console.log(`✅ Loaded ${newPosts.length} created posts. Total: ${total}`);
            
        } catch (error) {
            console.error('❌ Error loading created posts:', error);
            Alert.alert(
                'Lỗi', 
                error.message || 'Không thể tải danh sách bài đăng đã tạo'
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        loadCreatedPosts(0, false);
    }, [loadCreatedPosts]);

    // Handle refresh
    const handleRefresh = useCallback(() => {
        loadCreatedPosts(0, true);
    }, [loadCreatedPosts]);

    // Handle load more
    const handleLoadMore = useCallback(() => {
        if (!loadingMore && hasMoreData) {
            loadCreatedPosts(currentPage + 1, false);
        }
    }, [loadingMore, hasMoreData, currentPage, loadCreatedPosts]);

    // Get post status info
    const getPostStatusInfo = (post) => {
        const currentTime = new Date();
        const eventTime = new Date(post.eventTime);
        
        if (eventTime < currentTime) {
            return {
                status: 'completed',
                label: 'Đã kết thúc',
                color: '#757575',
                icon: 'event-available'
            };
        } else if (post.status === 'CANCELLED') {
            return {
                status: 'cancelled',
                label: 'Đã hủy',
                color: '#F44336',
                icon: 'event-busy'
            };
        } else if (post.status === 'PAUSED') {
            return {
                status: 'paused',
                label: 'Tạm dừng',
                color: '#FF9800',
                icon: 'pause-circle-outline'
            };
        } else {
            return {
                status: 'active',
                label: 'Đang diễn ra',
                color: '#4CAF50',
                icon: 'event'
            };
        }
    };

    // Render post item
    const renderPostItem = ({ item }) => {
        const statusInfo = getPostStatusInfo(item);
        
        return (
            <View style={styles.postItemWrapper}>
                <SportsPostItem
                    item={item}
                    navigation={navigation}
                    currentUserId={null} // Sẽ được set trong SportsPostItem
                />
                
                {/* Hiển thị thông tin creator và stats */}
                <View style={styles.creatorInfoBanner}>
                    <View style={styles.leftSection}>
                        <MaterialIcons name="create" size={16} color="#E91E63" />
                        <Text style={styles.creatorInfoText}>
                            Tạo ngày {moment(item.creatorInfo?.createdAt || item.createdAt).format('DD/MM/YYYY')}
                        </Text>
                    </View>
                    
                    <View style={styles.rightSection}>
                        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                            <MaterialIcons name={statusInfo.icon} size={12} color="#fff" />
                            <Text style={styles.statusText}>{statusInfo.label}</Text>
                        </View>
                    </View>
                </View>

                {/* Stats banner */}
                <View style={styles.statsBanner}>
                    <View style={styles.statItem}>
                        <MaterialIcons name="people" size={16} color="#666" />
                        <Text style={styles.statText}>
                            {item.currentParticipants || 0}/{item.maxParticipants} người
                        </Text>
                    </View>
                    
                    <TouchableOpacity 
                        style={styles.manageButton}
                        onPress={() => navigation.navigate('ManageParticipants', { 
                            postId: item.id, 
                            postTitle: item.title 
                        })}
                    >
                        <MaterialIcons name="settings" size={16} color="#E91E63" />
                        <Text style={styles.manageButtonText}>Quản lý</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // Render empty state
    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <MaterialIcons name="add-circle-outline" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>Chưa tạo bài đăng nào</Text>
            <Text style={styles.emptySubtitle}>
                Tạo bài đăng đầu tiên để tìm người tham gia hoạt động thể thao
            </Text>
            <TouchableOpacity 
                style={styles.createButton}
                onPress={() => navigation.navigate('CreateSportsPost')}
            >
                <MaterialIcons name="add-circle" size={20} color="#fff" />
                <Text style={styles.createButtonText}>Tạo bài đăng</Text>
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
                <Text style={styles.loadingText}>Đang tải bài đăng đã tạo...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header stats */}
            <View style={styles.statsHeader}>
                <View style={styles.statHeaderItem}>
                    <Text style={styles.statNumber}>{totalElements}</Text>
                    <Text style={styles.statLabel}>Đã tạo</Text>
                </View>
                <View style={styles.statHeaderItem}>
                    <Text style={styles.statNumber}>
                        {posts.filter(p => getPostStatusInfo(p).status === 'active').length}
                    </Text>
                    <Text style={styles.statLabel}>Đang diễn ra</Text>
                </View>
                <View style={styles.statHeaderItem}>
                    <Text style={styles.statNumber}>
                        {posts.filter(p => getPostStatusInfo(p).status === 'completed').length}
                    </Text>
                    <Text style={styles.statLabel}>Đã kết thúc</Text>
                </View>
            </View>

            {/* Posts list */}
            <FlatList
                data={posts}
                renderItem={renderPostItem}
                keyExtractor={(item, index) => `${item.id || index}-${item.creatorInfo?.id || ''}`}
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
    addButton: {
        padding: 8,
        marginRight: 8,
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
    statHeaderItem: {
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
    creatorInfoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFF3E0',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    creatorInfoText: {
        marginLeft: 6,
        fontSize: 13,
        color: '#E65100',
        flex: 1,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 2,
    },
    statsBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: {
        marginLeft: 4,
        fontSize: 13,
        color: '#666',
    },
    manageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#E91E63',
    },
    manageButtonText: {
        marginLeft: 4,
        fontSize: 12,
        color: '#E91E63',
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
    createButton: {
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
    createButtonText: {
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

export default MyCreatedPostsScreen; 