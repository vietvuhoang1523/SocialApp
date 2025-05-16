// SimpleImageService.js
const API_URL = 'http://192.168.100.193:8082';

export const createImageUrl = (path) => {
    if (!path) {
        console.log('DEBUG: Không có path');
        return null;
    }

    try {
        // Kiểm tra nếu path đã là URL đầy đủ
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }

        // Loại bỏ tiền tố nếu có để lấy UUID file
        let cleanPath = path;
        if (path.startsWith('thanh/posts/')) {
            cleanPath = path.substring('thanh/posts/'.length);
        } else if (path.startsWith('/posts/')) {
            cleanPath = path.substring('/posts/'.length);
        } else if (path.startsWith('/')) {
            cleanPath = path.substring(1);
        }

        // Tạo URL hoàn chỉnh với endpoint image
        const fullUrl = `${API_URL}/api/files/view?bucketName=thanh&path=posts/${cleanPath}`;
        console.log('DEBUG - Final URL:', fullUrl);

        return fullUrl;
    } catch (error) {
        console.log('ERROR - Lỗi khi tạo URL:', error);
        return null;
    }
};