// FriendsMessagingShortcut.js - Shortcut nhanh để nhắn tin với bạn bè
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Modal,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import FriendService from '../services/FriendService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { determineFriendData } from '../utils/friendUtils';

const FriendsMessagingShortcut = ({ currentUser }) => {
    const navigation = useNavigation();
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    // Initialize service
    const friendService = FriendService;

    // Load friends when modal opens
    const loadFriends = async () => {
        try {
            setLoading(true);
            const data = await friendService.getFriends();
            console.log('📥 Friends data loaded:', data?.length || 0);
            
            if (Array.isArray(data)) {
                setFriends(data);
            } else {
                setFriends([]);
            }
        } catch (error) {
            console.error('❌ Error loading friends:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách bạn bè');
            setFriends([]);
        } finally {
            setLoading(false);
        }
    };

    // Open modal and load friends
    const openFriendsModal = () => {
        setModalVisible(true);
        loadFriends();
    };

    // Start chat with friend
    const startChatWithFriend = (friend) => {
        const friendData = determineFriendData(friend, currentUser?.id);
        if (!friendData) {
            Alert.alert('Lỗi', 'Thông tin bạn bè không hợp lệ');
            return;
        }

        const friendForChat = {
            id: friendData.id,
            username: friendData.fullName || "Người dùng",
            fullName: friendData.fullName || "Người dùng",
            profilePicture: friendData.avatarUrl,
            email: friendData.email
        };

        setModalVisible(false);
        
        // Navigate to new chat screen
        navigation.navigate('NewChatScreen', {
            user: friendForChat,
            currentUser: currentUser
        });
    };

    // Render friend item
    const renderFriendItem = ({ item }) => {
        const friendData = determineFriendData(item, currentUser?.id);
        if (!friendData) return null;

        return (
            <TouchableOpacity
                style={styles.friendItem}
                onPress={() => startChatWithFriend(item)}
            >
                <View style={styles.friendAvatar}>
                    <Text style={styles.friendAvatarText}>
                        {friendData.fullName?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                </View>
                <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>
                        {friendData.fullName || 'Người dùng'}
                    </Text>
                    <Text style={styles.friendEmail}>
                        {friendData.email || ''}
                    </Text>
                </View>
                <Ionicons name="chatbubble-outline" size={20} color="#667eea" />
            </TouchableOpacity>
        );
    };

    return (
        <>
            {/* Shortcut Button */}
            <TouchableOpacity
                style={styles.shortcutButton}
                onPress={openFriendsModal}
            >
                <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.gradientButton}
                >
                    <Ionicons name="people" size={20} color="#fff" />
                    <Text style={styles.shortcutText}>Nhắn tin bạn bè</Text>
                </LinearGradient>
            </TouchableOpacity>

            {/* Friends Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Chọn bạn để nhắn tin</Text>
                        <View style={styles.placeholder} />
                    </View>

                    {/* Friends List */}
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#667eea" />
                            <Text style={styles.loadingText}>Đang tải danh sách bạn bè...</Text>
                        </View>
                    ) : friends.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={60} color="#E0E0E0" />
                            <Text style={styles.emptyTitle}>Chưa có bạn bè nào</Text>
                            <Text style={styles.emptySubtitle}>
                                Hãy kết bạn với người khác để có thể nhắn tin
                            </Text>
                            <TouchableOpacity
                                style={styles.findFriendsButton}
                                onPress={() => {
                                    setModalVisible(false);
                                    navigation.navigate('FriendSearch');
                                }}
                            >
                                <Text style={styles.findFriendsText}>Tìm bạn bè</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <FlatList
                            data={friends}
                            renderItem={renderFriendItem}
                            keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.friendsList}
                        />
                    )}
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    shortcutButton: {
        margin: 15,
        borderRadius: 12,
        overflow: 'hidden',
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
    },
    shortcutText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    closeButton: {
        padding: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    placeholder: {
        width: 34,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginTop: 20,
        marginBottom: 10,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    findFriendsButton: {
        backgroundColor: '#667eea',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
    },
    findFriendsText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    friendsList: {
        paddingVertical: 10,
    },
    friendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 15,
        marginVertical: 2,
        marginHorizontal: 10,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    friendAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    friendAvatarText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    friendInfo: {
        flex: 1,
    },
    friendName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    friendEmail: {
        fontSize: 14,
        color: '#666',
    },
});

export default FriendsMessagingShortcut; 