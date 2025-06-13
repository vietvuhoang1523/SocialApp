// src/components/debug/WebSocketTester.js
// Component để test WebSocket connection trong app

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert
} from 'react-native';
import webSocketService from '../../services/WebSocketService';
import { runWebSocketDebug, quickWebSocketTest } from '../../../DEBUG_WEBSOCKET_CONNECTION';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WebSocketTester = () => {
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [logs, setLogs] = useState([]);
    const [authInfo, setAuthInfo] = useState(null);

    useEffect(() => {
        loadAuthInfo();
        
        // Listen to connection changes
        webSocketService.onConnectionChange((status) => {
            setConnectionStatus(status.status);
            addLog(`Connection status changed: ${status.status}`, 'info');
        });

        webSocketService.onError((error) => {
            addLog(`Error: ${error.error}`, 'error');
        });

        return () => {
            webSocketService.cleanup();
        };
    }, []);

    const loadAuthInfo = async () => {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            const userData = await AsyncStorage.getItem('userData');
            
            setAuthInfo({
                hasToken: !!token,
                tokenLength: token ? token.length : 0,
                hasUserData: !!userData,
                userData: userData ? JSON.parse(userData) : null
            });
        } catch (error) {
            addLog(`Error loading auth info: ${error.message}`, 'error');
        }
    };

    const addLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = {
            timestamp,
            message,
            type,
            id: Date.now() + Math.random()
        };
        
        setLogs(prev => [logEntry, ...prev.slice(0, 49)]); // Keep last 50 logs
    };

    const testQuickConnection = async () => {
        addLog('Starting quick WebSocket test...', 'info');
        
        try {
            const result = await quickWebSocketTest();
            if (result) {
                addLog('✅ Quick test PASSED', 'success');
                Alert.alert('Success', 'WebSocket connection test passed!');
            } else {
                addLog('❌ Quick test FAILED', 'error');
                Alert.alert('Failed', 'WebSocket connection test failed. Check logs.');
            }
        } catch (error) {
            addLog(`Quick test error: ${error.message}`, 'error');
            Alert.alert('Error', error.message);
        }
    };

    const runFullDebug = async () => {
        addLog('Starting full WebSocket debug...', 'info');
        
        try {
            const results = await runWebSocketDebug();
            
            // Add debug results to logs
            results.tests.forEach(test => {
                addLog(test.message, test.type);
            });
            
            const errorCount = results.tests.filter(t => t.type === 'error').length;
            
            if (errorCount === 0) {
                Alert.alert('Debug Complete', 'No errors found! WebSocket should work.');
            } else {
                Alert.alert('Debug Complete', `Found ${errorCount} errors. Check logs for details.`);
            }
        } catch (error) {
            addLog(`Debug error: ${error.message}`, 'error');
            Alert.alert('Debug Error', error.message);
        }
    };

    const testManualConnection = async () => {
        addLog('Testing manual WebSocket connection...', 'info');
        
        try {
            const success = await webSocketService.connect();
            if (success) {
                addLog('✅ Manual connection SUCCESSFUL', 'success');
                Alert.alert('Success', 'WebSocket connected successfully!');
            } else {
                addLog('❌ Manual connection FAILED', 'error');
                Alert.alert('Failed', 'WebSocket connection failed');
            }
        } catch (error) {
            addLog(`Manual connection error: ${error.message}`, 'error');
            Alert.alert('Connection Error', error.message);
        }
    };

    const forceReconnect = async () => {
        addLog('Forcing WebSocket reconnection...', 'info');
        
        try {
            const success = await webSocketService.forceReconnect();
            if (success) {
                addLog('✅ Force reconnect SUCCESSFUL', 'success');
            } else {
                addLog('❌ Force reconnect FAILED', 'error');
            }
        } catch (error) {
            addLog(`Force reconnect error: ${error.message}`, 'error');
        }
    };

    const testMultipleURLs = async () => {
        addLog('Testing multiple WebSocket URLs for HTTP 400 fix...', 'info');
        
        const urlsToTest = [
            'ws://192.168.0.102:8082/ws',           // Original
            'ws://192.168.0.102:8082/websocket',    // Common alternative
            'ws://192.168.0.102:8082/ws/websocket', // Another variation  
            'ws://192.168.0.102:8082',              // Root path
            'ws://192.168.0.102:8082/stomp',        // STOMP specific
            'ws://localhost:8082/ws',               // Localhost fallback
        ];
        
        for (const url of urlsToTest) {
            addLog(`Testing: ${url}`, 'info');
            
            try {
                const result = await new Promise((resolve) => {
                    const ws = new WebSocket(url);
                    const timeout = setTimeout(() => {
                        ws.close();
                        resolve({ success: false, error: 'timeout' });
                    }, 5000);
                    
                    ws.onopen = () => {
                        clearTimeout(timeout);
                        ws.close();
                        resolve({ success: true });
                    };
                    
                    ws.onerror = (error) => {
                        clearTimeout(timeout);
                        resolve({ success: false, error: error.message || 'connection failed' });
                    };
                });
                
                if (result.success) {
                    addLog(`✅ ${url} - SUCCESS!`, 'success');
                    Alert.alert('Found Working URL!', `URL that works: ${url}\n\nUpdate your api.js with this URL.`);
                    break;
                } else {
                    addLog(`❌ ${url} - ${result.error}`, 'error');
                }
                
            } catch (error) {
                addLog(`❌ ${url} - ${error.message}`, 'error');
            }
        }
    };

    const clearLogs = () => {
        setLogs([]);
        addLog('Logs cleared', 'info');
    };

    const getStatusColor = () => {
        switch (connectionStatus) {
            case 'connected': return '#4CAF50';
            case 'connecting': return '#FF9800';
            case 'disconnected': return '#F44336';
            default: return '#9E9E9E';
        }
    };

    const getLogColor = (type) => {
        switch (type) {
            case 'success': return '#4CAF50';
            case 'error': return '#F44336';
            case 'warning': return '#FF9800';
            case 'debug': return '#9C27B0';
            default: return '#333';
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🔧 WebSocket Tester</Text>

            {/* Connection Status */}
            <View style={[styles.statusContainer, { backgroundColor: getStatusColor() }]}>
                <Text style={styles.statusText}>
                    Status: {connectionStatus.toUpperCase()}
                </Text>
            </View>

            {/* Auth Info */}
            {authInfo && (
                <View style={styles.authContainer}>
                    <Text style={styles.authTitle}>🎫 Auth Info:</Text>
                    <Text style={styles.authText}>
                        Token: {authInfo.hasToken ? `Available (${authInfo.tokenLength} chars)` : 'Missing'}
                    </Text>
                    <Text style={styles.authText}>
                        User: {authInfo.hasUserData ? authInfo.userData.username || 'Unknown' : 'No user data'}
                    </Text>
                </View>
            )}

            {/* Test Buttons */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={testQuickConnection}>
                    <Text style={styles.buttonText}>⚡ Quick Test</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={testManualConnection}>
                    <Text style={styles.buttonText}>🔗 Manual Connect</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={forceReconnect}>
                    <Text style={styles.buttonText}>🔄 Force Reconnect</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, styles.debugButton]} onPress={runFullDebug}>
                    <Text style={styles.buttonText}>🐛 Full Debug</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, styles.debugButton]} onPress={testMultipleURLs}>
                    <Text style={styles.buttonText}>🔄 Test Multiple URLs</Text>
                </TouchableOpacity>
            </View>

            {/* Logs */}
            <View style={styles.logsContainer}>
                <View style={styles.logsHeader}>
                    <Text style={styles.logsTitle}>📝 Logs</Text>
                    <TouchableOpacity onPress={clearLogs}>
                        <Text style={styles.clearText}>Clear</Text>
                    </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.logsScroll} showsVerticalScrollIndicator={false}>
                    {logs.map(log => (
                        <View key={log.id} style={styles.logItem}>
                            <Text style={styles.logTimestamp}>{log.timestamp}</Text>
                            <Text style={[styles.logMessage, { color: getLogColor(log.type) }]}>
                                {log.message}
                            </Text>
                        </View>
                    ))}
                </ScrollView>
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
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
        color: '#333'
    },
    statusContainer: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        alignItems: 'center'
    },
    statusText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    },
    authContainer: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16
    },
    authTitle: {
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#333'
    },
    authText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2
    },
    buttonContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 16
    },
    button: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        marginBottom: 8,
        width: '48%',
        alignItems: 'center'
    },
    debugButton: {
        backgroundColor: '#FF9500',
        width: '100%'
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14
    },
    logsContainer: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12
    },
    logsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    logsTitle: {
        fontWeight: 'bold',
        color: '#333'
    },
    clearText: {
        color: '#FF3B30',
        fontSize: 14
    },
    logsScroll: {
        flex: 1
    },
    logItem: {
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    logTimestamp: {
        fontSize: 10,
        color: '#999',
        fontFamily: 'monospace'
    },
    logMessage: {
        fontSize: 12,
        fontFamily: 'monospace',
        lineHeight: 16
    }
});

export default WebSocketTester; 