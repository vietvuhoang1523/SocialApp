import { BASE_URL } from './api';

class ImageService {
    /**
     * Tạo URL để hiển thị hình ảnh từ server
     * @param {string} bucketName - Tên bucket lưu trữ
     * @param {string} path - Đường dẫn file trong bucket
     * @returns {string} URL đầy đủ để truy cập hình ảnh
     */
    static getImageUrl(bucketName, path) {
        if (!bucketName || !path) {
            return null;
        }

        return `${BASE_URL}/v1/users/view?bucketName=${encodeURIComponent(bucketName)}&path=${encodeURIComponent(path)}`;
    }

    /**
     * Tạo một đối tượng source cho component Image của React Native
     * @param {string} bucketName - Tên bucket lưu trữ
     * @param {string} path - Đường dẫn file trong bucket
     * @param {string} defaultImage - URL hình ảnh mặc định khi không có hình ảnh
     * @returns {object} Đối tượng source cho Image component
     */
    static getImageSource(bucketName, path, defaultImage = 'https://via.placeholder.com/150') {
        const imageUrl = this.getImageUrl(bucketName, path);
        return {
            uri: imageUrl || defaultImage
        };
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
