import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  StyleSheet,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { 
  createSportsPost, 
  getSportsPosts, 
  getAllSportsPosts,
  getMyPosts,
  getSportsPostById,
  leaveSportsPost 
} from '../services/sportsService';
import SportsPostParticipantService from '../services/SportsPostParticipantService';

const { width } = Dimensions.get('window');

const SportsPostExample = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);

  // Load posts khi component mount
  useEffect(() => {
    loadPosts();
  }, []);

  // Hàm load danh sách posts
  const loadPosts = async () => {
    try {
      setLoading(true);
      
      // Có thể chọn một trong các hàm sau:
      // const response = await getSportsPosts(0, 10); // Chỉ available posts
      // const response = await getAllSportsPosts(0, 10); // Tất cả posts
      const response = await getMyPosts(0, 10); // Posts của mình
      
      console.log('📋 Loaded posts:', response);
      setPosts(response.content || []);
    } catch (error) {
      console.error('❌ Error loading posts:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách bài đăng');
    } finally {
      setLoading(false);
    }
  };

  // Hàm chọn hình ảnh
  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        maxFiles: 5, // Giới hạn 5 ảnh
      });

      if (!result.canceled && result.assets) {
        setSelectedImages(result.assets);
        console.log('📸 Selected images:', result.assets.length);
      }
    } catch (error) {
      console.error('❌ Error picking images:', error);
      Alert.alert('Lỗi', 'Không thể chọn hình ảnh');
    }
  };

  // Hàm tạo post mới
  const createNewPost = async () => {
    try {
      setLoading(true);

      const postData = {
        title: 'Bài đăng thể thao mẫu',
        description: 'Mô tả bài đăng với hình ảnh',
        sportType: 'FOOTBALL',
        skillLevel: 'BEGINNER',
        maxParticipants: 10,
        location: 'Hà Nội',
        latitude: 21.0285,
        longitude: 105.8542,
        scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Ngày mai
        tags: ['football', 'hanoi', 'beginner']
      };

      console.log('🏀 Creating post with images:', selectedImages.length);
      
      const newPost = await createSportsPost(postData, selectedImages);
      console.log('✅ Created post:', newPost);
      
      // Thêm post mới vào đầu danh sách
      setPosts(prevPosts => [newPost, ...prevPosts]);
      setSelectedImages([]);
      
      Alert.alert('Thành công', 'Tạo bài đăng thành công!');
    } catch (error) {
      console.error('❌ Error creating post:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tạo bài đăng');
    } finally {
      setLoading(false);
    }
  };

  // Hàm tham gia post
  const handleJoinPost = async (postId) => {
    try {
      console.log('🤝 Joining post:', postId);
      const updatedPost = await SportsPostParticipantService.joinSportsPost(postId, 'Tôi muốn tham gia!');
      
      // Cập nhật post trong danh sách - need to reload the post data
      loadPosts(); // Reload all posts to get updated data
      
      Alert.alert('Thành công', 'Đã gửi yêu cầu tham gia!');
    } catch (error) {
      console.error('❌ Error joining post:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tham gia bài đăng');
    }
  };

  // Component hiển thị hình ảnh của post
  const PostImages = ({ images, imageUrls, imagePaths, postImages }) => {
    // Tổng hợp tất cả các source hình ảnh có thể
    const allImages = [
      ...(images || []),
      ...(imageUrls || []),
      ...(imagePaths || []),
      ...(postImages || [])
    ].filter(Boolean);

    if (!allImages || allImages.length === 0) {
      return (
        <View style={styles.noImageContainer}>
          <Text style={styles.noImageText}>Không có hình ảnh</Text>
        </View>
      );
    }

    return (
      <View style={styles.imageContainer}>
        <FlatList
          data={allImages}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => `image_${index}`}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.imageWrapper}
              onPress={() => {
                console.log('🖼️ Image tapped:', item);
                // Có thể mở modal xem ảnh full size
              }}
            >
              <Image
                source={{ uri: item }}
                style={styles.postImage}
                resizeMode="cover"
                onError={(error) => {
                  console.error(`❌ Error loading image ${index}:`, error);
                }}
                onLoad={() => {
                  console.log(`✅ Image ${index} loaded successfully`);
                }}
              />
              {index === 0 && allImages.length > 1 && (
                <View style={styles.imageCountBadge}>
                  <Text style={styles.imageCountText}>+{allImages.length - 1}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  // Component hiển thị một post
  const PostItem = ({ item }) => (
    <View style={styles.postContainer}>
      <Text style={styles.postTitle}>{item.title}</Text>
      <Text style={styles.postDescription}>{item.description}</Text>
      
      {/* Hiển thị hình ảnh */}
      <PostImages 
        images={item.images}
        imageUrls={item.imageUrls}
        imagePaths={item.imagePaths}
        postImages={item.postImages}
      />
      
      <View style={styles.postInfo}>
        <Text>🏃 {item.sportType}</Text>
        <Text>📍 {item.location}</Text>
        <Text>👥 {item.currentParticipants || 0}/{item.maxParticipants}</Text>
      </View>
      
      <TouchableOpacity
        style={styles.joinButton}
        onPress={() => handleJoinPost(item.id)}
      >
        <Text style={styles.joinButtonText}>Tham gia</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Sports Posts với Hình ảnh</Text>
      
      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={pickImages}>
          <Text style={styles.buttonText}>
            Chọn ảnh ({selectedImages.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.createButton]} 
          onPress={createNewPost}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Tạo Post</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={loadPosts}>
          <Text style={styles.buttonText}>Reload</Text>
        </TouchableOpacity>
      </View>

      {/* Loading indicator */}
      {loading && <ActivityIndicator size="large" color="#007AFF" />}

      {/* Posts list */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={({ item }) => <PostItem item={item} />}
        refreshing={loading}
        onRefresh={loadPosts}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    minWidth: 80,
  },
  createButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  postContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  postDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  imageContainer: {
    marginVertical: 12,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 8,
  },
  postImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  imageCountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  imageCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  noImageContainer: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  noImageText: {
    color: '#999',
    fontStyle: 'italic',
  },
  postInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  joinButton: {
    backgroundColor: '#FF9500',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default SportsPostExample; 