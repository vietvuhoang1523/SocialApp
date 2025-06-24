// src/navigation/MainTabNavigator.js
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { View } from "react-native";
import NotificationBadge from './common/NotificationBadge';
import { useNotifications } from './NotificationContext';

// Import your screens with correct paths
import InstagramHomeScreen from "../screens/InstagramHomeScreen";
import SearchScreen from "../screens/SearchScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import CreatePostScreen from "../screens/CreatePostScreen";
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

// Social Stack (formerly HomeStack)
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

// Find Players Stack
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
    // Get notification count from context
    const { unreadCount } = useNotifications();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    switch (route.name) {
                        case 'Social':
                            iconName = focused ? 'globe' : 'globe-outline';
                            break;
                        case 'FindPlayers':
                            iconName = focused ? 'people' : 'people-outline';
                            break;
                        case 'CreatePost':
                            iconName = focused ? 'add-circle' : 'add-circle-outline';
                            break;
                        case 'WorkoutTracker':
                            iconName = focused ? 'fitness' : 'fitness-outline';
                            break;
                        case 'Notifications':
                            iconName = focused ? 'notifications' : 'notifications-outline';
                            // Add notification badge for notifications tab
                            return (
                                <View>
                                    <Ionicons name={iconName} size={size} color={color} />
                                    {unreadCount > 0 && <NotificationBadge count={unreadCount} />}
                                </View>
                            );
                        case 'Profile':
                            iconName = focused ? 'person' : 'person-outline';
                            break;
                        default:
                            iconName = 'help-outline';
                            break;
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#405DE6',
                tabBarInactiveTintColor: 'gray',
                tabBarLabelStyle: {
                    fontSize: 12,
                },
                tabBarStyle: {
                    height: 60,
                    paddingBottom: 5,
                    paddingTop: 5,
                },
            })}
        >
            <Tab.Screen 
                name="Social" 
                component={SocialStack} 
                options={{ 
                    headerShown: false, 
                    title: 'Trang chủ'
                }} 
            />
            <Tab.Screen 
                name="FindPlayers" 
                component={FindPlayersStack} 
                options={{ 
                    headerShown: false, 
                    title: 'Tìm người chơi'
                }} 
            />
            <Tab.Screen 
                name="CreatePost" 
                component={CreatePostStack} 
                options={{ 
                    headerShown: false, 
                    title: 'Tạo bài đăng'
                }} 
            />
            <Tab.Screen 
                name="WorkoutTracker" 
                component={WorkoutStack} 
                options={{ 
                    headerShown: false, 
                    title: 'Luyện tập'
                }} 
            />
            <Tab.Screen 
                name="Notifications" 
                component={NotificationsStack} 
                options={{ 
                    headerShown: false, 
                    title: 'Thông báo'
                }} 
            />
            <Tab.Screen 
                name="Profile" 
                component={ProfileStack} 
                options={{ 
                    headerShown: false, 
                    title: 'Hồ sơ'
                }} 
            />
        </Tab.Navigator>
    );
}

export default MainTabNavigator;
