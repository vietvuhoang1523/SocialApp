import React, { useEffect } from 'react';
import { Animated, View } from 'react-native';

const PulsingView = ({ children, style, pulseScale = 1.1, duration = 1000 }) => {
    const pulseValue = new Animated.Value(1);

    useEffect(() => {
        const createPulseAnimation = () => {
            Animated.sequence([
                Animated.timing(pulseValue, {
                    toValue: pulseScale,
                    duration: duration / 2,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseValue, {
                    toValue: 1,
                    duration: duration / 2,
                    useNativeDriver: true,
                }),
            ]).start(() => createPulseAnimation());
        };

        createPulseAnimation();
    }, [pulseScale, duration]);

    return (
        <Animated.View
            style={[
                style,
                {
                    transform: [{ scale: pulseValue }],
                },
            ]}
        >
            {children}
        </Animated.View>
    );
};

export default PulsingView; 