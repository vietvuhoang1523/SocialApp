import { useState, useEffect, useCallback } from 'react';
import webSocketService from '../services/WebSocketService';

const useChatWebSocket = (currentUser, chatPartner, onNewMessage) => {
    const [wsConnected, setWsConnected] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    // In useChatWebSocket.js
    useEffect(() => {
        const connectionKey = `chat_${currentUser.id}_${chatPartner.id}`;

        const handleConnectionChange = (connected) => {
            console.log('WebSocket connection status changed:', connected);
            setWsConnected(connected);

            if (!connected) {
                // Attempt to reconnect when connection is lost
                setTimeout(() => {
                    webSocketService.connect().catch(err => {
                        console.error('Reconnection attempt failed:', err);
                    });
                }, 5000);
            }
        };

        const handleMessage = (message) => {
            console.log('Received message:', message);
            onNewMessage(message);
        };

        // Setup listeners
        webSocketService.onConnectionChange(handleConnectionChange);
        webSocketService.onMessage(connectionKey, handleMessage);

        // Initial connection
        webSocketService.connect().catch(err => {
            console.error('Initial WebSocket connection failed:', err);
        });

        return () => {
            webSocketService.offConnectionChange(handleConnectionChange);
            webSocketService.offMessage(connectionKey);
        };
    }, [currentUser.id, chatPartner.id, onNewMessage]);

    // Gửi tin nhắn
    const sendMessageViaWebSocket = useCallback(async (message) => {
        try {
            console.log('Sending WebSocket message:', message);
            return await webSocketService.sendMessage(message);
        } catch (error) {
            console.error('Error sending WebSocket message:', error);
            return false;
        }
    }, []);

    // Gửi thông báo typing
    const sendTypingNotification = useCallback((isTyping = true) => {
        if (!wsConnected) return false;

        try {
            return webSocketService.sendTyping(chatPartner.id, isTyping);
        } catch (error) {
            console.error('Error sending typing notification:', error);
            return false;
        }
    }, [wsConnected, chatPartner]);

    return {
        wsConnected,
        isTyping,
        sendMessageViaWebSocket,
        sendTypingNotification
    };
};

export default useChatWebSocket;