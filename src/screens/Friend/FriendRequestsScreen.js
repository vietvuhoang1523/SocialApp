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
    RefreshControl,
    SafeAreaView,
    StatusBar,
    Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FriendService from '../../services/FriendService';

const { width } = Dimensions.get('window');

const friendService = FriendService;

const FriendRequestsScreen = ({ navigation }) => {
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('received'); // 'received' hoặc 'sent'
    const [sentRequests, setSentRequests] = useState([]);

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
            await friendService.acceptFriendRequest(friendshipId);

            // Cập nhật danh sách
            setReceivedRequests(prev =>
                prev.filter(req => req.id !== friendshipId)
            );

            Alert.alert('Thành công', 'Đã chấp nhận lời mời kết bạn');
        } catch (error) {
            console.error('Lỗi chấp nhận:', error);
            Alert.alert('Lỗi', 'Không thể chấp nhận lời mời kết bạn');
        }
    };

    // Từ chối yêu cầu kết bạn
    const rejectRequest = async (friendshipId) => {
        try {
            await friendService.rejectFriendRequest(friendshipId);

            // Cập nhật danh sách
            setReceivedRequests(prev =>
                prev.filter(req => req.id !== friendshipId)
            );

            Alert.alert('Thành công', 'Đã từ chối lời mời kết bạn');
        } catch (error) {
            console.error('Lỗi từ chối:', error);
            Alert.alert('Lỗi', 'Không thể từ chối lời mời kết bạn');
        }
    };

    // Hủy yêu cầu kết bạn đã gửi
    const cancelRequest = async (friendshipId) => {
        try {
            await friendService.cancelFriendRequest(friendshipId);

            // Cập nhật danh sách
            setSentRequests(prev =>
                prev.filter(req => req.id !== friendshipId)
            );

            Alert.alert('Thành công', 'Đã hủy lời mời kết bạn');
        } catch (error) {
            console.error('Lỗi hủy:', error);
            Alert.alert('Lỗi', 'Không thể hủy lời mời kết bạn');
        }
    };

    // Render yêu cầu nhận được
    const renderReceivedRequest = ({ item }) => (
        <View style={styles.requestCard}>
            <View style={styles.cardHeader}>
                <View style={styles.avatarContainer}>
                    <Image
                        source={{ uri: item.sender?.profilePictureUrl || 'https://via.placeholder.com/60' }}
                        style={styles.avatar}
                    />
                    <View style={styles.onlineIndicator} />
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.sender?.fullName || 'Người dùng'}</Text>
                    <Text style={styles.userEmail}>{item.sender?.email || ''}</Text>
                    <Text style={styles.requestTime}>Vừa gửi lời mời</Text>
                </View>
            </View>

            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => acceptRequest(item.id)}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#E91E63', '#F06292']}
                        style={styles.buttonGradient}
                    >
                        <Ionicons name="checkmark" size={18} color="white" />
                        <Text style={styles.buttonText}>Chấp nhận</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => rejectRequest(item.id)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.rejectText}>Từ chối</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // Render yêu cầu đã gửi
    const renderSentRequest = ({ item }) => (
        <View style={styles.requestCard}>
            <View style={styles.cardHeader}>
                <View style={styles.avatarContainer}>
                    <Image
                        source={{ uri: item.receiver?.profilePictureUrl || 'https://via.placeholder.com/60' }}
                        style={styles.avatar}
                    />
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.receiver?.fullName || 'Người dùng'}</Text>
                    <Text style={styles.userEmail}>{item.receiver?.email || ''}</Text>
                    <Text style={styles.requestTime}>Đang chờ phản hồi</Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => cancelRequest(item.id)}
                activeOpacity={0.8}
            >
                <Ionicons name="close-circle-outline" size={20} color="#666" />
                <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>
        </View>
    );

    // Tab selector component
    const TabSelector = () => (
        <View style={styles.tabContainer}>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'received' && styles.activeTab]}
                onPress={() => setActiveTab('received')}
            >
                <Text style={[styles.tabText, activeTab === 'received' && styles.activeTabText]}>
                    Nhận được ({receivedRequests.length})
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
    );

    // Hiển thị nội dung chính
    const renderContent = () => {
        if (loading && !refreshing) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#E91E63" />
                    <Text style={styles.loadingText}>Đang tải yêu cầu kết bạn...</Text>
                </View>
            );
        }

        const currentData = activeTab === 'received' ? receivedRequests : sentRequests;
        const renderItem = activeTab === 'received' ? renderReceivedRequest : renderSentRequest;

        return (
            <FlatList
                data={currentData}
                renderItem={renderItem}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh}
                        colors={['#E91E63']}
                        tintColor="#E91E63"
                    />
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons 
                            name={activeTab === 'received' ? 'people-outline' : 'person-add-outline'} 
                            size={80} 
                            color="#E0E0E0" 
                        />
                        <Text style={styles.emptyTitle}>
                            {activeTab === 'received' 
                                ? 'Chưa có yêu cầu kết bạn nào' 
                                : 'Chưa gửi yêu cầu kết bạn nào'}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            {activeTab === 'received' 
                                ? 'Các yêu cầu kết bạn sẽ hiển thị ở đây' 
                                : 'Hãy tìm kiếm và gửi lời mời kết bạn'}
                        </Text>
                        {activeTab === 'sent' && (
                            <TouchableOpacity
                                style={styles.searchButton}
                                onPress={() => navigation.navigate('FriendSearch')}
                            >
                                <Text style={styles.searchButtonText}>Tìm bạn bè</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                }
            />
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#E91E63" />
            
            {/* Header */}
            <LinearGradient
                colors={['#E91E63', '#F06292']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Lời mời kết bạn</Text>
                    <TouchableOpacity 
                        style={styles.searchButton}
                        onPress={() => navigation.navigate('FriendSearch')}
                    >
                        <Ionicons name="person-add" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Tab Selector */}
            <TabSelector />

            {/* Content */}
            {renderContent()}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        paddingTop: 10,
        paddingBottom: 15,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
        textAlign: 'center',
    },
    searchButton: {
        padding: 5,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    tab: {
        flex: 1,
        paddingVertical: 15,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#E91E63',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#666',
    },
    activeTabText: {
        color: '#E91E63',
        fontWeight: 'bold',
    },
    listContent: {
        padding: 15,
    },
    requestCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 15,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#f0f0f0',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: '#fff',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    requestTime: {
        fontSize: 12,
        color: '#999',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    acceptButton: {
        flex: 1,
        borderRadius: 25,
        overflow: 'hidden',
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    rejectButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    rejectText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 15,
    },
    cancelText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
        marginBottom: 10,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 30,
    },
    searchButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default FriendRequestsScreen;
