import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const ProfileTabs = ({ onTabChange }) => {
    const [activeTab, setActiveTab] = useState('posts');

    const tabs = [
        {
            key: 'posts',
            label: 'Bài viết',
            icon: 'grid-outline'
        },
        {
            key: 'photos',
            label: 'Ảnh',
            icon: 'image-outline'
        },
        {
            key: 'reels',
            label: 'Reels',
            icon: 'play-circle-outline'
        },
        {
            key: 'videos',
            label: 'Video',
            icon: 'videocam-outline'
        }
    ];

    const handleTabPress = (tabKey) => {
        setActiveTab(tabKey);
        onTabChange && onTabChange(tabKey);
    };

    return (
        <View style={styles.container}>
            {tabs.map((tab) => (
                <TouchableOpacity
                    key={tab.key}
                    style={[
                        styles.tabButton,
                        activeTab === tab.key && styles.activeTabButton
                    ]}
                    onPress={() => handleTabPress(tab.key)}
                >
                    <Ionicons
                        name={tab.icon}
                        size={22}
                        color={activeTab === tab.key ? '#1877F2' : '#65676B'}
                    />
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === tab.key && styles.activeTabText
                        ]}
                    >
                        {tab.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderTopWidth: 0.5,
        borderTopColor: '#E5E5E5',
        borderBottomWidth: 0.5,
        borderBottomColor: '#E5E5E5',
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 5,
    },
    activeTabButton: {
        borderBottomWidth: 2,
        borderBottomColor: '#1877F2',
    },
    tabText: {
        color: '#65676B',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#1877F2',
        fontWeight: 'bold',
    },
});

export default ProfileTabs;