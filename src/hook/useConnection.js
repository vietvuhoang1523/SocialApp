// src/hook/useConnection.js
import { useState, useEffect, useCallback } from 'react';
import webSocketService from '../services/WebSocketService';

const useConnection = (currentUser, chatPartner, chatKey, onReconnect) => {
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [reconnecting, setReconnecting] = useState(false);

    useEffect(() => {
        if (!currentUser?.id || !chatPartner?.id) {
            return;
        }

        const handleConnectionChange = (connected) => {
            console.log('Connection status changed:', connected);

            if (connected) {
                setConnectionStatus('connected');
                setReconnecting(false);

                // Gọi callback khi kết nối lại thành công
                if (onReconnect) {
                    onReconnect();
                }
            } else {
                setConnectionStatus('disconnected');
                setReconnecting(true);

                // Thử kết nối lại sau 3 giây
                setTimeout(() => {
                    if (webSocketService.isConnected()) {
                        setReconnecting(false);
                    }
                }, 3000);
            }
        };

        // Đăng ký listener
        webSocketService.onConnectionChange(handleConnectionChange);

        // Kiểm tra trạng thái hiện tại
        const currentStatus = webSocketService.isConnected();
        setConnectionStatus(currentStatus ? 'connected' : 'disconnected');

        // Cleanup
        return () => {
            webSocketService.offConnectionChange(handleConnectionChange);
        };
    }, [currentUser?.id, chatPartner?.id, onReconnect]);

    const manualReconnect = useCallback(async () => {
        try {
            setReconnecting(true);
            await webSocketService.forceReconnect();
        } catch (error) {
            console.error('Manual reconnect failed:', error);
            setReconnecting(false);
        }
    }, []);

    return {
        connectionStatus,
        reconnecting,
        manualReconnect
    };
};

export default useConnection;