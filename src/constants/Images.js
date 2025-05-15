// constants/Images.js
// Các hình ảnh mặc định và hằng số liên quan đến hình ảnh

// Ảnh đại diện mặc định
export const DEFAULT_PROFILE_IMAGE = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

// Ảnh bìa mặc định
export const DEFAULT_COVER_IMAGE = 'https://via.placeholder.com/800x200?text=Cover+Image';

// Kích thước mặc định của ảnh đại diện
export const PROFILE_IMAGE_SIZE = {
  SMALL: 40,
  MEDIUM: 80,
  LARGE: 120
};

// Kích thước mặc định của ảnh bìa
export const COVER_IMAGE_SIZE = {
  HEIGHT: 200
};

// Tỉ lệ ảnh khi chỉnh sửa
export const ASPECT_RATIO = {
  PROFILE: [1, 1], // Hình vuông cho ảnh đại diện
  COVER: [16, 9]   // Tỉ lệ 16:9 cho ảnh bìa
};

// Giới hạn kích thước tải lên
export const UPLOAD_LIMITS = {
  MAX_SIZE_MB: 5 // 5MB
};

export default {
  DEFAULT_PROFILE_IMAGE,
  DEFAULT_COVER_IMAGE,
  PROFILE_IMAGE_SIZE,
  COVER_IMAGE_SIZE,
  ASPECT_RATIO,
  UPLOAD_LIMITS
};
