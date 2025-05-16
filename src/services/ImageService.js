import appConfig from './config';

const API_BASE_URL = appConfig.extra.apiUrl.replace(/\/api$/, '');
// Lấy URL trực tiếp từ config

class ImageService {
    // Bucket name mặc định
    static DEFAULT_BUCKET = 'thanh';

    /**
     * Tạo URL để hiển thị hình ảnh từ server
     * @param {string} path - Đường dẫn file trong bucket
     * @param {string} bucketName - Tên bucket lưu trữ (mặc định là 'thanh')
     * @returns {string} URL đầy đủ để truy cập hình ảnh
     */
    static getImageUrl(path, bucketName = this.DEFAULT_BUCKET) {
        try {
            console.log('getImageUrl called with:', path, bucketName);

            if (!path) {
                console.log('Path is empty');
                return null;
            }

            // Xử lý path để loại bỏ dấu / ở đầu nếu có
            let cleanPath = path;
            if (path.startsWith('/')) {
                cleanPath = path.substring(1);
            }

            // URL đúng format: http://192.168.1.73:8082/api/files/view?bucketName=thanh&path=posts/xyz.png
            const url = `${API_BASE_URL}/api/files/view?bucketName=${encodeURIComponent(bucketName)}&path=${encodeURIComponent(cleanPath)}`;
            console.log('Generated URL in service:', url);
            return url;
        } catch (error) {
            console.error('Error in getImageUrl:', error);
            return null;
        }
    }

    /**
     * Tạo một đối tượng source cho component Image của React Native
     * @param {string} path - Đường dẫn file trong bucket
     * @param {string} defaultImage - URL hình ảnh mặc định khi không có hình ảnh
     * @param {string} bucketName - Tên bucket lưu trữ (mặc định là 'thanh')
     * @returns {object} Đối tượng source cho Image component
     */
    static getImageSource(path, defaultImage = 'https://via.placeholder.com/150', bucketName = this.DEFAULT_BUCKET) {
        try {
            const imageUrl = this.getImageUrl(path, bucketName);
            if (!imageUrl) {
                console.log('Using default image:', defaultImage);
                return { uri: defaultImage };
            }

            console.log('Image source created with URI:', imageUrl);
            return { uri: imageUrl };
        } catch (error) {
            console.error('Error in getImageSource:', error);
            return { uri: defaultImage };
        }
    }

    // Các phương thức khác giữ nguyên...
    static getProfileImageSource(path, defaultImage = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png') {
        return this.getImageSource(path, defaultImage);
    }

    static getPostImageSource(path, defaultImage = 'https://via.placeholder.com/600x400?text=No+Image') {
        return this.getImageSource(path, defaultImage);
    }

    /**
     * Tạo đối tượng form data cho việc tải lên hình ảnh
     * @param {object} imageFile - Đối tượng chứa thông tin file từ thư viện hình ảnh
     * @param {string} fieldName - Tên trường trong form data (mặc định là 'file')
     * @returns {FormData} Đối tượng FormData đã chuẩn bị cho việc tải lên
     */
    static createImageFormData(imageFile, fieldName = 'file') {
        const formData = new FormData();

        formData.append(fieldName, {
            uri: imageFile.uri,
            type: imageFile.type || 'image/jpeg',
            name: imageFile.fileName || `image_${Date.now()}.jpg`
        });

        return formData;
    }

    /**
     * Chuyển đổi kích thước hình ảnh để hiển thị phù hợp
     * @param {number} width - Chiều rộng ban đầu của hình ảnh
     * @param {number} height - Chiều cao ban đầu của hình ảnh
     * @param {number} maxWidth - Chiều rộng tối đa cho phép
     * @param {number} maxHeight - Chiều cao tối đa cho phép
     * @returns {object} Kích thước mới (width, height) cho hình ảnh
     */
    static getResizedDimensions(width, height, maxWidth, maxHeight) {
        if (width <= maxWidth && height <= maxHeight) {
            return { width, height };
        }

        const aspectRatio = width / height;

        if (width > height) {
            // Landscape
            return {
                width: maxWidth,
                height: Math.round(maxWidth / aspectRatio)
            };
        } else {
            // Portrait
            return {
                width: Math.round(maxHeight * aspectRatio),
                height: maxHeight
            };
        }
    }
}

export default ImageService;