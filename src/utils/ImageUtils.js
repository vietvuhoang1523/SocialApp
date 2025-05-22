// src/utils/ImageUtils.js
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

class ImageUtils {
    // Chọn ảnh từ thư viện
    static async pickImageFromLibrary() {
        try {
            // Yêu cầu quyền truy cập thư viện ảnh
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    'Quyền truy cập bị từ chối',
                    'Ứng dụng cần quyền truy cập thư viện ảnh để chọn hình ảnh.'
                );
                return null;
            }

            // Mở thư viện ảnh
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                return {
                    uri: asset.uri,
                    type: asset.type || 'image/jpeg',
                    fileName: asset.fileName || `image_${Date.now()}.jpg`,
                    fileSize: asset.fileSize,
                    width: asset.width,
                    height: asset.height
                };
            }

            return null;
        } catch (error) {
            console.error('Error picking image from library:', error);
            Alert.alert('Lỗi', 'Không thể chọn hình ảnh. Vui lòng thử lại.');
            return null;
        }
    }

    // Chụp ảnh từ camera
    static async takePhotoWithCamera() {
        try {
            // Yêu cầu quyền truy cập camera
            const { status } = await ImagePicker.requestCameraPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    'Quyền truy cập bị từ chối',
                    'Ứng dụng cần quyền truy cập camera để chụp ảnh.'
                );
                return null;
            }

            // Mở camera
            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                return {
                    uri: asset.uri,
                    type: 'image/jpeg',
                    fileName: `photo_${Date.now()}.jpg`,
                    fileSize: asset.fileSize,
                    width: asset.width,
                    height: asset.height
                };
            }

            return null;
        } catch (error) {
            console.error('Error taking photo with camera:', error);
            Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
            return null;
        }
    }

    // Hiển thị ActionSheet để chọn nguồn ảnh
    static async showImagePicker() {
        return new Promise((resolve) => {
            Alert.alert(
                'Chọn hình ảnh',
                'Bạn muốn chọn hình ảnh từ đâu?',
                [
                    {
                        text: 'Hủy',
                        style: 'cancel',
                        onPress: () => resolve(null)
                    },
                    {
                        text: 'Thư viện ảnh',
                        onPress: async () => {
                            const result = await this.pickImageFromLibrary();
                            resolve(result);
                        }
                    },
                    {
                        text: 'Chụp ảnh',
                        onPress: async () => {
                            const result = await this.takePhotoWithCamera();
                            resolve(result);
                        }
                    }
                ]
            );
        });
    }

    // Resize ảnh (nếu cần)
    static getResizedDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
        let width = originalWidth;
        let height = originalHeight;

        // Tính toán tỷ lệ
        const aspectRatio = width / height;

        if (width > maxWidth) {
            width = maxWidth;
            height = width / aspectRatio;
        }

        if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
        }

        return { width: Math.round(width), height: Math.round(height) };
    }
}

export default ImageUtils;