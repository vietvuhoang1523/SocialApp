// utils/chatUtils.js - File mới
// Các hàm tiện ích cho việc xử lý tin nhắn và cuộc trò chuyện

/**
 * Lấy đối tác trò chuyện từ một tin nhắn
 * @param {Object} message - Tin nhắn
 * @param {number} currentUserId - ID người dùng hiện tại
 * @returns {number} - ID của đối tác trò chuyện
 */
export const getMessagePartner = (message, currentUserId) => {
    if (!message) return null;
    return message.senderId == currentUserId ? message.receiverId : message.senderId;
};

/**
 * Nhóm tin nhắn theo ngày
 * @param {Array} messages - Danh sách tin nhắn
 * @returns {Object} - Tin nhắn đã nhóm theo ngày
 */
export const groupMessagesByDate = (messages) => {
    if (!messages || !Array.isArray(messages)) return {};

    const groups = {};

    messages.forEach(message => {
        const date = new Date(message.createdAt || message.timestamp);
        const dateStr = date.toLocaleDateString('vi-VN');

        if (!groups[dateStr]) {
            groups[dateStr] = [];
        }

        groups[dateStr].push(message);
    });

    // Sắp xếp tin nhắn trong mỗi ngày theo thời gian
    for (const dateStr in groups) {
        groups[dateStr].sort((a, b) => {
            const timeA = new Date(a.createdAt || a.timestamp);
            const timeB = new Date(b.createdAt || b.timestamp);
            return timeA - timeB;
        });
    }

    return groups;
};

/**
 * Nhóm tin nhắn liên tiếp từ cùng một người gửi
 * @param {Array} messages - Danh sách tin nhắn
 * @returns {Array} - Tin nhắn đã nhóm
 */
export const groupConsecutiveMessages = (messages) => {
    if (!messages || !Array.isArray(messages)) return [];

    const groupedMessages = [];
    let currentGroup = null;

    messages.forEach(message => {
        if (!currentGroup || currentGroup.senderId !== message.senderId) {
            // Bắt đầu nhóm mới
            currentGroup = {
                senderId: message.senderId,
                messages: [message]
            };
            groupedMessages.push(currentGroup);
        } else {
            // Thêm vào nhóm hiện tại
            currentGroup.messages.push(message);
        }
    });

    return groupedMessages;
};

/**
 * Định dạng thời gian tin nhắn để hiển thị
 * @param {string|Date} dateTimeStr - Thời gian dạng chuỗi hoặc Date
 * @param {boolean} includeSeconds - Có hiển thị giây hay không
 * @returns {string} - Chuỗi thời gian đã định dạng
 */
export const formatMessageTime = (dateTimeStr, includeSeconds = false) => {
    try {
        const date = typeof dateTimeStr === 'string' ? new Date(dateTimeStr) : dateTimeStr;

        const options = {
            hour: '2-digit',
            minute: '2-digit'
        };

        if (includeSeconds) {
            options.second = '2-digit';
        }

        return date.toLocaleTimeString([], options);
    } catch (error) {
        console.error('Lỗi khi định dạng thời gian:', error);
        return '';
    }
};

/**
 * Kiểm tra xem một tin nhắn có phải là tin nhắn mới hay không
 * @param {Object} message - Tin nhắn
 * @param {string|Date} sinceTime - Thời gian bắt đầu kiểm tra
 * @returns {boolean} - Có phải tin nhắn mới hay không
 */
export const isNewMessage = (message, sinceTime) => {
    if (!message || !sinceTime) return false;

    const messageTime = new Date(message.createdAt || message.timestamp);
    const compareTime = typeof sinceTime === 'string' ? new Date(sinceTime) : sinceTime;

    return messageTime > compareTime;
};

/**
 * Tạo ID tạm thời cho tin nhắn
 * @returns {string} - ID tạm thời
 */
export const generateTempMessageId = () => {
    return `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

/**
 * Kiểm tra xem tin nhắn có phải là tin nhắn tạm thời hay không
 * @param {Object} message - Tin nhắn
 * @returns {boolean} - Có phải tin nhắn tạm thời hay không
 */
export const isTempMessage = (message) => {
    return message && message.id && typeof message.id === 'string' && message.id.startsWith('temp-');
};

/**
 * Tạo tin nhắn optimistic để hiển thị ngay
 * @param {Object} messageData - Dữ liệu tin nhắn
 * @returns {Object} - Tin nhắn tạm thời
 */
export const createOptimisticMessage = (messageData) => {
    return {
        id: generateTempMessageId(),
        senderId: messageData.senderId,
        receiverId: messageData.receiverId,
        content: messageData.content,
        createdAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        read: false,
        delivered: false,
        isSending: true,
        ...(messageData.attachmentUrl ? {
            attachmentUrl: messageData.attachmentUrl,
            attachmentType: messageData.attachmentType || 'image/jpeg'
        } : {})
    };
};

/**
 * Kiểm tra xem có nên cuộn xuống tin nhắn mới nhất không
 * @param {Array} messages - Danh sách tin nhắn
 * @param {Object} newMessage - Tin nhắn mới nhận được
 * @param {number} currentUserId - ID người dùng hiện tại
 * @param {number} scrollPosition - Vị trí cuộn hiện tại
 * @param {number} viewHeight - Chiều cao của view tin nhắn
 * @returns {boolean} - Có nên cuộn xuống hay không
 */
export const shouldAutoScrollToBottom = (messages, newMessage, currentUserId, scrollPosition, viewHeight) => {
    // Nếu là tin nhắn của người dùng hiện tại, luôn cuộn xuống
    if (newMessage.senderId == currentUserId) {
        return true;
    }

    // Nếu người dùng đang xem gần với tin nhắn cuối cùng (khoảng 200px), cuộn xuống
    const isNearBottom = scrollPosition > viewHeight - 200;

    return isNearBottom;
};

/**
 * Tạo tin nhắn mới từ dữ liệu tin nhắn và đối tượng file đính kèm
 * @param {Object} messageData - Dữ liệu tin nhắn cơ bản
 * @param {Object} attachment - Đối tượng file đính kèm (có thể null)
 * @returns {Object} - Dữ liệu tin nhắn đã được xử lý
 */
export const createMessageWithAttachment = (messageData, attachment) => {
    const message = { ...messageData };

    if (attachment) {
        message.attachmentUrl = attachment.uri;
        message.attachmentType = attachment.type || 'image/jpeg';
    }

    return message;
};

/**
 * Lấy loại file từ URL hoặc mime type
 * @param {string} url - URL của file
 * @param {string} mimeType - Mime type của file
 * @returns {string} - Loại file (image, video, audio, document, other)
 */
export const getFileType = (url, mimeType) => {
    if (!url && !mimeType) return 'other';

    // Ưu tiên kiểm tra mime type
    if (mimeType) {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('audio/')) return 'audio';
        if (mimeType.startsWith('application/pdf')) return 'pdf';
        if (mimeType.includes('word')) return 'document';
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'spreadsheet';
        if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
    }

    // Fallback: kiểm tra phần mở rộng từ URL
    if (url) {
        const extension = url.split('.').pop().toLowerCase();

        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
        const videoExtensions = ['mp4', 'webm', 'mov', 'avi', 'wmv', 'flv', 'mkv'];
        const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'm4a'];
        const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
        const spreadsheetExtensions = ['xls', 'xlsx', 'csv'];
        const presentationExtensions = ['ppt', 'pptx'];

        if (imageExtensions.includes(extension)) return 'image';
        if (videoExtensions.includes(extension)) return 'video';
        if (audioExtensions.includes(extension)) return 'audio';
        if (extension === 'pdf') return 'pdf';
        if (documentExtensions.includes(extension)) return 'document';
        if (spreadsheetExtensions.includes(extension)) return 'spreadsheet';
        if (presentationExtensions.includes(extension)) return 'presentation';
    }

    return 'other';
};

/**
 * Chuẩn hóa định dạng tin nhắn
 * @param {Object} message - Tin nhắn gốc
 * @returns {Object} - Tin nhắn đã chuẩn hóa
 */
export const normalizeMessage = (message) => {
    if (!message) return null;

    return {
        id: message.id || generateTempMessageId(),
        content: message.content || '',
        senderId: message.senderId,
        receiverId: message.receiverId,
        createdAt: message.createdAt || message.timestamp || new Date().toISOString(),
        timestamp: message.timestamp || message.createdAt || new Date().toISOString(),
        read: message.read || false,
        delivered: message.delivered || false,
        attachmentUrl: message.attachmentUrl || null,
        attachmentType: message.attachmentType || null
    };
};