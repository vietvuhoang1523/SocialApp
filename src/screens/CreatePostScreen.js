import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Image,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    ActivityIndicator,
    Platform,
    Animated
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import PostService from '../services/CreatePostService';

// Enum cho quyền riêng tư
const PrivacyOptions = {
    PUBLIC: 'PUBLIC',
    PRIVATE: 'PRIVATE',
    FRIENDS_ONLY: 'FRIENDS_ONLY'
};

const CreatePostComponent = ({ onPostCreated, navigation }) => {
    // State quản lý form
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imageFiles, setImageFiles] = useState([]);
    const [privacy, setPrivacy] = useState(PrivacyOptions.PUBLIC);

    // State quản lý UI
    const [imagePreview, setImagePreview] = useState(null);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Animation states
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(50));
    const [scaleAnim] = useState(new Animated.Value(0.95));

    // Xin quyền truy cập thư viện ảnh khi component mount và khởi tạo animations
    useEffect(() => {
        (async () => {
            try {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                console.log("Initial permission status:", status);
            } catch (err) {
                console.error("Error requesting permissions:", err);
            }
        })();

        // ✨ Entrance animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    // Xử lý thay đổi nội dung bài đăng
    const handleContentChange = (text) => {
        // Giới hạn 5000 ký tự
        if (text.length <= 5000) {
            setContent(text);
            setError('');
        } else {
            setError('Nội dung bài đăng không được vượt quá 5000 ký tự');
        }
    };

    // ✨ Xử lý chọn nhiều ảnh
    const handleMultipleImageUpload = async () => {
        try {
            // Kiểm tra số lượng ảnh hiện tại
            if (imageFiles.length >= 10) {
                setError('Chỉ được chọn tối đa 10 hình ảnh');
                return;
            }

            // Xin quyền truy cập thư viện ảnh
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            console.log("Permission status:", status);

            if (status !== 'granted') {
                setError('Cần cấp quyền truy cập thư viện ảnh để tải lên');
                return;
            }

            console.log("🖼️ Launching multiple image picker...");

            // Chọn nhiều ảnh
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: "Images",
                quality: 0.8,
                allowsEditing: false,
                allowsMultipleSelection: true, // ✨ Enable multiple selection
                selectionLimit: Math.min(10 - imageFiles.length, 10), // Giới hạn số ảnh còn lại
            });

            console.log("📷 Multiple picker result:", JSON.stringify(result));

            if (!result.canceled && result.assets && result.assets.length > 0) {
                console.log(`📸 Selected ${result.assets.length} images`);

                const newImageFiles = [];
                const newImagePreviews = [];

                result.assets.forEach((selectedAsset, index) => {
                    console.log(`🖼️ Processing image ${index + 1}:`, selectedAsset);

                    // Lấy tên file từ URI
                    const uriParts = selectedAsset.uri.split('/');
                    const fileName = uriParts[uriParts.length - 1];

                    // Đoán loại file dựa trên phần mở rộng
                    const fileExtension = fileName.split('.').pop().toLowerCase();
                    const mimeType = getMimeType(fileExtension);

                    const fileObject = {
                        uri: selectedAsset.uri,
                        type: mimeType,
                        name: fileName,
                        id: Date.now() + index, // Unique ID
                    };

                    newImageFiles.push(fileObject);
                    newImagePreviews.push({
                        id: Date.now() + index,
                        uri: selectedAsset.uri
                    });
                });

                // ✨ Cập nhật state với ảnh mới
                setImageFiles(prev => [...prev, ...newImageFiles]);
                setImagePreviews(prev => [...prev, ...newImagePreviews]);
                setError('');

                console.log(`✅ Added ${newImageFiles.length} images. Total: ${imageFiles.length + newImageFiles.length}`);
            } else {
                console.log("❌ Multiple image selection canceled or failed");
            }
        } catch (error) {
            console.error("❌ Multiple image upload error:", error);
            setError(`Lỗi khi chọn ảnh: ${error.message}`);
        }
    };

    // Xử lý chọn ảnh (single - backward compatibility)
    const handleImageUpload = async () => {
        try {
            // Nếu đã có nhiều ảnh, không cho phép thêm single image
            if (imageFiles.length > 0) {
                setError('Đã có nhiều ảnh, vui lòng xóa ảnh hiện tại để thêm ảnh đơn');
                return;
            }

            // Xin quyền truy cập thư viện ảnh
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            console.log("Permission status:", status);

            if (status !== 'granted') {
                setError('Cần cấp quyền truy cập thư viện ảnh để tải lên');
                return;
            }

            console.log("📷 Launching single image picker...");

            // Sử dụng cấu trúc cũ/đơn giản
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: "Images",
                quality: 1,
                allowsEditing: true,
                aspect: [4, 3]
            });

            console.log("📸 Single picker result:", JSON.stringify(result));

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const selectedAsset = result.assets[0];
                console.log("🖼️ Selected single asset:", JSON.stringify(selectedAsset));

                // Lấy tên file từ URI
                const uriParts = selectedAsset.uri.split('/');
                const fileName = uriParts[uriParts.length - 1];

                // Đoán loại file dựa trên phần mở rộng
                const fileExtension = fileName.split('.').pop().toLowerCase();
                const mimeType = getMimeType(fileExtension);

                const fileObject = {
                    uri: selectedAsset.uri,
                    type: mimeType,
                    name: fileName,
                };

                console.log("📤 Prepared single file object:", JSON.stringify(fileObject));

                setImageFile(fileObject);
                setImagePreview(selectedAsset.uri);
                setError('');

                console.log("✅ Single image set successfully");
            } else {
                console.log("❌ Single image selection canceled or failed");
            }
        } catch (error) {
            console.error("❌ Single image upload error:", error);
            setError(`Lỗi khi chọn ảnh: ${error.message}`);
        }
    };

    // Helper để xác định loại MIME từ phần mở rộng
    const getMimeType = (extension) => {
        switch (extension) {
            case 'jpg':
            case 'jpeg':
                return 'image/jpeg';
            case 'png':
                return 'image/png';
            case 'gif':
                return 'image/gif';
            case 'webp':
                return 'image/webp';
            default:
                return 'image/jpeg'; // Mặc định
        }
    };

    // ✨ Xóa một ảnh cụ thể trong danh sách
    const handleRemoveImageFromList = (imageId) => {
        setImageFiles(prev => prev.filter(img => img.id !== imageId));
        setImagePreviews(prev => prev.filter(img => img.id !== imageId));
        console.log(`🗑️ Removed image with ID: ${imageId}`);
    };

    // Xóa ảnh (single image - backward compatibility)
    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        console.log("🗑️ Removed single image");
    };

    // ✨ Xóa tất cả ảnh
    const handleRemoveAllImages = () => {
        setImageFiles([]);
        setImagePreviews([]);
        setImageFile(null);
        setImagePreview(null);
        setError('');
        console.log("🗑️ Removed all images");
    };

    // Gửi bài đăng
    const handleSubmitPost = async () => {
        // Reset trạng thái
        setError('');
        setIsLoading(true);

        // ✨ Validate - cho phép cả single và multiple images
        const hasContent = content.trim();
        const hasSingleImage = imageFile;
        const hasMultipleImages = imageFiles.length > 0;

        if (!hasContent && !hasSingleImage && !hasMultipleImages) {
            setError('Vui lòng nhập nội dung hoặc chọn ảnh');
            setIsLoading(false);
            return;
        }

        try {
            console.log("📤 Đang chuẩn bị gửi bài đăng...");
            console.log("📝 Content:", content);
            console.log("🖼️ ImageFiles (multiple):", imageFiles.length);
            console.log("📷 ImageFile (single):", imageFile ? "có" : "không");
            console.log("🔒 Privacy:", privacy);

            // ✨ Tạo payload phù hợp
            const postData = {
                content: content,
                type: privacy
            };

            // ✨ Ưu tiên multiple images
            if (hasMultipleImages) {
                postData.imageFiles = imageFiles;
                console.log(`📸 Sử dụng ${imageFiles.length} hình ảnh`);
            } else if (hasSingleImage) {
                postData.imageFile = imageFile;
                console.log("📷 Sử dụng 1 hình ảnh");
            }

            // Gọi service tạo bài đăng
            const newPost = await PostService.createPost(postData);

            console.log("✅ Kết quả tạo bài đăng:", newPost);

            // Gọi callback nếu có
            if (onPostCreated) {
                onPostCreated(newPost);
            }

            // ✨ Reset form - bao gồm cả multiple images
            setContent('');
            setImageFile(null);
            setImageFiles([]);
            setImagePreview(null);
            setImagePreviews([]);
            setPrivacy(PrivacyOptions.PUBLIC);
            setIsLoading(false);

            // Thông báo thành công
            const imageCount = hasMultipleImages ? imageFiles.length : (hasSingleImage ? 1 : 0);
            Alert.alert(
                'Thành công', 
                `Đăng bài thành công${imageCount > 0 ? ` với ${imageCount} hình ảnh!` : '!'}`
            );

            // Quay lại màn hình trước đó nếu có navigation
            if (navigation) {
                navigation.goBack();
            }
        } catch (error) {
            console.error("❌ Error in handleSubmitPost:", error);
            // Xử lý lỗi chi tiết
            setError(error.message || 'Đã có lỗi xảy ra khi đăng bài');
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* ✨ Header với gradient */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation?.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tạo bài viết</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView 
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <Animated.View 
                    style={[
                        styles.createPostContainer,
                        {
                            opacity: fadeAnim,
                            transform: [
                                { translateY: slideAnim },
                                { scale: scaleAnim }
                            ]
                        }
                    ]}
                >
                    {/* ✨ Profile Section */}
                    <View style={styles.profileSection}>
                        <View style={styles.avatarContainer}>
                            <MaterialIcons name="person" size={32} color="#6c7ce7" />
                        </View>
                        <View style={styles.userInfo}>
                            <Text style={styles.userName}>Bạn</Text>
                            <View style={styles.privacyBadge}>
                                <MaterialIcons 
                                    name={privacy === PrivacyOptions.PUBLIC ? "public" : 
                                          privacy === PrivacyOptions.FRIENDS_ONLY ? "group" : "lock"} 
                                    size={14} 
                                    color="#6c7ce7" 
                                />
                                <Text style={styles.privacyBadgeText}>
                                    {privacy === PrivacyOptions.PUBLIC ? "Công khai" :
                                     privacy === PrivacyOptions.FRIENDS_ONLY ? "Bạn bè" : "Riêng tư"}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* ✨ Content Input với improved design */}
                    <View style={styles.contentSection}>
                <TextInput
                    style={styles.postContentInput}
                            placeholder="Bạn đang nghĩ gì? ✨"
                            placeholderTextColor="#a0a0a0"
                    value={content}
                    onChangeText={handleContentChange}
                    multiline
                            numberOfLines={6}
                        />
                        
                        {/* Character counter */}
                        <View style={styles.characterCounter}>
                            <Text style={[
                                styles.characterCountText,
                                content.length > 4500 && styles.characterCountWarning
                            ]}>
                                {content.length}/5000
                            </Text>
                        </View>
                    </View>

                    {/* ✨ Multiple Images Preview */}
                    {imagePreviews.length > 0 && (
                        <Animated.View style={styles.multipleImagesContainer}>
                            <View style={styles.imagesHeader}>
                                <Text style={styles.imagesHeaderText}>
                                    📸 {imagePreviews.length}/10 hình ảnh
                                </Text>
                                <TouchableOpacity
                                    style={styles.clearAllButton}
                                    onPress={handleRemoveAllImages}
                                >
                                    <MaterialIcons name="clear-all" size={20} color="#ff6b6b" />
                                    <Text style={styles.clearAllText}>Xóa tất cả</Text>
                                </TouchableOpacity>
                            </View>
                            
                            <ScrollView 
                                horizontal 
                                showsHorizontalScrollIndicator={false}
                                style={styles.imagesScrollView}
                                contentContainerStyle={styles.imagesScrollContent}
                            >
                                {imagePreviews.map((image, index) => (
                                    <View key={image.id} style={styles.imagePreviewItem}>
                                        <Image
                                            source={{ uri: image.uri }}
                                            style={styles.multiplePreviewImage}
                                            resizeMode="cover"
                                        />
                                        <TouchableOpacity
                                            style={styles.removeImageItemBtn}
                                            onPress={() => handleRemoveImageFromList(image.id)}
                                        >
                                            <MaterialIcons name="close" size={16} color="#fff" />
                                        </TouchableOpacity>
                                        <View style={styles.imageIndexBadge}>
                                            <Text style={styles.imageIndexText}>{index + 1}</Text>
                                        </View>
                                    </View>
                                ))}
                                
                                {/* Add more button */}
                                {imagePreviews.length < 10 && (
                                    <TouchableOpacity
                                        style={styles.addMoreImageBtn}
                                        onPress={handleMultipleImageUpload}
                                    >
                                        <MaterialIcons name="add-photo-alternate" size={32} color="#6c7ce7" />
                                        <Text style={styles.addMoreImageText}>Thêm ảnh</Text>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>
                        </Animated.View>
                    )}

                    {/* ✨ Single Image Preview (backward compatibility) */}
                    {imagePreview && imagePreviews.length === 0 && (
                        <Animated.View 
                            style={styles.imagePreviewContainer}
                            entering="fadeInUp"
                        >
                        <Image
                            source={{ uri: imagePreview }}
                            style={styles.previewImage}
                            resizeMode="cover"
                        />
                        <TouchableOpacity
                            style={styles.removeImageBtn}
                            onPress={handleRemoveImage}
                        >
                                <MaterialIcons name="close" size={18} color="#fff" />
                        </TouchableOpacity>
                            <View style={styles.imageOverlay}>
                                <MaterialIcons name="image" size={20} color="#fff" />
                    </View>
                        </Animated.View>
                )}

                    {/* ✨ Error Message với improved design */}
                {error ? (
                        <Animated.View 
                            style={styles.errorContainer}
                            entering="fadeInDown"
                        >
                            <MaterialIcons name="error-outline" size={20} color="#ff6b6b" />
                        <Text style={styles.errorText}>{error}</Text>
                        </Animated.View>
                    ) : null}

                    {/* ✨ Privacy Options với card design */}
                    <View style={styles.privacySection}>
                        <Text style={styles.sectionTitle}>
                            <MaterialIcons name="visibility" size={18} color="#6c7ce7" />
                            {" "}Ai có thể xem bài viết này?
                        </Text>
                        <View style={styles.privacyOptionsContainer}>
                            {[
                                { key: PrivacyOptions.PUBLIC, label: "Công khai", icon: "public", desc: "Ai cũng có thể xem" },
                                { key: PrivacyOptions.FRIENDS_ONLY, label: "Bạn bè", icon: "group", desc: "Chỉ bạn bè của bạn" },
                                { key: PrivacyOptions.PRIVATE, label: "Riêng tư", icon: "lock", desc: "Chỉ mình bạn" }
                            ].map((option) => (
                                <TouchableOpacity
                                    key={option.key}
                                    style={[
                                        styles.privacyOptionCard,
                                        privacy === option.key && styles.privacyOptionSelected
                                    ]}
                                    onPress={() => setPrivacy(option.key)}
                                >
                                    <MaterialIcons 
                                        name={option.icon} 
                                        size={24} 
                                        color={privacy === option.key ? "#6c7ce7" : "#888"} 
                                    />
                                    <Text style={[
                                        styles.privacyOptionLabel,
                                        privacy === option.key && styles.privacyOptionLabelSelected
                                    ]}>
                                        {option.label}
                                    </Text>
                                    <Text style={styles.privacyOptionDesc}>{option.desc}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </Animated.View>
            </ScrollView>

            {/* ✨ Bottom Action Bar với gradient */}
            <View style={styles.bottomBar}>
                {/* ✨ Image Upload Options */}
                <View style={styles.mediaButtonsContainer}>
                    <TouchableOpacity
                        style={[styles.mediaButton, imageFiles.length > 0 && styles.mediaButtonDisabled]}
                        onPress={handleImageUpload}
                        disabled={imageFiles.length > 0}
                    >
                        <MaterialIcons name="image" size={20} color={imageFiles.length > 0 ? "#ccc" : "#6c7ce7"} />
                        <Text style={[styles.mediaButtonText, imageFiles.length > 0 && styles.mediaButtonTextDisabled]}>
                            1 ảnh
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.mediaButton, imageFile && styles.mediaButtonDisabled]}
                        onPress={handleMultipleImageUpload}
                        disabled={!!imageFile}
                    >
                        <MaterialIcons name="collections" size={20} color={imageFile ? "#ccc" : "#6c7ce7"} />
                        <Text style={[styles.mediaButtonText, imageFile && styles.mediaButtonTextDisabled]}>
                            Nhiều ảnh
                        </Text>
                    </TouchableOpacity>
                </View>

                        <TouchableOpacity
                            style={[
                        styles.submitButton,
                        (!content.trim() && !imageFile && imageFiles.length === 0) || isLoading
                            ? styles.submitButtonDisabled
                            : styles.submitButtonActive
                            ]}
                    onPress={handleSubmitPost}
                    disabled={(!content.trim() && !imageFile && imageFiles.length === 0) || isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <MaterialIcons name="send" size={20} color="#fff" />
                            <Text style={styles.submitButtonText}>
                                Đăng bài
                                {imageFiles.length > 0 && ` (${imageFiles.length} ảnh)`}
                                {imageFile && " (1 ảnh)"}
                            </Text>
                        </>
                    )}
                        </TouchableOpacity>
                    </View>
                </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6c7ce7',
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingBottom: 15,
        paddingHorizontal: 20,
        elevation: 8,
        shadowColor: '#6c7ce7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
        marginLeft: -40, // Compensate for back button
    },
    placeholder: {
        width: 40,
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100, // Space for bottom bar
    },
    createPostContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        shadowColor: '#6c7ce7',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
        padding: 20,
        marginBottom: 20,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f2f5',
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(108, 124, 231, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 2,
        borderColor: '#6c7ce7',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2d3436',
        marginBottom: 4,
    },
    privacyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(108, 124, 231, 0.1)',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        alignSelf: 'flex-start',
    },
    privacyBadgeText: {
        fontSize: 12,
        color: '#6c7ce7',
        fontWeight: '600',
        marginLeft: 4,
    },
    contentSection: {
        marginBottom: 20,
    },
    postContentInput: {
        minHeight: 120,
        borderWidth: 2,
        borderColor: '#e1e8ed',
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        textAlignVertical: 'top',
        backgroundColor: '#fafbfc',
        color: '#2d3436',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    characterCounter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 8,
    },
    characterCountText: {
        fontSize: 12,
        color: '#74b9ff',
        fontWeight: '500',
    },
    characterCountWarning: {
        color: '#ff6b6b',
        fontWeight: '700',
    },
    imagePreviewContainer: {
        position: 'relative',
        marginBottom: 20,
        height: 240,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#f8f9fa',
        borderWidth: 2,
        borderColor: '#e1e8ed',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    removeImageBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(255, 107, 107, 0.9)',
        borderRadius: 20,
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#ff6b6b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffebee',
        borderWidth: 1,
        borderColor: '#ff6b6b',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    errorText: {
        color: '#ff6b6b',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 8,
        flex: 1,
    },
    privacySection: {
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
        color: '#2d3436',
        flexDirection: 'row',
        alignItems: 'center',
    },
    privacyOptionsContainer: {
        gap: 12,
    },
    privacyOptionCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        padding: 16,
        marginBottom: 8,
        borderWidth: 2,
        borderColor: '#e1e8ed',
        alignItems: 'center',
    },
    privacyOptionSelected: {
        backgroundColor: 'rgba(108, 124, 231, 0.1)',
        borderColor: '#6c7ce7',
        transform: [{ scale: 1.02 }],
    },
    privacyOptionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#636e72',
        marginTop: 8,
    },
    privacyOptionLabelSelected: {
        color: '#6c7ce7',
        fontWeight: '700',
    },
    privacyOptionDesc: {
        fontSize: 11,
        color: '#b2bec3',
        textAlign: 'center',
        marginTop: 4,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: Platform.OS === 'ios' ? 32 : 16,
        borderTopWidth: 1,
        borderTopColor: '#e1e8ed',
        elevation: 8,
        shadowColor: '#6c7ce7',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    mediaButtonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    mediaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(108, 124, 231, 0.1)',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#6c7ce7',
    },
    mediaButtonDisabled: {
        backgroundColor: '#f0f0f0',
        borderColor: '#ddd',
        elevation: 0,
        shadowOpacity: 0,
    },
    mediaButtonText: {
        color: '#6c7ce7',
        marginLeft: 6,
        fontSize: 12,
        fontWeight: '600',
    },
    mediaButtonTextDisabled: {
        color: '#999',
    },
    submitButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 25,
        paddingVertical: 14,
        paddingHorizontal: 20,
        elevation: 4,
        shadowColor: '#6c7ce7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    submitButtonDisabled: {
        backgroundColor: '#ddd',
        elevation: 0,
        shadowOpacity: 0,
    },
    submitButtonActive: {
        backgroundColor: '#6c7ce7',
    },
    submitButtonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 16,
        marginLeft: 8,
    },
    multipleImagesContainer: {
        marginBottom: 20,
    },
    imagesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e1e8ed',
    },
    imagesHeaderText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2d3436',
    },
    clearAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        borderRadius: 16,
        padding: 8,
    },
    clearAllText: {
        color: '#ff6b6b',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    imagesScrollView: {
        flex: 1,
    },
    imagesScrollContent: {
        padding: 12,
    },
    imagePreviewItem: {
        position: 'relative',
        marginRight: 12,
        width: 180,
        height: 180,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#f8f9fa',
        borderWidth: 2,
        borderColor: '#e1e8ed',
    },
    multiplePreviewImage: {
        width: 180,
        height: 180,
    },
    removeImageItemBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(255, 107, 107, 0.9)',
        borderRadius: 20,
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#ff6b6b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    imageIndexBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 20,
        paddingHorizontal: 4,
        paddingVertical: 2,
        flexDirection: 'row',
        alignItems: 'center',
    },
    imageIndexText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
    },
    addMoreImageBtn: {
        width: 180,
        height: 180,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(108, 124, 231, 0.1)',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#6c7ce7',
        borderStyle: 'dashed',
    },
    addMoreImageText: {
        color: '#6c7ce7',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 8,
        textAlign: 'center',
    },
});

export default CreatePostComponent;
