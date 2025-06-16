// src/navigation/MainTabNavigator.js
import React, { useEffect, useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
<<<<<<< HEAD
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
=======
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { View } from "react-native";
import NotificationBadge from './common/NotificationBadge';
import { useNotifications } from './NotificationContext';
>>>>>>> 470eddff2a288d1a4e85b18401fe95e7a18b1512

// Import your screens with correct paths
import InstagramHomeScreen from "../screens/InstagramHomeScreen";
import SearchScreen from "../screens/SearchScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import CreatePostScreen from "../screens/CreatePostScreen";
import ReelsScreen from "../screens/Login/ReelsScreen";
import SportsAvailabilityScreen from "../screens/sports/SportsAvailabilityScreen";
import CommentsScreen from '../screens/CommentsScreen';
import CreateSportsPostScreen from '../screens/CreateSportsPostScreen';
import SportsPostDetailScreen from '../screens/SportsPostDetailScreen';
import CreateSportsAvailabilityScreen from '../screens/sports/CreateSportsAvailabilityScreen';
import SportsAvailabilityDetailScreen from '../screens/sports/SportsAvailabilityDetailScreen';

// Import WorkoutSession screens
import WorkoutSessionsScreen from '../screens/sports/WorkoutSessionsScreen';
import WorkoutSessionDetailScreen from '../screens/sports/WorkoutSessionDetailScreen';
import CreateWorkoutSessionScreen from '../screens/sports/CreateWorkoutSessionScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

<<<<<<< HEAD
// Renamed to SocialStack (formerly HomeStack)
function SocialStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="Home"
                component={InstagramHomeScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Comments"
                component={CommentsScreen}
                options={{ headerShown: true }}
            />
            <Stack.Screen
                name="SportsPostDetail"
                component={SportsPostDetailScreen}
                options={{ headerShown: true, title: 'Chi tiết bài đăng' }}
            />
        </Stack.Navigator>
    );
}

// Find Players Stack (formerly SportsStack)
function FindPlayersStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="SportsAvailability"
                component={SportsAvailabilityScreen}
                options={{ headerShown: true, title: 'Tìm người chơi cùng' }}
            />
            <Stack.Screen
                name="CreateSportsAvailability"
                component={CreateSportsAvailabilityScreen}
                options={{ headerShown: true, title: 'Tạo lịch tìm người chơi' }}
            />
            <Stack.Screen
                name="SportsAvailabilityDetail"
                component={SportsAvailabilityDetailScreen}
                options={{ headerShown: true, title: 'Chi tiết' }}
            />
        </Stack.Navigator>
    );
}

// Workout Tracking Stack
function WorkoutStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="WorkoutSessions"
                component={WorkoutSessionsScreen}
                options={{ headerShown: true, title: 'Buổi tập của tôi' }}
            />
            <Stack.Screen
                name="WorkoutSessionDetail"
                component={WorkoutSessionDetailScreen}
                options={{ headerShown: true, title: 'Chi tiết buổi tập' }}
            />
            <Stack.Screen
                name="CreateWorkoutSession"
                component={CreateWorkoutSessionScreen}
                options={{ headerShown: true, title: 'Tạo buổi tập mới' }}
            />
        </Stack.Navigator>
    );
}

// Create Post Stack
function CreatePostStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="CreatePost"
                component={CreatePostScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="CreateSportsPost"
                component={CreateSportsPostScreen}
                options={{ headerShown: true, title: 'Tạo bài đăng thể thao' }}
            />
        </Stack.Navigator>
    );
}

// Profile Stack
function ProfileStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
}

// Notifications Stack
function NotificationsStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
}

function MainTabNavigator() {
=======
export default function MainTabNavigator() {
    // Get notification count from context
    const { unreadCount } = useNotifications();

>>>>>>> 470eddff2a288d1a4e85b18401fe95e7a18b1512
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
<<<<<<< HEAD

                    if (route.name === 'FindPlayers') {
                        iconName = focused ? 'people' : 'people-outline';
                    } else if (route.name === 'WorkoutTracker') {
                        iconName = focused ? 'fitness' : 'fitness-outline';
                    } else if (route.name === 'CreatePost') {
                        iconName = focused ? 'add-circle' : 'add-circle-outline';
                    } else if (route.name === 'Social') {
                        iconName = focused ? 'globe' : 'globe-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
=======
                    switch (route.name) {
                        case 'Home':
                            iconName = focused ? 'home' : 'home-outline';
                            break;
                        case 'Search':
                            iconName = focused ? 'magnify' : 'magnify';
                            break;
                        case 'CreatePost':
                            iconName = 'plus-box-outline';
                            break;
                        case 'Notifications':
                            iconName = focused ? 'heart' : 'heart-outline';
                            // Add notification badge
                            return (
                                <View>
                                    <Icon name={iconName} size={size} color={color} />
                                    {route.name === 'Notifications' && <NotificationBadge count={unreadCount} />}
                                </View>
                            );
                            break;
                        case 'Profile':
                            iconName = focused ? 'account' : 'account-outline';
                            break;
                        case 'Sports':
                            iconName = focused ? 'basketball' : 'basketball-outline';
                            break;
>>>>>>> 470eddff2a288d1a4e85b18401fe95e7a18b1512
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#4CAF50',
                tabBarInactiveTintColor: 'gray',
                tabBarLabelStyle: { fontSize: 12 },
                tabBarStyle: { paddingBottom: 5, height: 60 },
            })}
        >
            <Tab.Screen 
                name="FindPlayers" 
                component={FindPlayersStack} 
                options={{ 
                    headerShown: false,
                    tabBarLabel: 'Tìm người chơi'
                }} 
            />
            <Tab.Screen 
                name="WorkoutTracker" 
                component={WorkoutStack} 
                options={{ 
                    headerShown: false,
                    tabBarLabel: 'Buổi tập'
                }} 
            />
            <Tab.Screen 
                name="CreatePost" 
                component={CreatePostStack} 
                options={{ 
                    headerShown: false,
                    tabBarLabel: 'Đăng bài'
                }} 
            />
            <Tab.Screen 
                name="Social" 
                component={SocialStack} 
                options={{ 
                    headerShown: false,
                    tabBarLabel: 'Cộng đồng'
                }} 
            />
            <Tab.Screen 
                name="Profile" 
                component={ProfileStack} 
                options={{ 
                    headerShown: false,
                    tabBarLabel: 'Hồ sơ'
                }} 
            />
        </Tab.Navigator>
    );
}

export default MainTabNavigator;
