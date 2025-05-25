import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
    // Main container styles
    safeArea: {
        flex: 1,
        backgroundColor: '#1877F2',
    },
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    formContainer: {
        marginTop: 70,
        paddingHorizontal: 16,
        paddingBottom: 30,
    },

    // Header styles
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1877F2',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
    },
    backButton: {
        padding: 8,
    },
    saveButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    saveButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },

    // Cover image styles
    coverImageContainer: {
        height: 200,
        position: 'relative',
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    coverGradient: {
        flex: 1,
        justifyContent: 'flex-end',
        padding: 16,
    },
    editCoverButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    editCoverText: {
        color: 'white',
        marginLeft: 6,
        fontSize: 12,
        fontWeight: '500',
    },

    // Profile picture styles
    profilePictureWrapper: {
        position: 'absolute',
        bottom: -60,
        left: 20,
    },
    profilePictureContainer: {
        position: 'relative',
    },
    profilePicture: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#FFF',
    },
    cameraIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#1877F2',
        borderRadius: 18,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },

    // Form section styles
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
        color: '#333',
    },

    // Input styles
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
    },
    multilineInput: {
        height: 100,
        textAlignVertical: 'top',
    },

    // Gender button styles
    genderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    genderButton: {
        flex: 1,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        marginHorizontal: 5,
        alignItems: 'center',
        backgroundColor: '#FFF',
    },
    selectedGenderButton: {
        backgroundColor: '#1877F2',
        borderColor: '#1877F2',
    },
    genderButtonText: {
        color: '#333',
        fontWeight: '500',
    },
    selectedGenderText: {
        color: 'white',
        fontWeight: '600',
    },

    // Date picker button styles
    datePickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 12,
    },
    datePickerButtonText: {
        fontSize: 16,
        color: '#333',
    },

    // Submit button styles
    submitButton: {
        flexDirection: 'row',
        backgroundColor: '#1877F2',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
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

    // Date picker modal styles
    datePickerModal: {
        width: width * 0.9,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    datePickerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#333',
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
        color: '#666',
    },
    pickerScrollView: {
        height: 150,
    },
    dateOption: {
        paddingVertical: 10,
        alignItems: 'center',
    },
    selectedDateOption: {
        backgroundColor: '#E6F2FF',
        borderRadius: 8,
    },
    dateOptionText: {
        fontSize: 16,
        color: '#333',
    },
    selectedDateOptionText: {
        color: '#1877F2',
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
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        alignItems: 'center',
        backgroundColor: '#FFF',
    },
    confirmButton: {
        flex: 1,
        padding: 12,
        marginLeft: 10,
        borderRadius: 8,
        backgroundColor: '#1877F2',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#666',
        fontWeight: '500',
    },
    confirmButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },

    // Image picker modal styles
    imagePickerModal: {
        width: width * 0.9,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    imagePickerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#333',
    },
    imagePickerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    imagePickerIcon: {
        marginRight: 16,
    },
    imagePickerOptionText: {
        fontSize: 16,
        color: '#333',
    },
    cancelOption: {
        justifyContent: 'center',
        paddingVertical: 14,
        marginTop: 8,
        borderBottomWidth: 0,
    },
    cancelOptionText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#F44336',
        textAlign: 'center',
    },
});
