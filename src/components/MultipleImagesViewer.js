import React, { useState } from 'react';
import {
    View,
    Image,
    StyleSheet,
    ActivityIndicator,
    Text,
    ScrollView,
    Dimensions,
    TouchableOpacity,
    Modal
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width: screenWidth } = Dimensions.get('window');

const MultipleImagesViewer = ({ 
    images = [], 
    containerStyle = {},
    imageHeight = 300,
    enableFullScreen = true,
    enableCounter = true,
    enableDots = true
}) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [imagesLoading, setImagesLoading] = useState({});
    const [imagesError, setImagesError] = useState({});
    const [fullScreenVisible, setFullScreenVisible] = useState(false);
    const [fullScreenIndex, setFullScreenIndex] = useState(0);

    const imageWidth = screenWidth - 24; // Accounting for padding

    if (!images || images.length === 0) return null;

    // ✨ Xử lý scroll của images
    const handleImageScroll = (event) => {
        const contentOffset = event.nativeEvent.contentOffset;
        const imageIndex = Math.round(contentOffset.x / imageWidth);
        setCurrentImageIndex(imageIndex);
    };

    // ✨ Xử lý load image
    const handleImageLoadStart = (imageId) => {
        setImagesLoading(prev => ({ ...prev, [imageId]: true }));
    };

    const handleImageLoad = (imageId) => {
        setImagesLoading(prev => ({ ...prev, [imageId]: false }));
        setImagesError(prev => ({ ...prev, [imageId]: false }));
    };

    const handleImageError = (imageId, imageUrl) => {
        console.log("Image failed to load:", imageUrl);
        setImagesLoading(prev => ({ ...prev, [imageId]: false }));
        setImagesError(prev => ({ ...prev, [imageId]: true }));
    };

    // ✨ Xử lý mở full screen
    const handleImagePress = (index) => {
        if (enableFullScreen) {
            setFullScreenIndex(index);
            setFullScreenVisible(true);
        }
    };

    // ✨ Render single image
    const renderSingleImage = (image, index) => (
        <TouchableOpacity
            key={image.id}
            style={[styles.imageContainer, { width: imageWidth, height: imageHeight }]}
            onPress={() => handleImagePress(index)}
            activeOpacity={0.9}
        >
            {imagesLoading[image.id] && (
                <ActivityIndicator
                    size="large"
                    color="#1877F2"
                    style={styles.imageLoader}
                />
            )}
            
            {!imagesError[image.id] ? (
                <Image
                    source={{ uri: image.url }}
                    style={styles.image}
                    resizeMode="cover"
                    onLoadStart={() => handleImageLoadStart(image.id)}
                    onLoad={() => handleImageLoad(image.id)}
                    onError={() => handleImageError(image.id, image.url)}
                />
            ) : (
                <View style={styles.imageErrorContainer}>
                    <Ionicons name="image-outline" size={30} color="#999" />
                    <Text style={styles.imageErrorText}>Không thể tải hình ảnh</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    // ✨ Render fullscreen modal
    const renderFullScreenModal = () => (
        <Modal
            visible={fullScreenVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setFullScreenVisible(false)}
        >
            <View style={styles.fullScreenContainer}>
                <TouchableOpacity
                    style={styles.fullScreenCloseButton}
                    onPress={() => setFullScreenVisible(false)}
                >
                    <Ionicons name="close" size={30} color="#fff" />
                </TouchableOpacity>

                <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    contentOffset={{ x: fullScreenIndex * screenWidth, y: 0 }}
                    onScroll={(event) => {
                        const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
                        setFullScreenIndex(index);
                    }}
                    scrollEventThrottle={16}
                >
                    {images.map((image, index) => (
                        <View key={image.id} style={styles.fullScreenImageContainer}>
                            <Image
                                source={{ uri: image.url }}
                                style={styles.fullScreenImage}
                                resizeMode="contain"
                            />
                        </View>
                    ))}
                </ScrollView>

                {images.length > 1 && (
                    <View style={styles.fullScreenCounter}>
                        <Text style={styles.fullScreenCounterText}>
                            {fullScreenIndex + 1} / {images.length}
                        </Text>
                    </View>
                )}
            </View>
        </Modal>
    );

    return (
        <View style={[styles.container, containerStyle]}>
            <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleImageScroll}
                scrollEventThrottle={16}
                style={styles.scrollView}
            >
                {images.map((image, index) => renderSingleImage(image, index))}
            </ScrollView>

            {/* ✨ Dots indicator */}
            {enableDots && images.length > 1 && (
                <View style={styles.dotsContainer}>
                    {images.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                currentImageIndex === index && styles.activeDot
                            ]}
                        />
                    ))}
                </View>
            )}

            {/* ✨ Image counter */}
            {enableCounter && images.length > 1 && (
                <View style={styles.imageCounter}>
                    <Text style={styles.imageCounterText}>
                        {currentImageIndex + 1}/{images.length}
                    </Text>
                </View>
            )}

            {/* ✨ Full screen modal */}
            {enableFullScreen && renderFullScreenModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        marginBottom: 10,
    },
    scrollView: {
        borderRadius: 8,
        overflow: 'hidden',
    },
    imageContainer: {
        backgroundColor: '#f0f0f0',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imageLoader: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -15,
        marginTop: -15,
        zIndex: 10,
    },
    imageErrorContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderStyle: 'dashed',
    },
    imageErrorText: {
        color: '#999',
        marginTop: 8,
        fontSize: 14,
    },
    // Dots indicator
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: 15,
        left: 0,
        right: 0,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        marginHorizontal: 3,
    },
    activeDot: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    // Image counter
    imageCounter: {
        position: 'absolute',
        top: 15,
        right: 15,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    imageCounterText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    // Full screen styles
    fullScreenContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenCloseButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 20,
        padding: 10,
    },
    fullScreenImageContainer: {
        width: screenWidth,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenImage: {
        width: screenWidth,
        height: '80%',
    },
    fullScreenCounter: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    fullScreenCounterText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
});

export default MultipleImagesViewer; 