import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    TextInput,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Alert,
    ActivityIndicator,
    Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Services
import UserProfileService from '../../services/UserProfileService';
import FriendService from '../../services/FriendService';

const FriendSearchScreen = ({ navigation, route }) => {
    // 📱 State Management
    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [friendshipStatuses, setFriendshipStatuses] = useState(new Map());
    const [error, setError] = useState(null);

    // Load current user
    useEffect(() => {
        const loadCurrentUser = async () => {
            try {
                console.log('👤 Loading current user...');
                
                // Try multiple sources for current user
                let userData = await AsyncStorage.getItem('userData');
                let userProfile = await AsyncStorage.getItem('userProfile');
                
                console.log('👤 userData from storage:', userData ? 'found' : 'not found');
                console.log('👤 userProfile from storage:', userProfile ? 'found' : 'not found');
                
                if (userData) {
                    const user = JSON.parse(userData);
                    console.log('👤 Current user from userData:', user.id, user.email);
                    setCurrentUser(user);
                } else if (userProfile) {
                    const user = JSON.parse(userProfile);
                    console.log('👤 Current user from userProfile:', user.id, user.email);
                    setCurrentUser(user);
                } else {
                    // Fallback: try to get from UserProfileService
                    console.log('👤 No stored user, trying to fetch current profile...');
                    try {
                        const currentProfile = await UserProfileService.getCurrentUserProfile();
                        console.log('👤 Current user from API:', currentProfile.id, currentProfile.email);
                        setCurrentUser(currentProfile);
                    } catch (apiError) {
                        console.error('👤 Failed to get current user from API:', apiError);
                    }
                }
            } catch (error) {
                console.error('👤 Error loading current user:', error);
            }
        };

        loadCurrentUser();
    }, []);

    // 🔍 Search users
    const searchUsers = useCallback(async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('🔍 Searching users:', query);
            const response = await UserProfileService.searchUsers(query);
            
            console.log('📊 Response received:', JSON.stringify(response, null, 2));
            console.log('📊 Response type:', typeof response);
            console.log('📊 Response keys:', response ? Object.keys(response) : 'null response');
            
            // Handle Page object format (Spring Boot Pageable response)
            let users = [];
            if (response && response.content && Array.isArray(response.content)) {
                users = response.content;
                console.log('📄 Page object detected, users:', users.length);
            } 
            // Handle direct array format
            else if (Array.isArray(response)) {
                users = response;
                console.log('📋 Direct array detected, users:', users.length);
            }
            // Handle success wrapper format
            else if (response && response.success && response.data) {
                if (response.data.content && Array.isArray(response.data.content)) {
                    users = response.data.content;
                } else if (Array.isArray(response.data)) {
                    users = response.data;
                }
                console.log('✅ Success wrapper detected, users:', users.length);
            }
            // Fallback: try to extract users from any nested structure
            else if (response) {
                console.log('🔍 Unknown format, trying to find users...');
                // Try common paths
                const possiblePaths = [
                    response.data?.content,
                    response.data?.users,
                    response.users,
                    response.content,
                    response.data
                ];
                
                for (const path of possiblePaths) {
                    if (Array.isArray(path)) {
                        users = path;
                        console.log('🎯 Found users in fallback path:', users.length);
                        break;
                    }
                }
            }
            
            console.log('👥 Final users array:', users.length, 'items');
            
            // Filter out current user
            const filteredUsers = users.filter(user => user && user.id && user.id !== currentUser?.id);
            setSearchResults(filteredUsers);

            // Get friendship statuses
            if (filteredUsers.length > 0) {
                await getFriendshipStatuses(filteredUsers.map(user => user.id));
            }
            
            console.log(`✅ Found ${filteredUsers.length} users after filtering`);
            
        } catch (error) {
            console.error('❌ Search error:', error);
            setError('Lỗi tìm kiếm người dùng');
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    }, [currentUser?.id]);

    // 👥 Get friendship statuses
    const getFriendshipStatuses = useCallback(async (userIds) => {
        try {
            const statuses = await FriendService.getBatchFriendshipStatus(userIds);
            const statusMap = new Map();
            
            Object.entries(statuses).forEach(([userId, status]) => {
                statusMap.set(parseInt(userId), status);
            });
            
            setFriendshipStatuses(statusMap);
        } catch (error) {
            console.error('❌ Error getting friendship statuses:', error);
        }
    }, []);

    // 🤝 Send friend request
    const sendFriendRequest = useCallback(async (userId) => {
        try {
            Alert.alert(
                'Gửi lời mời kết bạn',
                'Bạn có muốn gửi lời mời kết bạn không?',
                [
                    { text: 'Hủy', style: 'cancel' },
                    {
                        text: 'Gửi',
                        onPress: async () => {
                            try {
                                console.log('📤 Sending friend request to:', userId);
                                await FriendService.sendFriendRequestById(userId);

                                // Update status
                                setFriendshipStatuses(prev => {
                                    const newMap = new Map(prev);
                                    newMap.set(userId, 'PENDING_SENT');
                                    return newMap;
                });

            Alert.alert('Thành công', 'Đã gửi lời mời kết bạn');
        } catch (error) {
                                console.error('❌ Error sending friend request:', error);
            Alert.alert('Lỗi', 'Không thể gửi lời mời kết bạn');
        }
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('❌ Error in sendFriendRequest:', error);
        }
    }, []);

    // ⏰ Debounced search
    useEffect(() => {
        const delayedSearch = setTimeout(() => {
            if (searchText.trim()) {
                searchUsers(searchText);
            } else {
                setSearchResults([]);
                setError(null);
            }
        }, 500);

        return () => clearTimeout(delayedSearch);
    }, [searchText, searchUsers]);

    // 🔄 Refresh handler
    const onRefresh = useCallback(() => {
        if (searchText.trim()) {
            setRefreshing(true);
            searchUsers(searchText).finally(() => setRefreshing(false));
        }
    }, [searchText, searchUsers]);

    // 🎨 Get friendship button
    const getFriendshipButton = (user) => {
        const status = friendshipStatuses.get(user.id) || 'NOT_FRIEND';
        
        switch (status) {
            case 'ACCEPTED':
        return (
                    <View style={styles.friendButton}>
                        <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                        <Text style={styles.friendButtonText}>Bạn bè</Text>
                    </View>
                );
            case 'PENDING_SENT':
                return (
                    <View style={styles.pendingButton}>
                        <Ionicons name="time" size={20} color="#FF9800" />
                        <Text style={styles.pendingButtonText}>Đã gửi</Text>
                    </View>
                );
            case 'PENDING_RECEIVED':
                return (
                    <TouchableOpacity style={styles.acceptButton}>
                        <Ionicons name="person-add" size={20} color="#fff" />
                        <Text style={styles.acceptButtonText}>Chấp nhận</Text>
                        </TouchableOpacity>
                );
            case 'BLOCKED':
                return (
                    <View style={styles.blockedButton}>
                        <Ionicons name="ban" size={20} color="#F44336" />
                        <Text style={styles.blockedButtonText}>Đã chặn</Text>
                        </View>
                );
            default:
                return (
                        <TouchableOpacity
                        style={styles.addFriendButton}
                        onPress={() => sendFriendRequest(user.id)}
                            >
                        <Ionicons name="person-add" size={20} color="#fff" />
                        <Text style={styles.addFriendButtonText}>Kết bạn</Text>
            </TouchableOpacity>
        );
        }
    };

    // 🎨 Render user item
    const renderUserItem = ({ item }) => (
        <TouchableOpacity
            style={styles.userItem}
            onPress={() => navigation.navigate('UserProfileScreen', { userId: item.id })}
            activeOpacity={0.7}
        >
            <View style={styles.avatarContainer}>
                <Image
                    source={{ uri: item.profilePictureUrl || 'https://via.placeholder.com/60' }}
                    style={styles.avatar}
                    defaultSource={{ uri: 'https://via.placeholder.com/60' }}
                />
            </View>

            <View style={styles.userContent}>
                <Text style={styles.userName}>{item.fullName}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
                {item.mutualFriendsCount > 0 && (
                    <Text style={styles.mutualFriends}>
                        {item.mutualFriendsCount} bạn chung
                    </Text>
                )}
            </View>

            {getFriendshipButton(item)}
        </TouchableOpacity>
    );

    // 🎨 Empty state
    const EmptyState = () => {
        if (loading) return null;
        
        if (!searchText.trim()) {
            return (
                <View style={styles.emptyContainer}>
                    <Ionicons name="search" size={64} color="#ccc" />
                    <Text style={styles.emptyTitle}>Tìm kiếm bạn bè</Text>
                    <Text style={styles.emptySubtitle}>
                        Nhập tên hoặc email để tìm kiếm người dùng
                    </Text>
                </View>
            );
        }

        if (error) {
            return (
                        <View style={styles.emptyContainer}>
                    <Ionicons name="alert-circle" size={64} color="#FF6B6B" />
                    <Text style={styles.emptyTitle}>Có lỗi xảy ra</Text>
                    <Text style={styles.emptySubtitle}>{error}</Text>
                    <TouchableOpacity 
                        style={styles.retryButton}
                        onPress={() => searchUsers(searchText)}
                    >
                        <Text style={styles.retryButtonText}>Thử lại</Text>
                    </TouchableOpacity>
                        </View>
            );
        }

        return (
                        <View style={styles.emptyContainer}>
                <Ionicons name="person-outline" size={64} color="#ccc" />
                <Text style={styles.emptyTitle}>Không tìm thấy</Text>
                            <Text style={styles.emptySubtitle}>
                    Không tìm thấy người dùng nào với từ khóa "{searchText}"
                            </Text>
                        </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
            
            {/* Header */}
            <LinearGradient colors={['#007AFF', '#0056D3']} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    
                    <Text style={styles.headerTitle}>Tìm bạn bè</Text>
                    
                    <View style={styles.headerButton} />
                </View>
                
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchInputContainer}>
                        <Ionicons name="search" size={20} color="#666" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Tìm kiếm theo tên hoặc email..."
                            value={searchText}
                            onChangeText={setSearchText}
                            placeholderTextColor="#666"
                            autoFocus={true}
                        />
                        {searchText.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchText('')}>
                                <Ionicons name="close-circle" size={20} color="#666" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </LinearGradient>

            {/* Content */}
            <View style={styles.content}>
                {loading && searchText.trim() && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#007AFF" />
                        <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
                    </View>
                )}

                <FlatList
                    data={searchResults}
                    keyExtractor={(item) => `user_${item.id}`}
                    renderItem={renderUserItem}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#007AFF']}
                            tintColor="#007AFF"
                        />
                    }
                    ListEmptyComponent={EmptyState}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={searchResults.length === 0 ? styles.emptyListContainer : null}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        paddingTop: 20,
        paddingBottom: 15,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
        textAlign: 'center',
    },
    headerButton: {
        width: 34,
    },
    searchContainer: {
        marginBottom: 10,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginHorizontal: 5,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        marginLeft: 10,
        color: '#333',
    },
    content: {
        flex: 1,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        marginTop: 10,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 15,
        marginVertical: 2,
        marginHorizontal: 10,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    avatarContainer: {
        marginRight: 15,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#007AFF',
    },
    userContent: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 3,
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    mutualFriends: {
        fontSize: 12,
        color: '#007AFF',
        fontWeight: '500',
    },
    addFriendButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    addFriendButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 5,
    },
    friendButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E8',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    friendButtonText: {
        color: '#4CAF50',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 5,
    },
    pendingButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3E0',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    pendingButtonText: {
        color: '#FF9800',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 5,
    },
    acceptButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    acceptButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 5,
    },
    blockedButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEBEE',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    blockedButtonText: {
        color: '#F44336',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 5,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginTop: 15,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        lineHeight: 20,
    },
    retryButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        marginTop: 20,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyListContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default FriendSearchScreen;