import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    StyleSheet,
    Alert,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import FriendService from '../services/FriendService';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const FriendRequestsScreen = () => {
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('received'); // 'received' hoặc 'sent'
    const [sentRequests, setSentRequests] = useState([]);

    const friendService = new FriendService();

    // Tải danh sách yêu cầu kết bạn
    const fetchRequests = async () => {
        try {
            setLoading(true);
            // Lấy yêu cầu đã nhận
            const received = await friendService.getReceivedFriendRequests();
            setReceivedRequests(received || []);

            // Lấy yêu cầu đã gửi
            const sent = await friendService.getSentFriendRequests();
            setSentRequests(sent || []);
        } catch (error) {
            console.error('Lỗi tải yêu cầu:', error);
            Alert.alert('Lỗi', 'Không thể tải yêu cầu kết bạn');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Load dữ liệu khi màn hình hiển thị
    useEffect(() => {
        fetchRequests();
    }, []);

    // Hàm refresh để người dùng kéo xuống làm mới
    const onRefresh = () => {
        setRefreshing(true);
        fetchRequests();
    };

    // Chấp nhận yêu cầu kết bạn
    const acceptRequest = async (friendshipId) => {
        try {
            setLoading(true);
            await friendService.acceptFriendRequest(friendshipId);

            // Cập nhật danh sách
            setReceivedRequests(prev =>
                prev.filter(req => req.id !== friendshipId)
            );

            Alert.alert('Thành công', 'Đã chấp nhận lời mời kết bạn');
        } catch (error) {
            console.error('Lỗi chấp nhận:', error);
            Alert.alert('Lỗi', 'Không thể chấp nhận lời mời kết bạn');
        } finally {
            setLoading(false);
        }
    };

    // Từ chối yêu cầu kết bạn
    const rejectRequest = async (friendshipId) => {
        try {
            setLoading(true);
            await friendService.rejectFriendRequest(friendshipId);

            // Cập nhật danh sách
            setReceivedRequests(prev =>
                prev.filter(req => req.id !== friendshipId)
            );

            Alert.alert('Thành công', 'Đã từ chối lời mời kết bạn');
        } catch (error) {
            console.error('Lỗi từ chối:', error);
            Alert.alert('Lỗi', 'Không thể từ chối lời mời kết bạn');
        } finally {
            setLoading(false);
        }
    };

    // Hủy yêu cầu kết bạn đã gửi
    const cancelRequest = async (friendshipId) => {
        try {
            setLoading(true);
            await friendService.cancelFriendRequest(friendshipId);

            // Cập nhật danh sách
            setSentRequests(prev =>
                prev.filter(req => req.id !== friendshipId)
            );

            Alert.alert('Thành công', 'Đã hủy lời mời kết bạn');
        } catch (error) {
            console.error('Lỗi hủy:', error);
            Alert.alert('Lỗi', 'Không thể hủy lời mời kết bạn');
        } finally {
            setLoading(false);
        }
    };

    // Render yêu cầu nhận được
    const renderReceivedRequest = ({ item }) => (
        <View style={styles.requestItem}>
            <Image
                source={{ uri: item.sender?.profilePictureUrl || 'https://via.placeholder.com/50' }}
                style={styles.avatar}
            />
            <View style={styles.requestInfo}>
                <View style={styles.userDetails}>
                    <Text style={styles.userName}>{item.sender?.fullName || 'Người dùng'}</Text>
                    <Text style={styles.userEmail}>{item.sender?.email || ''}</Text>
                </View>

                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={() => acceptRequest(item.id)}
                        disabled={loading}
                    >
                        <Icon name="check" size={18} color="white" />
                        <Text style={styles.buttonText}>Chấp nhận</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => rejectRequest(item.id)}
                        disabled={loading}
                    >
                        <Icon name="close" size={18} color="white" />
                        <Text style={styles.buttonText}>Từ chối</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    // Render yêu cầu đã gửi
    const renderSentRequest = ({ item }) => (
        <View style={styles.requestItem}>
            <Image
                source={{ uri: item.receiver?.profilePictureUrl || 'https://via.placeholder.com/50' }}
                style={styles.avatar}
            />
            <View style={styles.requestInfo}>
                <View style={styles.userDetails}>
                    <Text style={styles.userName}>{item.receiver?.fullName || 'Người dùng'}</Text>
                    <Text style={styles.userEmail}>{item.receiver?.email || ''}</Text>
                </View>

                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => cancelRequest(item.id)}
                    disabled={loading}
                >
                    <Icon name="close-circle-outline" size={18} color="white" />
                    <Text style={styles.buttonText}>Hủy</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // Hiển thị nội dung chính
    const renderContent = () => {
        if (loading && !refreshing) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.loadingText}>Đang tải yêu cầu kết bạn...</Text>
                </View>
            );
        }

        // Hiển thị tab đã nhận
        if (activeTab === 'received') {
            return (
                <FlatList
                    data={receivedRequests}
                    renderItem={renderReceivedRequest}
                    keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Icon name="account-multiple-remove" size={50} color="#ccc" />
                            <Text style={styles.emptyText}>
                                Không có yêu cầu kết bạn mới
                            </Text>
                        </View>
                    }
                />
            );
        }

        // Hiển thị tab đã gửi
        return (
            <FlatList
                data={sentRequests}
                renderItem={renderSentRequest}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="send-check-outline" size={50} color="#ccc" />
                        <Text style={styles.emptyText}>
                            Không có yêu cầu kết bạn đang chờ
                        </Text>
                    </View>
                }
            />
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Yêu cầu kết bạn</Text>

            {/* Tab chuyển đổi */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'received' && styles.activeTab]}
                    onPress={() => setActiveTab('received')}
                >
                    <Text style={[styles.tabText, activeTab === 'received' && styles.activeTabText]}>
                        Đã nhận ({receivedRequests.length})
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'sent' && styles.activeTab]}
                    onPress={() => setActiveTab('sent')}
                >
                    <Text style={[styles.tabText, activeTab === 'sent' && styles.activeTabText]}>
                        Đã gửi ({sentRequests.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Nội dung chính */}
            {renderContent()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white'
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        padding: 15,
        textAlign: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center'
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#4CAF50'
    },
    tabText: {
        fontWeight: 'bold',
        color: 'gray'
    },
    activeTabText: {
        color: '#4CAF50'
    },
    requestItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15
    },
    requestInfo: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    userDetails: {
        flex: 1,
    },
    userName: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 2
    },
    userEmail: {
        color: 'gray',
        fontSize: 13
    },
    actionButtons: {
        flexDirection: 'row'
    },
    acceptButton: {
        backgroundColor: '#4CAF50',
        padding: 8,
        borderRadius: 5,
        marginRight: 10,
        flexDirection: 'row',
        alignItems: 'center'
    },
    rejectButton: {
        backgroundColor: '#f44336',
        padding: 8,
        borderRadius: 5,
        flexDirection: 'row',
        alignItems: 'center'
    },
    cancelButton: {
        backgroundColor: '#FF9800',
        padding: 8,
        borderRadius: 5,
        flexDirection: 'row',
        alignItems: 'center'
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 5
    },
    pendingText: {
        color: 'gray'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    loadingText: {
        marginTop: 10,
        color: 'gray'
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 10,
        color: 'gray',
        fontSize: 16
    }
});

export default FriendRequestsScreen;
