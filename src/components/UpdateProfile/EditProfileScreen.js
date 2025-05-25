import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, StatusBar, SafeAreaView } from 'react-native';
import AuthService from '../../services/AuthService';
import UserProfileService from '../../services/UserProfileService';
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
    const { profile } = route.params;
    const userProfileService = new UserProfileService();

    // State cho trường form
    const [firstname, setFirstname] = useState(profile?.firstname || '');
    const [lastname, setLastname] = useState(profile?.lastname || '');
    const [bio, setBio] = useState(profile?.bio || '');
    const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || '');
    const [address, setAddress] = useState(profile?.address || '');
    const [gender, setGender] = useState(profile?.gender || false);
    const [dateOfBirth, setDateOfBirth] = useState(
        profile?.dateOfBirth ? new Date(profile.dateOfBirth) : new Date()
    );
    const [website, setWebsite] = useState(profile?.website || '');
    const [occupation, setOccupation] = useState(profile?.occupation || '');
    const [education, setEducation] = useState(profile?.education || '');
    const [relationshipStatus, setRelationshipStatus] = useState(
        profile?.relationshipStatus || ''
    );
    const [preferredLanguage, setPreferredLanguage] = useState(
        profile?.preferredLanguage || ''
    );
    const [timezone, setTimezone] = useState(profile?.timezone || '');

    // State cho ảnh đại diện
    const [profilePicture, setProfilePicture] = useState(
        profile?.profilePictureUrl || null
    );
    const [profilePictureFile, setProfilePictureFile] = useState(null);

    // State cho ảnh nền
    const [coverImage, setCoverImage] = useState(
        profile?.coverImageUrl || null
    );
    const [coverImageFile, setCoverImageFile] = useState(null);

    // State cho loading và date picker
    const [isLoading, setIsLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // State cho modal chọn ảnh
    const [imagePickerModalVisible, setImagePickerModalVisible] = useState(false);
    const [imageType, setImageType] = useState(''); // 'avatar' hoặc 'cover'

    // State cho date picker
    const [tempDate, setTempDate] = useState({
        day: dateOfBirth.getDate(),
        month: dateOfBirth.getMonth() + 1,
        year: dateOfBirth.getFullYear()
    });

    // Kiểm tra xác thực khi màn hình được tải
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

    // Mở modal để chọn loại ảnh cần thay đổi
    const openImagePickerModal = (type) => {
        setImageType(type);
        setImagePickerModalVisible(true);
    };

    // Xử lý chọn ảnh từ thư viện
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

    // Xử lý xác nhận lựa chọn ngày
    const handleConfirmDate = () => {
        // Kiểm tra ngày hợp lệ
        const daysInMonth = new Date(tempDate.year, tempDate.month, 0).getDate();
        let day = tempDate.day;
        if (day > daysInMonth) {
            day = daysInMonth;
        }

        const newDate = new Date(tempDate.year, tempDate.month - 1, day);
        setDateOfBirth(newDate);
        setShowDatePicker(false);
    };

    // Xử lý khi gửi form
    const handleSubmit = async () => {
        // Kiểm tra dữ liệu đầu vào
        if (!firstname || !lastname) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ tên');
            return;
        }

        setIsLoading(true);

        try {
            // Chuẩn bị dữ liệu hồ sơ
            const profileData = {
                firstname,
                lastname,
                bio,
                phoneNumber,
                address,
                gender,
                dateOfBirth: dateOfBirth.toISOString().split('T')[0], // Format as YYYY-MM-DD
                website,
                occupation,
                education,
                relationshipStatus,
                preferredLanguage,
                timezone,
            };

            // Cập nhật hồ sơ
            await userProfileService.updateProfile(profileData);

            // Tải lên ảnh đại diện nếu đã chọn
            if (profilePictureFile) {
                await userProfileService.uploadProfilePicture(profilePictureFile);
            }

            // Tải lên ảnh nền nếu đã chọn
            if (coverImageFile) {
                await userProfileService.uploadCoverImage(coverImageFile);
            }

            // Hiển thị thông báo thành công và quay lại
            Alert.alert(
                'Thành công',
                'Hồ sơ của bạn đã được cập nhật',
                [{
                    text: 'OK',
                    onPress: () => navigation.goBack()
                }]
            );
        } catch (error) {
            console.error('Lỗi cập nhật hồ sơ:', error);

            if (global.authExpired) {
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
                global.authExpired = false;
            } else {
                Alert.alert('Lỗi', error.message || 'Không thể cập nhật hồ sơ');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#1877F2" />

            {/* Header */}
            <ProfileHeader
                navigation={navigation}
                isLoading={isLoading}
                handleSubmit={handleSubmit}
            />

            <ScrollView style={styles.container}>
                {/* Image Section (Cover and Profile) */}
                <ImageSection
                    coverImage={coverImage}
                    profilePicture={profilePicture}
                    openImagePickerModal={openImagePickerModal}
                />

                <View style={styles.formContainer}>
                    {/* Form Sections */}
                    <PersonalInfoSection
                        firstname={firstname}
                        setFirstname={setFirstname}
                        lastname={lastname}
                        setLastname={setLastname}
                        bio={bio}
                        setBio={setBio}
                        gender={gender}
                        setGender={setGender}
                        dateOfBirth={dateOfBirth}
                        setShowDatePicker={setShowDatePicker}
                    />

                    <ContactInfoSection
                        phoneNumber={phoneNumber}
                        setPhoneNumber={setPhoneNumber}
                        address={address}
                        setAddress={setAddress}
                        website={website}
                        setWebsite={setWebsite}
                    />

                    <WorkEducationSection
                        occupation={occupation}
                        setOccupation={setOccupation}
                        education={education}
                        setEducation={setEducation}
                    />

                    <OtherInfoSection
                        relationshipStatus={relationshipStatus}
                        setRelationshipStatus={setRelationshipStatus}
                        preferredLanguage={preferredLanguage}
                        setPreferredLanguage={setPreferredLanguage}
                        timezone={timezone}
                        setTimezone={setTimezone}
                    />

                    {/* Submit Button */}
                    <SubmitButton
                        onPress={handleSubmit}
                        isLoading={isLoading}
                    />
                </View>
            </ScrollView>

            {/* Custom Date Picker Modal */}
            <CustomDatePicker
                visible={showDatePicker}
                tempDate={tempDate}
                setTempDate={setTempDate}
                onCancel={() => setShowDatePicker(false)}
                onConfirm={handleConfirmDate}
            />

            {/* Image Picker Modal */}
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
