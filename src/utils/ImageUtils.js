// src/utils/ImageUtils.js
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export const pickImageFromLibrary = async () => {
    try {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert('Quyền truy cập', 'Bạn cần cấp quyền truy cập thư viện ảnh để sử dụng tính năng này.');
            return null;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
            allowsMultipleSelection: false
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            return {
                uri: result.assets[0].uri,
                type: 'image/jpeg',
                fileName: `attachment_${Date.now()}.jpg`
            };
        }

        return null;
    } catch (error) {
        console.error('Lỗi khi chọn ảnh:', error);
        Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại sau.');
        return null;
    }
};

// Chụp ảnh từ camera
export const takePhoto = async () => {
    try {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert('Quyền truy cập', 'Bạn cần cấp quyền truy cập camera để sử dụng tính năng này.');
            return null;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            return {
                uri: result.assets[0].uri,
                type: 'image/jpeg',
                fileName: `camera_${Date.now()}.jpg`
            };
        }

        return null;
    } catch (error) {
        console.error('Lỗi khi chụp ảnh:', error);
        Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại sau.');
        return null;
    }
};

// Định dạng thời gian tin nhắn
export const formatMessageTime = (dateTimeStr) => {
    try {
        const date = new Date(dateTimeStr);
        const now = new Date();

        // Nếu là hôm nay, chỉ hiển thị giờ:phút
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        // Nếu là trong tuần này, hiển thị thứ và giờ
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffDays < 7) {
            const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
            return `${dayNames[date.getDay()]} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }

        // Nếu khác, hiển thị DD/MM/YYYY
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        return '';
    }
};

export default {
    pickImageFromLibrary,
    takePhoto,
    formatMessageTime
};