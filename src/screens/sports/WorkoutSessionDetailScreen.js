import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';

// Components
import LoadingSpinner from '../../components/LoadingSpinner';
import { useProfileContext } from '../../components/ProfileContext';

// Services
import workoutService from '../../services/workoutService';

const WorkoutSessionDetailScreen = ({ route, navigation }) => {
    const { sessionId } = route.params;
    const { userProfile } = useProfileContext();
    
    // State
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Fetch session data
    useEffect(() => {
        const fetchSessionDetails = async () => {
            try {
                setLoading(true);
                const response = await workoutService.getWorkoutSessionById(sessionId);
                setSession(response);
            } catch (err) {
                console.error('Error fetching workout session:', err);
                setError('Không thể tải thông tin buổi tập. Vui lòng thử lại sau.');
            } finally {
                setLoading(false);
            }
        };

        fetchSessionDetails();
    }, [sessionId]);

    // Handle delete session
    const handleDeleteSession = async () => {
        Alert.alert(
            'Xóa buổi tập',
            'Bạn có chắc chắn muốn xóa buổi tập này không?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setDeleting(true);
                            await workoutService.deleteWorkoutSession(sessionId);
                            Alert.alert('Thành công', 'Đã xóa buổi tập');
                            navigation.goBack();
                        } catch (err) {
                            console.error('Error deleting workout session:', err);
                            Alert.alert('Lỗi', 'Không thể xóa buổi tập. Vui lòng thử lại sau.');
                        } finally {
                            setDeleting(false);
                        }
                    }
                }
            ]
        );
    };

    // Render loading state
    if (loading) {
        return <LoadingSpinner />;
    }

    // Render error state
    if (error) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.retryButtonText}>Quay lại</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // Format workout duration
    const formatDuration = (minutes) => {
        if (!minutes) return '0 phút';
        
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        if (hours === 0) return `${mins} phút`;
        if (mins === 0) return `${hours} giờ`;
        return `${hours} giờ ${mins} phút`;
    };

    // Get mood icon and color
    const getMoodData = (mood) => {
        switch (mood) {
            case 'EXCELLENT':
                return { icon: 'happy-outline', color: '#4CAF50', text: 'Tuyệt vời' };
            case 'GOOD':
                return { icon: 'smile-outline', color: '#8BC34A', text: 'Tốt' };
            case 'FAIR':
                return { icon: 'sad-outline', color: '#FFC107', text: 'Bình thường' };
            case 'POOR':
                return { icon: 'sad', color: '#FF5722', text: 'Không tốt' };
            default:
                return { icon: 'help-circle-outline', color: '#9E9E9E', text: 'Không xác định' };
        }
    };

    // Get intensity color
    const getIntensityColor = (intensity) => {
        switch (intensity) {
            case 'HIGH':
                return '#F44336';
            case 'MEDIUM':
                return '#FF9800';
            case 'LOW':
                return '#4CAF50';
            default:
                return '#9E9E9E';
        }
    };

    const moodData = getMoodData(session?.mood);
    const intensityColor = getIntensityColor(session?.intensity);
    const isCurrentUserOwner = session?.userId === userProfile?.id;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#E91E63" />
            
            {/* Header */}
            <LinearGradient
                colors={['#E91E63', '#C2185B']}
                style={styles.header}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chi tiết buổi tập</Text>
                {isCurrentUserOwner && (
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={() => navigation.navigate('EditWorkoutSession', { session })}
                        >
                            <Ionicons name="create-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={handleDeleteSession}
                            disabled={deleting}
                        >
                            {deleting ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons name="trash-outline" size={24} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </LinearGradient>

            <ScrollView style={styles.scrollView}>
                {/* Sport Type Card */}
                <View style={styles.card}>
                    <LinearGradient
                        colors={['rgba(233, 30, 99, 0.1)', 'rgba(233, 30, 99, 0.05)']}
                        style={styles.sportTypeContainer}
                    >
                        <View style={styles.sportIconContainer}>
                            <Ionicons 
                                name={session?.sportType === 'RUNNING' ? 'walk-outline' : 'barbell-outline'} 
                                size={32} 
                                color="#E91E63" 
                            />
                        </View>
                        <View style={styles.sportInfoContainer}>
                            <Text style={styles.sportTypeText}>{session?.sportType}</Text>
                            <Text style={styles.dateText}>
                                {moment(session?.date).format('DD/MM/YYYY')}
                            </Text>
                        </View>
                    </LinearGradient>
                </View>

                {/* Stats Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="stats-chart-outline" size={22} color="#E91E63" />
                        <Text style={styles.cardTitle}>Thống kê buổi tập</Text>
                    </View>
                    
                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{formatDuration(session?.durationMinutes)}</Text>
                            <Text style={styles.statLabel}>Thời gian</Text>
                        </View>
                        
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>
                                {session?.caloriesBurned || 0} <Text style={styles.statUnit}>kcal</Text>
                            </Text>
                            <Text style={styles.statLabel}>Calo đã đốt</Text>
                        </View>
                        
                        <View style={styles.statItem}>
                            <View style={[styles.intensityIndicator, { backgroundColor: intensityColor }]}>
                                <Text style={styles.intensityText}>{session?.intensity}</Text>
                            </View>
                            <Text style={styles.statLabel}>Cường độ</Text>
                        </View>
                        
                        <View style={styles.statItem}>
                            <View style={styles.moodContainer}>
                                <Ionicons name={moodData.icon} size={24} color={moodData.color} />
                                <Text style={[styles.moodText, { color: moodData.color }]}>{moodData.text}</Text>
                            </View>
                            <Text style={styles.statLabel}>Cảm xúc</Text>
                        </View>
                    </View>
                </View>

                {/* Distance Card (if applicable) */}
                {session?.distance && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="map-outline" size={22} color="#E91E63" />
                            <Text style={styles.cardTitle}>Khoảng cách</Text>
                        </View>
                        
                        <View style={styles.distanceContainer}>
                            <Text style={styles.distanceValue}>
                                {session.distance} <Text style={styles.distanceUnit}>km</Text>
                            </Text>
                        </View>
                    </View>
                )}

                {/* Notes Card */}
                {session?.notes && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="document-text-outline" size={22} color="#E91E63" />
                            <Text style={styles.cardTitle}>Ghi chú</Text>
                        </View>
                        
                        <Text style={styles.notesText}>{session.notes}</Text>
                    </View>
                )}

                {/* Location Card (if applicable) */}
                {session?.location && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="location-outline" size={22} color="#E91E63" />
                            <Text style={styles.cardTitle}>Địa điểm</Text>
                        </View>
                        
                        <Text style={styles.locationText}>{session.location}</Text>
                        
                        {/* Placeholder for map */}
                        <View style={styles.mapPlaceholder}>
                            <Ionicons name="map" size={32} color="#bbb" />
                            <Text style={styles.mapPlaceholderText}>Bản đồ</Text>
                        </View>
                    </View>
                )}

                {/* Share Button */}
                <TouchableOpacity style={styles.shareButton}>
                    <LinearGradient
                        colors={['#E91E63', '#C2185B']}
                        style={styles.shareButtonGradient}
                    >
                        <Ionicons name="share-social-outline" size={20} color="#fff" />
                        <Text style={styles.shareButtonText}>Chia sẻ buổi tập</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 15,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
        textAlign: 'center',
    },
    headerActions: {
        flexDirection: 'row',
    },
    headerButton: {
        padding: 5,
        marginLeft: 10,
    },
    scrollView: {
        flex: 1,
        padding: 15,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 8,
    },
    sportTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 10,
    },
    sportIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(233, 30, 99, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    sportInfoContainer: {
        flex: 1,
    },
    sportTypeText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    dateText: {
        fontSize: 14,
        color: '#666',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statItem: {
        width: '48%',
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    statUnit: {
        fontSize: 14,
        fontWeight: 'normal',
        color: '#666',
    },
    statLabel: {
        fontSize: 12,
        color: '#888',
    },
    intensityIndicator: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        marginBottom: 5,
    },
    intensityText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    moodContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    moodText: {
        marginLeft: 5,
        fontWeight: '600',
        fontSize: 14,
    },
    distanceContainer: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    distanceValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
    },
    distanceUnit: {
        fontSize: 18,
        fontWeight: 'normal',
        color: '#666',
    },
    notesText: {
        fontSize: 15,
        color: '#333',
        lineHeight: 22,
    },
    locationText: {
        fontSize: 15,
        color: '#333',
        marginBottom: 15,
    },
    mapPlaceholder: {
        backgroundColor: '#f0f0f0',
        height: 150,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapPlaceholderText: {
        color: '#999',
        marginTop: 5,
    },
    shareButton: {
        borderRadius: 25,
        overflow: 'hidden',
        marginBottom: 30,
    },
    shareButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
    },
    shareButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#E91E63',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default WorkoutSessionDetailScreen; 