import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet, ActivityIndicator
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Tạo component CreatePostButton có thể tái sử dụng
const CreatePostButton = ({ onPress }) => (
    <TouchableOpacity
        style={styles.createPostButton}
        onPress={onPress}
    >
        <Ionicons name="add-circle" size={24} color="#1877F2" />
        <Text style={styles.createPostText}>Tạo bài viết</Text>
    </TouchableOpacity>
);

// Tạo component EmptyContent có thể tái sử dụng
const EmptyContent = ({ message = 'Không có dữ liệu' }) => (
    <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{message}</Text>
    </View>
);

// Tạo component LoadingIndicator có thể tái sử dụng
const LoadingIndicator = ({ size = 'small', color = '#1877F2', style }) => (
    <ActivityIndicator size={size} color={color} style={[styles.loader, style]} />
);

const styles = StyleSheet.create({
    // Styles cho nút tạo bài viết
    createPostButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0F2F5',
        marginHorizontal: 15,
        marginBottom: 10,
        paddingVertical: 10,
        borderRadius: 8,
    },
    createPostText: {
        marginLeft: 10,
        color: '#1877F2',
        fontWeight: '600',
    },
    // Styles cho trạng thái trống
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: '#65676B',
        fontSize: 16,
    },
    // Style cho loading indicator
    loader: {
        marginVertical: 20,
    },
});

export { CreatePostButton, EmptyContent, LoadingIndicator };