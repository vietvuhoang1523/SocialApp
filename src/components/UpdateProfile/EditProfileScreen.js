import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, Alert, StatusBar, SafeAreaView } from 'react-native';
import AuthService from '../../services/AuthService';
import UserProfileService from '../../services/UserProfileService';
import { useProfileContext } from '../ProfileContext';
import { useAutoSave } from '../../hook/useAutoSave';
import { styles } from './styles';

// Import các component con
import ProfileHeader from './ProfileHeader';
import ImageSection from './ImageSection';
import CustomDatePicker from './CustomDatePicker';
import ImagePickerModal from './ImagePickerModal';
import {
    PersonalInfoSection,
    ContactInfoSection,
    WorkEducationSection,
    OtherInfoSection,
    SubmitButton
} from './FormComponents';

const EditProfileScreen = ({ navigation, route }) => {
    // Sử dụng ProfileContext
    const { userProfile, updateProfile } = useProfileContext();
    const userProfileService = UserProfileService;

    // State cho các trường form
    const [formData, setFormData] = useState({
        firstname: userProfile?.firstname || '',
        lastname: userProfile?.lastname || '',
        bio: userProfile?.bio || '',
        phoneNumber: userProfile?.phoneNumber || '',
        address: userProfile?.address || '',
        gender: userProfile?.gender || false,
        dateOfBirth: userProfile?.dateOfBirth ? new Date(userProfile.dateOfBirth) : new Date(),
        website: userProfile?.website || '',
        occupation: userProfile?.occupation || '',
        education: userProfile?.education || '',
        relationshipStatus: userProfile?.relationshipStatus || '',
        preferredLanguage: userProfile?.preferredLanguage || '',
        timezone: userProfile?.timezone || '',
    });

    // State cho ảnh
    const [profilePicture, setProfilePicture] = useState(userProfile?.profilePictureUrl || null);
    const [profilePictureFile, setProfilePictureFile] = useState(null);
    const [coverImage, setCoverImage] = useState(userProfile?.coverImageUrl || null);
    const [coverImageFile, setCoverImageFile] = useState(null);

    // State cho UI
    const [isLoading, setIsLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [imagePickerModalVisible, setImagePickerModalVisible] = useState(false);
    const [imageType, setImageType] = useState('');
    const [tempDate, setTempDate] = useState({
        day: formData.dateOfBirth.getDate(),
        month: formData.dateOfBirth.getMonth() + 1,
        year: formData.dateOfBirth.getFullYear()
    });

    // Hàm cập nhật từng field lên server
    const updateSingleField = useCallback(async (fieldName, value) => {
        try {
            // Kiểm tra nếu giá trị không thay đổi
            if (userProfile && userProfile[fieldName] === value) {
                return true;
            }

            const updateData = { [fieldName]: value };
            await userProfileService.updateProfile(updateData);

            // Cập nhật vào context
            await updateProfile(updateData);

            console.log(`✅ Auto-saved ${fieldName}:`, value);
            return true;
        } catch (error) {
            console.error(`❌ Error auto-saving ${fieldName}:`, error);
            return false;
        }
    }, [userProfile, userProfileService, updateProfile]);

    // Sử dụng auto-save hook
    const { debouncedUpdate, cleanup } = useAutoSave(updateSingleField, 1500);

    // Cập nhật formData khi userProfile thay đổi
    useEffect(() => {
        if (userProfile) {
            setFormData({
                firstname: userProfile.firstname || '',
                lastname: userProfile.lastname || '',
                bio: userProfile.bio || '',
                phoneNumber: userProfile.phoneNumber || '',
                address: userProfile.address || '',
                gender: userProfile.gender || false,
                dateOfBirth: userProfile.dateOfBirth ? new Date(userProfile.dateOfBirth) : new Date(),
                website: userProfile.website || '',
                occupation: userProfile.occupation || '',
                education: userProfile.education || '',
                relationshipStatus: userProfile.relationshipStatus || '',
                preferredLanguage: userProfile.preferredLanguage || '',
                timezone: userProfile.timezone || '',
            });
            setProfilePicture(userProfile.profilePictureUrl || null);
            setCoverImage(userProfile.coverImageUrl || null);
        }
    }, [userProfile]);

    // Cleanup khi component unmount
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    // Hàm helper để cập nhật field
    const updateField = useCallback((fieldName, value) => {
        setFormData(prev => ({ ...prev, [fieldName]: value }));

        // Auto-save cho text fields
        if (typeof value === 'string') {
            debouncedUpdate(fieldName, value);
        } else {
            // Immediate save cho boolean, date, etc.
            updateSingleField(fieldName, value);
        }
    }, [debouncedUpdate, updateSingleField]);

    // Kiểm tra xác thực
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const isAuthenticated = await AuthService.checkAuthentication();
                if (!isAuthenticated) {
                    Alert.alert(
                        'Phiên đăng nhập hết hạn',
                        'Vui lòng đăng nhập lại để tiếp tục',
                        [
                            {
                                text: 'OK',
                                onPress: () => navigation.reset({
                                    index: 0,
                                    routes: [{ name: 'Login' }],
                                })
                            }
                        ]
                    );
                }
            } catch (error) {
                console.error('Lỗi kiểm tra xác thực:', error);
            }
        };

        checkAuth();
    }, [navigation]);

    // Xử lý chọn ảnh
    const openImagePickerModal = (type) => {
        setImageType(type);
        setImagePickerModalVisible(true);
    };

    const handleChooseImage = (asset) => {
        if (imageType === 'avatar') {
            setProfilePicture(asset.uri);
            setProfilePictureFile(asset);
        } else if (imageType === 'cover') {
            setCoverImage(asset.uri);
            setCoverImageFile(asset);
        }
        setImagePickerModalVisible(false);
    };

    // Xử lý date picker
    const handleConfirmDate = () => {
        const daysInMonth = new Date(tempDate.year, tempDate.month, 0).getDate();
        let day = tempDate.day;
        if (day > daysInMonth) {
            day = daysInMonth;
        }

        const newDate = new Date(tempDate.year, tempDate.month - 1, day);
        const dateString = newDate.toISOString().split('T')[0];

        setFormData(prev => ({ ...prev, dateOfBirth: newDate }));
        updateSingleField('dateOfBirth', dateString);
        setShowDatePicker(false);
    };

    // Xử lý submit (chủ yếu cho ảnh)
    const handleSubmit = async () => {
        if (!formData.firstname || !formData.lastname) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ tên');
            return;
        }

        setIsLoading(true);

        try {
            // Upload ảnh nếu có thay đổi
            if (profilePictureFile) {
                await userProfileService.uploadProfilePicture(profilePictureFile);
            }

            if (coverImageFile) {
                await userProfileService.uploadCoverImage(coverImageFile);
            }

            // Refresh profile sau khi cập nhật
            const updatedProfile = await userProfileService.getCurrentUserProfile();
            await updateProfile(updatedProfile);

            Alert.alert('Thành công', 'Cập nhật hồ sơ thành công', [
                { 
                    text: 'OK', 
                    onPress: () => {
                        if (route.params?.onProfileUpdated) {
                            route.params.onProfileUpdated();
                        }
                        navigation.goBack();
                    }
                }
            ]);
        } catch (error) {
            console.error('Lỗi cập nhật hồ sơ:', error);
            Alert.alert('Lỗi', 'Không thể cập nhật hồ sơ. Vui lòng thử lại sau.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#E91E63" />
            
            <ProfileHeader
                navigation={navigation}
                isLoading={isLoading}
                handleSubmit={handleSubmit}
            />

            <ScrollView 
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <ImageSection
                    profilePicture={profilePicture}
                    coverImage={coverImage}
                    onProfileImagePress={() => openImagePickerModal('avatar')}
                    onCoverImagePress={() => openImagePickerModal('cover')}
                />

                <PersonalInfoSection
                    firstname={formData.firstname}
                    setFirstname={(value) => updateField('firstname', value)}
                    lastname={formData.lastname}
                    setLastname={(value) => updateField('lastname', value)}
                    bio={formData.bio}
                    setBio={(value) => updateField('bio', value)}
                    gender={formData.gender}
                    setGender={(value) => updateField('gender', value)}
                    dateOfBirth={formData.dateOfBirth}
                    setShowDatePicker={setShowDatePicker}
                />

                <ContactInfoSection
                    phoneNumber={formData.phoneNumber}
                    setPhoneNumber={(value) => updateField('phoneNumber', value)}
                    address={formData.address}
                    setAddress={(value) => updateField('address', value)}
                    website={formData.website}
                    setWebsite={(value) => updateField('website', value)}
                />

                <WorkEducationSection
                    occupation={formData.occupation}
                    setOccupation={(value) => updateField('occupation', value)}
                    education={formData.education}
                    setEducation={(value) => updateField('education', value)}
                />

                <OtherInfoSection
                    relationshipStatus={formData.relationshipStatus}
                    setRelationshipStatus={(value) => updateField('relationshipStatus', value)}
                    preferredLanguage={formData.preferredLanguage}
                    setPreferredLanguage={(value) => updateField('preferredLanguage', value)}
                    timezone={formData.timezone}
                    setTimezone={(value) => updateField('timezone', value)}
                />

                <SubmitButton
                    isLoading={isLoading}
                    onPress={handleSubmit}
                />
            </ScrollView>

            <CustomDatePicker
                visible={showDatePicker}
                onCancel={() => setShowDatePicker(false)}
                onConfirm={handleConfirmDate}
                tempDate={tempDate}
                setTempDate={setTempDate}
            />

            <ImagePickerModal
                visible={imagePickerModalVisible}
                imageType={imageType}
                onClose={() => setImagePickerModalVisible(false)}
                onChooseImage={handleChooseImage}
            />
        </SafeAreaView>
    );
};

export default EditProfileScreen;
