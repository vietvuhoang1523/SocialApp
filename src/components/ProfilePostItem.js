import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet
} from 'react-native';
import Config from '../services/config';
import MultipleImagesViewer from './MultipleImagesViewer';

// Hàm tạo URL ảnh
const createImageUrl = (path) => {
    if (!path) return null;

    // Nếu đường dẫn đã là URL đầy đủ, trả về ngay
    if (path.startsWith('http')) {
        return path;
    }

    try {
        // Xử lý path
        const cleanPath = path
            .replace(/^thanh\//, '') // Xóa prefix thanh/ nếu có
            .replace(/^\//, ''); // Xóa slash đầu tiên nếu có

        // Tạo URL hoàn chỉnh
        const apiUrl = Config.extra.apiUrl;
        const fullUrl = `${apiUrl}/files/image?bucketName=thanh&path=${encodeURIComponent(cleanPath)}`;

        return fullUrl;
    } catch (error) {
        console.error('Lỗi khi tạo URL ảnh:', error);
        return null;
    }
};

const ProfilePostItem = ({ item }) => {
    // Debug toàn bộ item
    useEffect(() => {
        console.log('DEBUG - Profile Post Item:', JSON.stringify(item, null, 2));
    }, [item]);

    // ✨ Xử lý multiple images từ backend
    const processImages = () => {
        // Kiểm tra nếu có multiple images từ backend (imageUrls array)
        if (item?.imageUrls && Array.isArray(item.imageUrls) && item.imageUrls.length > 0) {
            console.log('🖼️ DEBUG - Multiple imageUrls found:', item.imageUrls);
            return item.imageUrls.map((imgUrl, index) => ({
                url: createImageUrl(imgUrl),
                id: `multi_${index}`
            }));
        }
        
        // Kiểm tra nếu có PostImage entities (từ API response mới)
        if (item?.images && Array.isArray(item.images) && item.images.length > 0) {
            console.log('🖼️ DEBUG - PostImage entities found:', item.images);
            return item.images
                .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)) // Sort by displayOrder
                .map(img => ({
                    url: createImageUrl(img.imageUrl || img.url),
                    id: img.id || `entity_${img.displayOrder || 0}`
                }));
        }
        
        // Kiểm tra single image (backward compatibility)
        if (item?.imageUrl) {
            console.log('🖼️ DEBUG - Single imageUrl found:', item.imageUrl);
            return [{
                url: createImageUrl(item.imageUrl),
                id: 'single'
            }];
        }
        
        console.log('🖼️ DEBUG - No images found in item:', {
            hasImageUrls: !!item?.imageUrls,
            hasImages: !!item?.images, 
            hasImageUrl: !!item?.imageUrl
        });
        return [];
    };

    const images = processImages();

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

            {/* ✨ Hiển thị nhiều ảnh sử dụng MultipleImagesViewer */}
            <MultipleImagesViewer 
                images={images}
                imageHeight={250}
                enableFullScreen={true}
                enableCounter={true}
                enableDots={true}
            />

            {/* ✨ Debug info (có thể tắt sau) */}
            <View style={styles.debugInfo}>
                <Text style={styles.debugText}>
                    Images found: {images.length}
                </Text>
                {images.length > 0 && (
                    <Text style={styles.debugText}>
                        Image sources: {images.map(img => img.id).join(', ')}
                    </Text>
                )}
                </View>
        </View>
    );
};

const styles = StyleSheet.create({
    postItem: {
        backgroundColor: 'white',
        borderRadius: 10,
        marginBottom: 10,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        elevation: 2,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    postHeaderInfo: {
        flex: 1,
    },
    username: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    timestamp: {
        fontSize: 12,
        color: '#65676B',
    },
    postContent: {
        fontSize: 14,
        marginBottom: 10,
        lineHeight: 20,
    },
    // Debug styles
    debugInfo: {
        backgroundColor: '#f0f0f0',
        padding: 8,
        marginTop: 8,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    debugText: {
        fontSize: 10,
        color: '#666',
        fontFamily: 'monospace',
    },
});

export default ProfilePostItem;
