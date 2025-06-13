// videoCallService.js - Service for video call functionality
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EMERGENCY_MODE } from '../../EmergencyMode';

const BASE_URL = 'http://192.168.100.193:8082/api/video-call';

class VideoCallService {
    constructor() {
        this.isConnected = false;
        this.currentCall = null;
    }

    // Get auth token
    async getAuthToken() {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            if (!token) {
                throw new Error('No authentication token found');
            }
            return token;
        } catch (error) {
            console.error('❌ Error getting auth token:', error);
            throw error;
        }
    }

    // Make authenticated API request
    async makeRequest(endpoint, options = {}) {
        try {
            const token = await this.getAuthToken();

            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            };

            const response = await fetch(`${BASE_URL}${endpoint}`, {
                ...defaultOptions,
                ...options,
                headers: {
                    ...defaultOptions.headers,
                    ...options.headers,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`❌ API Request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    // 📞 Initiate a video call
    async initiateCall(calleeId, callType = 'VIDEO') {
        try {
            console.log('📞 Initiating video call to user:', calleeId);

            if (EMERGENCY_MODE.enabled) {
                return this.mockInitiateCall(calleeId, callType);
            }

            const callRequest = {
                calleeId: parseInt(calleeId),
                callType: callType,
                recordingEnabled: false,
                allowScreenShare: true,
                isPrivate: true,
                clientInfo: 'React Native App'
            };

            const response = await this.makeRequest('/initiate', {
                method: 'POST',
                body: JSON.stringify(callRequest),
            });

            this.currentCall = response;
            console.log('✅ Call initiated successfully:', response.roomId);
            return response;
        } catch (error) {
            console.error('❌ Error initiating call:', error);
            throw error;
        }
    }

    // ✅ Accept incoming call
    async acceptCall(roomId) {
        try {
            console.log('✅ Accepting call:', roomId);

            if (EMERGENCY_MODE.enabled) {
                return this.mockAcceptCall(roomId);
            }

            const response = await this.makeRequest(`/accept/${roomId}`, {
                method: 'POST',
            });

            this.currentCall = response;
            console.log('✅ Call accepted successfully');
            return response;
        } catch (error) {
            console.error('❌ Error accepting call:', error);
            throw error;
        }
    }

    // ❌ Reject incoming call
    async rejectCall(roomId) {
        try {
            console.log('❌ Rejecting call:', roomId);

            if (EMERGENCY_MODE.enabled) {
                return this.mockRejectCall(roomId);
            }

            const response = await this.makeRequest(`/reject/${roomId}`, {
                method: 'POST',
            });

            this.currentCall = null;
            console.log('❌ Call rejected successfully');
            return response;
        } catch (error) {
            console.error('❌ Error rejecting call:', error);
            throw error;
        }
    }

    // 📞 End call
    async endCall(roomId) {
        try {
            console.log('📞 Ending call:', roomId);

            if (EMERGENCY_MODE.enabled) {
                return this.mockEndCall(roomId);
            }

            const response = await this.makeRequest(`/end/${roomId}`, {
                method: 'POST',
            });

            this.currentCall = null;
            console.log('📞 Call ended successfully');
            return response;
        } catch (error) {
            console.error('❌ Error ending call:', error);
            throw error;
        }
    }

    // 📋 Get call history
    async getCallHistory(page = 0, size = 20) {
        try {
            console.log('📋 Getting call history...');

            if (EMERGENCY_MODE.enabled) {
                return this.mockGetCallHistory();
            }

            const response = await this.makeRequest(`/history?page=${page}&size=${size}`);
            console.log(`✅ Retrieved ${response.content?.length || 0} call history items`);
            return response;
        } catch (error) {
            console.error('❌ Error getting call history:', error);
            throw error;
        }
    }

    // 🔴 Get active calls
    async getActiveCalls() {
        try {
            console.log('🔴 Getting active calls...');

            if (EMERGENCY_MODE.enabled) {
                return [];
            }

            const response = await this.makeRequest('/active');
            console.log(`✅ Found ${response.length} active calls`);
            return response;
        } catch (error) {
            console.error('❌ Error getting active calls:', error);
            return [];
        }
    }

    // 📵 Get missed calls
    async getMissedCalls() {
        try {
            console.log('📵 Getting missed calls...');

            if (EMERGENCY_MODE.enabled) {
                return this.mockGetMissedCalls();
            }

            const response = await this.makeRequest('/missed');
            console.log(`✅ Found ${response.length} missed calls`);
            return response;
        } catch (error) {
            console.error('❌ Error getting missed calls:', error);
            return [];
        }
    }

    // 🏥 Health check
    async healthCheck() {
        try {
            const response = await this.makeRequest('/health');
            console.log('✅ Video call service is healthy');
            return response;
        } catch (error) {
            console.error('❌ Video call service health check failed:', error);
            return { status: 'UNHEALTHY', error: error.message };
        }
    }

    // MOCK METHODS FOR EMERGENCY MODE
    mockInitiateCall(calleeId, callType) {
        return {
            id: Date.now(),
            roomId: `room_mock_${Date.now()}`,
            callType: callType,
            status: 'RINGING',
            caller: { id: 1, fullName: 'Current User' },
            callee: { id: calleeId, fullName: 'Test User' },
            createdAt: new Date().toISOString(),
            recordingEnabled: false,
            allowScreenShare: true,
            isPrivate: true
        };
    }

    mockAcceptCall(roomId) {
        return {
            id: Date.now(),
            roomId: roomId,
            status: 'ACTIVE',
            startTime: new Date().toISOString()
        };
    }

    mockRejectCall(roomId) {
        return {
            id: Date.now(),
            roomId: roomId,
            status: 'REJECTED',
            endTime: new Date().toISOString()
        };
    }

    mockEndCall(roomId) {
        return {
            id: Date.now(),
            roomId: roomId,
            status: 'ENDED',
            endTime: new Date().toISOString(),
            durationSeconds: 120
        };
    }

    mockGetCallHistory() {
        return {
            content: [
                {
                    id: 1,
                    roomId: 'room_mock_1',
                    callType: 'VIDEO',
                    status: 'ENDED',
                    caller: { id: 1, fullName: 'Current User' },
                    callee: { id: 2, fullName: 'John Doe' },
                    createdAt: new Date(Date.now() - 3600000).toISOString(),
                    durationSeconds: 300
                },
                {
                    id: 2,
                    roomId: 'room_mock_2',
                    callType: 'VIDEO',
                    status: 'MISSED',
                    caller: { id: 3, fullName: 'Jane Smith' },
                    callee: { id: 1, fullName: 'Current User' },
                    createdAt: new Date(Date.now() - 7200000).toISOString(),
                    durationSeconds: 0
                }
            ],
            totalElements: 2,
            totalPages: 1,
            size: 20,
            number: 0
        };
    }

    mockGetMissedCalls() {
        return [
            {
                id: 2,
                roomId: 'room_mock_2',
                callType: 'VIDEO',
                status: 'MISSED',
                caller: { id: 3, fullName: 'Jane Smith' },
                callee: { id: 1, fullName: 'Current User' },
                createdAt: new Date(Date.now() - 7200000).toISOString(),
                durationSeconds: 0
            }
        ];
    }

    // Get current call
    getCurrentCall() {
        return this.currentCall;
    }

    // Clear current call
    clearCurrentCall() {
        this.currentCall = null;
    }

    // Check if user has an active call
    hasActiveCall() {
        return this.currentCall && ['RINGING', 'CONNECTING', 'ACTIVE'].includes(this.currentCall.status);
    }
}

export default new VideoCallService();
