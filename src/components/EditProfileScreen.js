import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Image,
    ActivityIndicator,
    Dimensions,
    Modal,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import UserProfileService from '../services/UserProfileService';
import AuthService from '../services/AuthService';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const EditProfileScreen = ({ navigation, route }) => {
    const { profile } = route.params;
    const userProfileService = new UserProfileService();

    // State for form fields
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

    // State for profile picture
    const [profilePicture, setProfilePicture] = useState(
        profile?.profilePictureUrl || null
    );
    const [profilePictureFile, setProfilePictureFile] = useState(null);

    // State for loading and custom date picker
    const [isLoading, setIsLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // State for custom date picker
    const [tempDate, setTempDate] = useState({
        day: dateOfBirth.getDate(),
        month: dateOfBirth.getMonth() + 1,
        year: dateOfBirth.getFullYear()
    });

    // Generate arrays for date picker
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

    // Kiểm tra xác thực khi màn hình được tải
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const isAuthenticated = await AuthService.isAuthenticated();
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
    }, []);

    // Handle image picker
    const handleChooseProfilePicture = () => {
        launchImageLibrary(
            {
                mediaType: 'photo',
                maxWidth: 500,
                maxHeight: 500,
                quality: 0.7,
            },
            (response) => {
                if (response.didCancel) {
                    console.log('User cancelled image picker');
                } else if (response.errorCode) {
                    console.log('ImagePicker Error: ', response.errorMessage);
                } else {
                    const asset = response.assets[0];
                    setProfilePicture(asset.uri);
                    setProfilePictureFile(asset);
                }
            }
        );
    };

    // Handle confirming date selection
    const handleConfirmDate = () => {
        // Check if date is valid
        const daysInMonth = new Date(tempDate.year, tempDate.month, 0).getDate();
        let day = tempDate.day;
        if (day > daysInMonth) {
            day = daysInMonth;
        }

        const newDate = new Date(tempDate.year, tempDate.month - 1, day);
        setDateOfBirth(newDate);
        setShowDatePicker(false);
    };

    // Handle form submission
    const handleSubmit = async () => {
        // Validate inputs
        if (!firstname || !lastname) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ tên');
            return;
        }

        setIsLoading(true);

        try {
            // Prepare profile data
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

            // Update profile
            await userProfileService.updateProfile(profileData);

            // Upload profile picture if selected
            if (profilePictureFile) {
                await userProfileService.uploadProfilePicture(profilePictureFile);
            }

            // Show success message and navigate back
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

            // Kiểm tra xem lỗi có phải do token hết hạn không
            if (global.authExpired) {
                // Nếu token hết hạn, chuyển hướng đến màn hình đăng nhập
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
                // Reset biến global
                global.authExpired = false;
            } else {
                Alert.alert('Lỗi', error.message || 'Không thể cập nhật hồ sơ');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.profilePictureContainer}>
                <TouchableOpacity onPress={handleChooseProfilePicture}>
                    <Image
                        source={
                            profilePicture
                                ? { uri: profilePicture }
                                : { uri: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png' }
                        }
                        style={styles.profilePicture}
                    />
                    <View style={styles.cameraIconContainer}>
                        <Icon name="camera" size={20} color="white" />
                    </View>
                </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
                <Text style={styles.label}>Tên</Text>
                <TextInput
                    style={styles.input}
                    value={firstname}
                    onChangeText={setFirstname}
                    placeholder="Nhập tên"
                />

                <Text style={styles.label}>Họ</Text>
                <TextInput
                    style={styles.input}
                    value={lastname}
                    onChangeText={setLastname}
                    placeholder="Nhập họ"
                />

                <Text style={styles.label}>Tiểu sử</Text>
                <TextInput
                    style={[styles.input, styles.multilineInput]}
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Viết về bản thân"
                    multiline
                    numberOfLines={4}
                />

                <Text style={styles.label}>Số điện thoại</Text>
                <TextInput
                    style={styles.input}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="Nhập số điện thoại"
                    keyboardType="phone-pad"
                />

                <Text style={styles.label}>Địa chỉ</Text>
                <TextInput
                    style={styles.input}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Nhập địa chỉ"
                />

                <Text style={styles.label}>Giới tính</Text>
                <View style={styles.genderContainer}>
                    <TouchableOpacity
                        style={[
                            styles.genderButton,
                            gender === false && styles.selectedGenderButton
                        ]}
                        onPress={() => setGender(false)}
                    >
                        <Text style={gender === false ? styles.selectedGenderText : styles.genderButtonText}>Nam</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.genderButton,
                            gender === true && styles.selectedGenderButton
                        ]}
                        onPress={() => setGender(true)}
                    >
                        <Text style={gender === true ? styles.selectedGenderText : styles.genderButtonText}>Nữ</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>Ngày sinh</Text>
                <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowDatePicker(true)}
                >
                    <Text>{dateOfBirth.toLocaleDateString()}</Text>
                </TouchableOpacity>

                {/* Custom Date Picker Modal */}
                <Modal
                    visible={showDatePicker}
                    transparent={true}
                    animationType="slide"
                >
                    <View style={styles.modalBackground}>
                        <View style={styles.datePickerModal}>
                            <Text style={styles.datePickerTitle}>Chọn ngày sinh</Text>

                            <View style={styles.datePickerContainer}>
                                {/* Day Picker */}
                                <View style={styles.datePickerColumn}>
                                    <Text style={styles.datePickerLabel}>Ngày</Text>
                                    <ScrollView style={styles.pickerScrollView}>
                                        {days.map(day => (
                                            <TouchableOpacity
                                                key={`day-${day}`}
                                                style={[
                                                    styles.dateOption,
                                                    tempDate.day === day && styles.selectedDateOption
                                                ]}
                                                onPress={() => setTempDate({...tempDate, day})}
                                            >
                                                <Text
                                                    style={[
                                                        styles.dateOptionText,
                                                        tempDate.day === day && styles.selectedDateOptionText
                                                    ]}
                                                >
                                                    {day}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>

                                {/* Month Picker */}
                                <View style={styles.datePickerColumn}>
                                    <Text style={styles.datePickerLabel}>Tháng</Text>
                                    <ScrollView style={styles.pickerScrollView}>
                                        {months.map(month => (
                                            <TouchableOpacity
                                                key={`month-${month}`}
                                                style={[
                                                    styles.dateOption,
                                                    tempDate.month === month && styles.selectedDateOption
                                                ]}
                                                onPress={() => setTempDate({...tempDate, month})}
                                            >
                                                <Text
                                                    style={[
                                                        styles.dateOptionText,
                                                        tempDate.month === month && styles.selectedDateOptionText
                                                    ]}
                                                >
                                                    {month}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>

                                {/* Year Picker */}
                                <View style={styles.datePickerColumn}>
                                    <Text style={styles.datePickerLabel}>Năm</Text>
                                    <ScrollView style={styles.pickerScrollView}>
                                        {years.map(year => (
                                            <TouchableOpacity
                                                key={`year-${year}`}
                                                style={[
                                                    styles.dateOption,
                                                    tempDate.year === year && styles.selectedDateOption
                                                ]}
                                                onPress={() => setTempDate({...tempDate, year})}
                                            >
                                                <Text
                                                    style={[
                                                        styles.dateOptionText,
                                                        tempDate.year === year && styles.selectedDateOptionText
                                                    ]}
                                                >
                                                    {year}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>

                            <View style={styles.datePickerButtons}>
                                <TouchableOpacity
                                    style={[styles.datePickerButton, styles.cancelButton]}
                                    onPress={() => setShowDatePicker(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Hủy</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.datePickerButton, styles.confirmButton]}
                                    onPress={handleConfirmDate}
                                >
                                    <Text style={styles.confirmButtonText}>Xác nhận</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                <Text style={styles.label}>Website</Text>
                <TextInput
                    style={styles.input}
                    value={website}
                    onChangeText={setWebsite}
                    placeholder="Nhập website"
                    keyboardType="url"
                />

                <Text style={styles.label}>Nghề nghiệp</Text>
                <TextInput
                    style={styles.input}
                    value={occupation}
                    onChangeText={setOccupation}
                    placeholder="Nhập nghề nghiệp"
                />

                <Text style={styles.label}>Học vấn</Text>
                <TextInput
                    style={styles.input}
                    value={education}
                    onChangeText={setEducation}
                    placeholder="Nhập thông tin học vấn"
                />

                <Text style={styles.label}>Tình trạng mối quan hệ</Text>
                <TextInput
                    style={styles.input}
                    value={relationshipStatus}
                    onChangeText={setRelationshipStatus}
                    placeholder="Nhập tình trạng mối quan hệ"
                />

                <Text style={styles.label}>Ngôn ngữ ưa thích</Text>
                <TextInput
                    style={styles.input}
                    value={preferredLanguage}
                    onChangeText={setPreferredLanguage}
                    placeholder="Nhập ngôn ngữ ưa thích"
                />

                <Text style={styles.label}>Múi giờ</Text>
                <TextInput
                    style={styles.input}
                    value={timezone}
                    onChangeText={setTimezone}
                    placeholder="Nhập múi giờ"
                />

                {/* Submit Button */}
                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.submitButtonText}>Lưu thay đổi</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    profilePictureContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    profilePicture: {
        width: 150,
        height: 150,
        borderRadius: 75,
        borderWidth: 2,
        borderColor: '#4CAF50',
    },
    cameraIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#4CAF50',
        borderRadius: 20,
        padding: 5,
    },
    formContainer: {
        paddingHorizontal: 20,
    },
    label: {
        marginTop: 15,
        marginBottom: 5,
        color: '#333',
        fontWeight: 'bold',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        padding: 10,
        fontSize: 16,
    },
    multilineInput: {
        height: 100,
        textAlignVertical: 'top',
    },
    genderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    genderButton: {
        flex: 1,
        padding: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    selectedGenderButton: {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50',
    },
    genderButtonText: {
        color: 'black',
        fontWeight: 'bold',
    },
    selectedGenderText: {
        color: 'white',
        fontWeight: 'bold',
    },
    datePickerButton: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        padding: 10,
    },
    submitButton: {
        backgroundColor: '#4CAF50',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    submitButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    // Modal styles
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    datePickerModal: {
        width: width * 0.9,
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
    },
    datePickerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    datePickerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    datePickerColumn: {
        flex: 1,
        marginHorizontal: 5,
    },
    datePickerLabel: {
        textAlign: 'center',
        marginBottom: 10,
        fontWeight: 'bold',
    },
    pickerScrollView: {
        height: 150,
    },
    dateOption: {
        paddingVertical: 10,
        alignItems: 'center',
    },
    selectedDateOption: {
        backgroundColor: '#e6f7e6',
    },
    dateOptionText: {
        fontSize: 16,
    },
    selectedDateOptionText: {
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    datePickerButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    cancelButton: {
        flex: 1,
        padding: 12,
        marginRight: 10,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    confirmButton: {
        flex: 1,
        padding: 12,
        marginLeft: 10,
        borderRadius: 5,
        backgroundColor: '#4CAF50',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#333',
    },
    confirmButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default EditProfileScreen;
