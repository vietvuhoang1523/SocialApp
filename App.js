// EMERGENCY OVERRIDE - Phải import đầu tiên
import './EMERGENCY_OVERRIDE';

import React, { useEffect, useState, useMemo } from 'react';
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import tất cả các màn hình
import InstagramHomeScreen from "./src/screens/InstagramHomeScreen";
import LoginScreen from "./src/screens/Login/LoginScreen";
import ProfileScreen from "./src/screens/profile/ProfileScreen";
import UserProfileScreen from "./src/screens/profile/UserProfileScreen";
import ReelsScreen from "./src/screens/Login/ReelsScreen";
import CreatePostScreen from "./src/screens/CreatePostScreen";
import CreateSportsPostScreen from "./src/screens/CreateSportsPostScreen";
import NotificationsScreen from "./src/screens/NotificationsScreen";
import MainTabNavigator from "./src/components/MainTabNavigator";
import RegisterScreen from "./src/screens/Login/RegisterScreen";
import ForgotPasswordScreen from "./src/screens/Login/ForgotPasswordScreen";
import EditProfileScreen from "./src/components/UpdateProfile/EditProfileScreen";
import FriendSearchScreen from "./src/screens/Friend/FriendSearchScreen";
import EmailSearchHandler from "./src/components/EmailSearchHandler";
import FriendRequestsScreen from "./src/screens/Friend/FriendRequestsScreen";
import ProfileTabs from "./src/screens/profile/ProfileTabs";
import ProfileContent from "./src/screens/profile/ProfileContent";
import ProfileInfo from "./src/screens/profile/ProfileInfo";
import ProfileHeader from "./src/screens/profile/ProfileHeader";
import FriendsSection from "./src/components/friends/FriendsSection";

// Import Sports Profile screens
import SportsProfileScreen from "./src/screens/profile/SportsProfileScreen";
import SportsMatchingScreen from "./src/screens/profile/SportsMatchingScreen";
import SportsPostDetailScreen from "./src/screens/SportsPostDetailScreen";

// Import Location screens
import UserLocationController from "./src/screens/profile/UserLocationController";
import SimpleLocationController from "./src/screens/profile/SimpleLocationController";
import LocationMap from "./src/screens/profile/LocationMap";
import LocationSettings from "./src/screens/profile/LocationSettings";
import ManualLocationScreen from "./src/screens/profile/ManualLocationScreen";

// Import các screen chat mới với UI hiện đại
import NewMessagesScreen from "./src/screens/Messages/NewMessagesScreen";
import NewChatScreen from "./src/screens/Messages/NewChatScreen";

// Import video call screens
import AudioCallScreen from "./src/screens/Calls/AudioCallScreen";
import VideoCallScreen from "./src/screens/Calls/VideoCallScreen";

// Import services
import webSocketService from './src/services/WebSocketService';
import AuthService from './src/services/AuthService';
//
import { ProfileProvider } from './src/components/ProfileContext';
import CommentsScreen from "./src/screens/CommentsScreen";
import EditPostScreen from "./src/screens/EditPostScreen";

const Stack = createStackNavigator();

export default function App() {

    const [value, setValue] = useState(0);
  // State quản lý việc kết nối WebSocket
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);

  // Kiểm tra xác thực và kết nối WebSocket
  useEffect(() => {
    const checkAuthAndSetupWebSocket = async () => {
      try {
        const isAuthenticated = await AuthService.checkAuthentication();
        if (isAuthenticated) {
          // Kết nối WebSocket
          await webSocketService.connect();
          setIsWebSocketConnected(true);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsWebSocketConnected(false);
      }
    };

    checkAuthAndSetupWebSocket();

    // Cleanup khi unmount
    return () => {
      webSocketService.disconnect();
      setIsWebSocketConnected(false);
    };
  }, []); // Dependency array rỗng để chỉ chạy một lần

  // Tạo navigator một cách ổn định
  const AppNavigator = useMemo(() => (
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
            name="UserProfileScreen"
            component={UserProfileScreen}
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
        <Stack.Screen
            name="UserProfile"
            component={UserProfileScreen}
            options={{ headerShown: false }}
        />
        
        {/* Sports Profile Screens */}
        <Stack.Screen
            name="SportsProfileScreen"
            component={SportsProfileScreen}
            options={{ headerShown: false }}
        />
        <Stack.Screen
            name="SportsMatchingScreen"
            component={SportsMatchingScreen}
            options={{ headerShown: false }}
        />
        
        {/* Screen tin nhắn mới với UI hiện đại */}
        <Stack.Screen
            name="Messages"
            component={NewMessagesScreen}
            options={{ headerShown: false }}
        />
        <Stack.Screen
            name="NewMessagesScreen"
            component={NewMessagesScreen}
            options={{ headerShown: false }}
        />
        <Stack.Screen
            name="NewChatScreen"
            component={NewChatScreen}
            options={{ headerShown: false }}
        />
        {/* Giữ lại route Chat cho backward compatibility */}
        <Stack.Screen
            name="Chat"
            component={NewChatScreen}
            options={{ headerShown: false }}
        />
        
        {/* Video Call Screens */}
        <Stack.Screen
            name="AudioCallScreen"
            component={AudioCallScreen}
            options={{ 
                headerShown: false,
                gestureEnabled: false, // Prevent swipe to go back during call
                animation: 'slide_from_bottom'
            }}
        />
        <Stack.Screen
            name="VideoCallScreen"
            component={VideoCallScreen}
            options={{ 
                headerShown: false,
                gestureEnabled: false, // Prevent swipe to go back during call
                animation: 'slide_from_bottom'
            }}
        />

        <Stack.Screen
            name="Comments"
            component={CommentsScreen}
            options={{ headerShown: false }}
        />
        <Stack.Screen
            name="EditPost"
            component={EditPostScreen}
            options={{ headerShown: false }}
        />
        <Stack.Screen
            name="EmailSearchHandler"
            component={EmailSearchHandler}
            options={{ headerShown: false }}
        />
        <Stack.Screen
            name="CreateSportsPost"
            component={CreateSportsPostScreen}
            options={{ headerShown: false }}
        />
        
        <Stack.Screen
            name="SportsPostDetail"
            component={SportsPostDetailScreen}
            options={{ headerShown: false }}
        />
        
        {/* Location Screens */}
        <Stack.Screen
            name="LocationMap"
            component={LocationMap}
            options={{ headerShown: false }}
        />
        <Stack.Screen
            name="LocationSettings"
            component={LocationSettings}
            options={{ headerShown: false }}
        />
        <Stack.Screen
            name="UserLocationController"
            component={UserLocationController}
            options={{ headerShown: false }}
        />
        <Stack.Screen
            name="SimpleLocationController"
            component={SimpleLocationController}
            options={{ headerShown: false }}
        />
        <Stack.Screen
            name="ManualLocationScreen"
            component={ManualLocationScreen}
            options={{ headerShown: false }}
        />
        
        <Stack.Screen name="MainApp" component={MainTabNavigator} />
      </Stack.Navigator>
  ), []);

  return (
      <ProfileProvider>
          <NavigationContainer>
              {AppNavigator}
          </NavigationContainer>
      </ProfileProvider>
  );
}
