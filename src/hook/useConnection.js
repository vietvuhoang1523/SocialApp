// src/hook/useConnection.js
import { useState, useEffect, useCallback, useRef } from 'react';
import webSocketService from '../services/WebSocketService';
import webSocketReconnectionManager from '../services/WebSocketReconnectionManager';

const useConnection = (currentUser, chatPartner, chatKey, onReconnect) => {
    const [connectionStatus, setConnectionStatus] = useState('unknown');
    const [reconnecting, setReconnecting] = useState(false);
    const [reconnectAttempt, setReconnectAttempt] = useState(0);
    const [maxAttempts, setMaxAttempts] = useState(10);
    const listenerKeys = useRef({});

    useEffect(() => {
        if (!currentUser?.id || !chatPartner?.id) {
            return;
        }

        const setupConnectionMonitoring = () => {
            // Check initial connection status
            const initialStatus = webSocketService.isConnected() ? 'connected' : 'disconnected';
            setConnectionStatus(initialStatus);

            // Listen for WebSocket connection status changes
            const connectionStatusKey = webSocketService.on('connectionStatus', (status) => {
                console.log(`🔌 WebSocket connection status changed: ${status}`);
                setConnectionStatus(status);
                
                if (status === 'connected') {
                    // Reset reconnection state when connected
                    setReconnecting(false);
                    webSocketReconnectionManager.resetAttempts();
                    
                    // Call onReconnect callback
                    if (onReconnect) {
                        onReconnect();
                    }
                } else if (status === 'disconnected' || status === 'error') {
                    // Start reconnection process when disconnected
                    if (!webSocketReconnectionManager.isAttemptingReconnect()) {
                        webSocketReconnectionManager.startReconnection();
                    }
                }
            });

            // Listen for reconnection manager events
            listenerKeys.current.reconnecting = webSocketReconnectionManager.on('reconnecting', (data) => {
                setReconnecting(true);
                setReconnectAttempt(data.attempt);
                setMaxAttempts(data.max);
            });

            listenerKeys.current.reconnected = webSocketReconnectionManager.on('reconnected', () => {
                setReconnecting(false);
                setConnectionStatus('connected');
                
                // Call onReconnect callback
                if (onReconnect) {
                    onReconnect();
                }
            });

            listenerKeys.current.maxAttemptsReached = webSocketReconnectionManager.on('maxAttemptsReached', () => {
                setReconnecting(false);
                setConnectionStatus('error');
            });

            return () => {
                // Cleanup listeners
                webSocketService.off('connectionStatus', connectionStatusKey);
                Object.keys(listenerKeys.current).forEach(key => {
                    if (key.startsWith('reconnecting')) {
                        webSocketReconnectionManager.off('reconnecting', listenerKeys.current[key]);
                    } else if (key.startsWith('reconnected')) {
                        webSocketReconnectionManager.off('reconnected', listenerKeys.current[key]);
                    } else if (key.startsWith('maxAttemptsReached')) {
                        webSocketReconnectionManager.off('maxAttemptsReached', listenerKeys.current[key]);
                    }
                });
            };
        };

        const cleanup = setupConnectionMonitoring();
        return cleanup;
    }, [currentUser?.id, chatPartner?.id, onReconnect]);

    // Force manual reconnection
    const manualReconnect = useCallback(async () => {
        try {
            setReconnecting(true);
            await webSocketReconnectionManager.forceReconnect();
        } catch (error) {
            console.error('❌ Manual reconnect failed:', error);
            setReconnecting(false);
        }
    }, []);

    return {
        connectionStatus,
        reconnecting,
        reconnectAttempt,
        maxAttempts,
        manualReconnect
    };
};

export default useConnection;