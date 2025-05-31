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
import { LinearGradient } from 'expo-linear-gradient';
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
                {/* Pink gradient overlay */}
                <LinearGradient
                    colors={['rgba(233, 30, 99, 0.1)', 'rgba(240, 98, 146, 0.1)']}
                    style={styles.coverOverlay}
                />
                <TouchableOpacity
                    style={styles.editCoverButton}
                    onPress={handleEditCoverImage}
                    activeOpacity={0.7}
                >
                    <Ionicons name="camera" size={18} color="#E91E63" />
                </TouchableOpacity>
            </View>

            <View style={styles.profileImageContainer}>
                <View style={styles.profileImageBorder}>
                    <Image
                        source={profileImage}
                        style={styles.profileImage}
                        resizeMode="cover"
                        onError={(e) => {
                            console.log('Profile image load failed', e.nativeEvent.error);
                            setProfileImage(DEFAULT_PROFILE_IMAGE);
                        }}
                    />
                </View>
                <TouchableOpacity
                    style={styles.editProfileImageButton}
                    onPress={handleEditProfileImage}
                    activeOpacity={0.7}
                >
                    <LinearGradient
                        colors={['#E91E63', '#F06292']}
                        style={styles.editIconGradient}
                    >
                        <Ionicons name="camera" size={16} color="#fff" />
                    </LinearGradient>
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
                        <LinearGradient
                            colors={['#E91E63', '#F06292']}
                            style={styles.primaryButtonGradient}
                        >
                            <Ionicons name="create-outline" size={18} color="#fff" />
                            <Text style={styles.primaryButtonText}>
                                Chỉnh sửa trang cá nhân
                            </Text>
                        </LinearGradient>
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
        borderRadius: 15,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        marginHorizontal: 15,
        marginTop: 15,
    },
    coverImageContainer: {
        height: 180,
        position: 'relative',
        backgroundColor: '#f0f2f5',
    },
    coverImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f0f2f5',
    },
    coverOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    editCoverButton: {
        position: 'absolute',
        bottom: 15,
        right: 15,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 25,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    profileImageContainer: {
        position: 'absolute',
        top: 130,
        left: 20,
        zIndex: 10,
    },
    profileImageBorder: {
        width: 110,
        height: 110,
        borderRadius: 55,
        padding: 5,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#f0f2f5',
    },
    editProfileImageButton: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        borderRadius: 20,
        overflow: 'hidden',
    },
    editIconGradient: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileDetailsContainer: {
        paddingTop: 70,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    nameText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'left',
        marginBottom: 8,
    },
    bioContainer: {
        marginVertical: 10,
        padding: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        borderLeftWidth: 3,
        borderLeftColor: '#E91E63',
    },
    bioText: {
        fontSize: 16,
        color: '#666',
        lineHeight: 22,
        fontStyle: 'italic',
    },
    actionButtonsContainer: {
        marginTop: 20,
    },
    primaryButton: {
        borderRadius: 25,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    primaryButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
});

export default ProfileInfo;
