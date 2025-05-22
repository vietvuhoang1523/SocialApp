// src/hooks/useConnection.js
import { useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import webSocketService from '../services/WebSocketService';

/**
 * Hook quản lý kết nối và tự động kết nối lại
 * @param {Object} currentUser - Thông tin người dùng hiện tại
 * @param {Object} chatPartner - Thông tin người nhận tin nhắn
 * @param {string} chatKey - Khóa định danh cho chat
 * @param {Function} onReconnect - Callback khi kết nối lại thành công
 * @returns {Object} Trạng thái kết nối và chức năng liên quan
 */
const useConnection = (currentUser, chatPartner, chatKey, onReconnect) => {
    const [connectionStatus, setConnectionStatus] = useState('checking');
    const [reconnecting, setReconnecting] = useState(false);
    const [netInfo, setNetInfo] = useState({});

    // In useConnection.js
    const handleConnection = useCallback(async () => {
        if (netInfo.isConnected) {
            setReconnecting(true);
            try {
                // Add timeout for connection attempt
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Connection timeout')), 10000)
                );

                await Promise.race([
                    webSocketService.connect(),
                    timeoutPromise
                ]);

                if (webSocketService.isConnected()) {
                    setConnectionStatus('connected');
                    if (typeof onReconnect === 'function') {
                        onReconnect();
                    }
                } else {
                    setConnectionStatus('disconnected');
                }
            } catch (error) {
                console.error('Connection error:', error);
                setConnectionStatus('disconnected');
                // Schedule retry
                setTimeout(handleConnection, 5000);
            } finally {
                setReconnecting(false);
            }
        } else {
            setConnectionStatus('disconnected');
        }
    }, [netInfo, onReconnect]);

    // Theo dõi thay đổi kết nối internet
    useEffect(() => {
        // Lấy trạng thái kết nối ban đầu
        const getInitialNetInfo = async () => {
            try {
                const state = await NetInfo.fetch();
                setNetInfo(state);
            } catch (error) {
                console.error('Lỗi khi lấy trạng thái kết nối:', error);
            }
        };

        getInitialNetInfo();

        // Đăng ký lắng nghe sự thay đổi kết nối
        const unsubscribe = NetInfo.addEventListener(state => {
            setNetInfo(state);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    // Xử lý kết nối khi netInfo thay đổi
    useEffect(() => {
        handleConnection();
    }, [netInfo, handleConnection]);

    // Thiết lập callback khi trạng thái WebSocket thay đổi
    useEffect(() => {
        const handleWebSocketConnection = (connected) => {
            setConnectionStatus(connected ? 'connected' : 'disconnected');
        };

        webSocketService.onConnectionChange(handleWebSocketConnection);

        return () => {
            webSocketService.offConnectionChange(handleWebSocketConnection);
        };
    }, []);

    // Theo dõi trạng thái ứng dụng (foreground/background)
    useEffect(() => {
        let appStateListener;

        try {
            // Import AppState
            import('react-native').then(({ AppState }) => {
                // Xử lý khi app trở lại foreground
                const handleAppStateChange = (nextAppState) => {
                    if (nextAppState === 'active') {
                        handleConnection();
                    }
                };

                // Đăng ký lắng nghe
                appStateListener = AppState.addEventListener('change', handleAppStateChange);
            });
        } catch (error) {
            console.error('Lỗi khi thiết lập AppState listener:', error);
        }

        return () => {
            if (appStateListener) {
                appStateListener.remove();
            }
        };
    }, [handleConnection]);

    // Thử kết nối lại thủ công
    const reconnect = useCallback(async () => {
        if (connectionStatus !== 'connected' && !reconnecting) {
            setReconnecting(true);

            try {
                await webSocketService.connect();

                if (webSocketService.isConnected()) {
                    setConnectionStatus('connected');
                    if (typeof onReconnect === 'function') {
                        onReconnect();
                    }
                } else {
                    setConnectionStatus('disconnected');
                }
            } catch (error) {
                console.error('Lỗi khi kết nối lại thủ công:', error);
                setConnectionStatus('disconnected');
            } finally {
                setReconnecting(false);
            }
        }
    }, [connectionStatus, reconnecting, onReconnect]);

    return {
        connectionStatus,
        reconnecting,
        netInfo,
        reconnect
    };
};

export default useConnection;