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
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
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
        if (!userProfile) return 'Người dùng';
        return userProfile.fullName ||
            `${userProfile.firstname || ''} ${userProfile.lastname || ''}`.trim();
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity: headerOpacity,
                    shadowOpacity: headerShadowOpacity,
                    paddingTop: Platform.OS === 'ios' ? StatusBar.currentHeight + 10 : 10
                }
            ]}
        >
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
            >
                <View style={styles.backButtonInner}>
                    <Ionicons
                        name="arrow-back"
                        size={24}
                        color="#1877F2"
                    />
                </View>
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
                <TouchableOpacity
                    style={styles.dropdownButton}
                    activeOpacity={0.7}
                >
                    <View style={styles.dropdownButtonInner}>
                        <Ionicons
                            name="chevron-down"
                            size={20}
                            color="#1877F2"
                        />
                    </View>
                </TouchableOpacity>
            </View>

            <View style={styles.rightActions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    activeOpacity={0.7}
                >
                    <View style={styles.actionButtonInner}>
                        <Ionicons
                            name="search"
                            size={22}
                            color="#1877F2"
                        />
                    </View>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={onMoreOptionsPress}
                    activeOpacity={0.7}
                >
                    <View style={styles.actionButtonInner}>
                        <MaterialIcons
                            name="more-vert"
                            size={22}
                            color="#1877F2"
                        />
                    </View>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingBottom: 10,
        backgroundColor: 'white',
        borderBottomWidth: 0.5,
        borderBottomColor: '#E5E5E5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 4,
        zIndex: 1000,
    },
    backButton: {
        padding: 5,
    },
    backButtonInner: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0F2F5',
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 10,
    },
    titleText: {
        fontSize: 20,
        fontWeight: 'bold',
        marginRight: 5,
        maxWidth: '80%',
        color: '#1C1E21',
    },
    dropdownButton: {
        padding: 2,
    },
    dropdownButtonInner: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0F2F5',
    },
    rightActions: {
        flexDirection: 'row',
    },
    actionButton: {
        marginLeft: 10,
        padding: 2,
    },
    actionButtonInner: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0F2F5',
    }
});

export default ProfileHeader;