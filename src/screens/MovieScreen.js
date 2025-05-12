import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, FlatList, TouchableOpacity, Linking } from 'react-native';

const MovieScreen = ({ route, navigation }) => {
  const movie = route.params?.movie?.data;
  console.log("📦 Dữ liệu nhận được từ route.params:", movie);

  if (!movie) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>Không có dữ liệu phim.</Text>
      </View>
    );
  }

  const handleWatchMovie = () => {
    // Điều hướng đến VideoPlayerScreen với URL phim
    const movieUrl = `http://192.168.100.193:8082/api/videos/hls-stream?bucketName=thanh&path=cc/output.m3u8`;
    console.log("🔗 Đang chuyển tới màn hình phát video:", movieUrl);
    navigation.navigate('VideoPlayerScreen', { movieUrl }); // Điều hướng đến VideoPlayerScreen
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header: Tên phim và hình ảnh */}
      <View style={styles.header}>
        <Image
          source={{
            uri: `http://192.168.100.193:8082/api/movieProduct/view?bucketName=thanh&path=${movie.imgMovie}`,
          }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{movie.title}</Text>
        </View>
      </View>

      {/* Mô tả phim */}
      <View style={styles.section}>
        <Text style={styles.label}>Mô tả:</Text>
        <Text style={styles.text}>{movie.description}</Text>
      </View>

      {/* Thể loại */}
      <View style={styles.section}>
        <Text style={styles.label}>Thể loại:</Text>
        <Text style={styles.text}>{movie.genre?.name || "Không rõ"}</Text>
      </View>

      {/* Tác giả */}
      <View style={styles.section}>
        <Text style={styles.label}>Tác giả:</Text>
        {Array.isArray(movie.author) && movie.author.length > 0 ? (
          <FlatList
            horizontal
            data={movie.author}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => <Text style={styles.text}>- {item.fullName}</Text>}
          />
        ) : (
          <Text style={styles.text}>Không có</Text>
        )}
      </View>

      {/* Diễn viên */}
      <View style={styles.section}>
        <Text style={styles.label}>Diễn viên:</Text>
        {Array.isArray(movie.performer) && movie.performer.length > 0 ? (
          <FlatList
            horizontal
            data={movie.performer}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => <Text style={styles.text}>- {item.name}</Text>}
          />
        ) : (
          <Text style={styles.text}>Không có</Text>
        )}
      </View>

      {/* Lượt thích và không thích */}
      <View style={styles.likesContainer}>
        <Text style={styles.likesText}>Lượt thích: {movie.likes}</Text>
        <Text style={styles.likesText}>Lượt không thích: {movie.dislikes}</Text>
      </View>

      {/* Nút xem phim */}
      <TouchableOpacity style={styles.watchButton} onPress={handleWatchMovie}>
        <Text style={styles.watchButtonText}>Xem Phim</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
    padding: 16,
  },
  noDataText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
    marginTop: 20,
  },
  header: {
    position: 'relative',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    opacity: 0.7,
  },
  titleContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 10,
    borderRadius: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    marginTop: 16,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#fff',
  },
  text: {
    fontSize: 15,
    color: '#ccc',
    marginTop: 5,
    marginLeft: 8,
  },
  likesContainer: {
    marginTop: 20,
  },
  likesText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5,
  },
  watchButton: {
    backgroundColor: '#ff6600',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  watchButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default MovieScreen;
