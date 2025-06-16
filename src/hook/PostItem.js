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
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '../services/config';
import createPostService from '../services/CreatePostService';
import MultipleImagesViewer from '../components/MultipleImagesViewer';

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
                      currentUserId, // Prop từ parent
                      onDeleteSuccess,
                      onEditSuccess
                  }) => {
    const [optionsVisible, setOptionsVisible] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [checkingOwnership, setCheckingOwnership] = useState(false);
    const [localCurrentUserId, setLocalCurrentUserId] = useState(currentUserId);

    // ✨ Xử lý multiple images từ backend
    const processImages = () => {
        // Kiểm tra nếu có multiple images từ backend (imageUrls array)
        if (item?.imageUrls && Array.isArray(item.imageUrls) && item.imageUrls.length > 0) {
            console.log('🖼️ DEBUG - Multiple imageUrls found:', item.imageUrls);
            return item.imageUrls.map((imgUrl, index) => ({
                url: getFullImageUrl(imgUrl),
                id: `multi_${index}`
            }));
        }
        
        // Kiểm tra nếu có PostImage entities (từ API response mới)
        if (item?.images && Array.isArray(item.images) && item.images.length > 0) {
            console.log('🖼️ DEBUG - PostImage entities found:', item.images);
            return item.images
                .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)) // Sort by displayOrder
                .map(img => ({
                    url: getFullImageUrl(img.imageUrl || img.url),
                    id: img.id || `entity_${img.displayOrder || 0}`
                }));
        }
        
        // Kiểm tra single image (backward compatibility)
        if (item?.imageUrl) {
            console.log('🖼️ DEBUG - Single imageUrl found:', item.imageUrl);
            return [{
                url: getFullImageUrl(item.imageUrl),
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

    // Kiểm tra quyền sở hữu khi có đủ thông tin
    useEffect(() => {
        const checkOwnership = async () => {
            try {
                // Hiển thị loading khi đang kiểm tra
                setCheckingOwnership(true);
                
                // Kiểm tra cơ bản
                if (!item?.id) {
                    setIsOwner(false);
                    setCheckingOwnership(false);
                    return;
                }

                // Nếu không có currentUserId từ props, thử lấy từ AsyncStorage
                let userId = localCurrentUserId;
                if (!userId) {
                    try {
                        // Thử lấy từ userData
                        const userData = await AsyncStorage.getItem('userData');
                        if (userData) {
                            const parsedData = JSON.parse(userData);
                            userId = parsedData.id;
                            setLocalCurrentUserId(userId);
                        }
                        
                        // Nếu vẫn không có, thử lấy từ user
                        if (!userId) {
                            const userJson = await AsyncStorage.getItem('user');
                            if (userJson) {
                                const user = JSON.parse(userJson);
                                userId = user.id;
                                setLocalCurrentUserId(userId);
                            }
                        }
                        
                        // Nếu vẫn không có, thử lấy từ accessToken (decode JWT)
                        if (!userId) {
                            const token = await AsyncStorage.getItem('accessToken');
                            if (token) {
                                // Lấy thông tin user từ API
                                try {
                                    const response = await createPostService.api.get('/v1/users/profile');
                                    if (response.data && response.data.id) {
                                        userId = response.data.id;
                                        setLocalCurrentUserId(userId);
                                    }
                                } catch (apiError) {
                                    console.error('Lỗi khi lấy thông tin user từ API:', apiError);
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Lỗi khi lấy userData từ AsyncStorage:', error);
                    }
                }

                if (!userId) {
                    setIsOwner(false);
                    setCheckingOwnership(false);
                    return;
                }

                // Lấy ID của chủ bài viết
                const postOwnerId = item?.userRes?.id || item?.user?.id;

                if (!postOwnerId) {
                    setIsOwner(false);
                    setCheckingOwnership(false);
                    return;
                }

                // So sánh đơn giản
                const isUserOwner = String(userId) === String(postOwnerId);

                console.log('🔍 Kiểm tra quyền sở hữu:', {
                    postId: item.id,
                    currentUserId: userId,
                    postOwnerId: postOwnerId,
                    isOwner: isUserOwner
                });

                setIsOwner(isUserOwner);
                setCheckingOwnership(false);
            } catch (error) {
                console.error('Lỗi khi kiểm tra quyền sở hữu:', error);
                setIsOwner(false);
                setCheckingOwnership(false);
            }
        };

        checkOwnership();
    }, [item?.id, localCurrentUserId]);

    // Lấy thông tin người dùng với fallback
    const fullName = item?.userRes?.fullName || item?.user?.name || 'Người dùng';
    const userId = item?.userRes?.id || item?.user?.id;

    // Xử lý avatar URL với fallback
    const avatarUrl = item?.userRes?.profilePictureUrl || item?.user?.profilePictureUrl;
    const processedAvatarUrl = avatarUrl ? getFullImageUrl(avatarUrl) : null;

    const avatarSource = processedAvatarUrl
        ? { uri: processedAvatarUrl }
        : require('../assets/default-avatar.png');

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

                            // Hiển thị loading khi đang xóa
                            setCheckingOwnership(true);
                            
                            // Gọi API xóa bài viết
                            await createPostService.deletePost(item.id);
                            
                            // Ẩn loading sau khi xóa xong
                            setCheckingOwnership(false);
                            
                            // Gọi callback để cập nhật UI trước khi hiển thị thông báo
                            if (onDeleteSuccess) {
                                onDeleteSuccess(item.id);
                            }
                            
                            // Hiển thị thông báo thành công
                            setTimeout(() => {
                                Alert.alert(
                                    "Thành công", 
                                    "Đã xóa bài viết thành công",
                                    [{ text: "OK" }]
                                );
                            }, 300);
                        } catch (error) {
                            // Ẩn loading nếu có lỗi
                            setCheckingOwnership(false);
                            
                            console.error('Lỗi khi xóa bài viết:', error);
                            Alert.alert(
                                "Lỗi", 
                                "Không thể xóa bài viết. Vui lòng thử lại sau.",
                                [{ text: "OK" }]
                            );
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.postItem}>
            {/* Header với loading indicator */}
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

                    {/* Hiển thị nút sửa và xóa trực tiếp nếu là chủ bài viết */}
                    {isOwner && !checkingOwnership && (
                        <View style={styles.ownerActions}>
                            <TouchableOpacity 
                                style={styles.headerActionButton} 
                                onPress={handleEditPost}
                            >
                                <Ionicons name="create-outline" size={20} color="#1877F2" />
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={styles.headerActionButton} 
                                onPress={handleDeletePost}
                            >
                                <Ionicons name="trash-outline" size={20} color="#E53935" />
                            </TouchableOpacity>
                        </View>
                    )}

                    <TouchableOpacity style={styles.moreOptions} onPress={toggleOptionsMenu}>
                        <Ionicons name="ellipsis-horizontal" size={20} color="#65676B" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Menu tùy chọn với nút xóa/sửa */}
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
                        {/* Hiển thị nút xóa/sửa nếu là chủ bài viết */}
                        {isOwner && (
                            <>
                                <TouchableOpacity style={styles.optionItem} onPress={handleEditPost}>
                                    <Ionicons name="create-outline" size={20} color="#1877F2" />
                                    <Text style={[styles.optionText, { color: '#1877F2' }]}>Chỉnh sửa bài viết</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={[styles.optionItem, styles.deleteOption]} onPress={handleDeletePost}>
                                    <Ionicons name="trash-outline" size={20} color="#E53935" />
                                    <Text style={[styles.optionText, { color: '#E53935', fontWeight: 'bold' }]}>Xóa bài viết</Text>
                                </TouchableOpacity>

                                {/* Thêm đường phân cách */}
                                <View style={styles.divider} />
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

            {/* Phần còn lại của JSX giữ nguyên */}
            <Text style={styles.postContent}>{item?.content || 'Không có nội dung'}</Text>

            {/* ✨ Hiển thị nhiều ảnh sử dụng MultipleImagesViewer */}
            <MultipleImagesViewer 
                images={images}
                imageHeight={300}
                enableFullScreen={true}
                enableCounter={true}
                enableDots={true}
            />

            {/* Footer actions */}
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

                {isOwner && (
                    <>
                        <TouchableOpacity
                            style={styles.footerItem}
                            onPress={handleEditPost}
                        >
                            <Ionicons name="create-outline" size={20} color="#1877F2" />
                            <Text style={styles.footerText}>Sửa</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.footerItem}
                            onPress={handleDeletePost}
                        >
                            <Ionicons name="trash-outline" size={20} color="#E53935" />
                            <Text style={styles.footerText}>Xóa</Text>
                        </TouchableOpacity>
                    </>
                )}

                {onSharePress && !isOwner && (
                    <TouchableOpacity
                        style={styles.footerItem}
                        onPress={() => onSharePress(item?.id)}
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
    divider: {
        height: 1,
        backgroundColor: '#E5E5E5',
        marginVertical: 5,
        marginHorizontal: -10, // Để đường kẻ chạy full width của menu
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
    deleteOption: {
        backgroundColor: 'rgba(229, 57, 53, 0.1)',
        borderRadius: 8,
        marginVertical: 4,
    },
    ownerActions: {
        flexDirection: 'row',
        marginRight: 5,
    },
    headerActionButton: {
        padding: 5,
        marginHorizontal: 2,
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
