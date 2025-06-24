import axios from 'axios';
import {BASE_URL, DEFAULT_HEADERS, FORM_DATA_HEADERS, ERROR_MESSAGES, DEFAULT_TIMEOUT} from './api';
import authService from './AuthService';

/**
 * Dịch vụ quản lý bình luận
 */
class CommentService {
    constructor() {
        // Điều chỉnh baseURL dựa trên môi trường
        this.apiBaseUrl = BASE_URL;

        console.log('API URL được sử dụng:', this.apiBaseUrl);

        this.api = axios.create({
            baseURL: `${this.apiBaseUrl}`,
            timeout: DEFAULT_TIMEOUT,
            headers: DEFAULT_HEADERS,
        });

        // Thêm interceptor để tự động thêm token vào mỗi request
        this.api.interceptors.request.use(async (config) => {
            try {
                const token = await authService.getBearerToken();
                if (token) {
                    config.headers.Authorization = token;
                }
                return config;
            } catch (error) {
                console.error('Lỗi khi lấy token:', error);
                return config;
            }
        });
    }

    // Helper để xử lý lỗi
    handleError(error) {
        console.error('API Error:', error);

        if (error.response) {
            // Lỗi có response từ server
            const status = error.response.status;
            const message = error.response.data?.message || ERROR_MESSAGES[status] || ERROR_MESSAGES.default;

            throw new Error(message);
        } else if (error.request) {
            // Lỗi không có response từ server
            throw new Error(ERROR_MESSAGES.default);
        } else {
            // Lỗi khác
            throw new Error(error.message || ERROR_MESSAGES.default);
        }
    }

    // Helper để lấy headers phù hợp
    getHeaders(isFormData = false) {
        return isFormData ? FORM_DATA_HEADERS : DEFAULT_HEADERS;
    }

    /**
     * Lấy danh sách bình luận của bài đăng
     * @param {number} postId - ID của bài đăng
     * @param {number} page - Số trang (bắt đầu từ 0)
     * @param {number} size - Số lượng bình luận mỗi trang
     * @param {string} sortBy - Trường để sắp xếp (mặc định: createdAt)
     * @param {string} sortDir - Hướng sắp xếp (asc hoặc desc)
     * @returns {Promise} - Promise chứa danh sách bình luận
     */
    async getCommentsByPostId(postId, page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc') {
        try {
            console.log(`💬 Fetching comments for post ${postId}`);
            console.log(`📡 API URL: ${this.api.defaults.baseURL}/comments/post/${postId}?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
            
            const response = await this.api.get(
                `/comments/post/${postId}?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
            );
            
            // Kiểm tra và xử lý dữ liệu trả về
            if (response.data && response.data.content) {
                // Đảm bảo mỗi comment có các trường cần thiết
                response.data.content = response.data.content.map(comment => ({
                    ...comment,
                    // Đảm bảo trường user luôn tồn tại
                    user: comment.user || {
                        id: comment.userId || 0,
                        username: 'Người dùng',
                        fullName: 'Người dùng',
                        profilePictureUrl: null
                    },
                    // Đảm bảo các trường khác luôn tồn tại
                    likeCount: comment.likeCount || 0,
                    isLiked: !!comment.isLiked,
                    content: comment.content || ''
                }));
            }
            
            console.log('✅ Comments fetched successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Lỗi khi lấy bình luận của bài đăng:', error);
            console.error('Error details:', error.response?.data || error.message);
            this.handleError(error);
        }
    }

    /**
     * Tạo bình luận mới
     * @param {number} postId - ID của bài đăng
     * @param {string} content - Nội dung bình luận
     * @returns {Promise} - Promise chứa bình luận đã tạo
     */
    async createComment(postId, content) {
        try {
            const commentRequest = {
                postId: postId,
                content: content
            };

            const response = await this.api.post('/comments', commentRequest);
            return response.data;
        } catch (error) {
            console.error('Lỗi khi tạo bình luận:', error);
            this.handleError(error);
        }
    }

    /**
     * Cập nhật bình luận
     * @param {number} commentId - ID của bình luận
     * @param {string} content - Nội dung bình luận mới
     * @param {number} postId - ID của bài đăng
     * @returns {Promise} - Promise chứa bình luận đã cập nhật
     */
    async updateComment(commentId, content, postId) {
        try {
            const commentRequest = {
                postId: postId,
                content: content
            };

            const response = await this.api.put(`/comments/${commentId}`, commentRequest);
            return response.data;
        } catch (error) {
            console.error('Lỗi khi cập nhật bình luận:', error);
            this.handleError(error);
        }
    }

    /**
     * Xóa bình luận
     * @param {number} commentId - ID của bình luận
     * @returns {Promise} - Promise chứa kết quả xóa
     */
    async deleteComment(commentId) {
        try {
            const response = await this.api.delete(`/comments/${commentId}`);
            return response.data;
        } catch (error) {
            console.error('Lỗi khi xóa bình luận:', error);
            this.handleError(error);
        }
    }

    /**
     * Thích hoặc bỏ thích bình luận
     * @param {number} commentId - ID của bình luận
     * @returns {Promise} - Promise chứa trạng thái thích
     */
    async toggleLikeComment(commentId) {
        try {
            const response = await this.api.post(`/comments/${commentId}/like`);
            return response.data;
        } catch (error) {
            console.error('Lỗi khi thích/bỏ thích bình luận:', error);
            this.handleError(error);
        }
    }

    /**
     * Lấy bình luận theo ID
     * @param {number} commentId - ID của bình luận
     * @returns {Promise} - Promise chứa thông tin bình luận
     */
    async getCommentById(commentId) {
        try {
            const response = await this.api.get(`/comments/${commentId}`);
            
            // Đảm bảo dữ liệu trả về có định dạng đúng
            if (response.data) {
                const comment = response.data;
                return {
                    ...comment,
                    user: comment.user || {
                        id: comment.userId || 0,
                        username: 'Người dùng',
                        fullName: 'Người dùng',
                        profilePictureUrl: null
                    },
                    likeCount: comment.likeCount || 0,
                    isLiked: !!comment.isLiked,
                    content: comment.content || ''
                };
            }
            
            return response.data;
        } catch (error) {
            console.error('Lỗi khi lấy thông tin bình luận:', error);
            this.handleError(error);
        }
    }

    /**
     * Lấy danh sách bình luận của người dùng
     * @param {number} userId - ID của người dùng
     * @param {number} page - Số trang (bắt đầu từ 0)
     * @param {number} size - Số lượng bình luận mỗi trang
     * @param {string} sortBy - Trường để sắp xếp (mặc định: createdAt)
     * @param {string} sortDir - Hướng sắp xếp (asc hoặc desc)
     * @returns {Promise} - Promise chứa danh sách bình luận
     */
    async getCommentsByUserId(userId, page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc') {
        try {
            const response = await this.api.get(
                `/comments/user/${userId}?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
            );
            
            // Kiểm tra và xử lý dữ liệu trả về
            if (response.data && response.data.content) {
                response.data.content = response.data.content.map(comment => ({
                    ...comment,
                    user: comment.user || {
                        id: comment.userId || userId,
                        username: 'Người dùng',
                        fullName: 'Người dùng',
                        profilePictureUrl: null
                    },
                    likeCount: comment.likeCount || 0,
                    isLiked: !!comment.isLiked,
                    content: comment.content || ''
                }));
            }
            
            return response.data;
        } catch (error) {
            console.error('Lỗi khi lấy bình luận của người dùng:', error);
            this.handleError(error);
        }
    }
}

// Tạo một instance của CommentService và export
const commentService = new CommentService();
export default commentService;
