import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const LoadingSpinner = ({ size = 40, colors = ['#E91E63', '#F06292'] }) => {
    const spinValue = new Animated.Value(0);

    useEffect(() => {
        const spin = () => {
            spinValue.setValue(0);
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 1000,
                easing: Easing.linear,
                useNativeDriver: true,
            }).start(() => spin());
        };
        spin();
    }, []);

    const rotate = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.spinner,
                    {
                        width: size,
                        height: size,
                        transform: [{ rotate }],
                    },
                ]}
            >
                <LinearGradient
                    colors={colors}
                    style={[styles.gradient, { width: size, height: size }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    spinner: {
        borderRadius: 50,
        borderWidth: 3,
        borderColor: 'transparent',
        borderTopColor: '#E91E63',
        borderRightColor: '#E91E63',
    },
    gradient: {
        borderRadius: 50,
        opacity: 0.3,
    },
});

export default LoadingSpinner; 