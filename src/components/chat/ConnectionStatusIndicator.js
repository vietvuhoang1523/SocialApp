import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ConnectionStatusIndicator = ({ status, reconnecting, onRetry }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Fade in the indicator
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Create pulsing animation for connecting state
    if (status === 'connecting' || reconnecting) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Stop pulsing for other states
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [status, reconnecting]);

  // Determine icon and color based on status
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: 'checkmark-circle',
          color: '#4CAF50',
          text: 'Kết nối thành công',
        };
      case 'connecting':
        return {
          icon: 'sync',
          color: '#FFC107',
          text: 'Đang kết nối...',
        };
      case 'error':
        return {
          icon: 'warning',
          color: '#F44336',
          text: 'Lỗi kết nối',
        };
      case 'disconnected':
        return {
          icon: 'close-circle',
          color: '#9E9E9E',
          text: 'Mất kết nối',
        };
      default:
        return {
          icon: 'help-circle',
          color: '#9E9E9E',
          text: 'Không xác định',
        };
    }
  };

  const { icon, color, text } = getStatusConfig();

  // Don't show when connected (to save space)
  if (status === 'connected' && !reconnecting) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.container,
        { opacity: fadeAnim }
      ]}
    >
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Ionicons name={icon} size={16} color={color} />
      </Animated.View>
      <Text style={[styles.text, { color }]}>
        {reconnecting ? 'Đang kết nối lại...' : text}
      </Text>
      {(status === 'error' || status === 'disconnected') && (
        <Text style={styles.retryText} onPress={onRetry}>
          Thử lại
        </Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 16,
    marginBottom: 8,
  },
  text: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  retryText: {
    fontSize: 12,
    marginLeft: 8,
    color: '#2196F3',
    fontWeight: '600',
  },
});

export default ConnectionStatusIndicator; 