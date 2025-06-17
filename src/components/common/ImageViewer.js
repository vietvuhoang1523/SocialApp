import React, { useState } from 'react';
import {
  Modal,
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const ImageViewer = ({ visible, images, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [loading, setLoading] = useState(true);
  
  const scale = useSharedValue(1);
  
  // Handle pinch gesture
  const pinchHandler = useAnimatedGestureHandler({
    onActive: (event) => {
      scale.value = event.scale;
    },
    onEnd: () => {
      scale.value = withTiming(1, { duration: 200 });
    }
  });
  
  // Animated style for image scaling
  const imageAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }]
    };
  });
  
  // Handle image load
  const handleImageLoad = () => {
    setLoading(false);
  };
  
  // Navigate to previous image
  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setLoading(true);
    }
  };
  
  // Navigate to next image
  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setLoading(true);
    }
  };
  
  // Close modal and reset state
  const handleClose = () => {
    onClose();
    // Reset state after animation completes
    setTimeout(() => {
      setCurrentIndex(initialIndex);
      setLoading(true);
    }, 300);
  };
  
  if (!images || images.length === 0) return null;
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <StatusBar hidden />
      <View style={styles.container}>
        {/* Close button */}
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
        
        {/* Navigation arrows */}
        {currentIndex > 0 && (
          <TouchableOpacity style={styles.navButtonLeft} onPress={goToPrevious}>
            <Ionicons name="chevron-back" size={36} color="white" />
          </TouchableOpacity>
        )}
        
        {currentIndex < images.length - 1 && (
          <TouchableOpacity style={styles.navButtonRight} onPress={goToNext}>
            <Ionicons name="chevron-forward" size={36} color="white" />
          </TouchableOpacity>
        )}
        
        {/* Image with pinch zoom */}
        <PinchGestureHandler
          onGestureEvent={pinchHandler}
          onHandlerStateChange={({ nativeEvent }) => {
            if (nativeEvent.state === State.END) {
              scale.value = withTiming(1, { duration: 200 });
            }
          }}
        >
          <Animated.View style={styles.imageContainer}>
            <Animated.Image
              source={{ uri: images[currentIndex] }}
              style={[styles.image, imageAnimatedStyle]}
              resizeMode="contain"
              onLoad={handleImageLoad}
            />
            
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="white" />
              </View>
            )}
          </Animated.View>
        </PinchGestureHandler>
        
        {/* Image counter */}
        {images.length > 1 && (
          <View style={styles.counterContainer}>
            <View style={styles.counterBadge}>
              <Ionicons name="images-outline" size={16} color="white" />
              <View style={styles.counterTextContainer}>
                <Ionicons name="ellipse" size={8} color="white" />
                <Ionicons 
                  name="ellipse" 
                  size={8} 
                  color="rgba(255,255,255,0.5)" 
                  style={styles.counterDot} 
                />
                <Ionicons name="ellipse" size={8} color="white" />
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonLeft: {
    position: 'absolute',
    left: 10,
    zIndex: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonRight: {
    position: 'absolute',
    right: 10,
    zIndex: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width,
    height: height,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterContainer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  counterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  counterTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  counterDot: {
    marginHorizontal: 4,
  }
});

export default ImageViewer; 