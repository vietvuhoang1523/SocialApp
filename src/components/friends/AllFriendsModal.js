import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Modal, TouchableOpacity, TextInput, Image, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import EmptyListComponent from './EmptyListComponent';
import { determineFriendData } from '../../utils/friendUtils';
import { getAvatarFromUser } from '../../utils/ImageUtils';

const DEFAULT_PROFILE_IMAGE = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

const AllFriendsModal = ({ visible, friends, onClose, onFriendPress,currentUserId }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredFriends, setFilteredFriends] = useState([]);

    // Cập nhật danh sách bạn bè khi props thay đổi
    useEffect(() => {
        if (Array.isArray(friends)) {
            const validFriends = friends.filter(item => item && item.sender && item.receiver);
            setFilteredFriends(validFriends);
        } else {
            setFilteredFriends([]);
        }
    }, [friends]);

    // Xử lý tìm kiếm
    const handleSearch = (text) => {
        setSearchQuery(text);
        if (!text || !text.trim()) {
            setFilteredFriends(Array.isArray(friends) ? friends.filter(f => f && (f.sender || f.receiver)) : []);
        } else {
            const lowercasedQuery = text.toLowerCase();
            const filtered = (Array.isArray(friends) ? friends : []).filter(friend => {
                if (!friend) return false;

                const friendData = determineFriendData(friend, currentUserId);
                if (!friendData) return false;

                const friendName = friendData.fullName ? friendData.fullName.toLowerCase() : '';
                const friendEmail = friendData.email ? friendData.email.toLowerCase() : '';

                return friendName.includes(lowercasedQuery) || friendEmail.includes(lowercasedQuery);
            });
            setFilteredFriends(filtered);
        }
    };

    // Render từng item bạn bè
    const renderFriendItem = ({ item }) => {
        if (!item) return null;

        const friendData = determineFriendData(item, currentUserId);
        if (!friendData) return null;

        // Get avatar URL using ImageUtils
        const avatarUrl = getAvatarFromUser(friendData);
        
        // Debug avatar data
        console.log('🖼️ AllFriendsModal avatar data:', {
            friendId: friendData?.id,
            friendName: friendData?.fullName,
            profilePictureUrl: friendData?.profilePictureUrl,
            avatarUrl: friendData?.avatarUrl,
            finalAvatarUrl: avatarUrl
        });

        return (
            <TouchableOpacity
                style={styles.allFriendItem}
                onPress={() => onFriendPress(item)}
            >
                {avatarUrl ? (
                    <Image
                        source={{ uri: avatarUrl }}
                        style={styles.allFriendImage}
                        onError={(e) => {
                            console.log('❌ Failed to load friend avatar in AllFriendsModal:', friendData?.fullName, e.nativeEvent.error);
                        }}
                    />
                ) : (
                    <View style={[styles.allFriendImage, styles.avatarPlaceholder]}>
                        <Text style={styles.avatarText}>
                            {(friendData?.fullName || 'U').charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}
                <View style={styles.allFriendInfo}>
                    <Text style={styles.allFriendName}>
                        {friendData.fullName || "Người dùng"}
                    </Text>
                    <Text style={styles.allFriendEmail}>
                        {friendData.email || ""}
                    </Text>
                </View>
                <TouchableOpacity style={styles.messageButton}>
                    <Ionicons name="chatbubble-outline" size={22} color="#1877F2" />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.allFriendsContainer}>
                {/* Header */}
                <View style={styles.allFriendsHeader}>
                    <TouchableOpacity onPress={onClose} style={styles.allFriendsBackButton}>
                        <Ionicons name="arrow-back" size={24} color="#1877F2" />
                    </TouchableOpacity>
                    <Text style={styles.allFriendsTitle}>Tất cả bạn bè</Text>
                    <View style={{width: 24}} /> {/* Để giữ cân bằng layout */}
                </View>

                {/* Thanh tìm kiếm */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm bạn bè..."
                        value={searchQuery}
                        onChangeText={handleSearch}
                        clearButtonMode="while-editing"
                    />
                </View>

                {/* Số lượng bạn bè */}
                <View style={styles.friendCountContainer}>
                    <Text style={styles.friendCountText}>
                        {filteredFriends.length} bạn bè
                    </Text>
                </View>

                {/* Danh sách bạn bè */}
                <FlatList
                    data={filteredFriends}
                    renderItem={renderFriendItem}
                    keyExtractor={(item) => (item && item.id ? item.id.toString() : Math.random().toString())}
                    contentContainerStyle={styles.allFriendsList}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={() => <EmptyListComponent searchQuery={searchQuery} />}
                />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    allFriendsContainer: {
        flex: 1,
        backgroundColor: 'white',
    },
    allFriendsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E4E6EB',
    },
    allFriendsBackButton: {
        padding: 5,
    },
    allFriendsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#050505',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F2F5',
        borderRadius: 20,
        marginHorizontal: 15,
        marginVertical: 10,
        paddingHorizontal: 15,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: 40,
        color: '#1C1E21',
    },
    friendCountContainer: {
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    friendCountText: {
        fontSize: 16,
        color: '#65676B',
    },
    allFriendsList: {
        paddingHorizontal: 15,
        paddingBottom: 20,
    },
    allFriendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#E4E6EB',
    },
    allFriendImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
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
    allFriendInfo: {
        marginLeft: 15,
        flex: 1,
    },
    allFriendName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1C1E21',
        marginBottom: 2,
    },
    allFriendEmail: {
        fontSize: 14,
        color: '#65676B',
    },
    messageButton: {
        padding: 10,
    },
});

export default AllFriendsModal;