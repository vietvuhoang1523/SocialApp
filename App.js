import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import InstagramHomeScreen from "./src/screens/InstagramHomeScreen";
import LoginScreen from "./src/screens/Login/LoginScreen";
import { useFonts } from "expo-font";
import { View, ActivityIndicator } from "react-native";
import ProfileScreen from "./src/screens/profile/ProfileScreen";
import ReelsScreen from "./src/screens/Login/ReelsScreen";
import CreatePostScreen from "./src/screens/CreatePostScreen";
import NotificationsScreen from "./src/screens/NotificationsScreen";
import MainTabNavigator from "./src/components/MainTabNavigator";
import RegisterScreen from "./src/screens/Login/RegisterScreen";
import ForgotPasswordScreen from "./src/screens/Login/ForgotPasswordScreen";
import EditProfileScreen from "./src/components/EditProfileScreen";
import FriendSearchScreen from "./src/screens/Friend/FriendSearchScreen";
import EmailSearchHandler from "./src/components/EmailSearchHandler";
import FriendRequestsScreen from "./src/screens/Friend/FriendRequestsScreen";
import ProfileTabs from "./src/screens/profile/ProfileTabs";
import ProfileContent from "./src/screens/profile/ProfileContent";
import ProfileInfo from "./src/screens/profile/ProfileInfo";
import ProfileHeader from "./src/screens/profile/ProfileHeader";
import FriendsSection from "./src/components/friends/FriendsSection";
import MessagesScreen from "./src/screens/Messages/MessagesScreen";
import ChatScreen from "./src/screens/Messages/ChatScreen";

const Stack = createStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    Regular: require("./src/assets/fonts/NunitoSans-Regular.ttf"),
    Bold: require("./src/assets/fonts/NunitoSans-Bold.ttf"),
    Black: require("./src/assets/fonts/NunitoSans-Black.ttf"),
    ExtraBold: require("./src/assets/fonts/NunitoSans-ExtraBold.ttf"),
    ExtraLight: require("./src/assets/fonts/NunitoSans-ExtraLight.ttf"),
    Light: require("./src/assets/fonts/NunitoSans-Light.ttf"),
    SemiBold: require("./src/assets/fonts/NunitoSans-SemiBold.ttf"),
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
              name="FriendSearch"
              component={FriendSearchScreen}
              options={{ headerShown: false }}
          />
          <Stack.Screen
              name="FriendRequests"
              component={FriendRequestsScreen}
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
              name="FriendsSection"
              component={FriendsSection}
              options={{ headerShown: false }}
          />
          <Stack.Screen
              name="ProfileHeader"
              component={ProfileHeader}
              options={{ headerShown: false }}
          />
          <Stack.Screen
              name="ProfileInfo"
              component={ProfileInfo}
              options={{ headerShown: false }}
          />
          <Stack.Screen
              name="ProfileContent"
              component={ProfileContent}
              options={{ headerShown: false }}
          />
          <Stack.Screen
              name="ProfileTabs"
              component={ProfileTabs}
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
          <Stack.Screen name="Messages" component={MessagesScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
          <Stack.Screen
              name="EmailSearchHandler"
              component={EmailSearchHandler}
              options={{ headerShown: false }}
          />
          <Stack.Screen name="MainApp" component={MainTabNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
  );
}
