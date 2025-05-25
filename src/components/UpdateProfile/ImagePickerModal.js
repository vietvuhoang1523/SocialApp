import React from 'react';
import { View, Text, TouchableOpacity, Modal, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import { styles } from './styles';

const ImagePickerModal = ({ visible, imageType, onClose, onChooseImage }) => {
    const handleChooseImage = async () => {
        try {
            // Yêu cầu quyền truy cập thư viện ảnh
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    'Quyền truy cập bị từ chối',
                    'Bạn cần cấp quyền truy cập thư viện ảnh để sử dụng tính năng này.'
                );
                return;
            }

            // Mở thư viện ảnh
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: imageType === 'avatar' ? [1, 1] : [16, 9],
                quality: 0.8,
            });

            if (!result.canceled) {
                // Tạo asset tương tự như react-native-image-picker để giữ nhất quán API
                const asset = {
                    uri: result.assets[0].uri,
                    type: 'image/jpeg', // Mặc định cho Expo
                    fileName: result.assets[0].uri.split('/').pop(),
                    width: result.assets[0].width,
                    height: result.assets[0].height
                };

                onChooseImage(asset);
            }
        } catch (error) {
            console.error('Lỗi khi chọn ảnh:', error);
            Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại sau.');
        } finally {
            onClose();
        }
    };

    const handleTakePhoto = async () => {
        try {
            // Yêu cầu quyền truy cập camera
            const { status } = await ImagePicker.requestCameraPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    'Quyền truy cập bị từ chối',
                    'Bạn cần cấp quyền truy cập camera để sử dụng tính năng này.'
                );
                return;
            }

            // Mở camera
            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: imageType === 'avatar' ? [1, 1] : [16, 9],
                quality: 0.8,
            });

            if (!result.canceled) {
                // Tạo asset tương tự như react-native-image-picker
                const asset = {
                    uri: result.assets[0].uri,
                    type: 'image/jpeg',
                    fileName: result.assets[0].uri.split('/').pop(),
                    width: result.assets[0].width,
                    height: result.assets[0].height
                };

                onChooseImage(asset);
            }
        } catch (error) {
            console.error('Lỗi khi chụp ảnh:', error);
            Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại sau.');
        } finally {
            onClose();
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.modalBackground}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={styles.imagePickerModal}>
                    <Text style={styles.imagePickerTitle}>
                        {imageType === 'avatar' ? 'Thay đổi ảnh đại diện' : 'Thay đổi ảnh bìa'}
                    </Text>

                    <TouchableOpacity
                        style={styles.imagePickerOption}
                        onPress={handleChooseImage}
                    >
                        <Icon name="image" size={24} color="#1877F2" style={styles.imagePickerIcon} />
                        <Text style={styles.imagePickerOptionText}>Chọn từ thư viện</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.imagePickerOption}
                        onPress={handleTakePhoto}
                    >
                        <Icon name="camera" size={24} color="#1877F2" style={styles.imagePickerIcon} />
                        <Text style={styles.imagePickerOptionText}>Chụp ảnh mới</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.imagePickerOption, styles.cancelOption]}
                        onPress={onClose}
                    >
                        <Text style={styles.cancelOptionText}>Hủy</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

export default ImagePickerModal;
