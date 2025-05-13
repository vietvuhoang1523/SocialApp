// src/screens/CreatePostScreen.js
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TextInput,
    TouchableOpacity,
    ScrollView,
    FlatList,
    SafeAreaView,
    Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';

const { width } = Dimensions.get('window');

// Mock data cho thư viện ảnh
const MOCK_GALLERY = [
    { id: '1', uri: 'https://picsum.photos/id/1/500/500' },
    { id: '2', uri: 'https://picsum.photos/id/2/500/500' },
    { id: '3', uri: 'https://picsum.photos/id/3/500/500' },
    { id: '4', uri: 'https://picsum.photos/id/4/500/500' },
    { id: '5', uri: 'https://picsum.photos/id/5/500/500' },
    { id: '6', uri: 'https://picsum.photos/id/6/500/500' },
    { id: '7', uri: 'https://picsum.photos/id/7/500/500' },
    { id: '8', uri: 'https://picsum.photos/id/8/500/500' },
    { id: '9', uri: 'https://picsum.photos/id/9/500/500' },
    { id: '10', uri: 'https://picsum.photos/id/10/500/500' },
    { id: '11', uri: 'https://picsum.photos/id/11/500/500' },
    { id: '12', uri: 'https://picsum.photos/id/12/500/500' },
];

const CreatePostScreen = ({ navigation }) => {
    const [selectedImage, setSelectedImage] = useState(MOCK_GALLERY[0].uri);
    const [caption, setCaption] = useState('');
    const [selectedTab, setSelectedTab] = useState('GALLERY');
    const [showFullCaption, setShowFullCaption] = useState(false);

    // Tùy chọn chia sẻ
    const [shareToFeed, setShareToFeed] = useState(true);
    const [shareToStory, setShareToStory] = useState(false);

    // Các tabs tạo bài đăng
    const tabs = ['GALLERY', 'PHOTO', 'VIDEO'];

    const handlePost = () => {
        // Xử lý logic đăng bài
        // Sau khi đăng thành công, quay lại màn hình Home
        navigation.navigate('Home');
    };

    const renderGalleryItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.galleryItem,
                selectedImage === item.uri && styles.selectedGalleryItem
            ]}
            onPress={() => setSelectedImage(item.uri)}
        >
            <Image source={{ uri: item.uri }} style={styles.galleryItemImage} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="close" size={28} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Post</Text>
                <TouchableOpacity style={styles.nextButton} onPress={handlePost}>
                    <Text style={styles.nextButtonText}>Share</Text>
                </TouchableOpacity>
            </View>

            {/* Preview và Caption */}
            <View style={styles.previewContainer}>
                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                <View style={styles.captionContainer}>
                    <TextInput
                        style={[styles.captionInput, showFullCaption && styles.expandedCaptionInput]}
                        placeholder="Write a caption..."
                        multiline
                        value={caption}
                        onChangeText={setCaption}
                        onFocus={() => setShowFullCaption(true)}
                        onBlur={() => setShowFullCaption(false)}
                    />
                    {!showFullCaption && (
                        <View style={styles.quickActions}>
                            <TouchableOpacity style={styles.quickAction}>
                                <Icon name="emoticon-outline" size={24} color="#999" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.quickAction}>
                                <Icon name="map-marker-outline" size={24} color="#999" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.quickAction}>
                                <Icon name="music" size={24} color="#999" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>

            {/* Tag People, Add Location, etc. */}
            <View style={styles.optionsContainer}>
                <TouchableOpacity style={styles.option}>
                    <Text style={styles.optionText}>Tag People</Text>
                    <Icon name="chevron-right" size={20} color="#999" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.option}>
                    <Text style={styles.optionText}>Add Location</Text>
                    <Icon name="chevron-right" size={20} color="#999" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.option}>
                    <Text style={styles.optionText}>Add Music</Text>
                    <Icon name="chevron-right" size={20} color="#999" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.option}>
                    <Text style={styles.optionText}>Advanced Settings</Text>
                    <Icon name="chevron-right" size={20} color="#999" />
                </TouchableOpacity>
            </View>

            {/* Share To Options */}
            <View style={styles.shareOptionsContainer}>
                <Text style={styles.shareOptionsTitle}>Also Share To</Text>

                <View style={styles.shareOption}>
                    <Text style={styles.shareOptionText}>Feed</Text>
                    <TouchableOpacity
                        style={styles.toggleButton}
                        onPress={() => setShareToFeed(!shareToFeed)}
                    >
                        <View style={[styles.toggleTrack, shareToFeed && styles.toggleTrackActive]}>
                            <View style={[styles.toggleThumb, shareToFeed && styles.toggleThumbActive]} />
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.shareOption}>
                    <Text style={styles.shareOptionText}>Your Story</Text>
                    <TouchableOpacity
                        style={styles.toggleButton}
                        onPress={() => setShareToStory(!shareToStory)}
                    >
                        <View style={[styles.toggleTrack, shareToStory && styles.toggleTrackActive]}>
                            <View style={[styles.toggleThumb, shareToStory && styles.toggleThumbActive]} />
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tab selections */}
            <View style={styles.tabContainer}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, selectedTab === tab && styles.activeTab]}
                        onPress={() => setSelectedTab(tab)}
                    >
                        <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Gallery */}
            {selectedTab === 'GALLERY' && (
                <FlatList
                    data={MOCK_GALLERY}
                    renderItem={renderGalleryItem}
                    keyExtractor={(item) => item.id}
                    numColumns={3}
                    style={styles.gallery}
                />
            )}

            {/* Camera options if PHOTO or VIDEO selected */}
            {selectedTab !== 'GALLERY' && (
                <View style={styles.cameraContainer}>
                    <Text style={styles.cameraText}>
                        {selectedTab === 'PHOTO' ? 'Camera would open here to take photos' : 'Camera would open here to record video'}
                    </Text>
                    <Icon name="camera" size={48} color="#999" />
                </View>
            )}

            {/* Edit Toolbar */}
            <View style={styles.editToolbar}>
                <TouchableOpacity style={styles.editTool}>
                    <Icon name="crop" size={24} color="black" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.editTool}>
                    <Icon name="tune" size={24} color="black" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.editTool}>
                    <Icon name="magic-staff" size={24} color="black" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.editTool}>
                    <Icon name="text" size={24} color="black" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.editTool}>
                    <Icon name="sticker-emoji" size={24} color="black" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#EFEFEF',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    nextButton: {
        backgroundColor: '#0095F6',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 4,
    },
    nextButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    previewContainer: {
        flexDirection: 'row',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#EFEFEF',
    },
    previewImage: {
        width: 80,
        height: 80,
        borderRadius: 5,
        marginRight: 15,
    },
    captionContainer: {
        flex: 1,
        justifyContent: 'space-between',
    },
    captionInput: {
        fontSize: 16,
        maxHeight: 80,
    },
    expandedCaptionInput: {
        height: 80,
    },
    quickActions: {
        flexDirection: 'row',
    },
    quickAction: {
        marginRight: 15,
    },
    optionsContainer: {
        borderBottomWidth: 1,
        borderBottomColor: '#EFEFEF',
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
    },
    optionText: {
        fontSize: 16,
    },
    shareOptionsContainer: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#EFEFEF',
    },
    shareOptionsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    shareOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 8,
    },
    shareOptionText: {
        fontSize: 16,
    },
    toggleButton: {
        justifyContent: 'center',
    },
    toggleTrack: {
        width: 50,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#EFEFEF',
        justifyContent: 'center',
        paddingHorizontal: 2,
    },
    toggleTrackActive: {
        backgroundColor: '#0095F6',
    },
    toggleThumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
    },
    toggleThumbActive: {
        transform: [{ translateX: 22 }],
    },
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#EFEFEF',
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: 'black',
    },
    tabText: {
        fontSize: 14,
        color: '#999',
    },
    activeTabText: {
        color: 'black',
        fontWeight: 'bold',
    },
    gallery: {
        flex: 1,
    },
    galleryItem: {
        width: width / 3,
        height: width / 3,
        padding: 1,
    },
    selectedGalleryItem: {
        opacity: 0.7,
    },
    galleryItemImage: {
        width: '100%',
        height: '100%',
    },
    cameraContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F7F7F7',
    },
    cameraText: {
        marginBottom: 20,
        fontSize: 16,
        color: '#666',
    },
    editToolbar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: '#EFEFEF',
    },
    editTool: {
        alignItems: 'center',
    },
});

export default CreatePostScreen;
