import React from 'react';
import { View, TouchableOpacity, Text, Image, ImageBackground } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles } from './styles';

const ImageSection = ({ coverImage, profilePicture, openImagePickerModal }) => {
    const defaultCoverImage = 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029';
    const defaultProfilePicture = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

    return (
        <View style={styles.coverImageContainer}>
            <ImageBackground
                source={
                    coverImage
                        ? { uri: coverImage }
                        : { uri: defaultCoverImage }
                }
                style={styles.coverImage}
                resizeMode="cover"
            >
                <View style={[styles.coverGradient, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
                    <TouchableOpacity
                        style={styles.editCoverButton}
                        onPress={() => openImagePickerModal('cover')}
                    >
                        <Icon name="camera" size={22} color="white" />
                        <Text style={styles.editCoverText}>Thay đổi ảnh bìa</Text>
                    </TouchableOpacity>
                </View>
            </ImageBackground>

            <View style={styles.profilePictureWrapper}>
                <TouchableOpacity
                    style={styles.profilePictureContainer}
                    onPress={() => openImagePickerModal('avatar')}
                >
                    <Image
                        source={
                            profilePicture
                                ? { uri: profilePicture }
                                : { uri: defaultProfilePicture }
                        }
                        style={styles.profilePicture}
                    />
                    <View style={styles.cameraIconContainer}>
                        <Icon name="camera" size={18} color="white" />
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default ImageSection;
