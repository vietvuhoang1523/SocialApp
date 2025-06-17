import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import webSocketService from '../../services/WebSocketService';
import webSocketReconnectionManager from '../../services/WebSocketReconnectionManager';

/**
 * ConnectionMonitor - Monitors WebSocket connection status and provides reconnection options
 * 
 * This component displays the current connection status and allows users to manually
 * reconnect when the connection is lost.
 */
const ConnectionMonitor = ({ onReconnect }) => {
  const [connectionStatus, setConnectionStatus] = useState('unknown');
  const [reconnecting, setReconnecting] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(10);
  
  // Animation refs
  const slideAnim = useRef(new Animated.Value(-60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Listener refs
  const listenerKeys = useRef({});
  
  useEffect(() => {
    // Set up WebSocket connection monitoring
    const setupMonitoring = () => {
      // Check initial connection status
      const initialStatus = webSocketService.isConnected() ? 'connected' : 'disconnected';
      setConnectionStatus(initialStatus);
      
      // Only show for non-connected states
      setVisible(initialStatus !== 'connected');
      
      // Listen for WebSocket connection status changes
      listenerKeys.current.connectionStatus = webSocketService.on('connectionStatus', (status) => {
        console.log(`🔌 WebSocket connection status changed: ${status}`);
        setConnectionStatus(status);
        
        // Show for non-connected states, hide for connected
        setVisible(status !== 'connected');
        
        if (status === 'connected') {
          // Hide after a brief delay when connected
          setTimeout(() => {
            hideMonitor();
          }, 2000);
          
          // Reset reconnection state
          setReconnecting(false);
        }
      });
      
      // Listen for reconnection manager events
      listenerKeys.current.reconnecting = webSocketReconnectionManager.on('reconnecting', (data) => {
        setReconnecting(true);
        setReconnectAttempt(data.attempt);
        setMaxAttempts(data.max);
        showMonitor();
      });
      
      listenerKeys.current.reconnected = webSocketReconnectionManager.on('reconnected', () => {
        setReconnecting(false);
        setConnectionStatus('connected');
        
        // Hide after a brief delay
        setTimeout(() => {
          hideMonitor();
        }, 2000);
      });
      
      listenerKeys.current.maxAttemptsReached = webSocketReconnectionManager.on('maxAttemptsReached', () => {
        setReconnecting(false);
        setConnectionStatus('error');
        showMonitor();
      });
    };
    
    setupMonitoring();
    
    // Clean up listeners
    return () => {
      Object.values(listenerKeys.current).forEach(key => {
        if (key) {
          webSocketService.off('connectionStatus', key);
          webSocketReconnectionManager.off('reconnecting', key);
          webSocketReconnectionManager.off('reconnected', key);
          webSocketReconnectionManager.off('maxAttemptsReached', key);
        }
      });
    };
  }, []);
  
  // Show monitor with animation
  const showMonitor = () => {
    setVisible(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  // Hide monitor with animation
  const hideMonitor = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -60,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
    });
  };
  
  // Handle manual reconnection
  const handleReconnect = () => {
    webSocketReconnectionManager.forceReconnect();
    
    if (onReconnect) {
      onReconnect();
    }
  };
  
  // Don't render if not visible
  if (!visible) {
    return null;
  }
  
  // Get status configuration
  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: 'checkmark-circle',
          color: '#4CAF50',
          text: 'Kết nối thành công',
          showRetry: false,
        };
      case 'connecting':
        return {
          icon: 'sync',
          color: '#FFC107',
          text: 'Đang kết nối...',
          showRetry: false,
        };
      case 'error':
        return {
          icon: 'warning',
          color: '#F44336',
          text: 'Lỗi kết nối',
          showRetry: true,
        };
      case 'disconnected':
        return {
          icon: 'close-circle',
          color: '#9E9E9E',
          text: 'Mất kết nối',
          showRetry: true,
        };
      default:
        return {
          icon: 'help-circle',
          color: '#9E9E9E',
          text: 'Không xác định',
          showRetry: true,
        };
    }
  };
  
  const { icon, color, text, showRetry } = getStatusConfig();
  
  return (
    <Animated.View 
      style={[
        styles.container,
        { 
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
        }
      ]}
    >
      <View style={styles.content}>
        <Ionicons name={icon} size={16} color={color} />
        <Text style={styles.text}>
          {reconnecting 
            ? `Đang kết nối lại... (${reconnectAttempt}/${maxAttempts})` 
            : text
          }
        </Text>
        {(showRetry || reconnecting) && (
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={handleReconnect}
            disabled={reconnecting}
          >
            <Text style={[
              styles.retryText,
              reconnecting && styles.retryTextDisabled
            ]}>
              {reconnecting ? 'Đang thử lại...' : 'Thử lại'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  text: {
    color: 'white',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  retryButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
  },
  retryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  retryTextDisabled: {
    opacity: 0.5,
  },
});

export default ConnectionMonitor; 