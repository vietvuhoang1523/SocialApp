import React from 'react';
import { View, Text, Image, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { determineFriendData } from '../../utils/friendUtils';

const DEFAULT_PROFILE_IMAGE = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

const FriendDetailModal = ({ friend, visible, onClose, currentUserId }) => {
    if (!friend) return null;

    const friendData = determineFriendData(friend, currentUserId);
    if (!friendData) return null;

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
                        source={{ uri: friendData.avatarUrl || DEFAULT_PROFILE_IMAGE }}
                        style={styles.modalFriendImage}
                    />

                    <Text style={styles.modalFriendName}>
                        {friendData.fullName || "Người dùng"}
                    </Text>
                    <Text style={styles.modalFriendEmail}>
                        {friendData.email || ""}
                    </Text>

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


const styles = StyleSheet.create({
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
        marginBottom: 5,
    },
    modalFriendEmail: {
        fontSize: 14,
        color: '#65676B',
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

export default FriendDetailModal;