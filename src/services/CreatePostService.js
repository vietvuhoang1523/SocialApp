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

    // Tạo bài đăng mới
    async createPost(postData) {
        try {
            // Log request
            console.log('Đang gửi request tạo bài đăng với dữ liệu:', postData);

            // Tạo FormData để upload ảnh và dữ liệu
            const formData = new FormData();

            // Thêm các trường từ postData
            if (postData.content) {
                formData.append('content', postData.content);
            }

            // Thêm ảnh nếu có
            if (postData.imageFile) {
                console.log('Thêm file:', postData.imageFile);
                // Đảm bảo đúng cấu trúc cho React Native FormData
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

            console.log('FormData được tạo:', JSON.stringify(formData));

            // Log URL đầy đủ
            console.log('URL request:', this.api.defaults.baseURL + '/posts');

            // Mở rộng timeout cho upload
            const response = await this.api.post('/posts', formData, {
                headers: {
                    ...this.getHeaders(true),
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 60000 // Tăng timeout lên 60 giây
            });

            console.log('Response từ createPost:', response.data);
            return response.data;
        } catch (error) {
            console.error('Lỗi khi tạo bài đăng:', error);
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
            this.handleError(error);
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

    // Trong CreatePostService.js
    // Sửa đổi hàm checkPostOwnership trong CreatePostService.js
    async checkPostOwnership(postId) {
        try {
            console.log('🔍 Bắt đầu kiểm tra quyền sở hữu bài viết:', postId);

            // Kiểm tra postId có hợp lệ không
            if (!postId) {
                console.log('❌ PostId không hợp lệ');
                return false;
            }

            // Lấy token từ AsyncStorage
            const token = await AsyncStorage.getItem('accessToken');
            if (!token) {
                console.log('❌ Không có token');
                return false;
            }

            // Tạo các promise để thực hiện song song
            const promises = [];

            // Promise 1: Lấy thông tin bài viết
            const getPostPromise = this.getPostById(postId)
                .then(postData => {
                    console.log('📄 Chi tiết bài viết:', JSON.stringify(postData, null, 2));
                    return postData;
                })
                .catch(error => {
                    console.error('❌ Lỗi khi lấy chi tiết bài viết:', error);
                    throw new Error('Không thể lấy thông tin bài viết');
                });

            // Promise 2: Lấy thông tin user hiện tại
            const getUserPromise = this.api.get('/v1/users/profile')
                .then(response => {
                    if (!response?.data) {
                        throw new Error('Response không hợp lệ từ API profile');
                    }
                    console.log('👤 Thông tin người dùng hiện tại:', JSON.stringify(response.data, null, 2));
                    return response.data;
                })
                .catch(error => {
                    console.error('❌ Lỗi khi lấy thông tin người dùng:', error);
                    if (error.response) {
                        console.error('📊 Chi tiết lỗi từ server:', error.response.data);
                        console.error('📈 Status code:', error.response.status);
                    }
                    throw new Error('Không thể lấy thông tin người dùng');
                });

            // Thực hiện cả hai promises song song với timeout
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('API timeout after 8 seconds')), 8000)
            );

            const [postData, currentUser] = await Promise.race([
                Promise.all([getPostPromise, getUserPromise]),
                timeoutPromise
            ]);

            // Kiểm tra dữ liệu có hợp lệ không
            if (!postData) {
                console.log('❌ Không tìm thấy bài viết');
                return false;
            }

            if (!currentUser) {
                console.log('❌ Không tìm thấy thông tin người dùng');
                return false;
            }

            // Lấy ID với nhiều fallback options
            const currentUserId = currentUser?.id ||
                currentUser?.userId ||
                currentUser?.user_id;

            const postOwnerId = postData?.userRes?.id ||
                postData?.user?.id ||
                postData?.userId ||
                postData?.user_id ||
                postData?.authorId;

            console.log('🔄 So sánh ID:', {
                currentUserId,
                postOwnerId,
                currentUserType: typeof currentUserId,
                postOwnerType: typeof postOwnerId,
                currentUserObject: currentUser,
                postDataUserRes: postData?.userRes
            });

            // Kiểm tra cả hai ID đều tồn tại và hợp lệ
            if (!currentUserId || !postOwnerId) {
                console.log('❌ Một trong các ID không tồn tại');
                console.log('📋 Debug info:', {
                    hasCurrentUserId: !!currentUserId,
                    hasPostOwnerId: !!postOwnerId,
                    currentUserKeys: Object.keys(currentUser || {}),
                    postDataKeys: Object.keys(postData || {})
                });
                return false;
            }

            // Chuyển đổi sang string và so sánh
            const currentUserIdStr = String(currentUserId).trim();
            const postOwnerIdStr = String(postOwnerId).trim();

            const isOwner = currentUserIdStr === postOwnerIdStr;

            console.log('✅ Kết quả kiểm tra quyền:', {
                isOwner,
                currentUserIdStr,
                postOwnerIdStr,
                exactMatch: currentUserIdStr === postOwnerIdStr
            });

            return isOwner;

        } catch (error) {
            console.error('💥 Lỗi tổng quát khi kiểm tra quyền sở hữu bài viết:', error);

            // Log chi tiết các loại lỗi khác nhau
            if (error.name === 'TypeError') {
                console.error('🔧 TypeError - có thể do object undefined:', error.message);
            } else if (error.code === 'NETWORK_ERROR') {
                console.error('🌐 Network error:', error.message);
            } else if (error.response) {
                console.error('🔴 HTTP Error Response:', {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data
                });
            } else if (error.request) {
                console.error('📡 Request error - no response received:', error.request);
            }

            // Trả về false thay vì throw error để không crash app
            return false;
        }
    }

// Cập nhật phương thức getFeedPosts trong CreatePostService.js
    async getFeedPosts(page = 0, size = 10, order = 'desc') {
        try {
            console.log(`Đang gọi API lấy feed bài đăng: /posts/feed?page=${page}&size=${size}&order=${order}`);

            const response = await this.api.get(`/posts/feed`, {
                params: { page, size, order }
            });

            console.log('Response từ getFeedPosts:', response.data);

            // Chuyển đổi dữ liệu bài đăng để xử lý URL hình ảnh
            const content = this.processPostsImageUrls(response.data || []);

            // Nếu response.data là mảng, tức là nó không phải là dữ liệu phân trang
            if (Array.isArray(response.data)) {
                return {
                    content: content,
                    totalElements: content.length,
                    totalPages: 1,
                    last: true,
                    number: page,
                    size: size
                };
            }

            // Nếu response.data là đối tượng phân trang
            return {
                content: content,
                totalElements: response.data.totalElements,
                totalPages: response.data.totalPages,
                last: response.data.last,
                number: response.data.number,
                size: response.data.size
            };
        } catch (error) {
            console.error('Lỗi khi lấy feed bài đăng:', error);
            this.handleError(error);
        }
    }

// Thêm hàm mới để xử lý URL hình ảnh cho tất cả bài đăng
    processPostsImageUrls(posts) {
        // Kiểm tra nếu posts là đối tượng phân trang
        if (posts && posts.content) {
            posts = posts.content;
        }

        // Nếu posts không phải là mảng, trả về mảng rỗng
        if (!Array.isArray(posts)) {
            return [];
        }

        return posts.map(post => {
            // Tạo URL hình ảnh đầy đủ nếu có imageUrl
            if (post.imageUrl) {
                post.fullImageUrl = this.createImageUrl(post.imageUrl);
            }
            return post;
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
