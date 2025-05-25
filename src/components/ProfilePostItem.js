import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    Alert
} from 'react-native';

// Hàm tạo URL ảnh
const createImageUrl = (path) => {
    if (!path) {
        console.warn('DEBUG: Không có path');
        return null;
    }

    try {
        // Loại bỏ dấu / ở đầu nếu có
        const cleanPath = path.replace(/^\//, '');

        // Log các bước xử lý
        console.log('DEBUG - Original Path:', path);
        console.log('DEBUG - Cleaned Path:', cleanPath);

        // Tạo URL hoàn chỉnh
        // LƯU Ý: Thay đổi IP nếu cần
        const fullUrl = `http://192.168.1.73:8082/api/files/image?bucketName=thanh&path=${encodeURIComponent(cleanPath)}`;

        console.log('DEBUG - Full Image URL:', fullUrl);
        return fullUrl;
    } catch (error) {
        console.error('DEBUG - Lỗi khi tạo URL:', error);
        return null;
    }
};

const ProfilePostItem = ({ item }) => {
    // Debug toàn bộ item
    useEffect(() => {
        console.log('DEBUG - Toàn bộ Post Item:', JSON.stringify(item, null, 2));
    }, [item]);

    // Xử lý URL ảnh
    const imageUrl = item.imageUrl
        ? createImageUrl(item.imageUrl)
        : null;

    // Log URL ảnh
    useEffect(() => {
        console.log('DEBUG - Processed Image URL:', imageUrl);
    }, [imageUrl]);

    return (
        <View style={styles.postItem}>
            {/* Header */}
            <View style={styles.postHeader}>
                <Image
                    source={{
                        uri: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
                    }}
                    style={styles.avatar}
                />
                <View style={styles.postHeaderInfo}>
                    <Text style={styles.username}>
                        {item.userRes?.fullName || 'Người dùng'}
                    </Text>
                    <Text style={styles.timestamp}>
                        {item.createdAt
                            ? new Date(item.createdAt).toLocaleDateString('vi-VN')
                            : 'Ngày không xác định'}
                    </Text>
                </View>
            </View>

            {/* Nội dung bài viết */}
            <Text style={styles.postContent}>
                {item.content || 'Không có nội dung'}
            </Text>

            {/* Hiển thị hình ảnh */}
            {imageUrl && (
                <View>
                    {/* Hiển thị đường dẫn ảnh để kiểm tra */}
                    <Text style={styles.imagePathText}>
                        Original Path: {item.imageUrl}
                    </Text>

                    {/* Hiển thị hình ảnh từ URL */}
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.postImage}
                        resizeMode="cover"
                        onError={(e) => {
                            console.error('DEBUG - Lỗi tải hình ảnh:', {
                                error: e.nativeEvent.error,
                                imageUrl: imageUrl
                            });
                            Alert.alert(
                                'Lỗi tải ảnh',
                                `Không thể tải ảnh từ URL: ${imageUrl}`
                            );
                        }}
                        onLoadStart={() => console.log('DEBUG - Bắt đầu tải ảnh')}
                        onLoad={() => console.log('DEBUG - Tải ảnh thành công')}
                    />

                    {/* Thêm hình ảnh mẫu để kiểm tra */}
                    <Text style={styles.imagePathText}>Ảnh mẫu:</Text>
                    <Image
                        source={{ uri: 'https://picsum.photos/500/300' }}
                        style={[styles.postImage, { height: 100 }]}
                        resizeMode="cover"
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    // ... các styles khác giữ nguyên như trước
    imagePathText: {
        fontSize: 12,
        color: 'red', // Đổi màu để dễ nhận biết
        marginBottom: 5,
        textAlign: 'center'
    },
});

export default ProfilePostItem;
