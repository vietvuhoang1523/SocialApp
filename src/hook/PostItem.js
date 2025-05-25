import React, {useEffect, useState} from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Image,
    Modal,
    Alert
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Config from '../../src/services/config';
import createPostService from '../../src/services/CreatePostService';

// Hàm helper để tạo URL đầy đủ từ đường dẫn tương đối
const getFullImageUrl = (relativePath) => {
    if (!relativePath) return null;

    // Nếu đường dẫn đã là URL đầy đủ, trả về ngay
    if (relativePath.startsWith('http')) {
        return relativePath;
    }

    // Xử lý path
    const cleanPath = relativePath
        .replace(/^thanh\//, '') // Xóa prefix thanh/ nếu có
        .replace(/^\//, ''); // Xóa slash đầu tiên nếu có

    const apiUrl = Config.extra.apiUrl;
    return `${apiUrl}/files/image?bucketName=thanh&path=${encodeURIComponent(cleanPath)}`;
};

const PostItem = ({
                      item,
                      onLikePress,
                      onCommentPress,
                      onSharePress,
                      navigation,
                      currentUserId,
                      onDeleteSuccess,
                      onEditSuccess
                  }) => {
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    const [optionsVisible, setOptionsVisible] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [checkingOwnership, setCheckingOwnership] = useState(false);

    // Kiểm tra quyền sở hữu khi component mount
    useEffect(() => {
        const checkOwnership = async () => {
            // Kiểm tra cơ bản trước
            if (!item?.id) {
                console.log('Item hoặc item.id không hợp lệ');
                setIsOwner(false);
                return;
            }

            // Fallback check đầu tiên - nhanh và không cần API
            if (currentUserId && item?.userRes?.id) {
                const quickCheck = String(currentUserId) === String(item.userRes.id);
                setIsOwner(quickCheck);

                // Nếu đã là owner theo quick check, không cần gọi API
                if (quickCheck) {
                    console.log('Quick ownership check: true');
                    return;
                }
            }

            // Chỉ gọi API nếu cần thiết
            try {
                setCheckingOwnership(true);
                console.log('Bắt đầu kiểm tra quyền API cho bài viết:', item.id);

                // Timeout ngắn hơn để tránh lag UI
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout')), 5000)
                );

                const checkPromise = createPostService.checkPostOwnership(item.id);
                const hasOwnership = await Promise.race([checkPromise, timeoutPromise]);

                console.log('Kết quả kiểm tra quyền API:', hasOwnership);
                setIsOwner(Boolean(hasOwnership));

            } catch (error) {
                console.error('Lỗi kiểm tra quyền:', error);

                // Giữ nguyên fallback check nếu API thất bại
                if (currentUserId && item?.userRes?.id) {
                    const fallbackOwnership = String(currentUserId) === String(item.userRes.id);
                    console.log('Sử dụng fallback ownership check:', fallbackOwnership);
                    setIsOwner(fallbackOwnership);
                } else {
                    setIsOwner(false);
                }
            } finally {
                setCheckingOwnership(false);
            }
        };

        checkOwnership();
    }, [item?.id, currentUserId]);

    // Lấy thông tin người dùng với fallback
    const fullName = item?.userRes?.fullName || item?.user?.name || 'Người dùng';
    const userId = item?.userRes?.id || item?.user?.id;

    // Xử lý avatar URL với fallback
    const avatarUrl = item?.userRes?.profilePictureUrl || item?.user?.profilePictureUrl;
    const processedAvatarUrl = avatarUrl ? getFullImageUrl(avatarUrl) : null;

    const avatarSource = processedAvatarUrl
        ? { uri: processedAvatarUrl }
        : require('../assets/default-avatar.png');

    // Xử lý post image URL với fallback
    const postImageUrl = item?.imageUrl ? getFullImageUrl(item.imageUrl) : null;

    // Format time ago với fallback
    const formatTimeAgo = (dateString) => {
        if (!dateString) return 'Không rõ thời gian';
        try {
            const now = new Date();
            const date = new Date(dateString);

            // Kiểm tra date có hợp lệ không
            if (isNaN(date.getTime())) {
                return 'Không rõ thời gian';
            }

            const diffInSeconds = Math.floor((now - date) / 1000);
            if (diffInSeconds < 60) return 'vừa xong';
            if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
            if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
            if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
            return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
        } catch (error) {
            console.error('Lỗi format time:', error);
            return 'Không rõ thời gian';
        }
    };

    const timeAgo = formatTimeAgo(item?.createdAt);

    // Hàm xử lý khi click vào ảnh đại diện hoặc tên người dùng
    const handleProfilePress = () => {
        if (navigation && userId) {
            navigation.navigate('Profile', { userId });
        }
    };

    // Xử lý hiển thị menu tùy chọn
    const toggleOptionsMenu = () => {
        setOptionsVisible(!optionsVisible);
    };

    // Xử lý chỉnh sửa bài viết
    const handleEditPost = () => {
        setOptionsVisible(false);
        if (navigation && item?.id) {
            navigation.navigate('EditPost', {
                postId: item.id,
                initialContent: item.content || '',
                imageUrl: item.imageUrl || '',
                onEditSuccess: onEditSuccess
            });
        }
    };

    // Xử lý xóa bài viết với error handling tốt hơn
    const handleDeletePost = () => {
        setOptionsVisible(false);

        Alert.alert(
            "Xác nhận xóa",
            "Bạn có chắc chắn muốn xóa bài viết này không?",
            [
                {
                    text: "Hủy",
                    style: "cancel"
                },
                {
                    text: "Xóa",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            if (!item?.id) {
                                Alert.alert("Lỗi", "Không thể xác định ID bài viết");
                                return;
                            }

                            await createPostService.deletePost(item.id);
                            Alert.alert("Thành công", "Đã xóa bài viết");

                            if (onDeleteSuccess) {
                                onDeleteSuccess(item.id);
                            }
                        } catch (error) {
                            console.error('Lỗi khi xóa bài viết:', error);
                            Alert.alert("Lỗi", "Không thể xóa bài viết. Vui lòng thử lại sau.");
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.postItem}>
            <View style={styles.postHeader}>
                <TouchableOpacity onPress={handleProfilePress}>
                    <Image
                        source={avatarSource}
                        style={styles.avatar}
                        onError={() => {
                            console.log("Avatar image failed to load:", avatarSource);
                        }}
                    />
                </TouchableOpacity>
                <TouchableOpacity style={styles.postHeaderInfo} onPress={handleProfilePress}>
                    <Text style={styles.username}>{fullName}</Text>
                    <Text style={styles.timestamp}>{timeAgo}</Text>
                </TouchableOpacity>

                <View style={styles.headerActions}>
                    {/* Hiển thị loading khi đang kiểm tra quyền API */}
                    {checkingOwnership && (
                        <ActivityIndicator size="small" color="#1877F2" style={styles.ownershipLoader} />
                    )}

                    <TouchableOpacity style={styles.moreOptions} onPress={toggleOptionsMenu}>
                        <Ionicons name="ellipsis-horizontal" size={20} color="#65676B" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Menu tùy chọn */}
            <Modal
                visible={optionsVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setOptionsVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setOptionsVisible(false)}
                >
                    <View style={styles.optionsMenu}>
                        {isOwner && (
                            <>
                                <TouchableOpacity style={styles.optionItem} onPress={handleEditPost}>
                                    <Ionicons name="create-outline" size={20} color="#1877F2" />
                                    <Text style={[styles.optionText, { color: '#1877F2' }]}>Chỉnh sửa bài viết</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.optionItem} onPress={handleDeletePost}>
                                    <Ionicons name="trash-outline" size={20} color="#E53935" />
                                    <Text style={[styles.optionText, { color: '#E53935' }]}>Xóa bài viết</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        <TouchableOpacity style={styles.optionItem} onPress={() => setOptionsVisible(false)}>
                            <Ionicons name="bookmark-outline" size={20} color="#65676B" />
                            <Text style={styles.optionText}>Lưu bài viết</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.optionItem} onPress={() => setOptionsVisible(false)}>
                            <Ionicons name="alert-circle-outline" size={20} color="#65676B" />
                            <Text style={styles.optionText}>Báo cáo bài viết</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            <Text style={styles.postContent}>{item?.content || 'Không có nội dung'}</Text>

            {/* Hiển thị hình ảnh bài đăng */}
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
                            console.log("Post image loaded successfully");
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
                    onPress={onLikePress ? () => onLikePress(item?.id) : undefined}
                >
                    <Ionicons
                        name={item?.isLike ? "heart" : "heart-outline"}
                        size={22}
                        color={item?.isLike ? "#E53935" : "#65676B"}
                    />
                    <Text style={styles.footerText}>
                        {(item?.lengthLike || 0) > 0 ? `${item.lengthLike} ` : ''}Thích
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.footerItem}
                    onPress={onCommentPress ? () => onCommentPress(item?.id) : undefined}
                >
                    <Ionicons name="chatbubble-outline" size={20} color="#65676B" />
                    <Text style={styles.footerText}>
                        {(item?.lengthCmt || 0) > 0 ? `${item.lengthCmt} ` : ''}Bình luận
                    </Text>
                </TouchableOpacity>

                {onSharePress && (
                    <TouchableOpacity
                        style={styles.footerItem}
                        onPress={() => onSharePress(item?.id)}
                    >
                        <Ionicons name="share-outline" size={20} color="#65676B" />
                        <Text style={styles.footerText}>Chia sẻ</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Debug info - chỉ hiển thị khi development */}
            {__DEV__ && (
                <View style={styles.debugInfo}>
                    <Text style={styles.debugText}>
                        isOwner: {String(isOwner)} | PostId: {item?.id} | CurrentUser: {currentUserId} | PostOwner: {item?.userRes?.id}
                    </Text>
                </View>
            )}
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
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ownershipLoader: {
        marginRight: 10,
    },
    moreOptions: {
        padding: 5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionsMenu: {
        position: 'absolute',
        right: 20,
        top: 70,
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        width: 200,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 10,
    },
    optionText: {
        marginLeft: 10,
        fontSize: 14,
        color: '#333',
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

export default PostItem;
