// src/navigation/MainTabNavigator.js
import React, { useEffect, useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { View } from "react-native";
import NotificationBadge from './common/NotificationBadge';
import { useNotifications } from './NotificationContext';

// Import your screens with correct paths
import InstagramHomeScreen from "../screens/InstagramHomeScreen";
import SearchScreen from "../screens/SearchScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import CreatePostScreen from "../screens/CreatePostScreen";
import ReelsScreen from "../screens/Login/ReelsScreen";
import SportsAvailabilityScreen from "../screens/sports/SportsAvailabilityScreen";


const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
    // Get notification count from context
    const { unreadCount } = useNotifications();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
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
                    }
                    return <Icon name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: 'black',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
                tabBarShowLabel: false,
            })}
        >
            <Tab.Screen name="Home" component={InstagramHomeScreen} />
            <Tab.Screen name="Search" component={ReelsScreen} />
            <Tab.Screen name="CreatePost" component={CreatePostScreen} />
            <Tab.Screen name="Sports" component={SportsAvailabilityScreen} />
            <Tab.Screen name="Notifications" component={NotificationsScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}
