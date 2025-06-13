import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
    // Main container styles
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 30,
    },

    // Header styles
    headerGradient: {
        paddingTop: 10,
        paddingBottom: 15,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
        flex: 1,
        textAlign: 'center',
    },
    backButton: {
        padding: 5,
    },
    saveButton: {
        padding: 5,
    },
    saveButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 5,
    },

    // Cover image styles - Enhanced Modern Design
    imageSection: {
        position: 'relative',
        marginBottom: 80, // Space for floating profile picture
    },
    coverImageContainer: {
        height: 200,
        position: 'relative',
        borderRadius: 20,
        overflow: 'hidden',
        marginHorizontal: 15,
        marginTop: 15,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    coverImageStyle: {
        borderRadius: 20,
    },
    coverGradient: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        padding: 20,
    },
    editCoverButton: {
        borderRadius: 25,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#E91E63',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
    },
    editButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 25,
    },
    editCoverText: {
        color: 'white',
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.5,
    },

    // Profile picture styles - Enhanced with Floating Effect
    profilePictureWrapper: {
        position: 'absolute',
        bottom: -70,
        left: 25,
        zIndex: 10,
        alignItems: 'center',
    },
    profilePictureContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profilePictureRing: {
        position: 'relative',
        padding: 4,
        borderRadius: 70,
        backgroundColor: 'white',
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
    },
    profilePicture: {
        width: 130,
        height: 130,
        borderRadius: 65,
        borderWidth: 4,
        borderColor: '#FFF',
    },
    statusRing: {
        position: 'absolute',
        top: -2,
        left: -2,
        right: -2,
        bottom: -2,
        borderRadius: 72,
        borderWidth: 3,
        borderColor: 'rgba(76, 175, 80, 0.3)',
    },
    cameraIconWrapper: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 6,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
    },
    cameraIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    onlineIndicator: {
        position: 'absolute',
        top: 15,
        right: 15,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 2,
        elevation: 4,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    onlineDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#4CAF50',
    },
    floatingHint: {
        marginTop: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    hintText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: 0.5,
    },

    // Form section styles
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 15,
        marginHorizontal: 15,
        paddingBottom: 12,
        borderBottomWidth: 2,
        borderBottomColor: '#E91E63',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
        color: '#333',
    },

    // Input styles
    inputGroup: {
        marginBottom: 16,
        marginHorizontal: 15,
    },
    label: {
        fontSize: 16,
        color: '#333',
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        color: '#333',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    multilineInput: {
        height: 100,
        textAlignVertical: 'top',
    },

    // Gender button styles
    genderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    genderButton: {
        flex: 1,
        padding: 15,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#FFF',
    },
    selectedGenderButton: {
        backgroundColor: '#E91E63',
        borderColor: '#E91E63',
    },
    genderButtonText: {
        color: '#333',
        fontWeight: '600',
        fontSize: 16,
    },
    selectedGenderText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },

    // Date picker button styles
    datePickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    datePickerButtonText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },

    // Submit button styles
    submitButton: {
        flexDirection: 'row',
        backgroundColor: '#E91E63',
        padding: 16,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 30,
        marginHorizontal: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    submitButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 25,
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    disabledButton: {
        opacity: 0.6,
    },

    // Image picker modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#333',
    },
    modalButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 15,
        color: '#333',
    },
    modalCancelButton: {
        backgroundColor: '#E91E63',
        marginTop: 10,
    },
    modalCancelButtonText: {
        color: '#FFF',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
    },

    // Date picker modal styles
    datePickerModal: {
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 15,
        margin: 20,
    },
    datePickerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#333',
    },
    datePickerRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    datePickerColumn: {
        alignItems: 'center',
    },
    datePickerLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#E91E63',
        marginBottom: 10,
    },
    datePickerButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
    },
    datePickerButton: {
        backgroundColor: '#E91E63',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        minWidth: 80,
    },
    datePickerButtonSecondary: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#E91E63',
    },
    datePickerButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    datePickerButtonTextSecondary: {
        color: '#E91E63',
    },

    // Auto-save indicator
    autoSaveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        backgroundColor: 'rgba(233, 30, 99, 0.1)',
        marginHorizontal: 15,
        borderRadius: 8,
        marginBottom: 10,
    },
    autoSaveText: {
        color: '#E91E63',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 5,
    },
});
