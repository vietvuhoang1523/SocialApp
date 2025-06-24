import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Alert,
    ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as SportsPostService from '../../services/SportsPostService';
import * as ParticipantService from '../../services/SportsPostParticipantService';

const AutoApproveDebugTool = () => {
    const [loading, setLoading] = useState(false);
    const [testPostId, setTestPostId] = useState('1');
    const [postDetails, setPostDetails] = useState(null);
    const [logs, setLogs] = useState([]);

    const addLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev.slice(-10), { timestamp, message, type }]);
        console.log(`[${type.toUpperCase()}] ${message}`);
    };

    const checkPostAutoApprove = async () => {
        try {
            setLoading(true);
            addLog(`🔍 Checking auto approve setting for post ${testPostId}...`, 'info');
            
            // Get post details
            const post = await SportsPostService.getSportsPostById(testPostId);
            setPostDetails(post);
            
            addLog(`📊 Post Details:`, 'info');
            addLog(`- Title: ${post.title}`, 'info');
            addLog(`- Auto Approve: ${post.autoApprove ? '✅ TRUE (Tự động duyệt)' : '❌ FALSE (Duyệt thủ công)'}`, 
                   post.autoApprove ? 'success' : 'warning');
            addLog(`- Creator: ${post.creator?.fullName || post.userRes?.fullName || 'Unknown'}`, 'info');
            addLog(`- Current Participants: ${post.currentParticipants}/${post.maxParticipants}`, 'info');
            addLog(`- Status: ${post.status}`, 'info');
            
        } catch (error) {
            addLog(`❌ Error checking post: ${error.message}`, 'error');
            setPostDetails(null);
        } finally {
            setLoading(false);
        }
    };

    const testJoinFlow = async () => {
        try {
            setLoading(true);
            addLog(`🚀 Testing join flow for post ${testPostId}...`, 'info');
            
            // Step 1: Check current participation status
            addLog(`Step 1: Checking current participation status...`, 'info');
            try {
                const status = await ParticipantService.getUserParticipationStatus(testPostId);
                addLog(`Current status: ${status || 'NOT_JOINED'}`, 'info');
                
                if (status === 'ACCEPTED' || status === 'PENDING') {
                    addLog(`Already joined with status: ${status}. Leaving first...`, 'warning');
                    await ParticipantService.leaveSportsPost(testPostId);
                    addLog(`✅ Successfully left the post`, 'success');
                }
            } catch (error) {
                addLog(`Status check failed (probably not joined): ${error.message}`, 'info');
            }
            
            // Step 2: Join the post
            addLog(`Step 2: Joining the post...`, 'info');
            const joinResult = await ParticipantService.joinSportsPost(testPostId, 'Debug test join - Tôi muốn test tham gia');
            
            addLog(`✅ Join result:`, 'success');
            addLog(`- Status: ${joinResult.status}`, joinResult.status === 'ACCEPTED' ? 'success' : 'warning');
            addLog(`- Message: ${joinResult.joinMessage || 'No message'}`, 'info');
            addLog(`- User: ${joinResult.user?.fullName || 'Unknown'}`, 'info');
            addLog(`- Is Creator: ${joinResult.isCreator}`, 'info');
            addLog(`- Joined At: ${joinResult.joinedAt}`, 'info');
            
            // Step 3: Check post auto approve setting again
            await checkPostAutoApprove();
            
        } catch (error) {
            addLog(`❌ Join test failed: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const getAllSportsPosts = async () => {
        try {
            setLoading(true);
            addLog(`📋 Getting all sports posts to check auto approve settings...`, 'info');
            
            const posts = await SportsPostService.getSportsPosts(0, 10);
            const postsArray = posts.content || posts;
            
            addLog(`Found ${postsArray.length} posts:`, 'info');
            
            postsArray.forEach((post, index) => {
                addLog(`${index + 1}. Post ID ${post.id}: "${post.title}"`, 'info');
                addLog(`   Auto Approve: ${post.autoApprove ? '✅ TRUE' : '❌ FALSE'}`, 
                       post.autoApprove ? 'success' : 'warning');
                addLog(`   Creator: ${post.creator?.fullName || post.userRes?.fullName || 'Unknown'}`, 'info');
            });
            
        } catch (error) {
            addLog(`❌ Error getting posts: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const clearLogs = () => {
        setLogs([]);
        setPostDetails(null);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>🔧 Auto Approve Debug Tool</Text>
                
                <View style={styles.inputRow}>
                    <Text style={styles.inputLabel}>Post ID:</Text>
                    <TextInput
                        style={styles.input}
                        value={testPostId}
                        onChangeText={setTestPostId}
                        placeholder="Enter Post ID"
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.buttonRow}>
                    <TouchableOpacity 
                        style={[styles.button, styles.checkButton]}
                        onPress={checkPostAutoApprove}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <MaterialIcons name="info" size={16} color="#fff" />
                        )}
                        <Text style={styles.buttonText}>Check Post</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.button, styles.testButton]}
                        onPress={testJoinFlow}
                        disabled={loading}
                    >
                        <MaterialIcons name="play-arrow" size={16} color="#fff" />
                        <Text style={styles.buttonText}>Test Join</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.buttonRow}>
                    <TouchableOpacity 
                        style={[styles.button, styles.allPostsButton]}
                        onPress={getAllSportsPosts}
                        disabled={loading}
                    >
                        <MaterialIcons name="list" size={16} color="#fff" />
                        <Text style={styles.buttonText}>All Posts</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.button, styles.clearButton]}
                        onPress={clearLogs}
                    >
                        <MaterialIcons name="clear" size={16} color="#fff" />
                        <Text style={styles.buttonText}>Clear</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.scrollView}>
                {/* Post Details */}
                {postDetails && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📊 Post Details</Text>
                        <View style={styles.detailCard}>
                            <Text style={styles.detailTitle}>{postDetails.title}</Text>
                            <Text style={styles.detailText}>ID: {postDetails.id}</Text>
                            <Text style={[styles.detailText, { 
                                color: postDetails.autoApprove ? '#27ae60' : '#e74c3c',
                                fontWeight: 'bold' 
                            }]}>
                                Auto Approve: {postDetails.autoApprove ? 'TRUE ✅' : 'FALSE ❌'}
                            </Text>
                            <Text style={styles.detailText}>
                                Creator: {postDetails.creator?.fullName || postDetails.userRes?.fullName || 'Unknown'}
                            </Text>
                            <Text style={styles.detailText}>
                                Participants: {postDetails.currentParticipants}/{postDetails.maxParticipants}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Live Logs */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📝 Debug Logs</Text>
                    {logs.map((log, index) => (
                        <View key={index} style={styles.logItem}>
                            <Text style={styles.logTime}>[{log.timestamp}]</Text>
                            <Text style={[
                                styles.logMessage,
                                { color: log.type === 'error' ? '#e74c3c' : 
                                         log.type === 'success' ? '#27ae60' : 
                                         log.type === 'warning' ? '#f39c12' : '#333' }
                            ]}>
                                {log.message}
                            </Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#fff',
        padding: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        textAlign: 'center',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        width: 80,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        backgroundColor: '#fff',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        gap: 5,
    },
    checkButton: {
        backgroundColor: '#3498db',
    },
    testButton: {
        backgroundColor: '#27ae60',
    },
    allPostsButton: {
        backgroundColor: '#9b59b6',
    },
    clearButton: {
        backgroundColor: '#e74c3c',
    },
    buttonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    scrollView: {
        flex: 1,
        padding: 15,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    detailCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    detailTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    detailText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    logItem: {
        flexDirection: 'row',
        marginBottom: 4,
        flexWrap: 'wrap',
    },
    logTime: {
        fontSize: 10,
        color: '#666',
        marginRight: 8,
        minWidth: 70,
    },
    logMessage: {
        fontSize: 11,
        flex: 1,
        fontFamily: 'monospace',
    },
});

export default AutoApproveDebugTool; 