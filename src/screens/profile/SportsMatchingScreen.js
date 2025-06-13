import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    Animated
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Services
import sportsProfileService from '../../services/sportsProfileService';

const { width: screenWidth } = Dimensions.get('window');

// Enums matching backend
const SportType = {
    FOOTBALL: { name: 'FOOTBALL', display: 'Bóng đá', icon: 'football', color: '#4CAF50' },
    BASKETBALL: { name: 'BASKETBALL', display: 'Bóng rổ', icon: 'basketball', color: '#FF9800' },
    TENNIS: { name: 'TENNIS', display: 'Tennis', icon: 'tennisball', color: '#2196F3' },
    BADMINTON: { name: 'BADMINTON', display: 'Cầu lông', icon: 'fitness', color: '#9C27B0' },
    VOLLEYBALL: { name: 'VOLLEYBALL', display: 'Bóng chuyền', icon: 'american-football', color: '#F44336' },
    SWIMMING: { name: 'SWIMMING', display: 'Bơi lội', icon: 'water', color: '#00BCD4' },
    RUNNING: { name: 'RUNNING', display: 'Chạy bộ', icon: 'walk', color: '#607D8B' },
    GYM: { name: 'GYM', display: 'Gym', icon: 'barbell', color: '#795548' },
    CYCLING: { name: 'CYCLING', display: 'Đạp xe', icon: 'bicycle', color: '#8BC34A' },
    YOGA: { name: 'YOGA', display: 'Yoga', icon: 'leaf', color: '#CDDC39' }
};

const SkillLevel = {
    BEGINNER: { name: 'BEGINNER', display: 'Mới bắt đầu', color: '#4CAF50' },
    INTERMEDIATE: { name: 'INTERMEDIATE', display: 'Trung bình', color: '#FF9800' },
    ADVANCED: { name: 'ADVANCED', display: 'Nâng cao', color: '#F44336' },
    PROFESSIONAL: { name: 'PROFESSIONAL', display: 'Chuyên nghiệp', color: '#9C27B0' }
};

const SportsMatchingScreen = ({ navigation, route }) => {
    const currentUser = route.params?.currentUser;

    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    // State
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('compatible'); // compatible, partner, team, training, coaching
    const [compatibleUsers, setCompatibleUsers] = useState([]);
    const [partnerSeekers, setPartnerSeekers] = useState([]);
    const [teamSeekers, setTeamSeekers] = useState([]);
    const [trainingUsers, setTrainingUsers] = useState([]);
    const [coachingUsers, setCoachingUsers] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    // Entrance animation
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    // Load data
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                loadCompatibleUsers(),
                loadPartnerSeekers(),
                loadTeamSeekers(),
                loadTrainingUsers(),
                loadCoachingUsers()
            ]);
        } catch (error) {
            console.error('Error loading matching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCompatibleUsers = async () => {
        try {
            const response = await sportsProfileService.findCompatibleUsers();
            setCompatibleUsers(response || []);
        } catch (error) {
            console.error('Error loading compatible users:', error);
            // Mock data for testing
            setCompatibleUsers([
                {
                    id: 1,
                    user: {
                        id: 1,
                        fullName: 'Nguyễn Văn A',
                        avatar: 'https://i.pravatar.cc/150?img=1',
                        city: 'TP. Hồ Chí Minh'
                    },
                    favoriteSports: ['FOOTBALL', 'BASKETBALL'],
                    skillLevel: 'INTERMEDIATE',
                    activityLevel: 'MODERATE',
                    compatibilityScore: 85,
                    lookingForPartner: true,
                    availableForTraining: true
                },
                {
                    id: 2,
                    user: {
                        id: 2,
                        fullName: 'Trần Thị B',
                        avatar: 'https://i.pravatar.cc/150?img=2',
                        city: 'TP. Hồ Chí Minh'
                    },
                    favoriteSports: ['TENNIS', 'YOGA'],
                    skillLevel: 'BEGINNER',
                    activityLevel: 'HIGH',
                    compatibilityScore: 78,
                    lookingForTeam: true,
                    openToCoaching: true
                }
            ]);
        }
    };

    const loadPartnerSeekers = async () => {
        try {
            const response = await sportsProfileService.getUsersLookingForPartner();
            setPartnerSeekers(response || []);
        } catch (error) {
            console.error('Error loading partner seekers:', error);
            setPartnerSeekers([]);
        }
    };

    const loadTeamSeekers = async () => {
        try {
            const response = await sportsProfileService.getUsersLookingForTeam();
            setTeamSeekers(response || []);
        } catch (error) {
            console.error('Error loading team seekers:', error);
            setTeamSeekers([]);
        }
    };

    const loadTrainingUsers = async () => {
        try {
            const response = await sportsProfileService.getUsersAvailableForTraining();
            setTrainingUsers(response || []);
        } catch (error) {
            console.error('Error loading training users:', error);
            setTrainingUsers([]);
        }
    };

    const loadCoachingUsers = async () => {
        try {
            const response = await sportsProfileService.getUsersOpenToCoaching();
            setCoachingUsers(response || []);
        } catch (error) {
            console.error('Error loading coaching users:', error);
            setCoachingUsers([]);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const getActiveData = () => {
        switch (activeTab) {
            case 'compatible': return compatibleUsers;
            case 'partner': return partnerSeekers;
            case 'team': return teamSeekers;
            case 'training': return trainingUsers;
            case 'coaching': return coachingUsers;
            default: return [];
        }
    };

    const handleUserPress = (user) => {
        navigation.navigate('SportsProfileScreen', {
            userId: user.user?.id || user.id,
            currentUser: currentUser,
            isViewMode: true
        });
    };

    const renderTabButtons = () => {
        const tabs = [
            { key: 'compatible', label: 'Phù hợp', icon: 'heart', count: compatibleUsers.length },
            { key: 'partner', label: 'Tìm đối tác', icon: 'people', count: partnerSeekers.length },
            { key: 'team', label: 'Tìm đội', icon: 'american-football', count: teamSeekers.length },
            { key: 'training', label: 'Tập luyện', icon: 'fitness', count: trainingUsers.length },
            { key: 'coaching', label: 'Huấn luyện', icon: 'school', count: coachingUsers.length }
        ];

        return (
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.tabScrollView}
                contentContainerStyle={styles.tabContainer}
            >
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tabButton, activeTab === tab.key && styles.activeTab]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <LinearGradient
                            colors={activeTab === tab.key 
                                ? ['#E91E63', '#C2185B'] 
                                : ['transparent', 'transparent']
                            }
                            style={styles.tabButtonGradient}
                        >
                            <Ionicons 
                                name={tab.icon} 
                                size={18} 
                                color={activeTab === tab.key ? '#fff' : '#666'} 
                            />
                            <Text style={[
                                styles.tabText, 
                                activeTab === tab.key && styles.activeTabText
                            ]}>
                                {tab.label}
                            </Text>
                            {tab.count > 0 && (
                                <View style={styles.tabBadge}>
                                    <Text style={styles.tabBadgeText}>{tab.count}</Text>
                                </View>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        );
    };

    const renderSportChips = (sports) => {
        if (!sports || sports.length === 0) return null;
        
        return (
            <View style={styles.sportChipsContainer}>
                {sports.slice(0, 3).map((sport, index) => {
                    const sportInfo = SportType[sport] || { display: sport, color: '#999' };
                    return (
                        <View 
                            key={index} 
                            style={[styles.sportChip, { backgroundColor: sportInfo.color }]}
                        >
                            <Text style={styles.sportChipText}>{sportInfo.display}</Text>
                        </View>
                    );
                })}
                {sports.length > 3 && (
                    <View style={[styles.sportChip, { backgroundColor: '#999' }]}>
                        <Text style={styles.sportChipText}>+{sports.length - 3}</Text>
                    </View>
                )}
            </View>
        );
    };

    const renderUserCard = ({ item, index }) => {
        const user = item.user || item;
        const skillInfo = SkillLevel[item.skillLevel] || { display: item.skillLevel, color: '#999' };
        
        return (
            <Animated.View
                style={[
                    styles.userCard,
                    {
                        opacity: fadeAnim,
                        transform: [
                            {
                                translateY: slideAnim.interpolate({
                                    inputRange: [0, 30],
                                    outputRange: [0, 30 + (index * 10)]
                                })
                            }
                        ]
                    }
                ]}
            >
                <TouchableOpacity
                    onPress={() => handleUserPress(item)}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#fff', 'rgba(248, 249, 250, 0.8)']}
                        style={styles.userCardGradient}
                    >
                        {/* Header with avatar and name */}
                        <View style={styles.userCardHeader}>
                            <View style={styles.userAvatarContainer}>
                                <Image
                                    source={{ uri: user.avatar || 'https://via.placeholder.com/60' }}
                                    style={styles.userAvatar}
                                />
                                {item.compatibilityScore && (
                                    <View style={styles.compatibilityBadge}>
                                        <Text style={styles.compatibilityText}>
                                            {Math.round(item.compatibilityScore)}%
                                        </Text>
                                    </View>
                                )}
                            </View>
                            
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>{user.fullName}</Text>
                                <Text style={styles.userLocation}>{user.city || 'Không rõ'}</Text>
                                
                                <View style={styles.skillContainer}>
                                    <View style={[styles.skillBadge, { backgroundColor: skillInfo.color }]}>
                                        <Text style={styles.skillText}>{skillInfo.display}</Text>
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity 
                                style={styles.actionButton}
                                onPress={() => {
                                    // TODO: Implement contact action
                                    console.log('Contact user:', user.id);
                                }}
                            >
                                <LinearGradient
                                    colors={['#E91E63', '#C2185B']}
                                    style={styles.actionButtonGradient}
                                >
                                    <Ionicons name="chatbubble" size={20} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        {/* Sports chips */}
                        {renderSportChips(item.favoriteSports)}

                        {/* Status indicators */}
                        <View style={styles.statusContainer}>
                            {item.lookingForPartner && (
                                <View style={styles.statusTag}>
                                    <Ionicons name="people" size={12} color="#4CAF50" />
                                    <Text style={styles.statusText}>Tìm đối tác</Text>
                                </View>
                            )}
                            {item.lookingForTeam && (
                                <View style={styles.statusTag}>
                                    <Ionicons name="american-football" size={12} color="#2196F3" />
                                    <Text style={styles.statusText}>Tìm đội</Text>
                                </View>
                            )}
                            {item.availableForTraining && (
                                <View style={styles.statusTag}>
                                    <Ionicons name="fitness" size={12} color="#FF9800" />
                                    <Text style={styles.statusText}>Tập luyện</Text>
                                </View>
                            )}
                            {item.openToCoaching && (
                                <View style={styles.statusTag}>
                                    <Ionicons name="school" size={12} color="#9C27B0" />
                                    <Text style={styles.statusText}>Huấn luyện</Text>
                                </View>
                            )}
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const renderEmptyState = () => (
        <Animated.View 
            style={[
                styles.emptyContainer,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                }
            ]}
        >
            <Ionicons name="search" size={64} color="#E91E63" />
            <Text style={styles.emptyTitle}>Không tìm thấy người dùng</Text>
            <Text style={styles.emptySubtitle}>
                Hiện tại chưa có người dùng nào phù hợp với tiêu chí này.
                Hãy thử lại sau hoặc cập nhật profile của bạn.
            </Text>
            <TouchableOpacity 
                style={styles.refreshButton}
                onPress={onRefresh}
            >
                <LinearGradient
                    colors={['#E91E63', '#C2185B']}
                    style={styles.refreshButtonGradient}
                >
                    <Ionicons name="refresh" size={20} color="#fff" />
                    <Text style={styles.refreshButtonText}>Làm mới</Text>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#E91E63" />
                <LinearGradient colors={['#E91E63', '#C2185B']} style={styles.header}>
                    <Text style={styles.headerTitle}>Tìm kiếm đối tác</Text>
                </LinearGradient>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#E91E63" />
                    <Text style={styles.loadingText}>Đang tìm kiếm người dùng phù hợp...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#E91E63" />
            
            {/* Header */}
            <LinearGradient colors={['#E91E63', '#C2185B', '#AD1457']} style={styles.header}>
                <Animated.View 
                    style={[
                        styles.headerContent,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    
                    <Text style={styles.headerTitle}>🏃‍♂️ Tìm đối tác thể thao</Text>
                    
                    <TouchableOpacity
                        style={styles.refreshHeaderButton}
                        onPress={onRefresh}
                    >
                        <Ionicons name="refresh" size={24} color="#fff" />
                    </TouchableOpacity>
                </Animated.View>
            </LinearGradient>

            {/* Tab buttons */}
            <Animated.View 
                style={[
                    styles.tabSection,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}
            >
                {renderTabButtons()}
            </Animated.View>

            {/* Content */}
            <Animated.View 
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}
            >
                <FlatList
                    data={getActiveData()}
                    keyExtractor={(item, index) => `${activeTab}_${item.id || index}`}
                    renderItem={renderUserCard}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    ListEmptyComponent={renderEmptyState}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={getActiveData().length === 0 ? styles.emptyListContainer : styles.listContainer}
                />
            </Animated.View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        paddingTop: 20,
        paddingBottom: 15,
        paddingHorizontal: 20,
        elevation: 8,
        shadowColor: '#E91E63',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 15,
    },
    refreshHeaderButton: {
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
    },
    tabSection: {
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    tabScrollView: {
        maxHeight: 60,
    },
    tabContainer: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        gap: 10,
    },
    tabButton: {
        borderRadius: 20,
        overflow: 'hidden',
        minWidth: 100,
    },
    tabButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 15,
        paddingVertical: 8,
        gap: 5,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
    },
    activeTabText: {
        color: '#fff',
    },
    tabBadge: {
        backgroundColor: '#FF6B6B',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 5,
    },
    tabBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    listContainer: {
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    userCard: {
        marginBottom: 15,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    userCardGradient: {
        padding: 20,
    },
    userCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    userAvatarContainer: {
        position: 'relative',
        marginRight: 15,
    },
    userAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#f0f0f0',
    },
    compatibilityBadge: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        backgroundColor: '#4CAF50',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    compatibilityText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    userLocation: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    skillContainer: {
        flexDirection: 'row',
    },
    skillBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    skillText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    actionButton: {
        borderRadius: 25,
        overflow: 'hidden',
    },
    actionButtonGradient: {
        width: 45,
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sportChipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 15,
    },
    sportChip: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        opacity: 0.8,
    },
    sportChipText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
    statusContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    statusTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        gap: 4,
    },
    statusText: {
        fontSize: 11,
        color: '#666',
        fontWeight: '500',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#E91E63',
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyListContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#E91E63',
        marginVertical: 15,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 30,
    },
    refreshButton: {
        borderRadius: 25,
        overflow: 'hidden',
    },
    refreshButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 8,
    },
    refreshButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default SportsMatchingScreen; 