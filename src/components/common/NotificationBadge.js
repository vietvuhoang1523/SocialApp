import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import notificationService from '../../services/NotificationService';

const NotificationBadge = ({ count: propCount, size = 'medium' }) => {
    // Use prop count if provided, otherwise manage internally
    const [count, setCount] = useState(propCount || 0);
    const [animation] = useState(new Animated.Value(0));
    
    // Sizes based on the size prop
    const sizes = {
        small: { container: 16, font: 8 },
        medium: { container: 20, font: 10 },
        large: { container: 24, font: 12 }
    };
    
    const badgeSize = sizes[size] || sizes.medium;
    
    useEffect(() => {
        if (propCount !== undefined) {
            // If count is provided as prop, use it
            setCount(propCount);
        } else {
            // Otherwise fetch from service
            const fetchUnreadCount = async () => {
                try {
                    const unreadCount = await notificationService.getUnreadCount();
                    setCount(unreadCount);
                } catch (error) {
                    console.error('Error fetching notification count:', error);
                }
            };
            
            fetchUnreadCount();
        }
    }, [propCount]);
    
    // Animate when count changes
    useEffect(() => {
        if (count > 0) {
            Animated.sequence([
                Animated.timing(animation, {
                    toValue: 1.2,
                    duration: 100,
                    useNativeDriver: true
                }),
                Animated.timing(animation, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true
                })
            ]).start();
        } else {
            animation.setValue(0);
        }
    }, [count, animation]);
    
    // If count is 0, don't render anything
    if (count === 0) {
        return null;
    }
    
    return (
        <Animated.View 
            style={[
                styles.container, 
                { 
                    width: badgeSize.container,
                    height: badgeSize.container,
                    borderRadius: badgeSize.container / 2,
                    transform: [{ scale: animation }]
                }
            ]}
        >
            <Text style={[styles.text, { fontSize: badgeSize.font }]}>
                {count > 99 ? '99+' : count}
            </Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FF4236',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: -5,
        right: -5,
        zIndex: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
    },
    text: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        padding: 1,
    },
});

export default NotificationBadge; 