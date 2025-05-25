import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Alert
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useProfileContext } from '../../components/ProfileContext';
import { useNavigation } from '@react-navigation/native';
import { BASE_URL } from '../../services/api';

// Kích thước màn hình
const { width } = Dimensions.get('window');

// Ảnh mặc định
const DEFAULT_PROFILE_IMAGE = require('../../assets/h1.png');
const DEFAULT_COVER_IMAGE = require('../../assets/h1.png');

const getImageUrl = (relativePath) => {
    if (!relativePath) {
        console.log('getImageUrl: relativePath is null or empty');
        return null;
    }

    // Tạo URL đầy đủ cho hình ảnh và log để debug
    const url = `${BASE_URL}/files/image?bucketName=thanh&path=${encodeURIComponent(relativePath)}`;
    console.log('getImageUrl: Generated URL:', url);
    return url;
};

const ProfileInfo = ({ onEditProfile, onViewIntro }) => {
    const { userProfile } = useProfileContext();
    const navigation = useNavigation();

    const [profileImage, setProfileImage] = useState(DEFAULT_PROFILE_IMAGE);
    const [coverImage, setCoverImage] = useState(DEFAULT_COVER_IMAGE);

    // Log userProfile khi có thay đổi
    useEffect(() => {
        console.log('ProfileInfo: userProfile changed:', userProfile);
    }, [userProfile]);

    useEffect(() => {
        // Reset về ảnh mặc định khi userProfile thay đổi hoặc không có
        setProfileImage(DEFAULT_PROFILE_IMAGE);
        setCoverImage(DEFAULT_COVER_IMAGE);

        // Thoát sớm nếu không có userProfile
        if (!userProfile) {
            console.log('ProfileInfo: userProfile is null or undefined');
            return;
        }

        try {
            // Xử lý ảnh đại diện
            if (userProfile.profilePictureUrl) {
                const profileUrl = getImageUrl(userProfile.profilePictureUrl);
                console.log('ProfileInfo: Setting profile image URL:', profileUrl);
                if (profileUrl) {
                    // Thêm tham số timestamp để tránh cache
                    const uncachedUrl = `${profileUrl}&_t=${new Date().getTime()}`;
                    setProfileImage({ uri: uncachedUrl });
                }
            } else {
                console.log('ProfileInfo: No profilePictureUrl in userProfile');
            }

            // Xử lý ảnh bìa
            if (userProfile.coverImageUrl) {
                const coverUrl = getImageUrl(userProfile.coverImageUrl);
                console.log('ProfileInfo: Setting cover image URL:', coverUrl);
                if (coverUrl) {
                    // Thêm tham số timestamp để tránh cache
                    const uncachedUrl = `${coverUrl}&_t=${new Date().getTime()}`;
                    setCoverImage({ uri: uncachedUrl });
                }
            } else {
                console.log('ProfileInfo: No coverImageUrl in userProfile');
            }
        } catch (error) {
            console.error('ProfileInfo: Error processing images:', error);
            Alert.alert('Lỗi', 'Có lỗi xảy ra khi xử lý hình ảnh');
        }
    }, [userProfile]);


    const getFullName = () => {
        if (!userProfile) return 'Người dùng';

        // Ưu tiên fullName nếu có
        if (userProfile.fullName) return userProfile.fullName;

        // Ghép firstname + lastname
        return [userProfile.firstname, userProfile.lastname]
            .filter(name => name && name.trim())
            .join(' ')
            .trim() || 'Người dùng';
    };

    const handleEditProfile = () => {
        if (onEditProfile) {
            onEditProfile();
        } else {
            navigation.navigate('EditProfile', { profile: userProfile });
        }
    };

    const handleEditProfileImage = () => {
        navigation.navigate('EditProfile', {
            profile: userProfile,
            initialTab: 'avatar'
        });
    };

    const handleEditCoverImage = () => {
        navigation.navigate('EditProfile', {
            profile: userProfile,
            initialTab: 'cover'
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.coverImageContainer}>
                <Image
                    source={coverImage}
                    style={styles.coverImage}
                    resizeMode="cover"
                    onError={(e) => {
                        console.log('Cover image load failed', e.nativeEvent.error);
                        setCoverImage(DEFAULT_COVER_IMAGE);
                    }}
                />
                <TouchableOpacity
                    style={styles.editCoverButton}
                    onPress={handleEditCoverImage}
                    activeOpacity={0.7}
                >
                    <Ionicons name="camera" size={18} color="#000" />
                </TouchableOpacity>
            </View>

            <View style={styles.profileImageContainer}>
                <Image
                    source={profileImage}
                    style={styles.profileImage}
                    resizeMode="cover"
                    onError={(e) => {
                        console.log('Profile image load failed', e.nativeEvent.error);
                        setProfileImage(DEFAULT_PROFILE_IMAGE);
                    }}
                />
                <TouchableOpacity
                    style={styles.editProfileImageButton}
                    onPress={handleEditProfileImage}
                    activeOpacity={0.7}
                >
                    <Ionicons name="camera" size={18} color="#000" />
                </TouchableOpacity>
            </View>

            <View style={styles.profileDetailsContainer}>
                <Text style={styles.nameText}>{getFullName()}</Text>

                {userProfile?.bio && (
                    <TouchableOpacity
                        style={styles.bioContainer}
                        onPress={onViewIntro}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.bioText} numberOfLines={2}>
                            {userProfile.bio}
                        </Text>
                    </TouchableOpacity>
                )}

                <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleEditProfile}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.primaryButtonText}>
                            Chỉnh sửa trang cá nhân
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
        backgroundColor: '#f0f2f5', // Background mặc định nếu ảnh không tải được
    },
    coverImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f0f2f5',
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
        elevation: 2,
    },
    profileImageContainer: {
        position: 'absolute',
        top: 150,
        left: 15,
        zIndex: 10,
        backgroundColor: '#f0f2f5', // Background mặc định nếu ảnh không tải được
        borderRadius: 50,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: 'white',
        backgroundColor: '#f0f2f5',
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
        elevation: 2,
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
        lineHeight: 20,
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
        shadowColor: '#1877F2',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    primaryButtonText: {
        color: '#1877F2',
        fontWeight: 'bold',
        textAlign: 'center',
    }
});

export default ProfileInfo;
