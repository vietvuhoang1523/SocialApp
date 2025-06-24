import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    RefreshControl,
    Image,
    Modal,
    TextInput,
    ActivityIndicator,
    Dimensions
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import 'moment/locale/vi';
import * as ParticipantService from '../../services/SportsPostParticipantService';
import sportsService from '../../services/sportsService';

const { width } = Dimensions.get('window');
moment.locale('vi');

const ManageParticipantsScreen = ({ route, navigation }) => {
    const { postId, postTitle } = route.params;
    
    const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'accepted', 'all'
    const [pendingRequests, setPendingRequests] = useState([]);
    const [acceptedParticipants, setAcceptedParticipants] = useState([]);
    const [allParticipants, setAllParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    
    // Modal states
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [selectedParticipant, setSelectedParticipant] = useState(null);
    const [responseMessage, setResponseMessage] = useState('');
    const [responseType, setResponseType] = useState('approve'); // 'approve' or 'decline'

    useEffect(() => {
        navigation.setOptions({
            title: `Quản lý tham gia - ${postTitle}`,
            headerStyle: {
                backgroundColor: '#E91E63',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
                fontWeight: 'bold',
            },
        });
        
        loadData();
    }, [postId, postTitle]);

    const loadData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                loadPendingRequests(),
                loadAcceptedParticipants(),
                loadAllParticipants()
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
            Alert.alert('Lỗi', 'Không thể tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const loadPendingRequests = async () => {
        try {
            const response = await ParticipantService.getPendingRequests(postId, 0, 50);
            setPendingRequests(response.content || response);
        } catch (error) {
            console.error('Error loading pending requests:', error);
        }
    };

    const loadAcceptedParticipants = async () => {
        try {
            const response = await ParticipantService.getAcceptedParticipants(postId);
            setAcceptedParticipants(response);
        } catch (error) {
            console.error('Error loading accepted participants:', error);
        }
    };

    const loadAllParticipants = async () => {
        try {
            const response = await ParticipantService.getParticipants(postId, 0, 50);
            setAllParticipants(response.content || response);
        } catch (error) {
            console.error('Error loading all participants:', error);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, []);

    const handleResponseRequest = (participant, type) => {
        setSelectedParticipant(participant);
        setResponseType(type);
        setResponseMessage(type === 'approve' ? 'Chào mừng bạn tham gia!' : 'Xin lỗi, yêu cầu không phù hợp.');
        setShowResponseModal(true);
    };

    const submitResponse = async () => {
        if (!selectedParticipant) return;

        try {
            setProcessingId(selectedParticipant.id);
            const approve = responseType === 'approve';
            
            await ParticipantService.respondToJoinRequest(
                postId, 
                selectedParticipant.id, 
                approve, 
                responseMessage
            );

            Alert.alert(
                'Thành công', 
                `Đã ${approve ? 'chấp nhận' : 'từ chối'} yêu cầu của ${selectedParticipant.user?.fullName || selectedParticipant.fullName}`
            );

            setShowResponseModal(false);
            setSelectedParticipant(null);
            setResponseMessage('');
            
            // Reload data
            await loadData();
            
        } catch (error) {
            console.error('Error responding to request:', error);
            Alert.alert('Lỗi', error.message || 'Không thể xử lý yêu cầu');
        } finally {
            setProcessingId(null);
        }
    };

    const getProfilePictureUrl = (participant) => {
        const user = participant.user || participant;
        if (user.profilePictureUrl) {
            if (user.profilePictureUrl.startsWith('http://') || user.profilePictureUrl.startsWith('https://')) {
                return user.profilePictureUrl;
            }
            return sportsService.createImageUrl(user.profilePictureUrl);
        }
        return 'https://randomuser.me/api/portraits/men/1.jpg';
    };

    const renderParticipantItem = ({ item }) => {
        const user = item.user || item;
        const isProcessing = processingId === item.id;
        
        return (
            <View style={styles.participantCard}>
                <View style={styles.participantInfo}>
                    <Image 
                        source={{ uri: getProfilePictureUrl(item) }} 
                        style={styles.avatar} 
                    />
                    <View style={styles.userDetails}>
                        <Text style={styles.userName}>{user.fullName || 'Unknown User'}</Text>
                        <Text style={styles.userEmail}>{user.email || ''}</Text>
                        {item.joinMessage && (
                            <Text style={styles.joinMessage}>"{item.joinMessage}"</Text>
                        )}
                        <Text style={styles.requestTime}>
                            {moment(item.createdAt || item.requestedAt).fromNow()}
                        </Text>
                        {item.status && (
                            <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
                                <Text style={[styles.statusText, getStatusTextStyle(item.status)]}>
                                    {getStatusLabel(item.status)}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Action buttons for pending requests */}
                {activeTab === 'pending' && (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.approveButton]}
                            onPress={() => handleResponseRequest(item, 'approve')}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <MaterialIcons name="check" size={20} color="#fff" />
                            )}
                            <Text style={styles.actionButtonText}>Chấp nhận</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.declineButton]}
                            onPress={() => handleResponseRequest(item, 'decline')}
                            disabled={isProcessing}
                        >
                            <MaterialIcons name="close" size={20} color="#fff" />
                            <Text style={styles.actionButtonText}>Từ chối</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'PENDING': return 'Chờ duyệt';
            case 'ACCEPTED': return 'Đã chấp nhận';
            case 'DECLINED': return 'Đã từ chối';
            default: return status;
        }
    };

    const getStatusBadgeStyle = (status) => {
        switch (status) {
            case 'PENDING': return { backgroundColor: '#FF9800' };
            case 'ACCEPTED': return { backgroundColor: '#4CAF50' };
            case 'DECLINED': return { backgroundColor: '#F44336' };
            default: return { backgroundColor: '#9E9E9E' };
        }
    };

    const getStatusTextStyle = (status) => {
        return { color: '#fff' };
    };

    const getCurrentData = () => {
        switch (activeTab) {
            case 'pending': return pendingRequests;
            case 'accepted': return acceptedParticipants;
            case 'all': return allParticipants;
            default: return [];
        }
    };

    const getEmptyMessage = () => {
        switch (activeTab) {
            case 'pending': return 'Không có yêu cầu nào đang chờ duyệt';
            case 'accepted': return 'Chưa có ai được chấp nhận tham gia';
            case 'all': return 'Chưa có ai tham gia';
            default: return 'Không có dữ liệu';
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#E91E63" />
                <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
                    onPress={() => setActiveTab('pending')}
                >
                    <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
                        Chờ duyệt ({pendingRequests.length})
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'accepted' && styles.activeTab]}
                    onPress={() => setActiveTab('accepted')}
                >
                    <Text style={[styles.tabText, activeTab === 'accepted' && styles.activeTabText]}>
                        Đã chấp nhận ({acceptedParticipants.length})
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'all' && styles.activeTab]}
                    onPress={() => setActiveTab('all')}
                >
                    <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
                        Tất cả ({allParticipants.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Participants List */}
            <FlatList
                data={getCurrentData()}
                renderItem={renderParticipantItem}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#E91E63']}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="people-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>{getEmptyMessage()}</Text>
                    </View>
                }
                contentContainerStyle={styles.listContainer}
            />

            {/* Response Modal */}
            <Modal
                visible={showResponseModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowResponseModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {responseType === 'approve' ? 'Chấp nhận yêu cầu' : 'Từ chối yêu cầu'}
                            </Text>
                            <TouchableOpacity 
                                onPress={() => setShowResponseModal(false)}
                                style={styles.closeButton}
                            >
                                <MaterialIcons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        {selectedParticipant && (
                            <View style={styles.participantPreview}>
                                <Image 
                                    source={{ uri: getProfilePictureUrl(selectedParticipant) }} 
                                    style={styles.previewAvatar} 
                                />
                                <Text style={styles.previewName}>
                                    {selectedParticipant.user?.fullName || selectedParticipant.fullName}
                                </Text>
                            </View>
                        )}

                        <Text style={styles.messageLabel}>Tin nhắn phản hồi:</Text>
                        <TextInput
                            style={styles.messageInput}
                            value={responseMessage}
                            onChangeText={setResponseMessage}
                            placeholder="Nhập tin nhắn..."
                            multiline
                            numberOfLines={3}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setShowResponseModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Hủy</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.modalButton, responseType === 'approve' ? styles.approveButton : styles.declineButton]}
                                onPress={submitResponse}
                            >
                                <Text style={styles.actionButtonText}>
                                    {responseType === 'approve' ? 'Chấp nhận' : 'Từ chối'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
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
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    activeTabText: {
        color: '#E91E63',
    },
    listContainer: {
        padding: 15,
    },
    participantCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    participantInfo: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    userDetails: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    joinMessage: {
        fontSize: 14,
        color: '#333',
        fontStyle: 'italic',
        marginBottom: 4,
        backgroundColor: '#f8f8f8',
        padding: 8,
        borderRadius: 8,
    },
    requestTime: {
        fontSize: 12,
        color: '#999',
        marginBottom: 5,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        flex: 0.48,
    },
    approveButton: {
        backgroundColor: '#4CAF50',
    },
    declineButton: {
        backgroundColor: '#F44336',
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: '600',
        marginLeft: 5,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 10,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: width * 0.9,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        padding: 5,
    },
    participantPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        padding: 10,
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
    },
    previewAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    previewName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    messageLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    messageInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        flex: 0.48,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    cancelButtonText: {
        color: '#666',
        fontWeight: '600',
    },
});

export default ManageParticipantsScreen; 