import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    StatusBar,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useProfileContext } from '../../components/ProfileContext';

const ProfileHeader = ({
                           navigation,
                           onMoreOptionsPress,
                           scrollY = new Animated.Value(0) // Thêm Animated.Value để cho phép hiệu ứng scroll
                       }) => {
    // Sử dụng ProfileContext để lấy thông tin người dùng
    const { userProfile } = useProfileContext();

    // Tính toán màu nền khi cuộn
    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [1, 0.98],
        extrapolate: 'clamp'
    });

    // Tính toán độ mờ của cái bóng
    const headerShadowOpacity = scrollY.interpolate({
        inputRange: [0, 20],
        outputRange: [0, 0.3],
        extrapolate: 'clamp'
    });

    // Tính toán kích thước của tên khi cuộn
    const nameScale = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [1, 0.95],
        extrapolate: 'clamp'
    });

    const getFullName = () => {
        if (!userProfile) return 'Trang cá nhân';
        return userProfile.fullName ||
            `${userProfile.firstname || ''} ${userProfile.lastname || ''}`.trim() ||
            'Trang cá nhân';
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity: headerOpacity,
                    shadowOpacity: headerShadowOpacity,
                }
            ]}
        >
            <LinearGradient
                colors={['#E91E63', '#F06292']}
                style={styles.gradient}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={24}
                            color="#fff"
                        />
                    </TouchableOpacity>

                    <View style={styles.titleContainer}>
                        <Animated.Text
                            style={[
                                styles.titleText,
                                { transform: [{ scale: nameScale }] }
                            ]}
                            numberOfLines={1}
                        >
                            {getFullName()}
                        </Animated.Text>
                    </View>

                    <View style={styles.rightActions}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name="search"
                                size={22}
                                color="#fff"
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={onMoreOptionsPress}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name="ellipsis-vertical"
                                size={22}
                                color="#fff"
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 4,
        zIndex: 1000,
    },
    gradient: {
        paddingTop: Platform.OS === 'ios' ? 10 : 10,
        paddingBottom: 15,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    backButton: {
        padding: 5,
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 10,
    },
    titleText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    rightActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        marginLeft: 15,
        padding: 5,
    },
});

export default ProfileHeader;