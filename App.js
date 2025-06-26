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
import VerificationScreen from "./src/screens/Login/VerificationScreen";
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
import ViewSportsProfileScreen from "./src/screens/profile/ViewSportsProfileScreen";
import SportsPostDetailScreen from "./src/screens/SportsPostDetailScreen";

// Import Sports Availability screens
import SportsAvailabilityScreen from "./src/screens/sports/SportsAvailabilityScreen";
import CreateSportsAvailabilityScreen from "./src/screens/sports/CreateSportsAvailabilityScreen";
import SportsAvailabilityDetailScreen from "./src/screens/sports/SportsAvailabilityDetailScreen";
import ParticipantManagementScreen from "./src/screens/sports/ParticipantManagementScreen";
import ManageParticipantsScreen from "./src/screens/sports/ManageParticipantsScreen";
import AllPendingRequestsScreen from "./src/screens/sports/AllPendingRequestsScreen";
import MyJoinedPostsScreen from "./src/screens/sports/MyJoinedPostsScreen";
import MyCreatedPostsScreen from "./src/screens/sports/MyCreatedPostsScreen";


// Import Sports Matching screens
import SportsMatchingScreen from "./src/screens/sports/SportsMatchingScreen";
import MatchRequestsScreen from "./src/screens/sports/MatchRequestsScreen";
import BrowseAvailabilitiesScreen from "./src/screens/sports/BrowseAvailabilitiesScreen";

// Import Report and Workout screens
import ReportScreen from "./src/screens/ReportScreen";
import WorkoutTrackingScreen from "./src/screens/workout/WorkoutTrackingScreen";
import WorkoutHistoryScreen from "./src/screens/workout/WorkoutHistoryScreen";
import ReportManagementScreen from "./src/screens/admin/ReportManagementScreen";

// Import Statistics and Analytics screens
import SportsStatsScreen from "./src/screens/sports/SportsStatsScreen";
import WorkoutSessionsScreen from "./src/screens/sports/WorkoutSessionsScreen";
import CreateWorkoutSessionScreen from "./src/screens/sports/CreateWorkoutSessionScreen";
import WorkoutSessionDetailScreen from "./src/screens/sports/WorkoutSessionDetailScreen";
import SportsRecommendationsScreen from "./src/screens/sports/SportsRecommendationsScreen";

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
import webSocketManager from './src/services/WebSocketManager';
import AuthService from './src/services/AuthService';
//
import { ProfileProvider } from './src/components/ProfileContext';
import { ThemeProvider } from './src/hook/ThemeContext';
import { NotificationProvider } from './src/components/NotificationContext';
import CommentsScreen from "./src/screens/CommentsScreen";
import EditPostScreen from "./src/screens/EditPostScreen";

const Stack = createStackNavigator();

export default function App() {

    const [value, setValue] = useState(0);
  // State quản lý việc kết nối WebSocket
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);

  // ✅ FIXED: Initialize WebSocketManager for unified messaging
  useEffect(() => {
    const checkAuthAndSetupWebSocket = async () => {
      try {
        const isAuthenticated = await AuthService.checkAuthentication();
        if (isAuthenticated) {
          console.log('🔌 App: Initializing WebSocketManager...');
          
          // ✅ Initialize unified WebSocket manager
          await webSocketManager.initialize();
          setIsWebSocketConnected(webSocketManager.isConnected());
          
          console.log('✅ App: WebSocketManager initialized successfully');
        }
      } catch (error) {
        console.error('❌ App: WebSocket setup error:', error);
        setIsWebSocketConnected(false);
      }
    };

    checkAuthAndSetupWebSocket();

    // Cleanup khi unmount
    return () => {
      console.log('🧹 App: Cleaning up WebSocket connections');
      webSocketManager.cleanup();
      webSocketService.disconnect();
      setIsWebSocketConnected(false);
    };
  }, []);

  // Tạo navigator một cách ổn định (KHÔNG SỬ DỤNG - đã chuyển xuống return)
  /*
  const AppNavigator = useMemo(() => (
      <Stack.Navigator initialRouteName="Login">
        ...screens...
      </Stack.Navigator>
  ), []);
  */

  return (
    <ThemeProvider>
      <ProfileProvider>
        <NotificationProvider>
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
                  name="CreateSportsPost"
                  component={CreateSportsPostScreen}
                  options={{ headerShown: false }}
              />
              <Stack.Screen
                  name="SportsPostDetail"
                  component={SportsPostDetailScreen}
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
                  name="Verification"
                  component={VerificationScreen}
                  options={{ headerShown: false }}
              />
              <Stack.Screen
                  name="EditProfile"
                  component={EditProfileScreen}
                  options={{ headerShown: false }}
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
              {/* New Chat Screens */}
              <Stack.Screen
                  name="NewMessages"
                  component={NewMessagesScreen}
                  options={{ headerShown: false }}
              />
              <Stack.Screen
                  name="NewChatScreen"
                  component={NewChatScreen}
                  options={{ headerShown: false }}
              />
              {/* Call Screens */}
              <Stack.Screen
                  name="AudioCall"
                  component={AudioCallScreen}
                  options={{ headerShown: false }}
              />
              <Stack.Screen
                  name="VideoCall"
                  component={VideoCallScreen}
                  options={{ headerShown: false }}
              />
              {/* Location */}
              <Stack.Screen
                  name="UserLocation"
                  component={UserLocationController}
                  options={{ headerShown: false }}
              />
              <Stack.Screen
                  name="SimpleLocation"
                  component={SimpleLocationController}
                  options={{ headerShown: false }}
              />
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
                  name="ManualLocation"
                  component={ManualLocationScreen}
                  options={{ headerShown: false }}
              />
              {/* Sports Profile */}
              <Stack.Screen
                  name="SportsProfileScreen"
                  component={SportsProfileScreen}
                  options={{ headerShown: false }}
              />
              <Stack.Screen
                  name="ViewSportsProfileScreen"
                  component={ViewSportsProfileScreen}
                  options={{ headerShown: false }}
              />
              <Stack.Screen
                  name="SportsMatchingScreen"
                  component={SportsMatchingScreen}
                  options={{ headerShown: false }}
              />
              <Stack.Screen
                  name="MatchRequestsScreen"
                  component={MatchRequestsScreen}
                  options={{ headerShown: false }}
              />
              <Stack.Screen
                  name="BrowseAvailabilitiesScreen"
                  component={BrowseAvailabilitiesScreen}
                  options={{ headerShown: false }}
              />
              {/* Sports Availability */}
              <Stack.Screen
                  name="SportsAvailabilityScreen"
                  component={SportsAvailabilityScreen}
                  options={{ headerShown: false }}
              />
              <Stack.Screen
                  name="CreateSportsAvailability"
                  component={CreateSportsAvailabilityScreen}
                  options={{ headerShown: false }}
              />
              <Stack.Screen
                  name="SportsAvailabilityDetail"
                  component={SportsAvailabilityDetailScreen}
                  options={{ headerShown: false }}
              />
              <Stack.Screen
                  name="ParticipantManagement"
                  component={ParticipantManagementScreen}
                  options={{ headerShown: false }}
              />
              <Stack.Screen
                  name="ManageParticipants"
                  component={ManageParticipantsScreen}
                  options={{ headerShown: false }}
              />
              <Stack.Screen
                  name="AllPendingRequests"
                  component={AllPendingRequestsScreen}
                  options={{ headerShown: false }}
              />
              <Stack.Screen
                  name="MyJoinedPosts"
                  component={MyJoinedPostsScreen}
                  options={{ headerShown: false }}
              />
              <Stack.Screen
                  name="MyCreatedPosts"
                  component={MyCreatedPostsScreen}
                  options={{ headerShown: false }}
              />

              {/* Report and Workout screens */}
              <Stack.Screen
                  name="Report"
                  component={ReportScreen}
                  options={{ headerShown: false }}
              />
              <Stack.Screen
                  name="WorkoutTracking"
                  component={WorkoutTrackingScreen}
                  options={{ headerShown: false }}
              />
              <Stack.Screen
                  name="WorkoutHistory"
                  component={WorkoutHistoryScreen}
                  options={{ headerShown: false }}
              />
              <Stack.Screen
                  name="ReportManagement"
                  component={ReportManagementScreen}
                  options={{ headerShown: false }}
              />
              {/* Statistics and Analytics screens */}
              <Stack.Screen
                  name="SportsStatsScreen"
                  component={SportsStatsScreen}
                  options={{ headerShown: false }}
              />
              <Stack.Screen
                  name="WorkoutTrackingScreen"
                  component={WorkoutTrackingScreen}
                  options={{ headerShown: false }}
              />
              <Stack.Screen
                  name="WorkoutHistoryScreen"
                  component={WorkoutHistoryScreen}
                  options={{ headerShown: false }}
              />
              <Stack.Screen
                  name="WorkoutSessionsScreen"
                  component={WorkoutSessionsScreen}
                  options={{ headerShown: false }}
              />
              <Stack.Screen
                  name="CreateWorkoutSessionScreen"
                  component={CreateWorkoutSessionScreen}
                  options={{ headerShown: false }}
              />
              <Stack.Screen
                  name="WorkoutSessionDetailScreen"
                  component={WorkoutSessionDetailScreen}
                  options={{ headerShown: false }}
              />
              <Stack.Screen
                  name="MyCreatedPostsScreen"
                  component={MyCreatedPostsScreen}
                  options={{ headerShown: false }}
              />
              <Stack.Screen
                  name="MyJoinedPostsScreen"
                  component={MyJoinedPostsScreen}
                  options={{ headerShown: false }}
              />
              <Stack.Screen
                  name="SportsRecommendationsScreen"
                  component={SportsRecommendationsScreen}
                  options={{ headerShown: false }}
              />
              {/* Main Tab Navigator - Must be last */}
              <Stack.Screen
                  name="MainTab"
                  component={MainTabNavigator}
                  options={{ headerShown: false }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </NotificationProvider>
      </ProfileProvider>
    </ThemeProvider>
  );
}
