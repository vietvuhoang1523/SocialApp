import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Dimensions,
    Modal,
    FlatList
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useProfileContext } from '../../components/ProfileContext';

const { width } = Dimensions.get('window');
const DEFAULT_PROFILE_IMAGE = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

const FriendCard = ({ friend, onPress }) => (
    <TouchableOpacity
        style={styles.friendCardContainer}
        onPress={() => onPress(friend)}
    >
        <View style={styles.friendImageContainer}>
            <Image
                source={{ uri: friend.avatar || DEFAULT_PROFILE_IMAGE }}
                style={styles.friendImage}
            />
            {friend.online && <View style={styles.onlineIndicator} />}
        </View>
        <Text style={styles.friendName} numberOfLines={2}>
            {friend.name}
        </Text>
    </TouchableOpacity>
);

const FriendDetailModal = ({ friend, visible, onClose }) => {
    if (!friend) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalBackground}>
                <View style={styles.modalContainer}>
                    <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
                        <Ionicons name="close" size={24} color="#000" />
                    </TouchableOpacity>

                    <Image
                        source={{ uri: friend.avatar || DEFAULT_PROFILE_IMAGE }}
                        style={styles.modalFriendImage}
                    />

                    <Text style={styles.modalFriendName}>{friend.name}</Text>

                    <View style={styles.modalActionButtons}>
                        <TouchableOpacity style={styles.modalActionButton}>
                            <Ionicons name="chatbubble" size={20} color="#1877F2" />
                            <Text style={styles.modalActionButtonText}>Nhắn tin</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalActionButton}>
                            <Ionicons name="person" size={20} color="#1877F2" />
                            <Text style={styles.modalActionButtonText}>Trang cá nhân</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const FriendsSection = ({
                            onFindFriends,
                            onViewAllFriends
                        }) => {
    const {
        userProfile,
        followerCount
    } = useProfileContext();

    const [selectedFriend, setSelectedFriend] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    // Danh sách bạn bè mẫu (nên thay thế bằng dữ liệu từ API)
    const friendsData = useMemo(() => [
        {
            id: '1',
            name: 'Đỗ Tiến Dũng',
            avatar: DEFAULT_PROFILE_IMAGE,
            online: true,
            mutualFriends: 12
        },
        {
            id: '2',
            name: 'Dương Thanh Long',
            avatar: DEFAULT_PROFILE_IMAGE,
            online: false,
            mutualFriends: 5
        },
        {
            id: '3',
            name: 'Trần Văn A',
            avatar: DEFAULT_PROFILE_IMAGE,
            online: true,
            mutualFriends: 8
        },
        {
            id: '4',
            name: 'Nguyễn Văn B',
            avatar: DEFAULT_PROFILE_IMAGE,
            online: false,
            mutualFriends: 3
        },
        {
            id: '5',
            name: 'Trịnh Mạnh Hà',
            avatar: DEFAULT_PROFILE_IMAGE,
            online: true,
            mutualFriends: 15
        },
        {
            id: '6',
            name: 'Phúc Bùi',
            avatar: DEFAULT_PROFILE_IMAGE,
            online: false,
            mutualFriends: 7
        }
    ], []);

    const handleFriendPress = (friend) => {
        setSelectedFriend(friend);
        setIsModalVisible(true);
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
        setSelectedFriend(null);
    };

    return (
        <View style={styles.container}>
            {/* Phần Header */}
            <View style={styles.headerContainer}>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.titleText}>Bạn bè</Text>
                    <Text style={styles.subtitleText}>
                        {followerCount} bạn bè
                    </Text>
                </View>

                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={styles.findFriendsButton}
                        onPress={onFindFriends}
                    >
                        <Ionicons name="person-add" size={20} color="#1877F2" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.searchFriendsButton}
                        onPress={() => {/* Implement search friends */}}
                    >
                        <Ionicons name="search" size={20} color="#1877F2" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Danh sách bạn bè */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.friendsScrollContainer}
            >
                {friendsData.map(friend => (
                    <FriendCard
                        key={friend.id}
                        friend={friend}
                        onPress={handleFriendPress}
                    />
                ))}
            </ScrollView>

            {/* Nút Xem tất cả bạn bè */}
            <TouchableOpacity
                style={styles.viewAllButton}
                onPress={onViewAllFriends}
            >
                <Text style={styles.viewAllButtonText}>
                    Xem tất cả bạn bè
                </Text>
            </TouchableOpacity>

            {/* Modal chi tiết bạn bè */}
            <FriendDetailModal
                friend={selectedFriend}
                visible={isModalVisible}
                onClose={handleCloseModal}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        paddingVertical: 15,
        marginBottom: 10,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        marginBottom: 15,
    },
    headerTitleContainer: {
        flexDirection: 'column',
    },
    titleText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#050505',
    },
    subtitleText: {
        fontSize: 14,
        color: '#65676B',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    findFriendsButton: {
        marginRight: 15,
        padding: 5,
    },
    searchFriendsButton: {
        padding: 5,
    },
    friendsScrollContainer: {
        paddingHorizontal: 15,
    },
    friendCardContainer: {
        marginRight: 10,
        alignItems: 'center',
        width: 100,
    },
    friendImageContainer: {
        position: 'relative',
        marginBottom: 5,
    },
    friendImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#31A24C',
        borderWidth: 2,
        borderColor: 'white',
    },
    friendName: {
        fontSize: 13,
        textAlign: 'center',
        color: '#050505',
    },
    viewAllButton: {
        marginTop: 15,
        marginHorizontal: 15,
        backgroundColor: '#F0F2F5',
        paddingVertical: 10,
        borderRadius: 6,
        alignItems: 'center',
    },
    viewAllButtonText: {
        color: '#1877F2',
        fontWeight: '600',
    },
    // Styles cho Modal
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    modalCloseButton: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    modalFriendImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 15,
    },
    modalFriendName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    modalActionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    modalActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0F2F5',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 6,
        flex: 1,
        marginHorizontal: 5,
    },
    modalActionButtonText: {
        marginLeft: 5,
        color: '#1877F2',
        fontWeight: '600',
    },
});

export default FriendsSection;