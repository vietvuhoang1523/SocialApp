import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import InstagramHomeScreen from "./src/screens/InstagramHomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import { useFonts } from "expo-font";
import { View, ActivityIndicator } from "react-native";
import ProfileScreen from "./src/screens/ProfileScreen";
import ReelsScreen from "./src/screens/ReelsScreen";
import CreatePostScreen from "./src/screens/CreatePostScreen";
import NotificationsScreen from "./src/screens/NotificationsScreen";
import MainTabNavigator from "./src/components/MainTabNavigator";
import RegisterScreen from "./src/screens/RegisterScreen";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
import EditProfileScreen from "./src/components/EditProfileScreen";

const Stack = createStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    Regular: require("./assets/fonts/NunitoSans-Regular.ttf"),
    Bold: require("./assets/fonts/NunitoSans-Bold.ttf"),
    Black: require("./assets/fonts/NunitoSans-Black.ttf"),
    ExtraBold: require("./assets/fonts/NunitoSans-ExtraBold.ttf"),
    ExtraLight: require("./assets/fonts/NunitoSans-ExtraLight.ttf"),
    Light: require("./assets/fonts/NunitoSans-Light.ttf"),
    SemiBold: require("./assets/fonts/NunitoSans-SemiBold.ttf"),
  });

  if (!fontsLoaded) {
    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" />
        </View>
    );
  }

  return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
          />
          <Stack.Screen
              name="Home"
              component={InstagramHomeScreen}
              options={{ headerShown: false }}
          />
          <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ headerShown: false }}
          />
          <Stack.Screen
              name="Reels"
              component={ReelsScreen}
              options={{ headerShown: false }}
          />
          <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ headerShown: false }}
          />
          <Stack.Screen
              name="CreatePost"
              component={CreatePostScreen}
              options={{ headerShown: false }}
          />
          <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ headerShown: false }}
          />
          <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{ headerShown: false }}
          />
          <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{ headerShown: false }}
          />
          <Stack.Screen name="MainApp" component={MainTabNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
  );
}
