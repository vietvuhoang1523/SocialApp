import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Image
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Định nghĩa base URL cho API images
const API_BASE_URL = 'http://172.20.10.18:8082';
const IMAGE_API_PATH = '/api/files/image?bucketName=thanh&path=';

// Hàm helper để tạo URL đầy đủ từ đường dẫn tương đối
const getFullImageUrl = (relativePath) => {
    if (!relativePath) return null;
    return `${API_BASE_URL}${IMAGE_API_PATH}${relativePath}`;
};

const PostItem = ({ item, onLikePress, onCommentPress, onSharePress }) => {
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    // Lấy thông tin người dùng
    const fullName = item.userRes?.fullName || item.user?.name || 'Người dùng';

    // Xử lý avatar URL - sử dụng hàm getFullImageUrl để tạo URL đầy đủ
    const avatarUrl = item.userRes?.avatarUrl || item.user?.avatarUrl
        ? getFullImageUrl(item.userRes?.avatarUrl || item.user?.avatarUrl)
        : null;

    // Sử dụng default avatar nếu không có avatarUrl
    const avatarSource = avatarUrl
        ? { uri: avatarUrl }
        : require('../assets/default-avatar.png');

    // Xử lý post image URL - sử dụng hàm getFullImageUrl để tạo URL đầy đủ
    const postImageUrl = item.imageUrl
        ? getFullImageUrl(item.imageUrl)
        : null;

    // Xử lý timestamp từ createdAt
    const formattedDate = item.createdAt
        ? new Date(item.createdAt).toLocaleDateString('vi-VN')
        : 'Ngày không xác định';

    return (
        <View style={styles.postItem}>
            <View style={styles.postHeader}>
                <Image
                    source={avatarSource}
                    style={styles.avatar}
                    onError={() => {
                        console.log("Avatar image failed to load:", avatarSource);
                    }}
                />
                <View style={styles.postHeaderInfo}>
                    <Text style={styles.username}>{fullName}</Text>
                    <Text style={styles.timestamp}>{formattedDate}</Text>
                </View>
            </View>

            <Text style={styles.postContent}>{item.content || 'Không có nội dung'}</Text>

            {/* Hiển thị hình ảnh bài đăng với Image thay vì FastImage */}
            {postImageUrl && !imageError && (
                <View style={styles.imageContainer}>
                    {imageLoading && (
                        <ActivityIndicator
                            size="large"
                            color="#1877F2"
                            style={styles.imageLoader}
                        />
                    )}
                    <Image
                        source={{ uri: postImageUrl }}
                        style={styles.postImage}
                        resizeMode="cover"
                        onLoadStart={() => setImageLoading(true)}
                        onLoad={() => {
                            console.log("Post image loaded successfully:", postImageUrl);
                            setImageLoading(false);
                        }}
                        onError={() => {
                            console.log("Post image failed to load:", postImageUrl);
                            setImageLoading(false);
                            setImageError(true);
                        }}
                    />
                </View>
            )}

            {/* Hiển thị thông báo khi hình ảnh lỗi */}
            {postImageUrl && imageError && (
                <View style={styles.imageErrorContainer}>
                    <Ionicons name="image-outline" size={30} color="#999" />
                    <Text style={styles.imageErrorText}>Không thể tải hình ảnh</Text>
                </View>
            )}

            {/* Footer */}
            <View style={styles.postFooter}>
                <TouchableOpacity
                    style={styles.footerItem}
                    onPress={onLikePress ? () => onLikePress(item.id) : undefined}
                >
                    <Ionicons
                        name={item.isLike ? "heart" : "heart-outline"}
                        size={22}
                        color={item.isLike ? "#E53935" : "#65676B"}
                    />
                    <Text style={styles.footerText}>
                        {item.lengthLike > 0 ? `${item.lengthLike} ` : ''}Thích
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.footerItem}
                    onPress={onCommentPress ? () => onCommentPress(item.id) : undefined}
                >
                    <Ionicons name="chatbubble-outline" size={20} color="#65676B" />
                    <Text style={styles.footerText}>
                        {item.lengthCmt > 0 ? `${item.lengthCmt} ` : ''}Bình luận
                    </Text>
                </TouchableOpacity>

                {onSharePress && (
                    <TouchableOpacity
                        style={styles.footerItem}
                        onPress={() => onSharePress(item.id)}
                    >
                        <Ionicons name="share-outline" size={20} color="#65676B" />
                        <Text style={styles.footerText}>Chia sẻ</Text>
                    </TouchableOpacity>
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
    imageContainer: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 10,
        backgroundColor: '#f0f0f0',
        overflow: 'hidden',
        position: 'relative',
    },
    imageLoader: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -15,
        marginTop: -15,
        zIndex: 10,
    },
    postImage: {
        width: '100%',
        height: '100%',
    },
    imageErrorContainer: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        marginBottom: 10,
        backgroundColor: '#f9f9f9',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderStyle: 'dashed',
    },
    imageErrorText: {
        color: '#999',
        marginTop: 8,
        fontSize: 14,
    },
    postFooter: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
        paddingTop: 10,
        marginTop: 5,
    },
    footerItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerText: {
        marginLeft: 5,
        color: '#65676B',
    },
});

export default PostItem;