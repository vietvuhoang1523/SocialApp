import React, { useState } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    FlatList
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useProfileContext } from '../../components/ProfileContext';

const { width } = Dimensions.get('window');
const GRID_COLUMNS = 3;

const ProfileContent = ({ activeTab }) => {
    const { userProfile } = useProfileContext();
    const [posts, setPosts] = useState([
        // Dữ liệu mẫu, nên thay thế bằng dữ liệu từ API
        {
            id: '1',
            image: 'https://picsum.photos/200/300?random=1',
            likes: 125,
            comments: 24
        },
        {
            id: '2',
            image: 'https://picsum.photos/200/300?random=2',
            likes: 87,
            comments: 12
        },
        // Thêm các bài viết khác
    ]);

    const renderCreatePostButton = () => (
        <TouchableOpacity style={styles.createPostButton}>
            <Ionicons name="add-circle" size={24} color="#1877F2" />
            <Text style={styles.createPostText}>Tạo bài viết</Text>
        </TouchableOpacity>
    );

    const renderPostItem = ({ item }) => (
        <View style={styles.postItem}>
            <Image source={{ uri: item.image }} style={styles.postImage} />
            <View style={styles.postOverlay}>
                <View style={styles.postStats}>
                    <View style={styles.statItem}>
                        <Ionicons name="heart" size={16} color="white" />
                        <Text style={styles.statText}>{item.likes}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="chatbubble" size={16} color="white" />
                        <Text style={styles.statText}>{item.comments}</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderContent = () => {
        switch(activeTab) {
            case 'posts':
                return (
                    <View style={styles.postsContainer}>
                        {renderCreatePostButton()}
                        <FlatList
                            data={posts}
                            renderItem={renderPostItem}
                            keyExtractor={item => item.id}
                            numColumns={GRID_COLUMNS}
                            columnWrapperStyle={styles.postGridRow}
                        />
                    </View>
                );
            case 'photos':
                return (
                    <View style={styles.photosContainer}>
                        <FlatList
                            data={posts}
                            renderItem={renderPostItem}
                            keyExtractor={item => item.id}
                            numColumns={GRID_COLUMNS}
                            columnWrapperStyle={styles.postGridRow}
                        />
                    </View>
                );
            case 'reels':
                return (
                    <View style={styles.reelsContainer}>
                        <Text style={styles.emptyStateText}>Không có Reels</Text>
                    </View>
                );
            case 'videos':
                return (
                    <View style={styles.videosContainer}>
                        <Text style={styles.emptyStateText}>Không có Video</Text>
                    </View>
                );
            default:
                return null;
        }
    };

    return renderContent();
};

const styles = StyleSheet.create({
    postsContainer: {
        backgroundColor: 'white',
        paddingTop: 10,
    },
    photosContainer: {
        backgroundColor: 'white',
    },
    reelsContainer: {
        backgroundColor: 'white',
        minHeight: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    videosContainer: {
        backgroundColor: 'white',
        minHeight: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyStateText: {
        color: '#65676B',
        fontSize: 16,
    },
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
    postGridRow: {
        justifyContent: 'space-between',
        marginHorizontal: 2,
    },
    postItem: {
        width: width / GRID_COLUMNS - 4,
        height: width / GRID_COLUMNS - 4,
        marginBottom: 2,
        position: 'relative',
    },
    postImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    postOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'flex-end',
        padding: 5,
    },
    postStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: {
        color: 'white',
        marginLeft: 5,
        fontSize: 12,
    },
});

export default ProfileContent;