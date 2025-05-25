import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles } from './styles';

// Form section header component
export const FormComponents = ({ icon, title }) => {
    return (
        <View style={styles.sectionHeader}>
            <Icon name={icon} size={20} color="#1877F2" />
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
    );
};

// Custom input component
export const CustomInput = ({
                                label,
                                value,
                                onChangeText,
                                placeholder,
                                multiline = false,
                                numberOfLines = 1,
                                keyboardType = 'default',
                                secureTextEntry = false,
                            }) => {
    return (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={[
                    styles.input,
                    multiline && styles.multilineInput
                ]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#999"
                multiline={multiline}
                numberOfLines={numberOfLines}
                keyboardType={keyboardType}
                secureTextEntry={secureTextEntry}
            />
        </View>
    );
};

// Gender selector component
export const GenderSelector = ({ gender, setGender }) => {
    return (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>Giới tính</Text>
            <View style={styles.genderContainer}>
                <TouchableOpacity
                    style={[
                        styles.genderButton,
                        gender === false && styles.selectedGenderButton
                    ]}
                    onPress={() => setGender(false)}
                >
                    <Text
                        style={gender === false ? styles.selectedGenderText : styles.genderButtonText}
                    >
                        Nam
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.genderButton,
                        gender === true && styles.selectedGenderButton
                    ]}
                    onPress={() => setGender(true)}
                >
                    <Text
                        style={gender === true ? styles.selectedGenderText : styles.genderButtonText}
                    >
                        Nữ
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// Date picker button component
export const DatePickerButton = ({ dateOfBirth, setShowDatePicker }) => {
    return (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>Ngày sinh</Text>
            <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
            >
                <Text style={styles.datePickerButtonText}>
                    {dateOfBirth.toLocaleDateString('vi-VN')}
                </Text>
                <Icon name="calendar" size={20} color="#666" />
            </TouchableOpacity>
        </View>
    );
};

// Submit button component
export const SubmitButton = ({ onPress, isLoading }) => {
    return (
        <TouchableOpacity
            style={styles.submitButton}
            onPress={onPress}
            disabled={isLoading}
        >
            {isLoading ? (
                <ActivityIndicator color="white" />
            ) : (
                <>
                    <Icon name="content-save" size={20} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.submitButtonText}>Lưu thay đổi</Text>
                </>
            )}
        </TouchableOpacity>
    );
};

// Personal Info Form Section
export const PersonalInfoSection = ({
                                        firstname,
                                        setFirstname,
                                        lastname,
                                        setLastname,
                                        bio,
                                        setBio,
                                        gender,
                                        setGender,
                                        dateOfBirth,
                                        setShowDatePicker
                                    }) => {
    return (
        <View>
            <FormComponents icon="account" title="Thông tin cá nhân" />

            <CustomInput
                label="Tên"
                value={firstname}
                onChangeText={setFirstname}
                placeholder="Nhập tên"
            />

            <CustomInput
                label="Họ"
                value={lastname}
                onChangeText={setLastname}
                placeholder="Nhập họ"
            />

            <CustomInput
                label="Tiểu sử"
                value={bio}
                onChangeText={setBio}
                placeholder="Viết về bản thân"
                multiline
                numberOfLines={4}
            />

            <GenderSelector gender={gender} setGender={setGender} />

            <DatePickerButton
                dateOfBirth={dateOfBirth}
                setShowDatePicker={setShowDatePicker}
            />
        </View>
    );
};

// Contact Info Form Section
export const ContactInfoSection = ({
                                       phoneNumber,
                                       setPhoneNumber,
                                       address,
                                       setAddress,
                                       website,
                                       setWebsite
                                   }) => {
    return (
        <View>
            <FormComponents icon="phone" title="Thông tin liên hệ" />

            <CustomInput
                label="Số điện thoại"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Nhập số điện thoại"
                keyboardType="phone-pad"
            />

            <CustomInput
                label="Địa chỉ"
                value={address}
                onChangeText={setAddress}
                placeholder="Nhập địa chỉ"
            />

            <CustomInput
                label="Website"
                value={website}
                onChangeText={setWebsite}
                placeholder="Nhập website"
                keyboardType="url"
            />
        </View>
    );
};

// Work Education Form Section
export const WorkEducationSection = ({
                                         occupation,
                                         setOccupation,
                                         education,
                                         setEducation
                                     }) => {
    return (
        <View>
            <FormComponents icon="briefcase" title="Công việc và học vấn" />

            <CustomInput
                label="Nghề nghiệp"
                value={occupation}
                onChangeText={setOccupation}
                placeholder="Nhập nghề nghiệp"
            />

            <CustomInput
                label="Học vấn"
                value={education}
                onChangeText={setEducation}
                placeholder="Nhập thông tin học vấn"
            />
        </View>
    );
};

// Other Info Form Section
export const OtherInfoSection = ({
                                     relationshipStatus,
                                     setRelationshipStatus,
                                     preferredLanguage,
                                     setPreferredLanguage,
                                     timezone,
                                     setTimezone
                                 }) => {
    return (
        <View>
            <FormComponents icon="cog" title="Thông tin khác" />

            <CustomInput
                label="Tình trạng mối quan hệ"
                value={relationshipStatus}
                onChangeText={setRelationshipStatus}
                placeholder="Nhập tình trạng mối quan hệ"
            />

            <CustomInput
                label="Ngôn ngữ ưa thích"
                value={preferredLanguage}
                onChangeText={setPreferredLanguage}
                placeholder="Nhập ngôn ngữ ưa thích"
            />

            <CustomInput
                label="Múi giờ"
                value={timezone}
                onChangeText={setTimezone}
                placeholder="Nhập múi giờ"
            />
        </View>
    );
};
