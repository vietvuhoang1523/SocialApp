import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const ProfileTabs = ({ activeTab, onTabChange }) => {
    // Danh sách các tab
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
            key: 'videos',
            label: 'Video',
            icon: 'videocam-outline'
        },
        {
            key: 'location',
            label: 'Vị trí',
            icon: 'location-outline'
        }
    ];

    return (
        <View style={styles.tabContainer}>
            {tabs.map((tab) => (
                <TouchableOpacity
                    key={tab.key}
                    style={[
                        styles.tabButton,
                        activeTab === tab.key && styles.activeTabButton
                    ]}
                    onPress={() => onTabChange(tab.key)}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name={tab.icon}
                        size={22}
                        color={activeTab === tab.key ? '#E91E63' : '#666'}
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
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginVertical: 10,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        paddingHorizontal: 12,
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    activeTabButton: {
        borderBottomColor: '#E91E63',
        backgroundColor: 'rgba(233, 30, 99, 0.05)',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginLeft: 6,
    },
    activeTabText: {
        color: '#E91E63',
        fontWeight: 'bold',
    },
});

export default ProfileTabs;