import axios from 'axios';
import {BASE_URL, DEFAULT_HEADERS, FORM_DATA_HEADERS, ERROR_MESSAGES, DEFAULT_TIMEOUT} from './api';
import authService from './AuthService';
import AsyncStorage from "@react-native-async-storage/async-storage";

class CreatePostService {
    constructor() {
        // Điều chỉnh baseURL dựa trên môi trường
        let apiBaseUrl = BASE_URL;

        console.log('API URL được sử dụng:', apiBaseUrl);

        this.api = axios.create({
            baseURL: apiBaseUrl,
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

    // ✅ Tạo bài đăng mới với nhiều hình ảnh
    async createPostWithMultipleImages(postData) {
        try {
            console.log('🖼️ Đang gửi request tạo bài đăng với nhiều hình ảnh:', postData);

            // Validate số lượng hình ảnh
            if (postData.imageFiles && postData.imageFiles.length > 10) {
                throw new Error('Chỉ được upload tối đa 10 hình ảnh');
            }

            // Tạo FormData để upload nhiều ảnh và dữ liệu
            const formData = new FormData();

            // Thêm nội dung
            if (postData.content) {
                formData.append('content', postData.content);
            }

            // ✅ Thêm nhiều hình ảnh nếu có
            if (postData.imageFiles && postData.imageFiles.length > 0) {
                console.log(`📷 Thêm ${postData.imageFiles.length} hình ảnh`);
                postData.imageFiles.forEach((imageFile, index) => {
                    console.log(`📸 Thêm hình ảnh ${index + 1}:`, imageFile);
                    formData.append('imageFiles', {
                        uri: imageFile.uri,
                        type: imageFile.type || 'image/jpeg',
                        name: imageFile.name || `image_${index + 1}.jpg`
                    });
                });
            }

            // Thêm loại bài đăng
            if (postData.type) {
                formData.append('type', postData.type);
            }

            console.log('📤 FormData được tạo với nhiều hình ảnh');

            // ✅ Gửi đến endpoint /multi-images
            const response = await this.api.post('/posts/multi-images', formData, {
                headers: {
                    ...this.getHeaders(true),
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 120000 // Tăng timeout lên 2 phút cho multiple images
            });

            console.log('✅ Response từ createPostWithMultipleImages:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Lỗi khi tạo bài đăng với nhiều hình ảnh:', error);
            this.handleError(error);
        }
    }

    // Tạo bài đăng mới (single image - backward compatibility)
    async createPost(postData) {
        try {
            // ✅ Nếu có nhiều hình ảnh, sử dụng endpoint mới
            if (postData.imageFiles && postData.imageFiles.length > 0) {
                return await this.createPostWithMultipleImages(postData);
            }

            // Log request
            console.log('📝 Đang gửi request tạo bài đăng với dữ liệu:', postData);

            // Tạo FormData để upload ảnh và dữ liệu
            const formData = new FormData();

            // Thêm các trường từ postData
            if (postData.content) {
                formData.append('content', postData.content);
            }

            // Thêm ảnh nếu có (single image)
            if (postData.imageFile) {
                console.log('📷 Thêm file:', postData.imageFile);
                formData.append('imageFile', {
                    uri: postData.imageFile.uri,
                    type: postData.imageFile.type || 'image/jpeg',
                    name: postData.imageFile.name || 'image.jpg'
                });
            }

            // Thêm loại bài đăng (nếu có)
            if (postData.type) {
                formData.append('type', postData.type);
            }

            console.log('📤 FormData được tạo (single image)');

            // Gửi đến endpoint gốc
            const response = await this.api.post('/posts', formData, {
                headers: {
                    ...this.getHeaders(true),
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 60000
            });

            console.log('✅ Response từ createPost:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Lỗi khi tạo bài đăng:', error);
            this.handleError(error);
        }
    }

    // Cập nhật bài đăng
    async updatePost(postId, postData) {
        try {
            const formData = new FormData();

            if (postData.content) {
                formData.append('content', postData.content);
            }

            if (postData.imageFile) {
                formData.append('imageFile', {
                    uri: postData.imageFile.uri,
                    type: postData.imageFile.type || 'image/jpeg',
                    name: postData.imageFile.name || 'image.jpg'
                });
            }

            if (postData.type) {
                formData.append('type', postData.type);
            }

            const response = await this.api.put(`/posts/${postId}`, formData, {
                headers: {
                    ...this.getHeaders(true),
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 30000 // Tăng timeout cho upload
            });

            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    // Xóa bài đăng
    async deletePost(postId) {
        try {
            await this.api.delete(`/posts/${postId}`);
            return true;
        } catch (error) {
            this.handleError(error);
        }
    }

    // Lấy chi tiết bài đăng
    async getPostById(postId) {
        try {
            const response = await this.api.get(`/posts/${postId}`);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    // Lấy bài đăng của người dùng
    async getPostsByUser(userId) {
        try {
            const response = await this.api.get(`/posts/user/${userId}`);
            return response.data;
        } catch (error) {
            const errorInfo = this.handleError(error);
            // Trả về một đối tượng dữ liệu giả để tránh lỗi undefined
            return {
                error: true,
                errorInfo,
                post: {
                    id: postId,
                    title: '',
                    content: '',
                    images: [] // Mảng rỗng thay vì undefined
                }
            }
        }
    }

    // Tìm kiếm bài đăng
    async searchPosts(keyword) {
        try {
            const response = await this.api.get(`/posts/search`, {
                params: { keyword }
            });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }
    // bai viet cua nguoi dung
    async getCurrentUserPosts(page = 0, limit = 10, order = 'desc') {
        try {
            console.log(`Đang gọi API lấy bài đăng của người dùng hiện tại: /posts/me?page=${page}&limit=${limit}&order=${order}`);

            const response = await this.api.get('/posts/me', {
                params: {
                    page,
                    limit,
                    order
                }
            });

            console.log('Response từ getCurrentUserPosts:', response.data);
            return response.data;
        } catch (error) {
            console.error('Lỗi khi lấy bài đăng của người dùng hiện tại:', error);
            this.handleError(error);
        }
    }

    // Sửa đổi hàm checkPostOwnership trong CreatePostService.js - Phiên bản đơn giản
    async checkPostOwnership(postId) {
        try {
            console.log('🔍 Kiểm tra quyền sở hữu bài viết:', postId);

            // Kiểm tra cơ bản
            if (!postId) {
                console.log('❌ PostId không hợp lệ');
                return false;
            }

            // Lấy token
            const token = await AsyncStorage.getItem('accessToken');
            if (!token) {
                console.log('❌ Không có token');
                return false;
            }

            // Lấy thông tin bài viết
            let postData;
            try {
                postData = await this.getPostById(postId);
                console.log('📄 Thông tin bài viết:', {
                    id: postData?.id,
                    userRes: postData?.userRes,
                    user: postData?.user
                });
            } catch (error) {
                console.error('❌ Lỗi khi lấy bài viết:', error);
                return false;
            }

            if (!postData) {
                console.log('❌ Không tìm thấy bài viết');
                return false;
            }

            // Lấy thông tin user hiện tại
            let currentUser;
            try {
                const response = await this.api.get('/v1/users/profile');
                currentUser = response?.data;
                console.log('👤 Thông tin user hiện tại:', {
                    id: currentUser?.id,
                    userId: currentUser?.userId
                });
            } catch (error) {
                console.error('❌ Lỗi khi lấy thông tin user:', error);
                return false;
            }

            if (!currentUser) {
                console.log('❌ Không tìm thấy thông tin user');
                return false;
            }

            // Lấy ID với fallback
            const currentUserId = currentUser?.id || currentUser?.userId;
            const postOwnerId = postData?.userRes?.id || postData?.user?.id;

            console.log('🔄 So sánh ID:', {
                currentUserId: currentUserId,
                postOwnerId: postOwnerId,
                currentUserIdType: typeof currentUserId,
                postOwnerIdType: typeof postOwnerId
            });

            // Kiểm tra ID có tồn tại không
            if (!currentUserId || !postOwnerId) {
                console.log('❌ Thiếu ID để so sánh');
                return false;
            }

            // So sánh
            const isOwner = String(currentUserId) === String(postOwnerId);

            console.log('✅ Kết quả:', {
                isOwner: isOwner,
                currentUserIdStr: String(currentUserId),
                postOwnerIdStr: String(postOwnerId)
            });

            return isOwner;

        } catch (error) {
            console.error('💥 Lỗi trong checkPostOwnership:', error.message);
            return false;
        }
    }

// Cập nhật phương thức getFeedPosts trong CreatePostService.js
    async getFeedPosts(page = 0, size = 10, order = 'desc') {
        try {
            console.log(`🔄 Đang gọi API lấy feed bài đăng: /posts/feed?page=${page}&size=${size}&order=${order}`);

            const response = await this.api.get(`/posts/feed`, {
                params: { page, size, order }
            });

            console.log('📄 Raw Response từ getFeedPosts:', JSON.stringify(response.data, null, 2));

            // Kiểm tra cấu trúc response
            let posts = [];
            let isLastPage = true;
            let totalElements = 0;
            let totalPages = 0;
            let currentPage = page;

            if (response.data) {
                // Trường hợp 1: Response là đối tượng phân trang Spring Boot
                if (response.data.content && Array.isArray(response.data.content)) {
                    console.log('📋 Phát hiện cấu trúc phân trang Spring Boot');
                    posts = response.data.content;
                    isLastPage = response.data.last || false;
                    totalElements = response.data.totalElements || 0;
                    totalPages = response.data.totalPages || 0;
                    currentPage = response.data.number || page;
                }
                // Trường hợp 2: Response là mảng trực tiếp
                else if (Array.isArray(response.data)) {
                    console.log('📋 Phát hiện mảng trực tiếp');
                    posts = response.data;
                    totalElements = posts.length;
                    totalPages = posts.length > 0 ? 1 : 0;
                    isLastPage = true;
                }
                // Trường hợp 3: Response có cấu trúc khác
                else {
                    console.log('📋 Cấu trúc response không nhận dạng được:', typeof response.data);
                    posts = [];
                }
            }

            console.log(`📊 Thống kê dữ liệu:`, {
                totalPosts: posts.length,
                isLastPage,
                totalElements,
                totalPages,
                currentPage
            });

            // Xử lý URL hình ảnh cho các bài đăng
            const processedPosts = this.processPostsImageUrls(posts);

            console.log(`✅ Đã xử lý ${processedPosts.length} bài đăng`);

            // Trả về dữ liệu theo định dạng chuẩn
            return {
                content: processedPosts,
                totalElements: totalElements,
                totalPages: totalPages,
                last: isLastPage,
                number: currentPage,
                size: size
            };

        } catch (error) {
            console.error('❌ Lỗi khi lấy feed bài đăng:', error);
            
            // Log chi tiết lỗi
            if (error.response) {
                console.error('📤 Response Status:', error.response.status);
                console.error('📤 Response Data:', error.response.data);
                console.error('📤 Response Headers:', error.response.headers);
            } else if (error.request) {
                console.error('📤 Request được gửi nhưng không có response:', error.request);
            } else {
                console.error('📤 Lỗi khi setup request:', error.message);
            }

            this.handleError(error);
            
            // Trả về object rỗng để tránh crash
            return {
                content: [],
                totalElements: 0,
                totalPages: 0,
                last: true,
                number: page,
                size: size
            };
        }
    }

// Thêm hàm mới để xử lý URL hình ảnh cho tất cả bài đăng
    processPostsImageUrls(posts) {
        console.log('🖼️ Bắt đầu xử lý URL hình ảnh cho posts:', posts?.length || 0);

        // Kiểm tra đầu vào
        if (!posts) {
            console.log('❌ Posts is null/undefined');
            return [];
        }

        // Kiểm tra nếu posts là đối tượng phân trang
        if (posts && posts.content && Array.isArray(posts.content)) {
            console.log('📋 Phát hiện cấu trúc phân trang trong processPostsImageUrls');
            posts = posts.content;
        }

        // Nếu posts không phải là mảng, trả về mảng rỗng
        if (!Array.isArray(posts)) {
            console.log(`❌ Posts không phải là mảng, type: ${typeof posts}`);
            return [];
        }

        console.log(`🔄 Đang xử lý ${posts.length} bài đăng`);

        return posts.map((post, index) => {
            try {
                // Log thông tin mỗi post để debug
                console.log(`📝 Post ${index + 1}:`, {
                    id: post.id,
                    hasContent: !!post.content,
                    hasImageUrl: !!post.imageUrl,
                    hasImageUrls: !!post.imageUrls,
                    hasImages: !!post.images,
                    userRes: post.userRes?.fullName || 'No user info'
                });

                // Tạo URL hình ảnh đầy đủ cho single image
                if (post.imageUrl) {
                    post.fullImageUrl = this.createImageUrl(post.imageUrl);
                    console.log(`🖼️ Tạo fullImageUrl cho post ${post.id}: ${post.fullImageUrl}`);
                }

                // Xử lý multiple images nếu có
                if (post.imageUrls && Array.isArray(post.imageUrls)) {
                    post.processedImageUrls = post.imageUrls.map(imgUrl => this.createImageUrl(imgUrl));
                    console.log(`🖼️ Tạo ${post.processedImageUrls.length} processedImageUrls cho post ${post.id}`);
                }

                // Xử lý PostImage entities nếu có
                if (post.images && Array.isArray(post.images)) {
                    post.processedImages = post.images.map(img => ({
                        ...img,
                        fullUrl: this.createImageUrl(img.imageUrl || img.url)
                    }));
                    console.log(`🖼️ Tạo ${post.processedImages.length} processedImages cho post ${post.id}`);
                }

                return post;
            } catch (error) {
                console.error(`❌ Lỗi xử lý post ${index + 1}:`, error);
                return post; // Trả về post gốc nếu có lỗi
            }
        });
    }

// Thêm hàm để tạo URL hình ảnh từ đường dẫn
    createImageUrl(path) {
        if (!path) return null;

        try {
            // Loại bỏ dấu / ở đầu nếu có
            const cleanPath = path.replace(/^\//, '');

            // Tạo URL hoàn chỉnh dựa trên cấu hình API
            const baseUrl = this.api.defaults.baseURL || BASE_URL;
            const fullUrl = `${baseUrl}/files/image?bucketName=thanh&path=${encodeURIComponent(cleanPath)}`;

            return fullUrl;
        } catch (error) {
            console.error('Lỗi khi tạo URL hình ảnh:', error);
            return null;
        }
    }

    // Thích/bỏ thích bài đăng
    async toggleLike(postId) {
        try {
            const response = await this.api.post(`/posts/${postId}/like`);
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }
    async fetchUserPosts(pageNumber = 0, limit = 10, shouldRefresh = false) {
        try {
            console.log(`Đang tải bài đăng: trang ${pageNumber}, giới hạn ${limit}`);

            const response = await this.api.get('/posts/me', {
                params: {
                    page: pageNumber,
                    limit: limit,
                    order: 'desc'
                }
            });

            // Log toàn bộ response để kiểm tra
            console.log('Response từ fetchUserPosts:', JSON.stringify(response.data, null, 2));

            // Trả về object chứa thông tin phân trang và danh sách bài đăng
            return {
                posts: response.data.content || [],
                isLastPage: response.data.last,
                totalElements: response.data.totalElements,
                currentPage: response.data.number
            };
        } catch (error) {
            console.error('Lỗi khi lấy bài đăng của người dùng:', error);

            // Nếu có response từ server, log chi tiết lỗi
            if (error.response) {
                console.error('Chi tiết lỗi:', error.response.data);
            }

            // Ném lỗi để component có thể xử lý
            throw error;
        }
    }
}

export default  new CreatePostService();
