// src/components/friends/EmailSearchHandler.js
import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Hình ảnh mặc định cho avatar
const DEFAULT_PROFILE_IMAGE = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

const EmailSearchHandler = ({
                                friendService,
                                navigation,
                                isConnected,
                                emailSearchResult,
                                setEmailSearchResult
                            }) => {
    const [loading, setLoading] = useState(false);

    // Hàm tìm kiếm người dùng theo email
    const searchUserByEmail = async (email) => {
        if (!isConnected) {
            Alert.alert('Lỗi kết nối', 'Vui lòng kiểm tra kết nối internet và thử lại');
            return;
        }

        try {
            setLoading(true);
            const result = await friendService.findUserByEmail(email);
            setEmailSearchResult(result);

            // Nếu tìm thấy người dùng, kiểm tra trạng thái kết bạn
            if (result) {
                const status = await friendService.checkFriendStatus(result.id);
                // Cập nhật trạng thái bạn bè nếu cần
            }
        } catch (error) {
            console.error('Error searching user by email:', error);
            setEmailSearchResult(null);
            Alert.alert('Lỗi', 'Không tìm thấy người dùng với email này');
        } finally {
            setLoading(false);
        }
    };

    // Hàm xử lý gửi lời mời kết bạn qua email
    const handleSendFriendRequestByEmail = async () => {
        if (!isConnected || !emailSearchResult) {
            Alert.alert('Lỗi kết nối', 'Vui lòng kiểm tra kết nối internet và thử lại');
            return;
        }

        try {
            await friendService.sendFriendRequestByEmail(emailSearchResult.email);

            // Cập nhật UI
            setEmailSearchResult(prev => ({
                ...prev,
                friendshipStatus: 'PENDING'
            }));

            Alert.alert('Thành công', 'Đã gửi lời mời kết bạn');
        } catch (error) {
            console.error('Error sending friend request by email:', error);
            Alert.alert('Lỗi', 'Không thể gửi lời mời kết bạn');
        }
    };

    // Xem hồ sơ người dùng
    const handleViewProfile = () => {
        if (emailSearchResult) {
            navigation.navigate('UserProfile', { userId: emailSearchResult.id });
        }
    };

    // Render kết quả tìm kiếm email
    const renderEmailSearchResult = () => {
        if (!emailSearchResult) return null;

        return (
            <View style={styles.emailSearchResultContainer}>
                <Text style={styles.emailSearchResultTitle}>Kết quả tìm kiếm</Text>
                <TouchableOpacity
                    style={styles.userItem}
                    onPress={handleViewProfile}
                    activeOpacity={0.7}
                >
                    <Image
                        source={{ uri: emailSearchResult.profilePictureUrl || DEFAULT_PROFILE_IMAGE }}
                        style={styles.userAvatar}
                    />
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>
                            {emailSearchResult.fullName || 'Người dùng'}
                        </Text>
                        <Text style={styles.userEmail}>{emailSearchResult.email}</Text>
                    </View>
                    <View style={styles.actionContainer}>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={handleSendFriendRequestByEmail}
                            activeOpacity={0.7}
                        >
                            <Icon name="account-plus" size={18} color="#4CAF50" />
                            <Text style={styles.addButtonText}>Kết bạn</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    return {
        searchUserByEmail,
        renderEmailSearchResult,
        loading
    };
};

const styles = StyleSheet.create({
    emailSearchResultContainer: {
        backgroundColor: '#F5F5F5',
        padding: 15,
        margin: 10,
        borderRadius: 10,
    },
    emailSearchResultTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    userInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    userName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333333',
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
        marginTop: 3,
    },
    actionContainer: {
        marginLeft: 10,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#4CAF50',
    },
    addButtonText: {
        color: '#4CAF50',
        fontWeight: '500',
        fontSize: 12,
        marginLeft: 4,
    },
});

export default EmailSearchHandler;
