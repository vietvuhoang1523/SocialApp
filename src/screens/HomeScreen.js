import { StatusBar } from "expo-status-bar";
import { Text, View, StyleSheet, ScrollView, FlatList,TextInput } from "react-native";
import React, { useState, useEffect } from "react";
import COLORS from "../constants/Colors";
import FONTS from "../constants/Fonts";
import GenreCard from "../components /GenreCard";
import ItemSeparator from "../components /ItemSeparator";
import MovieCard from "../components /MovieCard";
import CategoryService from "../services/CategoryService";
import SearchBar from "../components /SearchBar";
import MovieService from "../services/MovieService"; 
import Icon from 'react-native-vector-icons/MaterialIcons';

const HomeScreen = ({ navigation }) => {
  const [genres, setGenres] = useState([]);
  const [activeGenre, setActiveGenre] = useState(null);
  const [loading, setLoading] = useState(true);
  const [movies, setMovies] = useState([]);


  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await CategoryService.getAllCategories();
        console.log("📚 Dữ liệu thể loại:", response?.data?.content);
        setGenres(response?.data?.content || []);
      } catch (error) {
        console.error("❌ Lỗi khi lấy danh sách thể loại:", error);
      }
    };

    const fetchMovies = async () => {
      try {
        const response = await MovieService.getAllMovies();
        console.log("🎬 Danh sách phim:", response?.data?.content);

        if (Array.isArray(response?.data?.content)) {
          setMovies(response.data.content);
        } else {
          setMovies([]);
        }
      } catch (error) {
        console.error("❌ Lỗi khi lấy danh sách phim:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGenres();
    fetchMovies();
  }, []);


// Hàm xử lý khi nhấn vào một movie
const handleMoviePress = async (movieId) => {
  try {
    const response = await MovieService.getMovieById(movieId);
    console.log("🎬 Chi tiết phim:", response); // Chứa cả `status` và `data`

    navigation.navigate("movie", { movie: response }); // truyền cả response
  } catch (error) {
    console.error("❌ Lỗi khi lấy chi tiết phim:", error);
  }
};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar
        style="auto"
        translucent={false}
        backgroundColor={COLORS.BASIC_BACKGROUND}
      />
      {/* Tiêu đề và ô tìm kiếm */}
      <SearchBar
      />

      {/* Tiêu đề */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Now Playing</Text>
        <Text style={styles.headerSubTitle}>View All</Text>
      </View>

      {/* Danh sách thể loại */}
      <View style={styles.genreListContainer}>
        <FlatList
          data={genres}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => `${item.name}-${index}`}
          ItemSeparatorComponent={() => <ItemSeparator width={10} />}
          ListHeaderComponent={() => <ItemSeparator width={10} />}
          ListFooterComponent={() => <ItemSeparator width={10} />}
          renderItem={({ item }) => (
            <GenreCard
              genreName={item.name}
              active={item.name === activeGenre}
              onPress={(genreName) => setActiveGenre(genreName)}
            />
          )}
        />
      </View>

      {/* Danh sách phim */}
      <View>
        <FlatList
          data={movies}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => `${item.title}-${index}`}
          ItemSeparatorComponent={() => <ItemSeparator width={5} />}
          ListHeaderComponent={() => <ItemSeparator width={5} />}
          ListFooterComponent={() => <ItemSeparator width={5} />}
      //     renderItem={({ item }) => (
      //       <MovieCard movie={item} onPress={() => navigation.navigate("movie", { movie: item })} />
      //     )}
      //   />
      // </View>
      renderItem={({ item }) => (
        <MovieCard
          movie={item}
          onPress={() => {
            handleMoviePress(item.id)  // Gọi hàm handleMoviePress với movie.id
            
          }}
        />
      )}
      
    />
  </View>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Coming Soon</Text>
        <Text style={styles.headerSubTitle}>VIEW ALL</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.BASIC_BACKGROUND,
    padding: 5,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: FONTS.REGULAR,
  },
  headerSubTitle: {
    fontSize: 13,
    color: COLORS.ACTIVE,
    fontFamily: FONTS.BOLD,
  },
  genreListContainer: {
    paddingVertical: 10,
  },
});

export default HomeScreen;
