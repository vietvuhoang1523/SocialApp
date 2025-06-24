import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import InstagramHomeScreen from '../screens/InstagramHomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChatScreen from '../screens/ChatScreen';
import NotificationScreen from '../screens/NotificationScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SportsVenueSearchScreen from '../screens/sports/SportsVenueSearchScreen';
import SportsVenueDetailScreen from '../screens/sports/SportsVenueDetailScreen';
import CreateSportsVenueScreen from '../screens/sports/CreateSportsVenueScreen';
import ManageParticipantsScreen from '../screens/sports/ManageParticipantsScreen';
import AllPendingRequestsScreen from '../screens/sports/AllPendingRequestsScreen';
import SportsPostDetailScreen from '../screens/SportsPostDetailScreen';

// Import the new screens
import ReportScreen from '../screens/ReportScreen';
import WorkoutTrackingScreen from '../screens/workout/WorkoutTrackingScreen';
import WorkoutHistoryScreen from '../screens/workout/WorkoutHistoryScreen';
import ReportManagementScreen from '../screens/admin/ReportManagementScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Sports') {
            iconName = focused ? 'football' : 'football-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Sports" component={SportsNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Notifications" component={NotificationScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Sports Navigator
const SportsNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SportsVenueSearch" component={SportsVenueSearchScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SportsVenueDetail" component={SportsVenueDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CreateSportsVenue" component={CreateSportsVenueScreen} options={{ headerShown: false }} />
      <Stack.Screen name="WorkoutTracking" component={WorkoutTrackingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="WorkoutHistory" component={WorkoutHistoryScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

// Main Navigator
const MainNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="InstagramHome" component={InstagramHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Report" component={ReportScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ReportManagement" component={ReportManagementScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SportsPostDetail" component={SportsPostDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ManageParticipants" component={ManageParticipantsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AllPendingRequests" component={AllPendingRequestsScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

export default MainNavigator; 