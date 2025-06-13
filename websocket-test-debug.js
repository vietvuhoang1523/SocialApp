// websocket-test-debug.js - Test và debug WebSocket + API issues
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Services
import WebSocketService from './src/services/WebSocketService';
import UserProfileService from './src/services/UserProfileService';
import FriendService from './src/services/FriendService';

const WebSocketTestDebug = () => {
    const [testResults, setTestResults] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    // Add test result
    const addResult = (test, status, message, data = null) => {
        const result = {
            id: Date.now(),
            test,
            status, // 'SUCCESS', 'ERROR', 'INFO'
            message,
            data,
            timestamp: new Date().toLocaleTimeString()
        };
        setTestResults(prev => [result, ...prev]);
    };

    // Load current user
    useEffect(() => {
        const loadUser = async () => {
            try {
                const userData = await AsyncStorage.getItem('userData');
                if (userData) {
                    const user = JSON.parse(userData);
                    setCurrentUser(user);
                    addResult('INIT', 'SUCCESS', `Loaded user: ${user.fullName} (${user.email})`);
                } else {
                    addResult('INIT', 'ERROR', 'No user data found in storage');
                }
            } catch (error) {
                addResult('INIT', 'ERROR', `Error loading user: ${error.message}`);
            }
        };
        loadUser();
    }, []);

    // Test 1: Check AsyncStorage tokens
    const testAsyncStorage = async () => {
        try {
            addResult('STORAGE', 'INFO', 'Checking AsyncStorage...');
            
            const allKeys = await AsyncStorage.getAllKeys();
            addResult('STORAGE', 'INFO', `Found ${allKeys.length} keys`, allKeys);

            const token = await AsyncStorage.getItem('accessToken');
            if (token) {
                addResult('STORAGE', 'SUCCESS', `Token found: ${token.substring(0, 30)}...`);
                
                // Check if it's JWT
                if (token.startsWith('eyJ')) {
                    addResult('STORAGE', 'SUCCESS', 'Token is valid JWT format');
                } else {
                    addResult('STORAGE', 'ERROR', 'Token is not JWT format');
                }
            } else {
                addResult('STORAGE', 'ERROR', 'No access token found');
            }

            const userData = await AsyncStorage.getItem('userData');
            if (userData) {
                const user = JSON.parse(userData);
                addResult('STORAGE', 'SUCCESS', `User data: ${user.fullName} (ID: ${user.id})`);
            } else {
                addResult('STORAGE', 'ERROR', 'No user data found');
            }

        } catch (error) {
            addResult('STORAGE', 'ERROR', `Storage test failed: ${error.message}`);
        }
    };

    // Test 2: UserProfileService.searchUsers
    const testUserSearch = async () => {
        try {
            addResult('USER_SEARCH', 'INFO', 'Testing UserProfileService.searchUsers...');
            
            const response = await UserProfileService.searchUsers('test');
            addResult('USER_SEARCH', 'SUCCESS', 'Search method exists and callable');
            
            if (response && response.success) {
                addResult('USER_SEARCH', 'SUCCESS', `Search successful: ${response.data?.content?.length || 0} users found`);
            } else {
                addResult('USER_SEARCH', 'INFO', 'Search returned no results or unexpected format', response);
            }
            
        } catch (error) {
            addResult('USER_SEARCH', 'ERROR', `Search failed: ${error.message}`);
            console.error('UserProfileService.searchUsers error:', error);
        }
    };

    // Test 3: FriendService.getBatchFriendshipStatus
    const testFriendService = async () => {
        try {
            addResult('FRIEND_SERVICE', 'INFO', 'Testing FriendService.getBatchFriendshipStatus...');
            
            const testUserIds = [1, 2, 3]; // Sample user IDs
            const response = await FriendService.getBatchFriendshipStatus(testUserIds);
            
            addResult('FRIEND_SERVICE', 'SUCCESS', 'getBatchFriendshipStatus method exists and callable');
            addResult('FRIEND_SERVICE', 'INFO', 'Response from getBatchFriendshipStatus', response);
            
        } catch (error) {
            addResult('FRIEND_SERVICE', 'ERROR', `FriendService test failed: ${error.message}`);
            console.error('FriendService.getBatchFriendshipStatus error:', error);
        }
    };

    // Test 4: WebSocket Connection
    const testWebSocketConnection = async () => {
        try {
            addResult('WEBSOCKET', 'INFO', 'Testing WebSocket connection...');
            
            const connected = await WebSocketService.connect();
            if (connected) {
                addResult('WEBSOCKET', 'SUCCESS', 'WebSocket connected successfully');
                
                // Test connection status
                const isConnected = WebSocketService.isConnected();
                addResult('WEBSOCKET', isConnected ? 'SUCCESS' : 'ERROR', 
                    `Connection status: ${isConnected ? 'Connected' : 'Disconnected'}`);
                
            } else {
                addResult('WEBSOCKET', 'ERROR', 'WebSocket connection failed');
            }
            
        } catch (error) {
            addResult('WEBSOCKET', 'ERROR', `WebSocket test failed: ${error.message}`);
            console.error('WebSocket connection error:', error);
        }
    };

    // Test 5: Backend API reachability
    const testBackendAPI = async () => {
        try {
            addResult('BACKEND', 'INFO', 'Testing backend API reachability...');
            
            // Test user search endpoint directly
            const response = await fetch('http://192.168.0.102:8082/api/v1/users/search?query=test', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await AsyncStorage.getItem('accessToken')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                addResult('BACKEND', 'SUCCESS', `Backend API reachable. Status: ${response.status}`);
                addResult('BACKEND', 'INFO', 'Search API response', data);
            } else {
                addResult('BACKEND', 'ERROR', `Backend API error. Status: ${response.status}`);
            }
            
        } catch (error) {
            addResult('BACKEND', 'ERROR', `Backend API test failed: ${error.message}`);
        }
    };

    // Clear results
    const clearResults = () => {
        setTestResults([]);
    };

    // Run all tests
    const runAllTests = async () => {
        clearResults();
        addResult('ALL_TESTS', 'INFO', 'Starting all tests...');
        
        await testAsyncStorage();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await testUserSearch();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await testFriendService();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await testBackendAPI();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await testWebSocketConnection();
        
        addResult('ALL_TESTS', 'INFO', 'All tests completed');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'SUCCESS': return '#4CAF50';
            case 'ERROR': return '#F44336';
            case 'INFO': return '#2196F3';
            default: return '#666';
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>WebSocket & API Debug Console</Text>
            
            {currentUser && (
                <View style={styles.userInfo}>
                    <Text style={styles.userText}>
                        Current User: {currentUser.fullName} ({currentUser.id})
                    </Text>
                </View>
            )}

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={runAllTests}>
                    <Text style={styles.buttonText}>Run All Tests</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.button} onPress={testAsyncStorage}>
                    <Text style={styles.buttonText}>Test Storage</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.button} onPress={testUserSearch}>
                    <Text style={styles.buttonText}>Test User Search</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.button} onPress={testFriendService}>
                    <Text style={styles.buttonText}>Test Friend Service</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.button} onPress={testWebSocketConnection}>
                    <Text style={styles.buttonText}>Test WebSocket</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.button} onPress={testBackendAPI}>
                    <Text style={styles.buttonText}>Test Backend API</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearResults}>
                    <Text style={styles.buttonText}>Clear Results</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.resultsContainer}>
                {testResults.map((result) => (
                    <View key={result.id} style={styles.resultItem}>
                        <View style={styles.resultHeader}>
                            <Text style={[styles.resultTest, { color: getStatusColor(result.status) }]}>
                                [{result.test}] {result.status}
                            </Text>
                            <Text style={styles.resultTime}>{result.timestamp}</Text>
                        </View>
                        
                        <Text style={styles.resultMessage}>{result.message}</Text>
                        
                        {result.data && (
                            <Text style={styles.resultData}>
                                Data: {JSON.stringify(result.data, null, 2)}
                            </Text>
                        )}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#333',
    },
    userInfo: {
        backgroundColor: '#e3f2fd',
        padding: 10,
        borderRadius: 5,
        marginBottom: 20,
    },
    userText: {
        fontSize: 14,
        color: '#1976d2',
    },
    buttonContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 5,
        flex: 1,
        minWidth: 120,
    },
    clearButton: {
        backgroundColor: '#FF6B6B',
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '600',
    },
    resultsContainer: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 5,
        padding: 10,
    },
    resultItem: {
        marginBottom: 15,
        padding: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 5,
        borderLeftWidth: 4,
        borderLeftColor: '#007AFF',
    },
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    resultTest: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    resultTime: {
        fontSize: 12,
        color: '#666',
    },
    resultMessage: {
        fontSize: 14,
        color: '#333',
        marginBottom: 5,
    },
    resultData: {
        fontSize: 12,
        color: '#666',
        fontFamily: 'monospace',
        backgroundColor: '#f0f0f0',
        padding: 5,
        borderRadius: 3,
    },
});

export default WebSocketTestDebug; 