// src/examples/WebSocketMessagingTest.js
// Test component để kiểm tra WebSocket messaging functionality
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
    ActivityIndicator
} from 'react-native';
import useMessage from '../hooks/useMessage';
import useConversations from '../hooks/useConversations';
import webSocketMessageService from '../services/WebSocketMessageService';

const WebSocketMessagingTest = () => {
    // Mock users for testing
    const [currentUser] = useState({
        id: 1,
        name: 'Test User 1',
        email: 'user1@test.com'
    });
    
    const [targetUser] = useState({
        id: 2,
        name: 'Test User 2',
        email: 'user2@test.com'
    });

    // Message hook
    const {
        messages,
        loading: messageLoading,
        sending,
        sendMessage,
        loadMessages,
        sendTypingNotification,
        markAllAsRead,
        deleteMessage,
        isConnected,
        serviceStatus
    } = useMessage(currentUser, targetUser);

    // Conversations hook
    const {
        conversations,
        loading: conversationLoading,
        unreadCount,
        loadConversations,
        refreshConversations
    } = useConversations(currentUser);

    // Component state
    const [messageText, setMessageText] = useState('');
    const [testResults, setTestResults] = useState([]);

    // Add test result
    const addTestResult = (test, success, details = '') => {
        setTestResults(prev => [...prev, {
            test,
            success,
            details,
            timestamp: new Date().toLocaleTimeString()
        }]);
    };

    // Test connection
    const testConnection = async () => {
        try {
            addTestResult('Connection Test', isConnected, 
                isConnected ? 'WebSocket connected' : 'WebSocket disconnected');
            
            const status = serviceStatus;
            addTestResult('Service Status', status.initialized, 
                `Connected: ${status.connected}, Initialized: ${status.initialized}, Pending: ${status.pendingRequests}`);
        } catch (error) {
            addTestResult('Connection Test', false, error.message);
        }
    };

    // Test send message
    const testSendMessage = async () => {
        if (!messageText.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập nội dung tin nhắn');
            return;
        }

        try {
            const success = await sendMessage({
                content: messageText.trim(),
                messageType: 'text'
            });
            
            addTestResult('Send Message', success, 
                success ? `Message sent: "${messageText}"` : 'Failed to send message');
            
            if (success) {
                setMessageText('');
            }
        } catch (error) {
            addTestResult('Send Message', false, error.message);
        }
    };

    // Test load messages
    const testLoadMessages = async () => {
        try {
            await loadMessages();
            addTestResult('Load Messages', true, `Loaded ${messages.length} messages`);
        } catch (error) {
            addTestResult('Load Messages', false, error.message);
        }
    };

    // Test load conversations
    const testLoadConversations = async () => {
        try {
            await loadConversations();
            addTestResult('Load Conversations', true, `Loaded ${conversations.length} conversations`);
        } catch (error) {
            addTestResult('Load Conversations', false, error.message);
        }
    };

    // Test typing notification
    const testTypingNotification = async () => {
        try {
            await sendTypingNotification(true);
            addTestResult('Typing Start', true, 'Typing notification sent');
            
            setTimeout(async () => {
                await sendTypingNotification(false);
                addTestResult('Typing Stop', true, 'Typing stopped');
            }, 2000);
        } catch (error) {
            addTestResult('Typing Notification', false, error.message);
        }
    };

    // Test mark all as read
    const testMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
            addTestResult('Mark All Read', true, 'All messages marked as read');
        } catch (error) {
            addTestResult('Mark All Read', false, error.message);
        }
    };

    // Test advanced features
    const testAdvancedFeatures = async () => {
        try {
            // Test search
            const searchResult = await webSocketMessageService.searchMessages('test', targetUser.id);
            addTestResult('Search Messages', true, `Found ${searchResult?.length || 0} results`);

            // Test statistics
            const stats = await webSocketMessageService.getMessageStatistics(targetUser.id);
            addTestResult('Message Statistics', true, `Stats loaded: ${JSON.stringify(stats)}`);

            // Test recent messages
            const recent = await webSocketMessageService.getRecentMessages(10);
            addTestResult('Recent Messages', true, `Recent messages: ${recent?.length || 0}`);

        } catch (error) {
            addTestResult('Advanced Features', false, error.message);
        }
    };

    // Auto load on mount
    useEffect(() => {
        testConnection();
        testLoadMessages();
        testLoadConversations();
    }, []);

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>WebSocket Messaging Test</Text>

            {/* Connection Status */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Connection Status</Text>
                <Text style={[styles.status, { color: isConnected ? 'green' : 'red' }]}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                </Text>
                <Text style={styles.info}>
                    Messages: {messages.length}, Conversations: {conversations.length}, Unread: {unreadCount}
                </Text>
            </View>

            {/* Message Input */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Send Message Test</Text>
                <TextInput
                    style={styles.input}
                    value={messageText}
                    onChangeText={setMessageText}
                    placeholder="Nhập tin nhắn test..."
                    multiline
                />
                <TouchableOpacity
                    style={[styles.button, sending && styles.buttonDisabled]}
                    onPress={testSendMessage}
                    disabled={sending}
                >
                    {sending ? (
                        <ActivityIndicator color="white" size="small" />
                    ) : (
                        <Text style={styles.buttonText}>Send Message</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Test Actions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Test Actions</Text>
                
                <TouchableOpacity style={styles.button} onPress={testConnection}>
                    <Text style={styles.buttonText}>Test Connection</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={testLoadMessages}>
                    <Text style={styles.buttonText}>Load Messages</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={testLoadConversations}>
                    <Text style={styles.buttonText}>Load Conversations</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={testTypingNotification}>
                    <Text style={styles.buttonText}>Test Typing</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={testMarkAllAsRead}>
                    <Text style={styles.buttonText}>Mark All Read</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={testAdvancedFeatures}>
                    <Text style={styles.buttonText}>Test Advanced Features</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={refreshConversations}>
                    <Text style={styles.buttonText}>Refresh Conversations</Text>
                </TouchableOpacity>
            </View>

            {/* Recent Messages */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Messages ({messages.length})</Text>
                {messageLoading ? (
                    <ActivityIndicator />
                ) : (
                    messages.slice(0, 5).map((message, index) => (
                        <View key={message.id} style={styles.messageItem}>
                            <Text style={styles.messageContent}>
                                {message.content}
                            </Text>
                            <Text style={styles.messageInfo}>
                                From: {message.senderId} | {new Date(message.timestamp).toLocaleTimeString()}
                                {message.isSending && ' (Sending...)'}
                                {message.isError && ' (Error)'}
                            </Text>
                        </View>
                    ))
                )}
            </View>

            {/* Conversations */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Conversations ({conversations.length})</Text>
                {conversationLoading ? (
                    <ActivityIndicator />
                ) : (
                    conversations.slice(0, 3).map((conv, index) => (
                        <View key={conv.id} style={styles.conversationItem}>
                            <Text style={styles.conversationName}>
                                {conv.participantName}
                            </Text>
                            <Text style={styles.conversationInfo}>
                                Last: {conv.lastMessage || 'No messages'}
                                {conv.unreadCount > 0 && ` (${conv.unreadCount} unread)`}
                            </Text>
                        </View>
                    ))
                )}
            </View>

            {/* Test Results */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Test Results</Text>
                {testResults.map((result, index) => (
                    <View key={index} style={styles.testResult}>
                        <Text style={[
                            styles.testText,
                            { color: result.success ? 'green' : 'red' }
                        ]}>
                            [{result.timestamp}] {result.test}: {result.success ? 'PASS' : 'FAIL'}
                        </Text>
                        {result.details && (
                            <Text style={styles.testDetails}>{result.details}</Text>
                        )}
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#333',
    },
    section: {
        backgroundColor: 'white',
        padding: 16,
        marginBottom: 16,
        borderRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
    },
    status: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    info: {
        fontSize: 14,
        color: '#666',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        minHeight: 40,
        maxHeight: 100,
        textAlignVertical: 'top',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 8,
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    messageItem: {
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    messageContent: {
        fontSize: 14,
        marginBottom: 4,
    },
    messageInfo: {
        fontSize: 12,
        color: '#666',
    },
    conversationItem: {
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    conversationName: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    conversationInfo: {
        fontSize: 12,
        color: '#666',
    },
    testResult: {
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    testText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    testDetails: {
        fontSize: 11,
        color: '#666',
        marginTop: 2,
    },
});

export default WebSocketMessagingTest; 