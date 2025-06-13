// src/components/advanced/AdvancedMessageSearch.js
// Component để demo tính năng tìm kiếm tin nhắn nâng cao

import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Alert
} from 'react-native';
import useAdvancedMessaging from '../../hook/useAdvancedMessaging';

const AdvancedMessageSearch = ({ currentUser, selectedUser = null }) => {
    const [searchKeyword, setSearchKeyword] = useState('');
    const [attachmentType, setAttachmentType] = useState('');
    const [selectedDateRange, setSelectedDateRange] = useState({
        startDate: '',
        endDate: ''
    });

    const {
        searchResults,
        attachmentMessages,
        messagesByDate,
        searchLoading,
        loading,
        error,
        searchMessages,
        getMessagesWithAttachments,
        getMessagesByDateRange,
        clearSearchResults,
        clearAttachmentMessages,
        clearMessagesByDate,
        clearError
    } = useAdvancedMessaging(currentUser);

    // === SEARCH HANDLERS ===

    const handleTextSearch = async () => {
        if (!searchKeyword.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập từ khóa tìm kiếm');
            return;
        }

        try {
            await searchMessages(
                searchKeyword,
                selectedUser?.id || null,
                0,
                20
            );
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể tìm kiếm tin nhắn');
        }
    };

    const handleAttachmentSearch = async () => {
        try {
            await getMessagesWithAttachments(
                selectedUser?.id || null,
                attachmentType,
                0,
                20
            );
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể tải tin nhắn có đính kèm');
        }
    };

    const handleDateRangeSearch = async () => {
        if (!selectedUser?.id) {
            Alert.alert('Lỗi', 'Vui lòng chọn người dùng để tìm kiếm theo thời gian');
            return;
        }

        if (!selectedDateRange.startDate || !selectedDateRange.endDate) {
            Alert.alert('Lỗi', 'Vui lòng chọn khoảng thời gian');
            return;
        }

        try {
            await getMessagesByDateRange(
                selectedUser.id,
                selectedDateRange.startDate,
                selectedDateRange.endDate,
                0,
                20
            );
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể tìm kiếm theo thời gian');
        }
    };

    // === RENDER HELPERS ===

    const renderSearchResult = ({ item }) => (
        <View style={styles.messageItem}>
            <Text style={styles.messageContent}>{item.content}</Text>
            <Text style={styles.messageTime}>
                {new Date(item.createdAt).toLocaleString()}
            </Text>
            {item.senderName && (
                <Text style={styles.senderName}>Từ: {item.senderName}</Text>
            )}
        </View>
    );

    const renderAttachmentMessage = ({ item }) => (
        <View style={styles.messageItem}>
            <Text style={styles.messageContent}>{item.content || 'File đính kèm'}</Text>
            {item.attachmentUrl && (
                <Text style={styles.attachmentUrl}>📎 {item.attachmentType || 'File'}</Text>
            )}
            <Text style={styles.messageTime}>
                {new Date(item.createdAt).toLocaleString()}
            </Text>
        </View>
    );

    const renderDateMessage = ({ item }) => (
        <View style={styles.messageItem}>
            <Text style={styles.messageContent}>{item.content}</Text>
            <Text style={styles.messageTime}>
                📅 {new Date(item.createdAt).toLocaleDateString()}
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🔍 Tìm Kiếm Tin Nhắn Nâng Cao</Text>

            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={clearError} style={styles.clearErrorButton}>
                        <Text style={styles.clearErrorText}>✕</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* TEXT SEARCH */}
            <View style={styles.searchSection}>
                <Text style={styles.sectionTitle}>📝 Tìm Kiếm Theo Nội Dung</Text>
                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Nhập từ khóa..."
                        value={searchKeyword}
                        onChangeText={setSearchKeyword}
                    />
                    <TouchableOpacity 
                        onPress={handleTextSearch}
                        style={styles.searchButton}
                        disabled={searchLoading}
                    >
                        {searchLoading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.buttonText}>Tìm</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {searchResults.length > 0 && (
                    <View style={styles.resultsContainer}>
                        <View style={styles.resultsHeader}>
                            <Text style={styles.resultsTitle}>
                                Kết quả ({searchResults.length})
                            </Text>
                            <TouchableOpacity onPress={clearSearchResults}>
                                <Text style={styles.clearText}>Xóa</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={searchResults}
                            renderItem={renderSearchResult}
                            keyExtractor={(item, index) => `search_${index}`}
                            style={styles.resultsList}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                )}
            </View>

            {/* ATTACHMENT SEARCH */}
            <View style={styles.searchSection}>
                <Text style={styles.sectionTitle}>📎 Tìm Tin Nhắn Có Đính Kèm</Text>
                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Loại file (image, video, file...)"
                        value={attachmentType}
                        onChangeText={setAttachmentType}
                    />
                    <TouchableOpacity 
                        onPress={handleAttachmentSearch}
                        style={styles.searchButton}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.buttonText}>Tìm</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {attachmentMessages.length > 0 && (
                    <View style={styles.resultsContainer}>
                        <View style={styles.resultsHeader}>
                            <Text style={styles.resultsTitle}>
                                File đính kèm ({attachmentMessages.length})
                            </Text>
                            <TouchableOpacity onPress={clearAttachmentMessages}>
                                <Text style={styles.clearText}>Xóa</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={attachmentMessages}
                            renderItem={renderAttachmentMessage}
                            keyExtractor={(item, index) => `attachment_${index}`}
                            style={styles.resultsList}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                )}
            </View>

            {/* DATE RANGE SEARCH */}
            <View style={styles.searchSection}>
                <Text style={styles.sectionTitle}>📅 Tìm Theo Khoảng Thời Gian</Text>
                <View style={styles.dateRow}>
                    <TextInput
                        style={styles.dateInput}
                        placeholder="Từ ngày (YYYY-MM-DD)"
                        value={selectedDateRange.startDate}
                        onChangeText={(date) => setSelectedDateRange(prev => ({
                            ...prev,
                            startDate: date
                        }))}
                    />
                    <TextInput
                        style={styles.dateInput}
                        placeholder="Đến ngày (YYYY-MM-DD)"
                        value={selectedDateRange.endDate}
                        onChangeText={(date) => setSelectedDateRange(prev => ({
                            ...prev,
                            endDate: date
                        }))}
                    />
                </View>
                <TouchableOpacity 
                    onPress={handleDateRangeSearch}
                    style={styles.searchButton}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.buttonText}>Tìm Theo Thời Gian</Text>
                    )}
                </TouchableOpacity>

                {messagesByDate.length > 0 && (
                    <View style={styles.resultsContainer}>
                        <View style={styles.resultsHeader}>
                            <Text style={styles.resultsTitle}>
                                Tin nhắn theo thời gian ({messagesByDate.length})
                            </Text>
                            <TouchableOpacity onPress={clearMessagesByDate}>
                                <Text style={styles.clearText}>Xóa</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={messagesByDate}
                            renderItem={renderDateMessage}
                            keyExtractor={(item, index) => `date_${index}`}
                            style={styles.resultsList}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                )}
            </View>

            {selectedUser && (
                <View style={styles.userInfo}>
                    <Text style={styles.userInfoText}>
                        🎯 Tìm kiếm với: {selectedUser.username || selectedUser.fullName}
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5'
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333'
    },
    searchSection: {
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        color: '#333'
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12
    },
    searchInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginRight: 8,
        fontSize: 14
    },
    dateInput: {
        flex: 0.48,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14
    },
    searchButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 60
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14
    },
    resultsContainer: {
        marginTop: 16
    },
    resultsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    resultsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333'
    },
    clearText: {
        color: '#FF3B30',
        fontSize: 14,
        fontWeight: '500'
    },
    resultsList: {
        maxHeight: 200
    },
    messageItem: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        marginBottom: 8,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#007AFF'
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
    senderName: {
        fontSize: 12,
        color: '#007AFF',
        marginTop: 2
    },
    attachmentUrl: {
        fontSize: 12,
        color: '#FF9500',
        marginTop: 2
    },
    userInfo: {
        backgroundColor: '#E3F2FD',
        padding: 12,
        borderRadius: 8,
        marginTop: 8
    },
    userInfoText: {
        fontSize: 14,
        color: '#1976D2',
        textAlign: 'center'
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
    }
});

export default AdvancedMessageSearch; 