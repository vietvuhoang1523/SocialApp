// src/components/advanced/MessageReactionsDemo.js
// Component để demo tính năng reactions và real-time messaging

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Alert,
    TextInput,
    ScrollView
} from 'react-native';
import useAdvancedMessaging from '../../hook/useAdvancedMessaging';

const REACTION_EMOJIS = {
    like: '👍',
    love: '❤️',
    laugh: '😂',
    wow: '😮',
    sad: '😢',
    angry: '😠'
};

const MessageReactionsDemo = ({ currentUser, selectedUser, sampleMessages = [] }) => {
    const [selectedMessageId, setSelectedMessageId] = useState(null);
    const [typingText, setTypingText] = useState('');
    const [currentStatus, setCurrentStatus] = useState('online');

    const {
        isInitialized,
        connectionStatus,
        error,
        addReaction,
        removeReaction,
        getMessageReactions,
        sendTypingNotification,
        updateUserStatus,
        isUserTyping,
        isUserOnline,
        typingUsers,
        onlineUsers,
        clearError
    } = useAdvancedMessaging(currentUser);

    // === TYPING SIMULATION ===
    
    useEffect(() => {
        let typingTimer;
        
        if (typingText && selectedUser?.id) {
            // Send typing notification
            sendTypingNotification(selectedUser.id, true);
            
            // Clear typing after 3 seconds of no typing
            typingTimer = setTimeout(() => {
                sendTypingNotification(selectedUser.id, false);
            }, 3000);
        }
        
        return () => {
            if (typingTimer) {
                clearTimeout(typingTimer);
            }
        };
    }, [typingText, selectedUser?.id, sendTypingNotification]);

    // === HANDLERS ===

    const handleAddReaction = async (messageId, reactionType) => {
        try {
            const result = await addReaction(messageId, reactionType);
            if (result.status !== 'error') {
                Alert.alert('Thành công', `Đã thêm reaction ${REACTION_EMOJIS[reactionType]}`);
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể thêm reaction');
        }
    };

    const handleRemoveReaction = async (messageId, reactionType) => {
        try {
            const result = await removeReaction(messageId, reactionType);
            if (result.status !== 'error') {
                Alert.alert('Thành công', `Đã xóa reaction ${REACTION_EMOJIS[reactionType]}`);
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể xóa reaction');
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            setCurrentStatus(newStatus);
            const result = await updateUserStatus(newStatus);
            if (result.status !== 'error') {
                Alert.alert('Thành công', `Đã cập nhật trạng thái: ${newStatus}`);
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
        }
    };

    // === RENDER HELPERS ===

    const renderMessage = ({ item }) => {
        const reactions = getMessageReactions(item.id);
        const isSelected = selectedMessageId === item.id;

        return (
            <TouchableOpacity
                style={[styles.messageItem, isSelected && styles.selectedMessage]}
                onPress={() => setSelectedMessageId(isSelected ? null : item.id)}
            >
                <Text style={styles.messageContent}>{item.content}</Text>
                <Text style={styles.messageTime}>
                    {new Date(item.createdAt || Date.now()).toLocaleTimeString()}
                </Text>

                {/* Reactions Display */}
                {Object.keys(reactions).length > 0 && (
                    <View style={styles.reactionsContainer}>
                        {Object.entries(reactions).map(([reactionType, userIds]) => (
                            <View key={reactionType} style={styles.reactionItem}>
                                <Text style={styles.reactionEmoji}>
                                    {REACTION_EMOJIS[reactionType]}
                                </Text>
                                <Text style={styles.reactionCount}>
                                    {userIds.length}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Reaction Buttons */}
                {isSelected && (
                    <View style={styles.reactionButtons}>
                        <Text style={styles.reactionTitle}>Thêm reaction:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => (
                                <TouchableOpacity
                                    key={type}
                                    style={styles.reactionButton}
                                    onPress={() => handleAddReaction(item.id, type)}
                                >
                                    <Text style={styles.reactionButtonEmoji}>{emoji}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const renderTypingUser = (userId) => {
        if (isUserTyping(userId)) {
            return (
                <View key={userId} style={styles.typingIndicator}>
                    <Text style={styles.typingText}>
                        User {userId} đang nhập... ⌨️
                    </Text>
                </View>
            );
        }
        return null;
    };

    const renderOnlineUser = ([userId, userInfo]) => {
        return (
            <View key={userId} style={styles.onlineUserItem}>
                <View style={[styles.statusDot, 
                    { backgroundColor: userInfo.status === 'online' ? '#34C759' : '#FF9500' }
                ]} />
                <Text style={styles.onlineUserText}>
                    User {userId} - {userInfo.status}
                </Text>
            </View>
        );
    };

    if (!isInitialized) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Đang khởi tạo tính năng nâng cao...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>😀 Reactions & Real-time Demo</Text>

            {/* Connection Status */}
            <View style={[styles.statusBar, 
                { backgroundColor: connectionStatus === 'connected' ? '#E8F5E8' : '#FFE8E8' }
            ]}>
                <Text style={styles.statusText}>
                    📡 Kết nối: {connectionStatus}
                </Text>
            </View>

            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={clearError} style={styles.clearErrorButton}>
                        <Text style={styles.clearErrorText}>✕</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* User Status Control */}
            <View style={styles.statusSection}>
                <Text style={styles.sectionTitle}>📊 Trạng thái của bạn</Text>
                <View style={styles.statusButtons}>
                    {['online', 'away', 'busy', 'offline'].map(status => (
                        <TouchableOpacity
                            key={status}
                            style={[styles.statusButton,
                                currentStatus === status && styles.activeStatusButton
                            ]}
                            onPress={() => handleStatusChange(status)}
                        >
                            <Text style={[styles.statusButtonText,
                                currentStatus === status && styles.activeStatusButtonText
                            ]}>
                                {status}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Typing Simulation */}
            <View style={styles.typingSection}>
                <Text style={styles.sectionTitle}>⌨️ Mô phỏng nhập văn bản</Text>
                <TextInput
                    style={styles.typingInput}
                    placeholder="Nhập để gửi thông báo typing..."
                    value={typingText}
                    onChangeText={setTypingText}
                />
                {selectedUser && (
                    <Text style={styles.typingHelp}>
                        Sẽ gửi thông báo typing cho: {selectedUser.username || selectedUser.fullName}
                    </Text>
                )}
            </View>

            {/* Online Users */}
            {onlineUsers.size > 0 && (
                <View style={styles.onlineSection}>
                    <Text style={styles.sectionTitle}>👥 Người dùng online</Text>
                    <ScrollView style={styles.onlineList}>
                        {Array.from(onlineUsers.entries()).map(renderOnlineUser)}
                    </ScrollView>
                </View>
            )}

            {/* Typing Indicators */}
            {typingUsers.size > 0 && (
                <View style={styles.typingSection}>
                    <Text style={styles.sectionTitle}>⌨️ Đang nhập</Text>
                    {Array.from(typingUsers.keys()).map(renderTypingUser)}
                </View>
            )}

            {/* Sample Messages */}
            <View style={styles.messagesSection}>
                <Text style={styles.sectionTitle}>💬 Tin nhắn mẫu (tap để thêm reaction)</Text>
                <FlatList
                    data={sampleMessages.length > 0 ? sampleMessages : [
                        { id: '1', content: 'Xin chào! 👋', createdAt: new Date().toISOString() },
                        { id: '2', content: 'Bạn khỏe không?', createdAt: new Date().toISOString() },
                        { id: '3', content: 'Hôm nay thời tiết đẹp quá!', createdAt: new Date().toISOString() }
                    ]}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    style={styles.messagesList}
                    showsVerticalScrollIndicator={false}
                />
            </View>

            {/* Instructions */}
            <View style={styles.instructionsSection}>
                <Text style={styles.instructionsTitle}>📝 Hướng dẫn:</Text>
                <Text style={styles.instructionsText}>
                    • Tap tin nhắn để thêm reaction{'\n'}
                    • Thay đổi trạng thái để test real-time{'\n'}
                    • Nhập văn bản để gửi typing notification{'\n'}
                    • Reactions sẽ hiển thị real-time cho tất cả user
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5'
    },
    loadingText: {
        fontSize: 16,
        color: '#666'
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
        color: '#333'
    },
    statusBar: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        alignItems: 'center'
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333'
    },
    errorContainer: {
        backgroundColor: '#FFEBEE',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    errorText: {
        flex: 1,
        color: '#D32F2F',
        fontSize: 14
    },
    clearErrorButton: {
        padding: 4
    },
    clearErrorText: {
        color: '#D32F2F',
        fontSize: 16,
        fontWeight: 'bold'
    },
    statusSection: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        color: '#333'
    },
    statusButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8
    },
    statusButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ddd'
    },
    activeStatusButton: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF'
    },
    statusButtonText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500'
    },
    activeStatusButtonText: {
        color: '#fff'
    },
    typingSection: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16
    },
    typingInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14
    },
    typingHelp: {
        fontSize: 12,
        color: '#666',
        marginTop: 8,
        fontStyle: 'italic'
    },
    typingIndicator: {
        backgroundColor: '#E3F2FD',
        padding: 8,
        borderRadius: 8,
        marginBottom: 4
    },
    typingText: {
        fontSize: 14,
        color: '#1976D2',
        fontStyle: 'italic'
    },
    onlineSection: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16
    },
    onlineList: {
        maxHeight: 100
    },
    onlineUserItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8
    },
    onlineUserText: {
        fontSize: 14,
        color: '#333'
    },
    messagesSection: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        flex: 1
    },
    messagesList: {
        flex: 1
    },
    messageItem: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        marginBottom: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e9ecef'
    },
    selectedMessage: {
        borderColor: '#007AFF',
        backgroundColor: '#E3F2FD'
    },
    messageContent: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4
    },
    messageTime: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic'
    },
    reactionsContainer: {
        flexDirection: 'row',
        marginTop: 8,
        flexWrap: 'wrap'
    },
    reactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 16,
        marginRight: 4,
        marginBottom: 4,
        borderWidth: 1,
        borderColor: '#ddd'
    },
    reactionEmoji: {
        fontSize: 14,
        marginRight: 4
    },
    reactionCount: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600'
    },
    reactionButtons: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef'
    },
    reactionTitle: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8
    },
    reactionButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#fff',
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#ddd'
    },
    reactionButtonEmoji: {
        fontSize: 18
    },
    instructionsSection: {
        backgroundColor: '#FFF9C4',
        padding: 12,
        borderRadius: 8,
        marginTop: 8
    },
    instructionsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#F57F17',
        marginBottom: 4
    },
    instructionsText: {
        fontSize: 12,
        color: '#F57F17',
        lineHeight: 16
    }
});

export default MessageReactionsDemo; 