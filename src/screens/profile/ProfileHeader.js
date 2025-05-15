import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useProfileContext } from '../../components/ProfileContext';

const ProfileHeader = ({
                           navigation,
                           onMoreOptionsPress
                       }) => {
    const { userProfile } = useProfileContext();

    const getFullName = () => {
        if (!userProfile) return 'Người dùng';
        return userProfile.fullName ||
            `${userProfile.firstname || ''} ${userProfile.lastname || ''}`.trim();
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <Ionicons
                    name="arrow-back"
                    size={24}
                    color="#000"
                />
            </TouchableOpacity>

            <View style={styles.titleContainer}>
                <Text style={styles.titleText} numberOfLines={1}>
                    {getFullName()}
                </Text>
                <TouchableOpacity>
                    <Ionicons
                        name="chevron-down"
                        size={20}
                        color="#000"
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.rightActions}>
                <TouchableOpacity style={styles.actionButton}>
                    <Ionicons
                        name="search"
                        size={22}
                        color="#000"
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={onMoreOptionsPress}
                >
                    <MaterialIcons
                        name="more-vert"
                        size={22}
                        color="#000"
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: 'white',
        borderBottomWidth: 0.5,
        borderBottomColor: '#E5E5E5'
    },
    backButton: {
        padding: 5,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 15,
    },
    titleText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 5,
        maxWidth: '80%'
    },
    rightActions: {
        flexDirection: 'row',
    },
    actionButton: {
        marginLeft: 15,
        padding: 5,
    }
});

export default ProfileHeader;