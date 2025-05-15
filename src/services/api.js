// api.js
import appConfig from './config';

// URL cơ sở của API từ config.js
export const BASE_URL = appConfig.extra.apiUrl;

// Cài đặt timeout mặc định cho các yêu cầu API
export const DEFAULT_TIMEOUT = 10000; // 10 giây

// Định dạng header mặc định cho các yêu cầu API
export const DEFAULT_HEADERS = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
};

// Configuration cho FormData requests
export const FORM_DATA_HEADERS = {
    'Content-Type': 'multipart/form-data',
};

// Các mã lỗi API và thông báo tương ứng
export const ERROR_MESSAGES = {
    400: 'Yêu cầu không hợp lệ.',
    401: 'Bạn cần đăng nhập để tiếp tục.',
    403: 'Bạn không có quyền truy cập vào tính năng này.',
    404: 'Không tìm thấy tài nguyên yêu cầu.',
    500: 'Đã xảy ra lỗi từ máy chủ. Vui lòng thử lại sau.',
    502: 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.',
    default: 'Đã xảy ra lỗi. Vui lòng thử lại sau.'
};
