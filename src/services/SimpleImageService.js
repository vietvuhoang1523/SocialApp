// ImageService.js
// Dịch vụ xử lý URL hình ảnh cho toàn bộ ứng dụng

// Định nghĩa constants
const API_BASE_URL = 'http://172.20.10.18:8082';
const IMAGE_API_PATH = '/api/files/image?bucketName=thanh&path=';

/**
 * Tạo URL đầy đủ cho hình ảnh từ đường dẫn tương đối
 * @param {string} relativePath - Đường dẫn tương đối của hình ảnh (không bao gồm domain và API path)
 * @returns {string|null} URL đầy đủ của hình ảnh hoặc null nếu không có đường dẫn
 */
const getFullImageUrl = (relativePath) => {
    if (!relativePath) return null;
    return `${API_BASE_URL}${IMAGE_API_PATH}${relativePath}`;
};

/**
 * Tạo source cho FastImage/Image components từ đường dẫn tương đối
 * @param {string} relativePath - Đường dẫn tương đối của hình ảnh
 * @returns {object|null} Object source cho component Image/FastImage hoặc null
 */
const getImageSource = (relativePath) => {
    const fullUrl = getFullImageUrl(relativePath);
    return fullUrl ? { uri: fullUrl } : null;
};

/**
 * Tạo source cho avatar từ đường dẫn tương đối hoặc trả về avatar mặc định
 * @param {string} relativePath - Đường dẫn tương đối của avatar
 * @param {object} defaultAvatar - Resource cho avatar mặc định (require('path/to/default.png'))
 * @returns {object} Object source cho component Image/FastImage
 */
const getAvatarSource = (relativePath, defaultAvatar = require('../assets/default-avatar.png')) => {
    const fullUrl = getFullImageUrl(relativePath);
    return fullUrl ? { uri: fullUrl } : defaultAvatar;
};

/**
 * Tạo source cho ảnh bìa từ đường dẫn tương đối hoặc trả về ảnh bìa mặc định
 * @param {string} relativePath - Đường dẫn tương đối của ảnh bìa
 * @param {object} defaultCover - Resource cho ảnh bìa mặc định
 * @returns {object} Object source cho component Image/FastImage
 */
const getCoverImageSource = (relativePath, defaultCover = require('../assets/default-avatar.png')) => {
    const fullUrl = getFullImageUrl(relativePath);
    return fullUrl ? { uri: fullUrl } : defaultCover;
};

/**
 * Tạo source cho hình ảnh bài đăng từ đường dẫn tương đối
 * @param {string} relativePath - Đường dẫn tương đối của hình ảnh bài đăng
 * @returns {object|null} Object source cho component Image/FastImage hoặc null nếu không có
 */
const getPostImageSource = (relativePath) => {
    return getImageSource(relativePath);
};

export default {
    getFullImageUrl,
    getImageSource,
    getAvatarSource,
    getCoverImageSource,
    getPostImageSource,
    API_BASE_URL,
    IMAGE_API_PATH
};