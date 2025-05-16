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
    Platform
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
    const [privacy, setPrivacy] = useState(PrivacyOptions.PUBLIC);

    // State quản lý UI
    const [imagePreview, setImagePreview] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Xin quyền truy cập thư viện ảnh khi component mount
    useEffect(() => {
        (async () => {
            try {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                console.log("Initial permission status:", status);
            } catch (err) {
                console.error("Error requesting permissions:", err);
            }
        })();
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

    // Xử lý chọn ảnh
    const handleImageUpload = async () => {
        try {
            // Xin quyền truy cập thư viện ảnh
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            console.log("Permission status:", status);

            if (status !== 'granted') {
                setError('Cần cấp quyền truy cập thư viện ảnh để tải lên');
                return;
            }

            console.log("Launching image picker...");

            // Sử dụng cấu trúc cũ/đơn giản
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: "Images",
                quality: 1,
                allowsEditing: true,
                aspect: [4, 3]
            });

            console.log("Picker result:", JSON.stringify(result));

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const selectedAsset = result.assets[0];
                console.log("Selected asset:", JSON.stringify(selectedAsset));

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

                console.log("Prepared file object:", JSON.stringify(fileObject));

                setImageFile(fileObject);
                setImagePreview(selectedAsset.uri);
                setError('');

                console.log("Image set successfully");
            } else {
                console.log("Image selection canceled or failed");
            }
        } catch (error) {
            console.error("Image upload error:", error);
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

    // Xóa ảnh
    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    // Gửi bài đăng
    const handleSubmitPost = async () => {
        // Reset trạng thái
        setError('');
        setIsLoading(true);

        // Validate
        if (!content.trim() && !imageFile) {
            setError('Vui lòng nhập nội dung hoặc chọn ảnh');
            setIsLoading(false);
            return;
        }

        try {
            console.log("Đang chuẩn bị gửi bài đăng...");
            console.log("Content:", content);
            console.log("ImageFile:", JSON.stringify(imageFile));
            console.log("Privacy:", privacy);

            // Gọi service tạo bài đăng
            const newPost = await PostService.createPost({
                content: content,
                imageFile: imageFile,
                type: privacy
            });

            console.log("Kết quả tạo bài đăng:", newPost);

            // Gọi callback nếu có
            if (onPostCreated) {
                onPostCreated(newPost);
            }

            // Reset form
            setContent('');
            setImageFile(null);
            setImagePreview(null);
            setPrivacy(PrivacyOptions.PUBLIC);
            setIsLoading(false);

            // Thông báo
            Alert.alert('Thành công', 'Đăng bài thành công!');

            // Quay lại màn hình trước đó nếu có navigation
            if (navigation) {
                navigation.goBack();
            }
        } catch (error) {
            console.error("Error in handleSubmitPost:", error);
            // Xử lý lỗi chi tiết
            setError(error.message || 'Đã có lỗi xảy ra khi đăng bài');
            setIsLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.createPostContainer}>
                {/* Textarea nhập nội dung */}
                <TextInput
                    style={styles.postContentInput}
                    placeholder="Bạn đang nghĩ gì?"
                    value={content}
                    onChangeText={handleContentChange}
                    multiline
                    numberOfLines={4}
                />

                {/* Hiển thị preview ảnh */}
                {imagePreview && (
                    <View style={styles.imagePreview}>
                        <Image
                            source={{ uri: imagePreview }}
                            style={styles.previewImage}
                            resizeMode="cover"
                        />
                        <TouchableOpacity
                            style={styles.removeImageBtn}
                            onPress={handleRemoveImage}
                        >
                            <MaterialIcons name="close" size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Hiển thị lỗi */}
                {error ? (
                    <View style={styles.errorMessage}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                {/* Các hành động: upload ảnh, chọn quyền riêng tư */}
                <View style={styles.postActions}>
                    {/* Nút upload ảnh */}
                    <TouchableOpacity
                        style={styles.uploadImageBtn}
                        onPress={handleImageUpload}
                    >
                        <MaterialIcons name="image" size={20} color="#1877f2" />
                        <Text style={styles.uploadImageBtnText}>Ảnh/Video</Text>
                    </TouchableOpacity>

                    {/* Nút đăng bài */}
                    <TouchableOpacity
                        style={[
                            styles.submitPostBtn,
                            (!content.trim() && !imageFile) || isLoading
                                ? styles.submitPostBtnDisabled
                                : null
                        ]}
                        onPress={handleSubmitPost}
                        disabled={(!content.trim() && !imageFile) || isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Text style={styles.submitPostBtnText}>Đăng</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Quyền riêng tư */}
                <View style={styles.privacyContainer}>
                    <Text style={styles.privacyLabel}>Quyền riêng tư:</Text>
                    <View style={styles.privacyOptions}>
                        <TouchableOpacity
                            style={[
                                styles.privacyOption,
                                privacy === PrivacyOptions.PUBLIC && styles.privacyOptionSelected
                            ]}
                            onPress={() => setPrivacy(PrivacyOptions.PUBLIC)}
                        >
                            <Text
                                style={[
                                    styles.privacyOptionText,
                                    privacy === PrivacyOptions.PUBLIC && styles.privacyOptionTextSelected
                                ]}
                            >
                                Công khai
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.privacyOption,
                                privacy === PrivacyOptions.FRIENDS_ONLY && styles.privacyOptionSelected
                            ]}
                            onPress={() => setPrivacy(PrivacyOptions.FRIENDS_ONLY)}
                        >
                            <Text
                                style={[
                                    styles.privacyOptionText,
                                    privacy === PrivacyOptions.FRIENDS_ONLY && styles.privacyOptionTextSelected
                                ]}
                            >
                                Bạn bè
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.privacyOption,
                                privacy === PrivacyOptions.PRIVATE && styles.privacyOptionSelected
                            ]}
                            onPress={() => setPrivacy(PrivacyOptions.PRIVATE)}
                        >
                            <Text
                                style={[
                                    styles.privacyOptionText,
                                    privacy === PrivacyOptions.PRIVATE && styles.privacyOptionTextSelected
                                ]}
                            >
                                Chỉ mình tôi
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f2f5',
    },
    createPostContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
        padding: 16,
        margin: 10,
    },
    postContentInput: {
        minHeight: 100,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        fontSize: 16,
        textAlignVertical: 'top',
    },
    imagePreview: {
        position: 'relative',
        marginBottom: 12,
        height: 200,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        overflow: 'hidden',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    removeImageBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 15,
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorMessage: {
        backgroundColor: '#f8d7da',
        borderWidth: 1,
        borderColor: '#f5c6cb',
        borderRadius: 4,
        padding: 10,
        marginBottom: 12,
    },
    errorText: {
        color: '#dc3545',
        fontSize: 14,
    },
    postActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    uploadImageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f2f5',
        borderRadius: 6,
        padding: 8,
        paddingHorizontal: 12,
    },
    uploadImageBtnText: {
        color: '#1877f2',
        marginLeft: 8,
        fontSize: 14,
    },
    submitPostBtn: {
        backgroundColor: '#1877f2',
        borderRadius: 6,
        padding: 10,
        paddingHorizontal: 16,
    },
    submitPostBtnDisabled: {
        backgroundColor: '#b0b3b8',
    },
    submitPostBtnText: {
        color: 'white',
        fontWeight: '500',
    },
    privacyContainer: {
        marginTop: 10,
    },
    privacyLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 6,
    },
    privacyOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    privacyOption: {
        flex: 1,
        padding: 8,
        backgroundColor: '#f0f2f5',
        borderRadius: 4,
        marginHorizontal: 2,
        alignItems: 'center',
    },
    privacyOptionSelected: {
        backgroundColor: '#e6f2ff',
        borderWidth: 1,
        borderColor: '#1877f2',
    },
    privacyOptionText: {
        fontSize: 12,
        color: '#444',
    },
    privacyOptionTextSelected: {
        color: '#1877f2',
        fontWeight: '500',
    },
});

export default CreatePostComponent;