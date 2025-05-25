import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    Image,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import CommentService from '../services/CommentService';
import PostService from '../services/CreatePostService';
import AuthService from '../services/AuthService';
import Config from '../../src/services/config';

// Hàm helper để tạo URL đầy đủ từ đường dẫn tương đối
const getFullImageUrl = (relativePath) => {
    if (!relativePath) return null;

    // Nếu đường dẫn đã là URL đầy đủ, trả về ngay
    if (relativePath.startsWith('http')) {
        return relativePath;
    }

    // Xử lý path
    const cleanPath = relativePath
        .replace(/^thanh\//, '') // Xóa prefix thanh/ nếu có
        .replace(/^\//, ''); // Xóa slash đầu tiên nếu có

    const apiUrl = Config.extra.apiUrl;
    // Cắt bỏ /api từ apiUrl để khớp với đường dẫn hình ảnh
    const baseUrl = apiUrl.replace(/\/api$/, '');
    return `${baseUrl}/files/image?bucketName=thanh&path=${encodeURIComponent(cleanPath)}`;
};

const CommentsScreen = ({ route, navigation }) => {
    const { postId } = route.params;
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [post, setPost] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMoreComments, setHasMoreComments] = useState(true);
    const inputRef = useRef(null);

    // Lấy thông tin người dùng hiện tại
    const fetchCurrentUser = async () => {
        try {
            const userData = await AuthService.getUserData();
            setCurrentUser(userData);
            return userData;
        } catch (error) {
            console.error('Lỗi khi lấy thông tin người dùng:', error);
            return null;
        }
    };

    // Lấy thông tin chi tiết của bài đăng
    const fetchPostDetails = async () => {
        try {
            const postData = await PostService.getPostById(postId);
            setPost(postData);
        } catch (error) {
            console.error('Lỗi khi lấy thông tin bài đăng:', error);
            Alert.alert('Lỗi', 'Không thể tải thông tin bài đăng. Vui lòng thử lại sau.');
        }
    };

    // Lấy danh sách bình luận
    const fetchComments = async (pageNumber = 0, shouldRefresh = false) => {
        try {
            if (shouldRefresh) {
                setRefreshing(true);
                setPage(0);
                pageNumber = 0;
            } else if (pageNumber > 0) {
                // Đang tải thêm
            } else {
                setLoading(true);
            }

            const commentsData = await CommentService.getCommentsByPostId(postId, pageNumber);

            // Xử lý dữ liệu phân trang
            const newComments = commentsData.content || [];

            if (shouldRefresh || pageNumber === 0) {
                setComments(newComments);
            } else {
                setComments(prevComments => [...prevComments, ...newComments]);
            }

            // Kiểm tra xem có còn bình luận để tải không
            setHasMoreComments(!commentsData.last && newComments.length > 0);
            setPage(pageNumber);
        } catch (error) {
            console.error('Lỗi khi tải bình luận:', error);
            Alert.alert('Lỗi', 'Không thể tải bình luận. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Gửi bình luận mới
    const submitComment = async () => {
        if (!newComment.trim()) return;

        try {
            setSubmitting(true);
            await CommentService.createComment(postId, newComment);

            // Cập nhật UI
            setNewComment('');

            // Tải lại danh sách bình luận
            await fetchComments(0, true);

            // Cập nhật số lượng bình luận trong bài đăng
            if (post) {
                setPost({
                    ...post,
                    lengthCmt: (post.lengthCmt || 0) + 1
                });
            }
        } catch (error) {
            console.error('Lỗi khi gửi bình luận:', error);
            Alert.alert('Lỗi', 'Không thể gửi bình luận. Vui lòng thử lại sau.');
        } finally {
            setSubmitting(false);
        }
    };

    // Định dạng thời gian
    const formatTimeAgo = (dateString) => {
        if (!dateString) return '';
        const now = new Date();
        const date = new Date(dateString);
        const diffInSeconds = Math.floor((now - date) / 1000);
        if (diffInSeconds < 60) return 'vừa xong';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    };

    // Xóa bình luận
    const deleteComment = async (commentId) => {
        try {
            Alert.alert(
                'Xác nhận xóa',
                'Bạn có chắc chắn muốn xóa bình luận này không?',
                [
                    { text: 'Hủy', style: 'cancel' },
                    {
                        text: 'Xóa',
                        style: 'destructive',
                        onPress: async () => {
                            await CommentService.deleteComment(commentId);

                            // Cập nhật UI
                            setComments(comments.filter(comment => comment.id !== commentId));

                            // Cập nhật số lượng bình luận trong bài đăng
                            if (post) {
                                setPost({
                                    ...post,
                                    lengthCmt: Math.max(0, (post.lengthCmt || 1) - 1)
                                });
                            }
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Lỗi khi xóa bình luận:', error);
            Alert.alert('Lỗi', 'Không thể xóa bình luận. Vui lòng thử lại sau.');
        }
    };

    // Thích/bỏ thích bình luận
    const handleLikeComment = async (commentId) => {
        try {
            await CommentService.toggleLikeComment(commentId);

            // Cập nhật UI
            setComments(prevComments =>
                prevComments.map(comment => {
                    if (comment.id === commentId) {
                        const isCurrentlyLiked = comment.isLiked;
                        const newLikeCount = isCurrentlyLiked
                            ? (comment.likeCount - 1)
                            : (comment.likeCount + 1);

                        return {
                            ...comment,
                            isLiked: !isCurrentlyLiked,
                            likeCount: newLikeCount
                        };
                    }
                    return comment;
                })
            );
        } catch (error) {
            console.error('Lỗi khi thích/bỏ thích bình luận:', error);
            Alert.alert('Lỗi', 'Không thể thích/bỏ thích bình luận. Vui lòng thử lại sau.');
        }
    };

    // Kiểm tra quyền xóa bình luận
    const canDeleteComment = (comment) => {
        if (!currentUser || !comment || !comment.user) return false;

        // Người dùng có thể xóa bình luận của chính họ
        if (comment.user.id === currentUser.id) return true;

        // Chủ bài đăng có thể xóa tất cả bình luận trong bài đăng của họ
        if (post && post.userRes && post.userRes.id === currentUser.id) return true;

        return false;
    };

    // Tải thêm bình luận khi cuộn đến cuối
    const handleLoadMoreComments = () => {
        if (hasMoreComments && !loading && !refreshing) {
            fetchComments(page + 1);
        }
    };

    // Làm mới danh sách bình luận
    const handleRefresh = () => {
        fetchComments(0, true);
    };

    // Tải dữ liệu ban đầu
    useEffect(() => {
        const loadInitialData = async () => {
            await fetchCurrentUser();
            await fetchPostDetails();
            await fetchComments();
        };

        loadInitialData();
    }, [postId]);

    // Render item bình luận
    const renderCommentItem = ({ item }) => {
        const avatarUrl = item.user?.profilePictureUrl
            ? getFullImageUrl(item.user.profilePictureUrl)
            : 'https://randomuser.me/api/portraits/men/1.jpg';

        return (
            <View style={styles.commentItem}>
                <Image
                    source={{ uri: avatarUrl }}
                    style={styles.avatar}
                    defaultSource={require('../assets/default-avatar.png')}
                />
                <View style={styles.commentContent}>
                    <View style={styles.commentBubble}>
                        <Text style={styles.username}>{item.user?.fullName || item.user?.username || 'Người dùng'}</Text>
                        <Text style={styles.commentText}>{item.content}</Text>
                    </View>
                    <View style={styles.commentActions}>
                        <Text style={styles.timestamp}>{formatTimeAgo(item.createdAt)}</Text>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleLikeComment(item.id)}
                        >
                            <Icon
                                name={item.isLiked ? "heart" : "heart-outline"}
                                size={16}
                                color={item.isLiked ? "#E53935" : "#65676B"}
                            />
                            <Text style={styles.actionButtonText}>
                                {item.likeCount > 0 ? item.likeCount : ''} Thích
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => setNewComment(`@${item.user?.username} `)}
                        >
                            <Icon name="chatbubble-outline" size={16} color="#65676B" />
                            <Text style={styles.actionButtonText}>Trả lời</Text>
                        </TouchableOpacity>

                        {canDeleteComment(item) && (
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => deleteComment(item.id)}
                            >
                                <Icon name="trash-outline" size={16} color="#E53935" />
                                <Text style={[styles.actionButtonText, { color: '#E53935' }]}>Xóa</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    // Hiển thị thanh tiêu đề
    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Icon name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Bình luận</Text>
            <View style={{ width: 24 }} />
        </View>
    );

    // Hiển thị thông tin bài đăng gốc
    const renderOriginalPost = () => {
        if (!post) return null;

        const avatarUrl = post.userRes?.profilePictureUrl
            ? getFullImageUrl(post.userRes.profilePictureUrl)
            : 'https://randomuser.me/api/portraits/men/1.jpg';

        return (
            <View style={styles.originalPost}>
                <View style={styles.postHeader}>
                    <Image
                        source={{ uri: avatarUrl }}
                        style={styles.avatar}
                        defaultSource={require('../assets/default-avatar.png')}
                    />
                    <View style={styles.postUserInfo}>
                        <Text style={styles.username}>{post.userRes?.fullName || post.userRes?.username || 'Người dùng'}</Text>
                        <Text style={styles.postContent} numberOfLines={2}>{post.content}</Text>
                    </View>
                </View>
            </View>
        );
    };

    // Hiển thị khung nhập bình luận
    const renderCommentInput = () => {
        const avatarUrl = currentUser?.profilePictureUrl
            ? getFullImageUrl(currentUser.profilePictureUrl)
            : 'https://randomuser.me/api/portraits/men/1.jpg';

        return (
            <View style={styles.commentForm}>
                <Image
                    source={{ uri: avatarUrl }}
                    style={styles.avatar}
                    defaultSource={require('../assets/default-avatar.png')}
                />
                <TextInput
                    ref={inputRef}
                    style={styles.commentInput}
                    placeholder="Thêm bình luận..."
                    value={newComment}
                    onChangeText={setNewComment}
                    multiline
                />
                {submitting ? (
                    <ActivityIndicator size="small" color="#0095F6" />
                ) : (
                    <TouchableOpacity
                        onPress={submitComment}
                        disabled={!newComment.trim()}
                    >
                        <Text style={[
                            styles.postButton,
                            !newComment.trim() && styles.postButtonDisabled
                        ]}>
                            Đăng
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            {renderHeader()}
            {renderOriginalPost()}

            {loading && comments.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0095F6" />
                </View>
            ) : (
                <FlatList
                    data={comments}
                    renderItem={renderCommentItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.commentsList}
                    onEndReached={handleLoadMoreComments}
                    onEndReachedThreshold={0.5}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    ListFooterComponent={
                        hasMoreComments && comments.length > 0 ? (
                            <ActivityIndicator style={{ marginVertical: 15 }} size="small" color="#0095F6" />
                        ) : null
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</Text>
                        </View>
                    }
                />
            )}

            {renderCommentInput()}
        </KeyboardAvoidingView>
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
        borderBottomWidth: 0.5,
        borderBottomColor: '#DEDEDE',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    originalPost: {
        padding: 15,
        borderBottomWidth: 0.5,
        borderBottomColor: '#DEDEDE',
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    postUserInfo: {
        flex: 1,
        marginLeft: 10,
    },
    postContent: {
        color: '#222',
        marginTop: 3,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    commentsList: {
        flexGrow: 1,
        padding: 15,
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    commentContent: {
        flex: 1,
        marginLeft: 10,
    },
    commentBubble: {
        backgroundColor: '#F1F2F6',
        borderRadius: 18,
        padding: 10,
        paddingVertical: 8,
    },
    username: {
        fontWeight: 'bold',
        marginBottom: 2,
    },
    commentText: {
        fontSize: 14,
    },
    commentActions: {
        flexDirection: 'row',
        marginTop: 5,
        marginLeft: 5,
        alignItems: 'center',
    },
    timestamp: {
        fontSize: 12,
        color: '#65676B',
        marginRight: 15,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 15,
    },
    actionButtonText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#65676B',
        marginLeft: 4,
    },
    commentForm: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderTopWidth: 0.5,
        borderTopColor: '#DEDEDE',
        backgroundColor: 'white',
    },
    commentInput: {
        flex: 1,
        backgroundColor: '#F1F2F6',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 8,
        marginHorizontal: 10,
        maxHeight: 100,
    },
    postButton: {
        color: '#0095F6',
        fontWeight: 'bold',
    },
    postButtonDisabled: {
        opacity: 0.5,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        color: '#65676B',
        textAlign: 'center',
    },
});

export default CommentsScreen;
