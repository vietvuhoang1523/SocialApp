// NewMessagesScreen.js - Giao diện danh sách cuộc trò chuyện và bạn bè
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
    Dimensions,
    Image,
    Animated
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Services
import messagesService from '../../services/messagesService';
import webSocketService from '../../services/WebSocketService';
import FriendService from '../../services/FriendService';
import webSocketReconnectionManager from '../../services/WebSocketReconnectionManager';

// Components
import LoadingSpinner from '../../components/LoadingSpinner';
import UserSearchItem from '../../components/UserSearchItem';
import ConnectionMonitor from '../../components/chat/ConnectionMonitor';

const { width: screenWidth } = Dimensions.get('window');

const NewMessagesScreen = ({ navigation, route }) => {
    const currentUser = route.params?.currentUser;

    // 🎨 Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    // 📱 State Management - Mặc định hiển thị cuộc trò chuyện
    const [activeTab, setActiveTab] = useState('conversations'); // Luôn bắt đầu với cuộc trò chuyện
    const [conversations, setConversations] = useState([]);
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [searchMode, setSearchMode] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [unreadCounts, setUnreadCounts] = useState(new Map());
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [error, setError] = useState(null);

    // ✨ Entrance animation
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                delay: 200,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    // 🔍 Filtered data based on active tab
    const filteredData = useMemo(() => {
        if (!searchText.trim()) {
            return activeTab === 'conversations' ? conversations : friends;
        }
        
        if (activeTab === 'conversations') {
        return conversations.filter(conv => {
            const partner = conv.otherUser;
            return partner?.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
                   partner?.username?.toLowerCase().includes(searchText.toLowerCase()) ||
                   conv.lastMessage?.content?.toLowerCase().includes(searchText.toLowerCase());
        });
        } else {
            return friends.filter(friend => {
                const friendData = friend.sender?.id === currentUser?.id ? friend.receiver : friend.sender;
                return friendData?.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
                       friendData?.email?.toLowerCase().includes(searchText.toLowerCase());
            });
        }
    }, [conversations, friends, searchText, activeTab, currentUser?.id]);

    // 🔌 WebSocket Setup
    useEffect(() => {
        if (!currentUser?.id) return;

        const setupWebSocket = async () => {
            try {
                // Listen for connection status changes
                webSocketService.on('connectionStatus', (status) => {
                    console.log('🔌 Connection status changed:', status);
                    if (status === 'connected') {
                        // ✅ Khi kết nối lại, tải lại conversations
                        console.log('🔄 WebSocket connected, reloading conversations...');
                        loadConversations();
                    }
                });

                // Listen for conversation updates
                messagesService.on('conversationUpdate', (updatedConv) => {
                    console.log('📨 Conversation updated:', updatedConv);
                    setConversations(prev => 
                        prev.map(conv => 
                            conv.id === updatedConv.id ? updatedConv : conv
                        )
                    );
                });

                // Listen for new messages
                messagesService.on('newMessage', (message) => {
                    console.log('📩 New message received for conversation list:', message);
                    
                    // ✅ FIX: Thêm kiểm tra để đảm bảo message hợp lệ
                    if (!message || !message.id) {
                        console.log('⚠️ Received invalid message object');
                        return;
                    }
                    
                    // ✅ FIX: Đảm bảo message có timestamp
                    if (!message.timestamp) {
                        message.timestamp = new Date().toISOString();
                    }
                    
                    updateConversationWithNewMessage(message);
                });

                // Listen for unread counts
                messagesService.on('unreadCount', (data) => {
                    console.log('🔔 Unread count update:', data);
                    setUnreadCounts(prev => {
                        const newMap = new Map(prev);
                        newMap.set(data.conversationId, data.count);
                        return newMap;
                    });
                });

                // Listen for online status
                webSocketService.on('userOnline', (userData) => {
                    setOnlineUsers(prev => new Set([...prev, userData.userId]));
                });

                webSocketService.on('userOffline', (userData) => {
                    setOnlineUsers(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(userData.userId);
                        return newSet;
                    });
                });

                console.log('✅ WebSocket listeners setup complete');
            } catch (error) {
                console.error('❌ WebSocket setup error:', error);
            }
        };

        setupWebSocket();

        return () => {
            // Cleanup listeners
            messagesService.off('conversationUpdate');
            messagesService.off('newMessage');
            messagesService.off('unreadCount');
            webSocketService.off('userOnline');
            webSocketService.off('userOffline');
            webSocketService.off('connectionStatus');
        };
    }, [currentUser?.id]);

    // 📥 Load conversations - Cải thiện logic tải dữ liệu
    const loadConversations = useCallback(async (isRefresh = false) => {
        if (!currentUser?.id) {
            console.log('⚠️ No current user ID');
            return;
        }

        try {
            console.log('📥 Loading conversations for user:', currentUser.id);
            
            // ✅ Hiển thị loading nếu chưa có dữ liệu
            if (!isRefresh && conversations.length === 0) {
                setLoading(true);
            }

            // Fetch conversations from service
            const result = await messagesService.getConversations();
            console.log(`📥 Received ${result?.length || 0} conversations`);
            
            if (result && Array.isArray(result)) {
                setConversations(result);
                
                // Fetch unread counts for each conversation
                result.forEach(async (conv) => {
                    try {
                        if (conv.id) {
                            const count = await messagesService.getUnreadCount(conv.id);
                            setUnreadCounts(prev => {
                                const newMap = new Map(prev);
                                newMap.set(conv.id, count);
                                return newMap;
                            });
                        }
                    } catch (error) {
                        console.error('❌ Error fetching unread count:', error);
                    }
                });
            }
        } catch (error) {
            console.error('❌ Error loading conversations:', error);
            setError('Không thể tải cuộc trò chuyện. Vui lòng thử lại.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentUser?.id, conversations.length]);

    // 📥 Load friends
    const loadFriends = useCallback(async (isRefresh = false) => {
        if (!currentUser?.id) return;

        try {
            if (!isRefresh) {
                setLoading(true);
            }
            
            const result = await FriendService.getFriends(currentUser.id);
            console.log(`📥 Received ${result?.length || 0} friends`);
            
            if (result && Array.isArray(result)) {
                setFriends(result);
            }
        } catch (error) {
            console.error('❌ Error loading friends:', error);
            setError('Không thể tải danh sách bạn bè. Vui lòng thử lại.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentUser?.id]);

    // 🔄 Handle refresh
    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        setError(null);
        
        if (activeTab === 'conversations') {
            loadConversations(true);
        } else {
            loadFriends(true);
        }
    }, [activeTab, loadConversations, loadFriends]);

    // 🔄 Handle WebSocket reconnect
    const handleReconnect = useCallback(() => {
        console.log('🔄 Manually reconnecting WebSocket...');
        webSocketReconnectionManager.forceReconnect();
        
        // Also reload data
        if (activeTab === 'conversations') {
            loadConversations(true);
        } else {
            loadFriends(true);
        }
    }, [activeTab, loadConversations, loadFriends]);

    // 🚀 Initial data loading
    useEffect(() => {
        const initialize = async () => {
            try {
                // Ensure WebSocket is connected
                if (!webSocketService.isConnected()) {
                    console.log('🔌 WebSocket not connected, connecting...');
                    await webSocketService.connectWithStoredToken();
                }
                
                // Load initial data
                if (activeTab === 'conversations') {
                    await loadConversations();
                } else {
                    await loadFriends();
                }
            } catch (error) {
                console.error('❌ Error initializing:', error);
                setError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
            }
        };

        initialize();
    }, [activeTab, loadConversations, loadFriends]);

    // 📩 Update conversation with new message
    const updateConversationWithNewMessage = (message) => {
        setConversations(prev => {
            // ✅ FIX: Kiểm tra ID tin nhắn để tránh trùng lặp
            const messageAlreadyProcessed = prev.some(conv => 
                conv.lastMessage && conv.lastMessage.id === message.id
            );
            
            if (messageAlreadyProcessed) {
                console.log('🔍 Tin nhắn đã được xử lý trước đó, bỏ qua:', message.id);
                return prev;
            }
            
            const conversationIndex = prev.findIndex(conv => 
                (conv.otherUser.id === message.senderId && message.receiverId === currentUser?.id) ||
                (conv.otherUser.id === message.receiverId && message.senderId === currentUser?.id)
            );

            if (conversationIndex !== -1) {
                // ✅ FIX: Kiểm tra timestamp để đảm bảo chỉ cập nhật tin nhắn mới hơn
                const existingConv = prev[conversationIndex];
                const existingTimestamp = existingConv.lastMessage?.timestamp ? 
                    new Date(existingConv.lastMessage.timestamp).getTime() : 0;
                const newTimestamp = message.timestamp ? 
                    new Date(message.timestamp).getTime() : 0;
                
                // Nếu tin nhắn mới cũ hơn tin nhắn hiện tại, không cập nhật
                if (newTimestamp < existingTimestamp) {
                    console.log('⚠️ Tin nhắn mới cũ hơn tin nhắn hiện tại, không cập nhật');
                    return prev;
                }
                
                const updatedConversations = [...prev];
                updatedConversations[conversationIndex] = {
                    ...updatedConversations[conversationIndex],
                    lastMessage: message,
                    updatedAt: message.timestamp,
                    unreadCount: message.senderId !== currentUser?.id ? 
                        (updatedConversations[conversationIndex].unreadCount || 0) + 1 : 0
                };

                // ✅ FIX: Tạo bản sao mới của mảng để đảm bảo React nhận ra thay đổi
                const [movedConv] = updatedConversations.splice(conversationIndex, 1);
                return [movedConv, ...updatedConversations];
            }

            // Create new conversation if doesn't exist
            const newConversation = {
                id: `conv_${message.senderId}_${message.receiverId}`,
                otherUser: {
                    id: message.senderId === currentUser?.id ? message.receiverId : message.senderId,
                    fullName: 'Người dùng mới',
                    username: 'newuser',
                    avatar: null
                },
                lastMessage: message,
                unreadCount: message.senderId !== currentUser?.id ? 1 : 0,
                updatedAt: message.timestamp
            };

            return [newConversation, ...prev];
        });
    };

    // 🎨 Animate tab switch
    const animateTabSwitch = (newTab) => {
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            })
        ]).start();
        
        // ✅ Reset error khi chuyển tab
        if (error) {
            setError(null);
        }
        
        setActiveTab(newTab);
    };

    // 🎨 Render tab buttons
    const renderTabButtons = () => (
        <Animated.View 
            style={[
                styles.tabContainer,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                }
            ]}
        >
            <TouchableOpacity
                style={[styles.tabButton, activeTab === 'conversations' && styles.activeTab]}
                onPress={() => animateTabSwitch('conversations')}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={activeTab === 'conversations' 
                        ? ['#E91E63', '#C2185B', '#AD1457'] 
                        : ['transparent', 'transparent']
                    }
                    style={[styles.tabButtonGradient, activeTab === 'conversations' && styles.activeTabGradient]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Ionicons 
                        name="chatbubbles" 
                        size={20} 
                        color={activeTab === 'conversations' ? '#fff' : 'rgba(255,255,255,0.7)'} 
                    />
                    <Text style={[styles.tabText, activeTab === 'conversations' && styles.activeTabText]}>
                        Tin nhắn
                    </Text>
                    {conversations.length > 0 && (
                        <View style={styles.tabBadge}>
                            <Text style={styles.tabBadgeText}>{conversations.length}</Text>
                        </View>
                    )}
                </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.tabButton, activeTab === 'friends' && styles.activeTab]}
                onPress={() => animateTabSwitch('friends')}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={activeTab === 'friends' 
                        ? ['#E91E63', '#C2185B', '#AD1457'] 
                        : ['transparent', 'transparent']
                    }
                    style={[styles.tabButtonGradient, activeTab === 'friends' && styles.activeTabGradient]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Ionicons 
                        name="people" 
                        size={20} 
                        color={activeTab === 'friends' ? '#fff' : 'rgba(255,255,255,0.7)'} 
                    />
                    <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
                        Bạn bè
                    </Text>
                    {friends.length > 0 && (
                        <View style={styles.tabBadge}>
                            <Text style={styles.tabBadgeText}>{friends.length}</Text>
                        </View>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );

    // 🎨 Render conversation item
    const renderConversationItem = ({ item, index }) => {
        const unreadCount = unreadCounts.get(item.id) || item.unreadCount || 0;
        const isOnline = onlineUsers.has(item.otherUser.id);
        const lastMessageTime = item.lastMessage?.timestamp ? 
            new Date(item.lastMessage.timestamp).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
            }) : '';

        return (
            <Animated.View
                style={[
                    {
                        opacity: fadeAnim,
                        transform: [
                            { 
                                translateY: slideAnim.interpolate({
                                    inputRange: [0, 30],
                                    outputRange: [0, 30 + (index * 10)]
                                })
                            },
                            { scale: scaleAnim }
                        ]
                    }
                ]}
            >
            <TouchableOpacity
                style={styles.conversationItem}
                    onPress={() => handleSelectUser(item)}
                    activeOpacity={0.7}
                >
                    <LinearGradient
                        colors={unreadCount > 0 
                            ? ['rgba(233, 30, 99, 0.05)', 'rgba(233, 30, 99, 0.02)', '#fff']
                            : ['#fff', '#fff']
                        }
                        style={styles.conversationItemGradient}
                    >
                <View style={styles.avatarContainer}>
                            <View style={[styles.avatarRing, unreadCount > 0 && styles.unreadAvatarRing]}>
                                <Image
                                    source={{ uri: item.otherUser.avatar || 'https://via.placeholder.com/50' }}
                                    style={styles.avatar}
                                    defaultSource={{ uri: 'https://via.placeholder.com/50' }}
                                />
                    {isOnline && <View style={styles.onlineIndicator} />}
                            </View>
                </View>

                <View style={styles.conversationContent}>
                    <View style={styles.conversationHeader}>
                                <Text style={[styles.userName, unreadCount > 0 && styles.unreadUserName]}>
                                    {item.otherUser.fullName}
                        </Text>
                                <Text style={styles.timestamp}>{lastMessageTime}</Text>
                    </View>

                    <View style={styles.messagePreview}>
                        <Text 
                                    style={[styles.lastMessage, unreadCount > 0 && styles.unreadMessage]}
                            numberOfLines={1}
                        >
                                    {item.lastMessage?.senderId === currentUser?.id ? 'Bạn: ' : ''}
                                    {item.lastMessage?.content || 'Chưa có tin nhắn'}
                        </Text>
                                
                        {unreadCount > 0 && (
                                    <LinearGradient
                                        colors={['#E91E63', '#C2185B']}
                                        style={styles.unreadBadge}
                                    >
                                        <Text style={styles.unreadBadgeText}>
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </Text>
                                    </LinearGradient>
                        )}
                    </View>
                </View>
                    </LinearGradient>
            </TouchableOpacity>
            </Animated.View>
        );
    };

    // 🎨 Render friend item
    const renderFriendItem = ({ item, index }) => {
        const friendData = item.sender?.id === currentUser?.id ? item.receiver : item.sender;
        const isOnline = onlineUsers.has(friendData?.id);

        return (
            <Animated.View
                style={[
                    {
                        opacity: fadeAnim,
                        transform: [
                            { 
                                translateY: slideAnim.interpolate({
                                    inputRange: [0, 30],
                                    outputRange: [0, 30 + (index * 10)]
                                })
                            },
                            { scale: scaleAnim }
                        ]
                    }
                ]}
            >
                <TouchableOpacity
                    style={styles.friendItem}
                    onPress={() => handleSelectUser(item)}
                    activeOpacity={0.7}
                >
                    <LinearGradient
                        colors={['#fff', 'rgba(248, 249, 250, 0.8)']}
                        style={styles.friendItemGradient}
                    >
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatarRing}>
                                <Image
                                    source={{ uri: friendData?.profilePictureUrl || friendData?.avatarUrl || 'https://via.placeholder.com/50' }}
                                    style={styles.avatar}
                                    defaultSource={{ uri: 'https://via.placeholder.com/50' }}
                                />
                                {isOnline && <View style={styles.onlineIndicator} />}
                            </View>
                        </View>

                        <View style={styles.friendContent}>
                            <Text style={styles.friendName}>
                                {friendData?.fullName || friendData?.username || 'Người dùng'}
                            </Text>
                            <Text style={[styles.friendStatus, isOnline && styles.onlineFriendStatus]}>
                                {isOnline ? '🟢 Đang hoạt động' : '⭕ Offline'}
                            </Text>
                        </View>

                        <TouchableOpacity style={styles.messageButton}>
                            <LinearGradient
                                colors={['#E91E63', '#C2185B']}
                                style={styles.messageButtonGradient}
                            >
                                <Ionicons name="chatbubble-outline" size={18} color="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    // 🎨 Empty state component
    const EmptyState = () => (
        <Animated.View 
            style={[
                styles.emptyContainer,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
                }
            ]}
        >
            <LinearGradient
                colors={['rgba(233, 30, 99, 0.1)', 'rgba(233, 30, 99, 0.05)', 'transparent']}
                style={styles.emptyGradient}
            >
                <View style={styles.emptyIconContainer}>
                    <Ionicons 
                        name={activeTab === 'conversations' ? "chatbubbles-outline" : "people-outline"} 
                        size={64} 
                        color="#E91E63" 
                    />
                </View>
                <Text style={styles.emptyTitle}>
                    {activeTab === 'conversations' ? 'Chưa có cuộc trò chuyện' : 'Chưa có bạn bè'}
                </Text>
            <Text style={styles.emptySubtitle}>
                    {activeTab === 'conversations' 
                        ? 'Khi bạn gửi hoặc nhận tin nhắn, cuộc trò chuyện sẽ hiển thị ở đây.' 
                        : 'Hãy kết bạn để bắt đầu trò chuyện'
                    }
            </Text>
                
                {/* Enhanced Action Buttons */}
                {activeTab === 'conversations' ? (
                    <View style={styles.emptyActions}>
                        <TouchableOpacity 
                            style={styles.switchTabButton}
                            onPress={() => animateTabSwitch('friends')}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['rgba(233, 30, 99, 0.1)', 'rgba(233, 30, 99, 0.05)']}
                                style={styles.actionButtonGradient}
                            >
                                <Ionicons name="people" size={20} color="#E91E63" />
                                <Text style={styles.switchTabButtonText}>Xem danh sách bạn bè</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.refreshButton}
                            onPress={() => handleRefresh()}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#E91E63', '#C2185B']}
                                style={styles.actionButtonGradient}
                            >
                                <Ionicons name="refresh" size={20} color="#fff" />
                                <Text style={styles.refreshButtonText}>Làm mới</Text>
                            </LinearGradient>
                        </TouchableOpacity>
        </View>
                ) : (
                    <View style={styles.emptyActions}>
                        <TouchableOpacity 
                            style={styles.addFriendButton}
                            onPress={() => navigation.navigate('FriendSearchScreen')}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#E91E63', '#C2185B', '#AD1457']}
                                style={styles.actionButtonGradient}
                            >
                                <Ionicons name="person-add" size={20} color="#fff" />
                                <Text style={styles.addFriendButtonText}>Tìm bạn bè</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.refreshButton}
                            onPress={() => handleRefresh()}
                            activeOpacity={0.8}
                        >
                <LinearGradient
                                colors={['rgba(233, 30, 99, 0.1)', 'rgba(233, 30, 99, 0.05)']}
                                style={styles.actionButtonGradient}
                >
                                <Ionicons name="refresh" size={20} color="#E91E63" />
                                <Text style={styles.refreshButtonText}>Làm mới</Text>
                </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}
            </LinearGradient>
        </Animated.View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            
            {/* Connection Monitor */}
            <ConnectionMonitor onReconnect={handleReconnect} />
            
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Tin nhắn</Text>
                <View style={styles.headerRight}>
                    <TouchableOpacity 
                        style={styles.headerButton}
                        onPress={() => {
                            // Navigate to search screen or toggle search
                            setSearchMode(!searchMode);
                        }}
                    >
                        <Ionicons name="search" size={24} color="#0084ff" />
                    </TouchableOpacity>
                </View>
            </View>
            
            {/* Search Bar */}
            {searchMode && (
                <View style={styles.searchContainer}>
                    <View style={styles.searchInputContainer}>
                        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Tìm kiếm..."
                            value={searchText}
                            onChangeText={setSearchText}
                            autoFocus
                        />
                        {searchText.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchText('')}>
                                <Ionicons name="close-circle" size={20} color="#666" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}
            
            {/* Tab Buttons */}
            {renderTabButtons()}
            
            {/* Content */}
            {loading && filteredData.length === 0 ? (
                <LoadingSpinner />
            ) : (
                <Animated.View 
                    style={[
                        styles.contentContainer,
                        { 
                            opacity: fadeAnim,
                            transform: [
                                { translateY: slideAnim },
                                { scale: scaleAnim }
                            ]
                        }
                    ]}
                >
                    <FlatList
                        data={filteredData}
                        renderItem={activeTab === 'conversations' ? renderConversationItem : renderFriendItem}
                        keyExtractor={(item) => String(item.id)}
                        contentContainerStyle={filteredData.length === 0 ? styles.emptyList : styles.list}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={<EmptyState />}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                                colors={['#0084ff']}
                                tintColor="#0084ff"
                            />
                        }
                    />
                </Animated.View>
            )}
            
            {/* Error Message */}
            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity 
                        style={styles.errorButton}
                        onPress={handleRefresh}
                    >
                        <Text style={styles.errorButtonText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f2f5',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f2f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f2f5',
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f2f5',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f2f5',
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#0084ff',
    },
    tabText: {
        fontSize: 16,
        color: '#666',
    },
    activeTabText: {
        color: '#0084ff',
        fontWeight: '600',
    },
    contentContainer: {
        flex: 1,
    },
    list: {
        paddingTop: 8,
    },
    emptyList: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 50,
    },
    conversationItem: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f2f5',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#f0f2f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#666',
    },
    avatarImage: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    conversationContent: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        flex: 1,
    },
    time: {
        fontSize: 12,
        color: '#666',
    },
    messagePreview: {
        fontSize: 14,
        color: '#666',
        marginRight: 24,
    },
    unreadMessage: {
        fontWeight: '600',
        color: '#000',
    },
    unreadBadge: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        backgroundColor: '#0084ff',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unreadCount: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: '#fff',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyIcon: {
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    emptyActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 15,
    },
    switchTabButton: {
        borderRadius: 25,
        overflow: 'hidden',
        elevation: 2,
    },
    refreshButton: {
        borderRadius: 25,
        overflow: 'hidden',
        elevation: 2,
    },
    addFriendButton: {
        borderRadius: 25,
        overflow: 'hidden',
        elevation: 3,
    },
    actionButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    switchTabButtonText: {
        color: '#E91E63',
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 8,
    },
    refreshButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 8,
    },
    addFriendButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 8,
    },
    errorContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(244, 67, 54, 0.9)',
        borderRadius: 8,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    errorText: {
        color: '#fff',
        flex: 1,
        marginRight: 16,
    },
    errorButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
    },
    errorButtonText: {
        color: '#F44336',
        fontWeight: '600',
    },
});

export default NewMessagesScreen; 