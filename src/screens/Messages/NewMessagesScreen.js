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

// Utils
import { getAvatarFromUser } from '../../utils/ImageUtils';

const { width: screenWidth } = Dimensions.get('window');

const NewMessagesScreen = ({ navigation, route }) => {
    const currentUser = route.params?.currentUser;
    
    // Debug current user and route params
    console.log('🔍 NewMessagesScreen initialized with:', {
        currentUser,
        routeParams: route.params,
        hasCurrentUser: !!currentUser,
        currentUserId: currentUser?.id
    });

    // ✅ CRITICAL FIX: Add validation and error handling for missing currentUser
    if (!currentUser) {
        console.error('❌ CRITICAL: NewMessagesScreen received undefined currentUser');
        
        // Show error screen
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <View style={styles.errorContainer}>
                    <Text style={styles.errorTitle}>Lỗi tải dữ liệu</Text>
                    <Text style={styles.errorText}>
                        Không thể tải thông tin người dùng. Vui lòng thử lại.
                    </Text>
                    <TouchableOpacity 
                        style={styles.retryButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.retryButtonText}>Quay lại</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

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
    
    // ✅ FIX: Thêm ref để track message processing
    const messageProcessingRef = useRef(new Set());
    const messageTimeoutRef = useRef(null);

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

    // Handle select user
    const handleSelectUser = (item) => {
        console.log('🔄 Selected user/conversation:', item);
        console.log('🔄 Active tab:', activeTab);
        console.log('🔄 Current user:', currentUser);
        
        // ✅ Add validation to prevent crashes
        if (!item) {
            console.warn('⚠️ No item selected');
            return;
        }
        
        if (activeTab === 'conversations') {
            // ✅ FIX: Hỗ trợ cả 'otherUser' và 'partner' format từ backend
            const otherUser = item.otherUser || item.partner;
            
            if (!otherUser) {
                console.warn('⚠️ Invalid conversation - no otherUser or partner');
                return;
            }
            
            // Navigate to chat screen with conversation data
            console.log('🚀 Navigating to NewChatScreen with conversation data:', {
                conversation: item,
                user: otherUser,
                currentUser: currentUser
            });
            navigation.navigate('NewChatScreen', {
                conversation: item,
                user: otherUser,
                currentUser: currentUser
            });
        } else {
            // Navigate to chat screen with friend data
            const friendData = item.sender?.id === currentUser?.id ? item.receiver : item.sender;
            
            if (!friendData) {
                console.warn('⚠️ Invalid friend - no valid user data');
                return;
            }
            
            console.log('🚀 Navigating to NewChatScreen with friend data:', {
                user: friendData,
                currentUser: currentUser
            });
            navigation.navigate('NewChatScreen', {
                user: friendData,
                currentUser: currentUser
            });
        }
    };

    // 🔍 Filtered data based on active tab
    const filteredData = useMemo(() => {
        console.log('🔍 Computing filteredData:', {
            activeTab,
            conversationsLength: conversations.length,
            friendsLength: friends.length,
            searchText: searchText.trim()
        });
        
        if (!searchText.trim()) {
            const rawResult = activeTab === 'conversations' ? conversations : friends;
            // ✅ Filter out invalid items
            const result = rawResult.filter((item, index) => {
                if (activeTab === 'conversations') {
                    // ✅ FIX: Backend trả về 'partner' không phải 'otherUser'
                    const isValid = item && (item.otherUser || item.partner) && item.id;
                    if (!isValid) {
                        console.log(`🔍 Invalid conversation ${index}:`, {
                            hasItem: !!item,
                            hasOtherUser: !!item?.otherUser,
                            hasPartner: !!item?.partner,
                            hasId: !!item?.id,
                            item: item
                        });
                    }
                    return isValid;
                } else {
                    const isValid = item && (item.sender || item.receiver) && item.id;
                    if (!isValid) {
                        console.log(`🔍 Invalid friend ${index}:`, {
                            hasItem: !!item,
                            hasSender: !!item?.sender,
                            hasReceiver: !!item?.receiver,
                            hasId: !!item?.id,
                            item: item
                        });
                    }
                    return isValid;
                }
            });
            console.log('📊 Returning unfiltered data:', result.length, 'valid items out of', rawResult.length);
            return result;
        }
        
        if (activeTab === 'conversations') {
            const filtered = conversations.filter(conv => {
                // ✅ Ensure conversation is valid first
                if (!conv || (!conv.otherUser && !conv.partner) || !conv.id) return false;
                
                // ✅ FIX: Hỗ trợ cả otherUser và partner format
                const partner = conv.otherUser || conv.partner;
                return partner?.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
                       partner?.username?.toLowerCase().includes(searchText.toLowerCase()) ||
                       conv.lastMessage?.content?.toLowerCase().includes(searchText.toLowerCase());
            });
            console.log('📊 Filtered conversations:', filtered.length, 'items');
            return filtered;
        } else {
            const filtered = friends.filter(friend => {
                // ✅ Ensure friend is valid first
                if (!friend || (!friend.sender && !friend.receiver) || !friend.id) return false;
                
                const friendData = friend.sender?.id === currentUser?.id ? friend.receiver : friend.sender;
                if (!friendData) return false;
                
                return friendData?.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
                       friendData?.email?.toLowerCase().includes(searchText.toLowerCase());
            });
            console.log('📊 Filtered friends:', filtered.length, 'items');
            return filtered;
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
                    setConversations(prev => {
                        const updatedList = prev.map(conv => 
                            conv.id === updatedConv.id ? { ...conv, ...updatedConv } : conv
                        );
                        console.log('📊 Updated conversations list:', updatedList.length);
                        return updatedList;
                    });
                });

                // ❌ REMOVED: Duplicate message listener to prevent duplicate messages
                // The useChatWebSocket hook in NewChatScreen handles ALL message processing
                // NewMessagesScreen should NOT listen to individual messages
                console.log('✅ [NewMessagesScreen] NOT registering message listener - handled by useChatWebSocket');

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
            // ❌ REMOVED: No newMessage listener to clean up
            messagesService.off('unreadCount');
            webSocketService.off('userOnline');
            webSocketService.off('userOffline');
            webSocketService.off('connectionStatus');
        };
    }, [currentUser?.id]);

    // 📥 Load conversations - Enhanced with better debugging
    const loadConversations = useCallback(async (isRefresh = false) => {
        if (!currentUser?.id) {
            console.log('⚠️ No current user ID');
            return;
        }

        try {
            console.log('📥 Loading conversations for user:', currentUser.id);
            console.log('🔍 WebSocket connection status:', messagesService.getConnectionStatus());
            
            // ✅ Hiển thị loading nếu chưa có dữ liệu
            if (!isRefresh && conversations.length === 0) {
                setLoading(true);
            }

            // Check WebSocket connection first
            if (!webSocketService.isConnected()) {
                console.log('🔌 WebSocket not connected, attempting to connect...');
                try {
                    await webSocketService.connectWithStoredToken();
                    // Wait a bit for connection to stabilize
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } catch (connectError) {
                    console.error('❌ Failed to connect WebSocket:', connectError);
                    setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet.');
                    return;
                }
            }

            console.log('📤 Requesting conversations from service...');
            // Fetch conversations from service
            const result = await messagesService.getConversations();
            console.log('📥 Raw conversations result:', result);
            console.log(`📥 Received ${result?.length || 0} conversations`);
            
            if (result && Array.isArray(result)) {
                console.log('✅ Setting conversations:', result);
                console.log('🔍 Sample conversation structure:', result[0]);
                
                // ✅ FIX: Merge với conversations hiện tại để tránh mất tin nhắn mới
                setConversations(prev => {
                    if (isRefresh || prev.length === 0) {
                        console.log('📊 Replacing conversations completely');
                        return result;
                    } else {
                        console.log('📊 Merging with existing conversations');
                        // Merge logic: keep newer lastMessage
                        const merged = [...result];
                        prev.forEach(existingConv => {
                            const foundIndex = merged.findIndex(newConv => newConv.id === existingConv.id);
                            if (foundIndex !== -1) {
                                const existingTime = new Date(existingConv.lastMessage?.timestamp || 0).getTime();
                                const newTime = new Date(merged[foundIndex].lastMessage?.timestamp || 0).getTime();
                                if (existingTime > newTime) {
                                    merged[foundIndex] = existingConv;
                                }
                            }
                        });
                        return merged;
                    }
                });
                
                // ✅ Use unread count from conversation data directly
                result.forEach((conv) => {
                    if (conv.id && conv.unreadCount !== undefined) {
                        setUnreadCounts(prev => {
                            const newMap = new Map(prev);
                            newMap.set(conv.id, conv.unreadCount || 0);
                            return newMap;
                        });
                    }
                });
            } else {
                console.log('⚠️ No valid conversations data received');
                setConversations([]);
            }
        } catch (error) {
            console.error('❌ Error loading conversations:', error);
            setError('Không thể tải cuộc trò chuyện. Vui lòng thử lại.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentUser?.id, conversations.length]);

    // 📥 Load friends - Enhanced with better debugging
    const loadFriends = useCallback(async (isRefresh = false) => {
        if (!currentUser?.id) {
            console.log('⚠️ No current user ID for friends');
            return;
        }

        try {
            console.log('👥 Loading friends for user:', currentUser.id);
            
            if (!isRefresh && friends.length === 0) {
                setLoading(true);
            }
            
            console.log('📤 Requesting friends from FriendService...');
            const result = await FriendService.getFriends(currentUser.id);
            console.log('👥 Raw friends result:', result);
            console.log(`📥 Received ${result?.length || 0} friends`);
            
            if (result && Array.isArray(result)) {
                console.log('✅ Setting friends:', result);
                setFriends(result);
            } else {
                console.log('⚠️ No valid friends data received');
                setFriends([]);
            }
        } catch (error) {
            console.error('❌ Error loading friends:', error);
            setError('Không thể tải danh sách bạn bè. Vui lòng thử lại.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentUser?.id, friends.length]);

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
                console.log('🚀 Initializing NewMessagesScreen with activeTab:', activeTab);
                console.log('🔍 Current user valid?', !!currentUser?.id);
                
                // Ensure WebSocket is connected
                if (!webSocketService.isConnected()) {
                    console.log('🔌 WebSocket not connected, connecting...');
                    await webSocketService.connectWithStoredToken();
                }
                
                // Load initial data based on active tab
                console.log('📊 Loading data for tab:', activeTab);
                if (activeTab === 'conversations') {
                    console.log('📨 Loading conversations...');
                    await loadConversations();
                } else {
                    console.log('👥 Loading friends...');
                    await loadFriends();
                }
                console.log('✅ Initialization complete');
            } catch (error) {
                console.error('❌ Error initializing:', error);
                setError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
            }
        };

        if (currentUser?.id) {
            initialize();
        } else {
            console.log('⚠️ No currentUser.id, skipping initialization');
        }
    }, [activeTab, loadConversations, loadFriends, currentUser?.id]);

    // 📩 Update conversation with new message - ENHANCED for immediate updates
    const updateConversationWithNewMessage = useCallback((message) => {
        console.log('📩 [ENHANCED] Processing new message for conversations:', message);
        
        setConversations(prev => {
            console.log('📊 [ENHANCED] Current conversations count:', prev.length);
            
            // ✅ FIX: Enhanced duplicate check - check by message ID first
            const isDuplicateById = prev.some(conv => 
                conv.lastMessage && conv.lastMessage.id === message.id
            );
            
            if (isDuplicateById) {
                console.log('🔍 [ENHANCED] Message ID already exists in conversations, skipping:', message.id);
                return prev;
            }
            
            // ✅ Find conversation by user relationship
            const conversationIndex = prev.findIndex(conv => {
                // ✅ FIX: Hỗ trợ cả otherUser và partner format
                const partner = conv.otherUser || conv.partner;
                if (!partner) return false;
                
                const isMessageBetweenUsers = 
                    (partner.id === message.senderId && message.receiverId === currentUser?.id) ||
                    (partner.id === message.receiverId && message.senderId === currentUser?.id);
                
                console.log('🔍 [ENHANCED] Checking conversation with partner:', partner.id, 'isMatch:', isMessageBetweenUsers);
                return isMessageBetweenUsers;
            });

            if (conversationIndex !== -1) {
                console.log('📊 [ENHANCED] Found existing conversation at index:', conversationIndex);
                
                // ✅ Create new array with updated conversation
                const updatedConversations = [...prev];
                const existingConv = updatedConversations[conversationIndex];
                
                // ✅ Update the conversation with new message
                const updatedConv = {
                    ...existingConv,
                    lastMessage: message,
                    updatedAt: message.timestamp || new Date().toISOString(),
                    lastActivity: message.timestamp || new Date().toISOString(),
                    unreadCount: message.senderId !== currentUser?.id ? 
                        (existingConv.unreadCount || 0) + 1 : (existingConv.unreadCount || 0)
                };

                // ✅ Move conversation to top and update
                updatedConversations.splice(conversationIndex, 1);
                const finalList = [updatedConv, ...updatedConversations];
                
                console.log('✅ [ENHANCED] Conversation updated and moved to top, total:', finalList.length);
                return finalList;
            }

            // ✅ Create new conversation if doesn't exist
            console.log('📊 [ENHANCED] Creating new conversation for message');
            const partnerId = message.senderId === currentUser?.id ? message.receiverId : message.senderId;
            
            const newConversation = {
                id: `conv_${Date.now()}_${partnerId}`,
                // ✅ FIX: Enhanced partner format với better fallback
                partner: {
                    id: partnerId,
                    fullName: `User ${partnerId}`, // Better fallback
                    username: `user${partnerId}`,
                    avatarUrl: null,
                    profilePictureUrl: null
                },
                lastMessage: message,
                unreadCount: message.senderId !== currentUser?.id ? 1 : 0,
                lastActivity: message.timestamp || new Date().toISOString(),
                updatedAt: message.timestamp || new Date().toISOString()
            };

            const finalList = [newConversation, ...prev];
            console.log('✅ [ENHANCED] New conversation created, total:', finalList.length);
            return finalList;
        });
    }, [currentUser?.id]);

    // 🎨 Animate tab switch
    const animateTabSwitch = (newTab) => {
        console.log('🔄 Switching to tab:', newTab);
        
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
        // ✅ FIX: Hỗ trợ cả otherUser và partner format từ backend
        const partner = item.otherUser || item.partner;
        
        if (!item || !partner) {
            console.warn('⚠️ Invalid conversation item:', item);
            return null;
        }

        // Debug avatar data
        console.log('🖼️ Conversation partner avatar data:', {
            partnerName: partner?.fullName,
            partnerId: partner?.id,
            profilePictureUrl: partner?.profilePictureUrl,
            avatarUrl: partner?.avatarUrl,
            avatar: partner?.avatar,
            finalAvatarUrl: getAvatarFromUser(partner)
        });

        const unreadCount = unreadCounts.get(item.id) || item.unreadCount || 0;
        const isOnline = onlineUsers.has(partner?.id);
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
                                {getAvatarFromUser(partner) ? (
                                    <Image
                                        source={{ uri: getAvatarFromUser(partner) }}
                                        style={styles.avatar}
                                        onError={(e) => {
                                            console.log('❌ Failed to load avatar for partner:', partner?.fullName, e.nativeEvent.error);
                                        }}
                                    />
                                ) : (
                                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                        <Text style={styles.avatarText}>
                                            {(partner?.fullName || partner?.username || 'U').charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                )}
                    {isOnline && <View style={styles.onlineIndicator} />}
                            </View>
                </View>

                <View style={styles.conversationContent}>
                    <View style={styles.conversationHeader}>
                                <Text style={[styles.userName, unreadCount > 0 && styles.unreadUserName]}>
                                    {partner.fullName}
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
        // ✅ Add null checks to prevent crashes
        if (!item || (!item.sender && !item.receiver)) {
            console.warn('⚠️ Invalid friend item:', item);
            return null;
        }

        const friendData = item.sender?.id === currentUser?.id ? item.receiver : item.sender;
        
        // ✅ Additional check for friendData
        if (!friendData) {
            console.warn('⚠️ No valid friend data found in item:', item);
            return null;
        }

        // Debug avatar data
        console.log('🖼️ Friend avatar data:', {
            friendName: friendData?.fullName,
            friendId: friendData?.id,
            profilePictureUrl: friendData?.profilePictureUrl,
            avatarUrl: friendData?.avatarUrl,
            avatar: friendData?.avatar,
            finalAvatarUrl: getAvatarFromUser(friendData)
        });

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
                                {getAvatarFromUser(friendData) ? (
                                    <Image
                                        source={{ uri: getAvatarFromUser(friendData) }}
                                        style={styles.avatar}
                                        onError={(e) => {
                                            console.log('❌ Failed to load avatar for friend:', friendData?.fullName, e.nativeEvent.error);
                                        }}
                                    />
                                ) : (
                                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                        <Text style={styles.avatarText}>
                                            {(friendData?.fullName || friendData?.username || 'U').charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                )}
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
                        keyExtractor={(item, index) => item?.id ? String(item.id) : `item-${index}`}
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
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 25,
        margin: 8,
        overflow: 'hidden',
    },
    tabButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 25,
    },
    activeTab: {
        elevation: 3,
        shadowColor: '#E91E63',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    activeTabGradient: {
        borderRadius: 25,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
        color: 'rgba(255,255,255,0.7)',
    },
    activeTabText: {
        color: '#fff',
        fontWeight: '700',
    },
    tabBadge: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 8,
        minWidth: 20,
        alignItems: 'center',
    },
    tabBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
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
        marginHorizontal: 16,
        marginVertical: 4,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    conversationItemGradient: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
    },
    friendItem: {
        marginHorizontal: 16,
        marginVertical: 4,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    friendItemGradient: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatarRing: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    unreadAvatarRing: {
        borderColor: '#E91E63',
        borderWidth: 3,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    avatarPlaceholder: {
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
        marginLeft: 16,
    },
    conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        flex: 1,
    },
    unreadUserName: {
        fontWeight: '700',
        color: '#000',
    },
    timestamp: {
        fontSize: 12,
        color: '#666',
        fontWeight: '400',
    },
    messagePreview: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    lastMessage: {
        fontSize: 14,
        color: '#666',
        flex: 1,
        marginRight: 8,
    },
    unreadMessage: {
        fontWeight: '600',
        color: '#1a1a1a',
    },
    unreadBadge: {
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unreadBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    friendContent: {
        flex: 1,
        marginLeft: 16,
    },
    friendName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    friendStatus: {
        fontSize: 13,
        color: '#666',
    },
    onlineFriendStatus: {
        color: '#4CAF50',
        fontWeight: '500',
    },
    messageButton: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    messageButtonGradient: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
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
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 60,
    },
    emptyGradient: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 40,
        borderRadius: 20,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(233, 30, 99, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
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
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        backgroundColor: '#fff',
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#0084ff',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    errorBanner: {
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
    errorBannerText: {
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