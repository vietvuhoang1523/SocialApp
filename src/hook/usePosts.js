import { useState, useCallback } from 'react';
import createPostService from '../services/CreatePostService';

// Custom hook để quản lý các bài đăng
export const usePosts = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [imageLoadErrors, setImageLoadErrors] = useState({});

    // Lấy bài viết từ API
    const fetchPosts = useCallback(async (pageNumber = 0, shouldRefresh = false) => {
        if (shouldRefresh) {
            setPage(0);
            pageNumber = 0;
            setImageLoadErrors({});
        }

        setLoading(true);
        try {
            // Sử dụng service để lấy bài đăng
            const response = await createPostService.api.get('/posts/me', {
                params: {
                    page: pageNumber,
                    limit: 10,
                    order: 'desc'
                }
            });

            const newPosts = response.data.content || [];
            console.log('Fetched posts:', newPosts.length);

            if (shouldRefresh || pageNumber === 0) {
                setPosts(newPosts);
            } else {
                setPosts(prevPosts => [...prevPosts, ...newPosts]);
            }

            setHasMore(!response.data.last);
            setPage(pageNumber);
            return newPosts;
        } catch (error) {
            console.log('Lỗi khi lấy bài đăng:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    // Xử lý khi người dùng kéo xuống để tải thêm
    const handleLoadMore = useCallback(() => {
        if (!loading && hasMore) {
            fetchPosts(page + 1);
        }
    }, [loading, hasMore, page, fetchPosts]);

    // Xử lý refresh
    const handleRefresh = useCallback(async () => {
        return await fetchPosts(0, true);
    }, [fetchPosts]);

    // Xử lý lỗi ảnh
    const handleImageError = useCallback((postId) => {
        setImageLoadErrors(prev => ({
            ...prev,
            [postId]: true
        }));
    }, []);

    return {
        posts,
        loading,
        hasMore,
        page,
        imageLoadErrors,
        fetchPosts,
        handleLoadMore,
        handleRefresh,
        handleImageError
    };
};

export default usePosts;