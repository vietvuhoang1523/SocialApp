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

// Components
import LoadingSpinner from '../../components/LoadingSpinner';
import UserSearchItem from '../../components/UserSearchItem';

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

            // 🆘 TEMPORARY: Add mock data when backend is not running
            try {
                const response = await messagesService.getConversations();
                console.log('🔍 Raw conversations response:', response);
                
                // Handle different response formats from backend
                let conversationsData = [];
                
                if (response && response.conversations && Array.isArray(response.conversations)) {
                    // Backend returns: { conversations: [...], count: X, status: "success" }
                    conversationsData = response.conversations;
                    console.log(`📊 Found ${response.count || conversationsData.length} conversations in response`);
                } else if (Array.isArray(response)) {
                    // Backend returns: [conversation1, conversation2, ...]
                    conversationsData = response;
                    console.log(`📊 Found ${conversationsData.length} conversations as array`);
                } else if (response && response.data && Array.isArray(response.data)) {
                    // Another possible format
                    conversationsData = response.data;
                    console.log(`📊 Found ${conversationsData.length} conversations in data field`);
            } else {
                    console.log('⚠️ Unexpected response format:', typeof response, response);
                    conversationsData = [];
                }
                
                // Transform backend format to UI format
                const normalizedConversations = conversationsData.map((conv, index) => {
                    // Backend format: { id, partner: { id, fullName, avatarUrl, email }, lastMessage: {...}, unreadCount, lastActivity }
                    if (conv.partner) {
                        return {
                            id: conv.id || `conv_${index}`,
                            otherUser: {
                                id: conv.partner.id,
                                fullName: conv.partner.fullName || conv.partner.email || 'Người dùng',
                                username: conv.partner.email,
                                avatar: conv.partner.avatarUrl
                            },
                            lastMessage: conv.lastMessage ? {
                                id: conv.lastMessage.id,
                                content: conv.lastMessage.content,
                                senderId: conv.lastMessage.senderId,
                                receiverId: conv.lastMessage.receiverId,
                                timestamp: conv.lastMessage.timestamp,
                                read: conv.lastMessage.read
                            } : null,
                            unreadCount: conv.unreadCount || 0,
                            updatedAt: conv.lastActivity || conv.lastMessage?.timestamp || new Date().toISOString()
                        };
                    }
                    
                    // Fallback for other formats
                    return {
                        id: conv.id || `conv_${index}`,
                        otherUser: conv.otherUser || conv.user || {
                            id: conv.userId || index,
                            fullName: conv.fullName || conv.name || 'Người dùng',
                            username: conv.username || conv.email,
                            avatar: conv.avatar || conv.avatarUrl
                        },
                        lastMessage: conv.lastMessage,
                        unreadCount: conv.unreadCount || 0,
                        updatedAt: conv.updatedAt || conv.lastActivity || new Date().toISOString()
                    };
                });
                
                // ✅ Sắp xếp theo thời gian cập nhật mới nhất
                const sortedConversations = normalizedConversations.sort((a, b) => {
                    const timeA = new Date(a.updatedAt || 0).getTime();
                    const timeB = new Date(b.updatedAt || 0).getTime();
                    return timeB - timeA; // Mới nhất trước
                });
                
                setConversations(sortedConversations);
                console.log(`✅ Successfully loaded ${sortedConversations.length} conversations`);
                
                // ✅ Nếu có cuộc trò chuyện, chuyển sang tab conversations
                if (sortedConversations.length > 0 && activeTab !== 'conversations') {
                    console.log('📱 Auto-switching to conversations tab');
                    setActiveTab('conversations');
                }
                
            } catch (apiError) {
                console.warn('⚠️ Backend not available, showing mock conversations for testing:', apiError.message);
                
                // 🆘 MOCK DATA: Create sample conversations when backend is down
                const mockConversations = [
                    {
                        id: 'conv_mock_1',
                otherUser: {
                    id: 2,
                    fullName: 'Nguyễn Văn A',
                            username: 'nguyenvana@email.com',
                            avatar: 'https://i.pravatar.cc/150?img=1'
                },
                lastMessage: {
                    id: 'msg_1',
                    content: 'Chào bạn! Bạn có khỏe không?',
                    senderId: 2,
                            receiverId: currentUser.id,
                            timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
                            read: false
                        },
                        unreadCount: 2,
                        updatedAt: new Date(Date.now() - 3600000).toISOString()
                    },
                    {
                        id: 'conv_mock_2',
                otherUser: {
                    id: 3,
                    fullName: 'Trần Thị B',
                            username: 'tranthib@email.com',
                            avatar: 'https://i.pravatar.cc/150?img=2'
                },
                lastMessage: {
                    id: 'msg_2',
                            content: 'Hẹn gặp lại nhé!',
                            senderId: currentUser.id,
                    receiverId: 3,
                            timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
                            read: true
                },
                        unreadCount: 0,
                        updatedAt: new Date(Date.now() - 7200000).toISOString()
            },
            {
                        id: 'conv_mock_3',
                otherUser: {
                    id: 4,
                    fullName: 'Lê Văn C',
                            username: 'levanc@email.com',
                            avatar: 'https://i.pravatar.cc/150?img=3'
                },
                lastMessage: {
                    id: 'msg_3',
                    content: 'Cảm ơn bạn nhiều!',
                    senderId: 4,
                            receiverId: currentUser.id,
                            timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                            read: true
                        },
                        unreadCount: 0,
                        updatedAt: new Date(Date.now() - 86400000).toISOString()
                    }
                ];
                
                setConversations(mockConversations);
                console.log('🆘 Showing mock conversations for testing');
                
                // Auto-switch to conversations tab
                if (activeTab !== 'conversations') {
                    setActiveTab('conversations');
                }
            }
            
        } catch (error) {
            console.error('❌ Error loading conversations:', error);
            setError(error.message || 'Không thể tải cuộc trò chuyện');
            
            // ✅ Fallback: vẫn hiển thị empty state thay vì crash
            setConversations([]);
        }
    }, [currentUser?.id, conversations.length, activeTab]);

    // 👥 Load friends list - Cải thiện logic
    const loadFriends = useCallback(async (isRefresh = false) => {
        if (!currentUser?.id) {
            console.log('⚠️ No current user ID for friends');
            return;
        }

        try {
            console.log('👥 Loading friends for user:', currentUser.id);
            
            // ✅ Hiển thị loading chỉ khi cần thiết
            if (!isRefresh && friends.length === 0) {
                setLoading(true);
            }

            // 🔄 Gọi API lấy danh sách bạn bè
            const response = await FriendService.getFriends();
            console.log('🔍 Raw friends response:', JSON.stringify(response, null, 2));
            
            let friendsData = [];
            
            // ✅ Xử lý các format response khác nhau từ backend
            if (response && Array.isArray(response.data)) {
                // Format: { data: [...], message: "success", status: 200 }
                friendsData = response.data;
                console.log(`✅ Loaded ${friendsData.length} friends from data field`);
            } else if (Array.isArray(response)) {
                // Format: [friend1, friend2, ...]
                friendsData = response;
                console.log(`✅ Loaded ${friendsData.length} friends as direct array`);
            } else if (response && Array.isArray(response.friends)) {
                // Format: { friends: [...], count: X }
                friendsData = response.friends;
                console.log(`✅ Loaded ${friendsData.length} friends from friends field`);
            } else if (response && Array.isArray(response.connections)) {
                // Format: { connections: [...] }
                friendsData = response.connections;
                console.log(`✅ Loaded ${friendsData.length} friends from connections field`);
            } else {
                console.log('⚠️ Unexpected friends response format:', typeof response);
                console.log('Response structure:', Object.keys(response || {}));
                
                // 🔍 Log response để debug
                if (response) {
                    console.log('Response sample:', JSON.stringify(response).substring(0, 500));
                }
                
                friendsData = [];
            }
            
            // ✅ Normalize và filter chỉ những friendship đã được chấp nhận
            console.log('🔍 Raw friendsData before processing:', JSON.stringify(friendsData, null, 2));
            
            const normalizedFriends = friendsData
                .map((friendship, index) => {
                    console.log(`Processing friendship ${index}:`, JSON.stringify(friendship, null, 2));
                    console.log(`Friendship status: "${friendship.status}"`);
                    
                    // Backend format có thể là:
                    // { id, sender: {...}, receiver: {...}, status: "ACCEPTED", createdAt }
                    return {
                        id: friendship.id || `friend_${index}`,
                        sender: friendship.sender || friendship.user1,
                        receiver: friendship.receiver || friendship.user2,
                        status: friendship.status,
                        createdAt: friendship.createdAt || friendship.timestamp || new Date().toISOString(),
                        // Add raw data for debugging
                        _raw: friendship
                    };
                })
                .filter(friendship => {
                    // ✅ Relaxed filtering - show more types of accepted friendships
                    const validStatuses = [
                        'ACCEPTED', 'accepted', 'ACTIVE', 'active', 
                        'CONFIRMED', 'confirmed', 'ESTABLISHED', 'established'
                    ];
                    
                    const hasValidStatus = validStatuses.includes(friendship.status);
                    console.log(`Friendship ${friendship.id} status "${friendship.status}" - Valid: ${hasValidStatus}`);
                    
                    // ✅ TEMPORARY: Show all friends for debugging
                    if (!hasValidStatus) {
                        console.log(`⚠️ Showing friendship with status "${friendship.status}" for debugging`);
                        return true; // Temporarily show all
                    }
                    
                    return hasValidStatus;
                });
            
            console.log(`🎯 Processed ${normalizedFriends.length} friendships (including debug ones)`);
            
            // ✅ Debug each normalized friend
            normalizedFriends.forEach((friend, index) => {
                console.log(`Friend ${index}:`, {
                    id: friend.id,
                    status: friend.status,
                    senderName: friend.sender?.fullName || friend.sender?.name,
                    receiverName: friend.receiver?.fullName || friend.receiver?.name
                });
            });
            
            // ✅ Sort theo thời gian tạo mới nhất
            const sortedFriends = normalizedFriends.sort((a, b) => {
                const timeA = new Date(a.createdAt || 0).getTime();
                const timeB = new Date(b.createdAt || 0).getTime();
                return timeB - timeA; // Mới nhất trước
            });
            
            setFriends(sortedFriends);
            console.log(`✅ Successfully loaded ${sortedFriends.length} friends`);
            
            // ✅ Log sample friend để debug
            if (sortedFriends.length > 0) {
                console.log('Sample friend data:', JSON.stringify(sortedFriends[0], null, 2));
            }
            
        } catch (error) {
            console.error('❌ Error loading friends:', error);
            console.error('❌ Error details:', error.response?.data || error.message);
            
            // ✅ Hiển thị error message cụ thể
            if (error.response?.status === 401) {
                setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            } else if (error.response?.status === 404) {
                setError('Không tìm thấy danh sách bạn bè.');
            } else if (error.response?.status >= 500) {
                setError('Lỗi server. Vui lòng thử lại sau.');
            } else if (error.message.includes('Network Error')) {
                setError('Lỗi kết nối mạng. Kiểm tra internet và thử lại.');
            } else {
                setError(error.message || 'Không thể tải danh sách bạn bè');
            }
            
            // 🆘 MOCK DATA cho testing khi API lỗi
            console.log('🆘 Backend error, using mock friends for testing');
            const mockFriends = [
                {
                    id: 'friend_mock_1',
                    sender: {
                        id: currentUser.id,
                        fullName: currentUser.fullName,
                        email: currentUser.email
                    },
                    receiver: {
                        id: 'mock_friend_1',
                        fullName: 'Nguyễn Văn Mock Friend',
                        email: 'mockfriend1@email.com',
                        profilePictureUrl: 'https://i.pravatar.cc/150?img=10',
                        avatarUrl: 'https://i.pravatar.cc/150?img=10'
                    },
                    status: 'ACCEPTED',
                    createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
                },
                {
                    id: 'friend_mock_2',
                    sender: {
                        id: 'mock_friend_2',
                        fullName: 'Trần Thị Mock Friend',
                        email: 'mockfriend2@email.com',
                        profilePictureUrl: 'https://i.pravatar.cc/150?img=11',
                        avatarUrl: 'https://i.pravatar.cc/150?img=11'
                    },
                    receiver: {
                        id: currentUser.id,
                        fullName: currentUser.fullName,
                        email: currentUser.email
                    },
                    status: 'ACCEPTED',
                    createdAt: new Date(Date.now() - 172800000).toISOString() // 2 days ago
                },
                {
                    id: 'friend_mock_3',
                    sender: {
                        id: currentUser.id,
                        fullName: currentUser.fullName,
                        email: currentUser.email
                    },
                    receiver: {
                        id: 'mock_friend_3',
                        fullName: 'Lê Hoàng Mock Friend',
                        email: 'mockfriend3@email.com',
                        profilePictureUrl: 'https://i.pravatar.cc/150?img=12',
                        avatarUrl: 'https://i.pravatar.cc/150?img=12'
                    },
                    status: 'ACCEPTED',
                    createdAt: new Date(Date.now() - 259200000).toISOString() // 3 days ago
                }
            ];
            
            setFriends(mockFriends);
            console.log('🆘 Using mock friends data for testing');
        }
    }, [currentUser?.id, friends.length]);

    // 🔄 Load data based on active tab - Ưu tiên conversations
    const loadData = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else if ((activeTab === 'conversations' && conversations.length === 0) || 
                   (activeTab === 'friends' && friends.length === 0)) {
            setLoading(true);
        }

        try {
            console.log('🔄 LoadData called for tab:', activeTab, 'isRefresh:', isRefresh);
            
            if (activeTab === 'conversations') {
                console.log('📥 Loading conversations data...');
                await loadConversations(isRefresh);
            } else if (activeTab === 'friends') {
                console.log('👥 Loading friends data...');
                await loadFriends(isRefresh);
            }
            
        } catch (error) {
            console.error('❌ Error loading data:', error);
            setError(error.message || 'Không thể tải dữ liệu');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeTab, loadConversations, loadFriends]);

    // Initial setup - Tối ưu hóa việc khởi tạo
    useEffect(() => {
        let isMounted = true;

        const initialize = async () => {
            if (!currentUser?.id) {
                console.log('⚠️ No current user ID for messages screen');
                setLoading(false);
                return;
            }

            console.log('🚀 Initializing NewMessagesScreen for user:', currentUser.id);
            console.log('🔌 WebSocket status:', webSocketService.isConnected() ? 'Connected' : 'Disconnected');

            try {
                // ✅ Luôn tải conversations trước (chức năng chính)
                setLoading(true);
                console.log('📥 Loading initial conversations...');
                await loadConversations();
                
            } catch (error) {
                console.error('❌ Initialization error:', error);
                setError(error.message || 'Không thể khởi tạo màn hình');
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        initialize();

        return () => {
            isMounted = false;
        };
    }, [currentUser?.id, loadConversations]); // Chỉ phụ thuộc vào user ID

    // ✅ Load friends immediately when switching to friends tab
    useEffect(() => {
        if (activeTab === 'friends') {
            console.log('🔄 Switched to friends tab, loading friends...');
            loadFriends();
        }
    }, [activeTab, loadFriends]);

    // 📨 Update conversation with new message
    const updateConversationWithNewMessage = (message) => {
        setConversations(prev => {
            const conversationIndex = prev.findIndex(conv => 
                (conv.otherUser.id === message.senderId && message.receiverId === currentUser?.id) ||
                (conv.otherUser.id === message.receiverId && message.senderId === currentUser?.id)
            );

            if (conversationIndex !== -1) {
                const updatedConversations = [...prev];
                updatedConversations[conversationIndex] = {
                    ...updatedConversations[conversationIndex],
                    lastMessage: message,
                    updatedAt: message.timestamp,
                    unreadCount: message.senderId !== currentUser?.id ? 
                        (updatedConversations[conversationIndex].unreadCount || 0) + 1 : 0
                };

                // Move to top
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

    // 🎯 Handle item selection
    const handleSelectUser = useCallback((user) => {
        console.log('🎯 User selected:', user);
        
        if (activeTab === 'conversations') {
            // Navigate to chat with conversation data
            navigation.navigate('NewChatScreen', {
                user: user.otherUser,
                currentUser: currentUser,
                conversationId: user.id
            });
        } else {
            // Navigate to chat with friend data
            const friendData = user.sender?.id === currentUser?.id ? user.receiver : user.sender;
            navigation.navigate('NewChatScreen', {
                user: friendData,
                currentUser: currentUser,
                conversationId: null // New conversation
            });
        }
    }, [navigation, currentUser, activeTab]);

    // 🔄 Refresh handler
    const onRefresh = useCallback(() => {
        loadData(true);
    }, [loadData]);

    // 🎨 Enhanced Tab Animation
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

    // 🎨 Render Enhanced Tab Buttons
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

    // 🎨 Enhanced Conversation Item with Animation
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

    // 🎨 Enhanced Friend Item with Animation
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

    // 🎨 Enhanced Empty State
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
                            onPress={() => loadData(true)}
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
                            onPress={() => loadData(true)}
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
            <StatusBar barStyle="light-content" backgroundColor="#E91E63" />
            
            {/* Enhanced Header */}
            <LinearGradient colors={['#E91E63', '#C2185B', '#AD1457']} style={styles.header}>
                <Animated.View 
                    style={[
                        styles.headerContent,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <View style={styles.backButtonContainer}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    
                    <Text style={styles.headerTitle}>
                        {activeTab === 'conversations' ? '💬 Tin nhắn' : '👥 Bạn bè'}
                    </Text>
                    
                    <TouchableOpacity 
                        style={styles.headerButton}
                        onPress={() => navigation.navigate('FriendSearchScreen')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.headerButtonContainer}>
                            <Ionicons 
                                name={activeTab === 'conversations' ? "create-outline" : "person-add-outline"} 
                                size={24} 
                                color="#fff" 
                            />
                        </View>
                    </TouchableOpacity>
                </Animated.View>

                {/* Enhanced Search Bar */}
                <Animated.View 
                    style={[
                        styles.searchContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <View style={styles.searchInputContainer}>
                        <Ionicons name="search" size={20} color="#E91E63" />
                    <TextInput
                        style={styles.searchInput}
                            placeholder={`Tìm kiếm ${activeTab === 'conversations' ? 'cuộc trò chuyện' : 'bạn bè'}...`}
                        value={searchText}
                            onChangeText={setSearchText}
                            placeholderTextColor="#999"
                    />
                    {searchText.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchText('')} activeOpacity={0.7}>
                                <Ionicons name="close-circle" size={20} color="#E91E63" />
                        </TouchableOpacity>
                    )}
                </View>
                </Animated.View>

                {/* Enhanced Tab Buttons */}
                {renderTabButtons()}
            </LinearGradient>

            {/* Content */}
            <Animated.View 
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }]
                    }
                ]}
            >
                {/* Backend Status Banner */}
                {conversations.length > 0 && conversations[0]?.id?.includes('mock') && (
                    <Animated.View 
                        style={[
                            styles.mockDataBanner,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }]
                            }
                        ]}
                    >
                        <LinearGradient
                            colors={['#fff3cd', '#ffeaa7']}
                            style={styles.mockDataGradient}
                        >
                            <Ionicons name="warning-outline" size={16} color="#ff9800" />
                            <Text style={styles.mockDataText}>
                                Backend không khả dụng - Hiển thị dữ liệu mẫu tin nhắn
                    </Text>
                        <TouchableOpacity
                                style={styles.retryBackendButton}
                                onPress={() => loadData(true)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="refresh" size={14} color="#ff9800" />
                            </TouchableOpacity>
                        </LinearGradient>
                    </Animated.View>
                )}

                {/* Friends Debug Banner */}
                {friends.length > 0 && friends[0]?.id?.includes('mock') && (
                    <Animated.View 
                        style={[
                            styles.mockDataBanner,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }]
                            }
                        ]}
                    >
                        <LinearGradient
                            colors={['#e3f2fd', '#bbdefb']}
                            style={styles.mockDataGradient}
                        >
                            <Ionicons name="information-circle-outline" size={16} color="#1976d2" />
                            <Text style={[styles.mockDataText, { color: '#1565c0' }]}>
                                Backend không khả dụng - Hiển thị dữ liệu mẫu bạn bè
                            </Text>
                            <TouchableOpacity 
                                style={[styles.retryBackendButton, { backgroundColor: 'rgba(25, 118, 210, 0.15)' }]}
                                onPress={() => loadData(true)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="refresh" size={14} color="#1976d2" />
                            </TouchableOpacity>
                        </LinearGradient>
                    </Animated.View>
                )}

                {/* Debug Info Banner for Friends */}
                {activeTab === 'friends' && currentUser && (
                    <Animated.View 
                        style={[
                            styles.debugBanner,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }]
                            }
                        ]}
                    >
                        <LinearGradient
                            colors={['#f3e5f5', '#e1bee7']}
                            style={styles.mockDataGradient}
                        >
                            <Ionicons name="bug-outline" size={16} color="#7b1fa2" />
                            <Text style={[styles.mockDataText, { color: '#6a1b9a' }]}>
                                Debug: User ID {currentUser.id} | Friends: {friends.length}
                            </Text>
                            <TouchableOpacity 
                                style={[styles.retryBackendButton, { backgroundColor: 'rgba(123, 31, 162, 0.15)' }]}
                                onPress={() => {
                                    console.log('🔍 Manual friends refresh triggered');
                                    console.log('Current user:', currentUser);
                                    loadFriends(true);
                                }}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="bug" size={14} color="#7b1fa2" />
                        </TouchableOpacity>
                        </LinearGradient>
                    </Animated.View>
                )}

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#E91E63" />
                        <Text style={styles.loadingText}>
                            {activeTab === 'conversations' ? 'Đang tải tin nhắn...' : 'Đang tải danh sách bạn bè...'}
                                        </Text>
                                    </View>
                ) : error ? (
                    // 🚨 Error State
                    <Animated.View 
                        style={[
                            styles.errorContainer,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
                            }
                        ]}
                    >
                        <LinearGradient
                            colors={['rgba(244, 67, 54, 0.1)', 'rgba(244, 67, 54, 0.05)', 'transparent']}
                            style={styles.errorGradient}
                        >
                            <View style={styles.errorIconContainer}>
                                <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
                            </View>
                            <Text style={styles.errorTitle}>Có lỗi xảy ra!</Text>
                            <Text style={styles.errorMessage}>{error}</Text>
                            
                            <View style={styles.errorActions}>
                                <TouchableOpacity 
                                    style={styles.retryButton}
                                    onPress={() => {
                                        setError(null);
                                        loadData(true);
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={['#E91E63', '#C2185B']}
                                        style={styles.retryButtonGradient}
                                    >
                                        <Ionicons name="refresh" size={20} color="#fff" />
                                        <Text style={styles.retryButtonText}>Thử lại</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                                
                                {activeTab === 'friends' && (
                                    <TouchableOpacity 
                                        style={styles.switchToConversationsButton}
                                        onPress={() => {
                                            setError(null);
                                            animateTabSwitch('conversations');
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={['rgba(233, 30, 99, 0.1)', 'rgba(233, 30, 99, 0.05)']}
                                            style={styles.switchButtonGradient}
                                        >
                                            <Ionicons name="chatbubbles" size={20} color="#E91E63" />
                                            <Text style={styles.switchButtonText}>Xem tin nhắn</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                        )}
                    </View>
                        </LinearGradient>
                    </Animated.View>
                ) : (
                    <FlatList
                        data={filteredData}
                        keyExtractor={(item, index) => 
                            activeTab === 'conversations' ? 
                                (item.id || `conv_${index}`) : 
                                (item.id || `friend_${index}`)
                        }
                        renderItem={activeTab === 'conversations' ? renderConversationItem : renderFriendItem}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={['#E91E63']}
                                tintColor="#E91E63"
                            />
                        }
                        ListEmptyComponent={EmptyState}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={filteredData.length === 0 ? styles.emptyListContainer : styles.listContainer}
                    />
                )}

                {/* Enhanced Connection Status Indicator */}
                {!webSocketService.isConnected() && (
                    <Animated.View 
                        style={[
                            styles.connectionStatus,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }]
                            }
                        ]}
                    >
                        <LinearGradient
                            colors={['rgba(233, 30, 99, 0.9)', 'rgba(194, 24, 91, 0.9)']}
                            style={styles.connectionStatusGradient}
                        >
                            <ActivityIndicator size="small" color="#fff" />
                            <Text style={styles.connectionStatusText}>Đang kết nối lại...</Text>
                        </LinearGradient>
                    </Animated.View>
                )}
            </Animated.View>
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
        elevation: 8,
        shadowColor: '#E91E63',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
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
    backButtonContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 25,
        padding: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    headerButton: {
        padding: 5,
    },
    headerButtonContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 25,
        padding: 8,
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
        elevation: 4,
        shadowColor: '#E91E63',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        marginLeft: 10,
        color: '#333',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 25,
        margin: 10,
        padding: 4,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    tabButton: {
        flex: 1,
        borderRadius: 22,
        overflow: 'hidden',
    },
    tabButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 22,
    },
    activeTabGradient: {
        elevation: 2,
        shadowColor: '#E91E63',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.7)',
        marginLeft: 5,
    },
    activeTabText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    tabBadge: {
        backgroundColor: '#FF6B6B',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        elevation: 2,
    },
    tabBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    listContainer: {
        paddingBottom: 20,
    },
    conversationItem: {
        marginVertical: 3,
        marginHorizontal: 15,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    conversationItemGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    avatarContainer: {
        marginRight: 15,
    },
    avatarRing: {
        position: 'relative',
        padding: 3,
        borderRadius: 30,
        backgroundColor: '#fff',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    unreadAvatarRing: {
        backgroundColor: '#E91E63',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f0f0f0',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        backgroundColor: '#4CAF50',
        borderRadius: 7,
        borderWidth: 2,
        borderColor: '#fff',
        elevation: 2,
    },
    conversationContent: {
        flex: 1,
    },
    conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    userName: {
        fontSize: 17,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    unreadUserName: {
        fontWeight: 'bold',
        color: '#E91E63',
    },
    timestamp: {
        fontSize: 12,
        color: '#999',
        fontWeight: '500',
    },
    messagePreview: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lastMessage: {
        fontSize: 14,
        color: '#666',
        flex: 1,
        lineHeight: 18,
    },
    unreadMessage: {
        fontWeight: '600',
        color: '#333',
    },
    unreadBadge: {
        borderRadius: 15,
        minWidth: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
        elevation: 2,
    },
    unreadBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    friendItem: {
        marginVertical: 3,
        marginHorizontal: 15,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    friendItemGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    friendContent: {
        flex: 1,
        marginLeft: 15,
    },
    friendName: {
        fontSize: 17,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    friendStatus: {
        fontSize: 13,
        color: '#999',
        fontWeight: '500',
    },
    onlineFriendStatus: {
        color: '#4CAF50',
        fontWeight: '600',
    },
    messageButton: {
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 2,
    },
    messageButtonGradient: {
        padding: 10,
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyGradient: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 40,
        borderRadius: 20,
    },
    emptyIconContainer: {
        backgroundColor: 'rgba(233, 30, 99, 0.1)',
        borderRadius: 50,
        padding: 20,
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#E91E63',
        marginBottom: 10,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
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
    emptyListContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#E91E63',
        fontWeight: '600',
    },
    connectionStatus: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        borderRadius: 25,
        overflow: 'hidden',
        elevation: 4,
    },
    connectionStatusGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    connectionStatusText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 10,
    },
    mockDataBanner: {
        marginHorizontal: 15,
        marginBottom: 10,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
    },
    mockDataGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
    },
    mockDataText: {
        flex: 1,
        marginLeft: 8,
        color: '#856404',
        fontSize: 13,
        fontWeight: '600',
    },
    retryBackendButton: {
        padding: 8,
        borderRadius: 15,
        backgroundColor: 'rgba(255, 152, 0, 0.15)',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    errorGradient: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 40,
        borderRadius: 20,
    },
    errorIconContainer: {
        backgroundColor: 'rgba(233, 30, 99, 0.1)',
        borderRadius: 50,
        padding: 20,
        marginBottom: 20,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#E91E63',
        marginBottom: 10,
        textAlign: 'center',
    },
    errorMessage: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    errorActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 15,
    },
    retryButton: {
        borderRadius: 25,
        overflow: 'hidden',
        elevation: 2,
    },
    retryButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 8,
    },
    switchToConversationsButton: {
        borderRadius: 25,
        overflow: 'hidden',
        elevation: 2,
    },
    switchButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
    },
    switchButtonText: {
        color: '#E91E63',
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 8,
    },
    debugBanner: {
        marginHorizontal: 15,
        marginBottom: 10,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
    },
});

export default NewMessagesScreen; 