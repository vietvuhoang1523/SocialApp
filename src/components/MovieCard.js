import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  TouchableNativeFeedback,
} from "react-native";
import COLORS from "../constants/Colors";
import FONTS from "../constants/Fonts";
import IMAGES from "../constants/Images";
import Ionicons from "react-native-vector-icons/Ionicons";

const MovieCard = ({ movie = {}, heartLess = true,onPress }) => {
  const [liked, setLiked] = useState(false);

  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.container}>
        <ImageBackground
           source={{
            uri: `http://192.168.100.193:8082/api/movieProduct/view?bucketName=thanh&path=${movie.imgMovie}`,
          }}
          resizeMode="cover"
          style={styles.imageBackground}
        >
          <View style={styles.imdbContainer}>
            <Image
              source={IMAGES.IMDB}
              resizeMode="cover"
              style={styles.imdbImage}
            />
            <Text style={styles.imdbRating}>9.4</Text>
          </View>

          <TouchableNativeFeedback onPress={() => setLiked(!liked)}>
            <View style={styles.heartIconWrapper}>
              <Ionicons
                name={liked ? "heart" : "heart-outline"}
                size={25}
                color={liked ? COLORS.HEART : COLORS.WHITE}
              />
            </View>
          </TouchableNativeFeedback>
        </ImageBackground>
      </View>

      {/* Phần tiêu đề và like count */}
      <View style={styles.movieTitle}>
        <Text style={styles.movieSubTitle} numberOfLines={2}>
          {movie?.title || "Untitled Movie"}
        </Text>

        <View style={styles.movieSubTitleContainer}>
          <Text style={styles.movieSubTitle}>{movie?.name}</Text>
          <View style={styles.rowAndCenter}>
            <Ionicons
              name="heart"
              size={18}
              color={COLORS.HEART}
              style={{ marginRight: 5 }}
            />
            <Text style={styles.movieSubTitle}>
              {movie?.likes || 0} likes
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.ACTIVE,
    height: 200,
    width: 130,
    borderRadius: 12,
    elevation: 5,
    marginVertical: 2,
    overflow: "hidden",
  },
  imageBackground: {
    flex: 1, // Tràn hết container
    width: "100%",
    justifyContent: "space-between",
  },
  movieTitle: {
    paddingVertical: 2,
    marginTop: 5,
    width: 130,
  },
  movieSubTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  movieSubTitle: {
    fontSize: 12,
    fontFamily: FONTS.REGULAR,
    color: COLORS.GRAY,
  },
  rowAndCenter: {
    flexDirection: "row",
    alignItems: "center",
  },
  imdbContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: COLORS.YELLOW,
    borderBottomLeftRadius: 5,
    borderTopRightRadius: 12,
    paddingVertical: 3,
  },
  imdbImage: {
    height: 20,
    width: 50,
    borderBottomLeftRadius: 5,
  },
  imdbRating: {
    marginRight: 5,
    color: COLORS.HEART,
    fontFamily: FONTS.EXTRA_BOLD,
  },
  heartIconWrapper: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "transparent",
  },
});

export default MovieCard;
