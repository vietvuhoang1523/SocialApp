import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    ScrollView,
    ActivityIndicator,
    Alert,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import createPostService from '../../src/services/CreatePostService';

const EditPostScreen = ({ route, navigation }) => {
    // Lấy thông tin từ params
    const { postId, initialContent, imageUrl, onEditSuccess } = route.params;

    // State cho form
    const [content, setContent] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [originalImageUrl, setOriginalImageUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imageChanged, setImageChanged] = useState(false);

    // Tải dữ liệu ban đầu
    useEffect(() => {
        const loadPostData = async () => {
            try {
                if (initialContent) {
                    setContent(initialContent);
                }
                if (imageUrl) {
                    setOriginalImageUrl(imageUrl);
                }

                // Nếu không có dữ liệu ban đầu, tải từ API
                if (!initialContent || !imageUrl) {
                    const postData = await createPostService.getPostById(postId);
                    setContent(postData.content || '');

                    if (postData.imageUrl) {
                        const fullImageUrl = createPostService.createImageUrl(postData.imageUrl);
                        setOriginalImageUrl(fullImageUrl);
                    }
                }
            } catch (error) {
                console.error('Lỗi khi tải thông tin bài viết:', error);
                Alert.alert('Lỗi', 'Không thể tải thông tin bài viết. Vui lòng thử lại sau.');
            }
        };

        loadPostData();

        // Yêu cầu quyền truy cập thư viện ảnh
        (async () => {
            if (Platform.OS !== 'web') {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Lỗi', 'Chúng tôi cần quyền truy cập thư viện ảnh để thực hiện chức năng này.');
                }
            }
        })();
    }, [postId, initialContent, imageUrl]);

    // Xử lý khi chọn ảnh từ thư viện
    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled) {
                setSelectedImage({
                    uri: result.assets[0].uri,
                    type: 'image/jpeg',
                    name: 'post_image.jpg'
                });
                setImageChanged(true);
            }
        } catch (error) {
            console.error('Lỗi khi chọn ảnh:', error);
            Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
        }
    };

    // Xử lý khi xóa ảnh
    const removeImage = () => {
        setSelectedImage(null);
        setImageChanged(true);
    };

    // Xử lý khi lưu thay đổi
    const handleSubmit = async () => {
        // Validate
        if (!content.trim() && !selectedImage && !originalImageUrl) {
            Alert.alert('Thông báo', 'Vui lòng nhập nội dung hoặc chọn ảnh cho bài viết.');
            return;
        }

        setIsSubmitting(true);

        try {
            // Chuẩn bị dữ liệu
            const postData = {
                content: content.trim(),
                // Chỉ thêm imageFile khi có ảnh mới được chọn
                imageFile: imageChanged ? selectedImage : undefined,
                // Nếu ảnh đã bị xóa (đặt imageChanged = true và selectedImage = null)
                // API cần xử lý việc xóa ảnh dựa trên việc không có imageFile
            };

            // Gọi API cập nhật bài viết
            await createPostService.updatePost(postId, postData);

            // Thông báo thành công
            Alert.alert('Thành công', 'Bài viết đã được cập nhật.', [
                {
                    text: 'OK',
                    onPress: () => {
                        // Gọi callback nếu có
                        if (onEditSuccess) {
                            onEditSuccess(postId);
                        }
                        // Quay lại màn hình trước đó
                        navigation.goBack();
                    }
                }
            ]);
        } catch (error) {
            console.error('Lỗi khi cập nhật bài viết:', error);
            Alert.alert('Lỗi', 'Không thể cập nhật bài viết. Vui lòng thử lại sau.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sửa bài viết</Text>
                <TouchableOpacity
                    style={[styles.publishButton, (!content.trim() && !selectedImage && !originalImageUrl) ? styles.disabledButton : null]}
                    onPress={handleSubmit}
                    disabled={isSubmitting || (!content.trim() && !selectedImage && !originalImageUrl)}
                >
                    {isSubmitting ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.publishButtonText}>Lưu</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
                <TextInput
                    style={styles.contentInput}
                    placeholder="Bạn đang nghĩ gì?"
                    placeholderTextColor="#888"
                    multiline
                    value={content}
                    onChangeText={setContent}
                />

                {/* Hiển thị ảnh đã chọn */}
                {selectedImage && (
                    <View style={styles.imagePreviewContainer}>
                        <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} />
                        <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                            <Ionicons name="close-circle" size={30} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Hiển thị ảnh hiện tại nếu không có ảnh mới và ảnh hiện tại không bị xóa */}
                {!selectedImage && originalImageUrl && !imageChanged && (
                    <View style={styles.imagePreviewContainer}>
                        <Image source={{ uri: originalImageUrl }} style={styles.imagePreview} />
                        <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                            <Ionicons name="close-circle" size={30} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Nút thêm ảnh */}
                {(!selectedImage && (!originalImageUrl || imageChanged)) && (
                    <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                        <Ionicons name="image-outline" size={24} color="#1877F2" />
                        <Text style={styles.addImageText}>Thêm ảnh</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    publishButton: {
        backgroundColor: '#1877F2',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 4,
    },
    disabledButton: {
        backgroundColor: '#BCC0C4',
    },
    publishButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    contentInput: {
        fontSize: 16,
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: 16,
    },
    imagePreviewContainer: {
        marginBottom: 16,
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: 200,
        borderRadius: 8,
    },
    removeImageButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 15,
    },
    addImageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 8,
        borderStyle: 'dashed',
    },
    addImageText: {
        marginLeft: 8,
        color: '#1877F2',
        fontWeight: '500',
    },
});

export default EditPostScreen;
