import React, { useMemo } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    Dimensions
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useProfileContext } from '../../components/ProfileContext';

const { width } = Dimensions.get('window');
const DEFAULT_PROFILE_IMAGE = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

const ProfileInfo = ({
                         onEditProfile,
                         onViewIntro
                     }) => {
    const {
        userProfile,
        followerCount,
        followingCount
    } = useProfileContext();

    const profileImageUrl = useMemo(() => {
        return userProfile?.profilePicture || DEFAULT_PROFILE_IMAGE;
    }, [userProfile]);

    const coverImageUrl = useMemo(() => {
        return userProfile?.coverImage || require('../../assets/h1.png');
    }, [userProfile]);

    const getFullName = () => {
        if (!userProfile) return 'Người dùng';
        return userProfile.fullName ||
            `${userProfile.firstname || ''} ${userProfile.lastname || ''}`.trim();
    };

    return (
        <View style={styles.container}>
            {/* Cover Image */}
            <View style={styles.coverImageContainer}>
                <Image
                    source={coverImageUrl}
                    style={styles.coverImage}
                    resizeMode="cover"
                />
                <TouchableOpacity style={styles.editCoverButton}>
                    <Ionicons name="camera" size={18} color="#000" />
                </TouchableOpacity>
            </View>

            {/* Profile Image */}
            <View style={styles.profileImageContainer}>
                <Image
                    source={{ uri: profileImageUrl }}
                    style={styles.profileImage}
                />
                <TouchableOpacity style={styles.editProfileImageButton}>
                    <Ionicons name="camera" size={18} color="#000" />
                </TouchableOpacity>
            </View>

            {/* Profile Details */}
            <View style={styles.profileDetailsContainer}>
                <Text style={styles.nameText}>{getFullName()}</Text>

                {userProfile?.bio && (
                    <TouchableOpacity
                        style={styles.bioContainer}
                        onPress={onViewIntro}
                    >
                        <Text
                            style={styles.bioText}
                            numberOfLines={2}
                        >
                            {userProfile.bio}
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Social Stats */}
                <View style={styles.socialStatsContainer}>
                    <Text style={styles.socialStatsText}>
                        {followerCount} người theo dõi • {followingCount} đang theo dõi
                    </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={onEditProfile}
                    >
                        <Text style={styles.primaryButtonText}>
                            Chỉnh sửa trang cá nhân
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryButton}>
                        <Text style={styles.secondaryButtonText}>
                            Xem tin
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        marginBottom: 10,
    },
    coverImageContainer: {
        height: 200,
        position: 'relative',
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    editCoverButton: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 20,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileImageContainer: {
        position: 'absolute',
        top: 150,
        left: 15,
        zIndex: 10,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: 'white',
    },
    editProfileImageButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#E4E6EB',
        borderRadius: 20,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileDetailsContainer: {
        paddingTop: 60,
        paddingHorizontal: 15,
        paddingBottom: 15,
    },
    nameText: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'left',
    },
    bioContainer: {
        marginTop: 10,
    },
    bioText: {
        color: '#65676B',
    },
    socialStatsContainer: {
        marginTop: 10,
    },
    socialStatsText: {
        color: '#65676B',
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        marginTop: 15,
    },
    primaryButton: {
        backgroundColor: '#E7F3FF',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 6,
        marginRight: 10,
        flex: 1,
    },
    primaryButtonText: {
        color: '#1877F2',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    secondaryButton: {
        backgroundColor: '#E4E6EB',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 6,
        flex: 1,
    },
    secondaryButtonText: {
        color: '#050505',
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default ProfileInfo;