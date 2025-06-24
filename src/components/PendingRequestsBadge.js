import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ParticipantService from '../services/SportsPostParticipantService';

const PendingRequestsBadge = ({ navigation, style }) => {
    const [pendingCount, setPendingCount] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadPendingCount();
        
        // Refresh every 30 seconds
        const interval = setInterval(loadPendingCount, 30000);
        
        return () => clearInterval(interval);
    }, []);

    const loadPendingCount = async () => {
        try {
            setLoading(true);
            const response = await ParticipantService.getAllPendingRequestsForCurrentUser(0, 1);
            const totalCount = response.totalElements || response.total || 0;
            setPendingCount(totalCount);
        } catch (error) {
            console.error('Error loading pending requests count:', error);
            setPendingCount(0);
        } finally {
            setLoading(false);
        }
    };

    const handlePress = () => {
        navigation.navigate('AllPendingRequests');
    };

    if (pendingCount === 0) {
        return null;
    }

    return (
        <TouchableOpacity style={[styles.container, style]} onPress={handlePress}>
            <MaterialIcons name="notifications" size={20} color="#E91E63" />
            <Text style={styles.text}>
                {pendingCount} yêu cầu chờ duyệt
            </Text>
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingCount}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 25,
        marginHorizontal: 15,
        marginVertical: 5,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderLeftWidth: 4,
        borderLeftColor: '#E91E63',
    },
    text: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    badge: {
        backgroundColor: '#E91E63',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default PendingRequestsBadge; 