# Fix cho vấn đề tin nhắn WebSocket không hiển thị ngay lập tức

## Vấn đề ban đầu

Khi user gửi tin nhắn qua WebSocket:
1. ✅ Tin nhắn được gửi thành công
2. ❌ Tin nhắn không hiển thị ngay lập tức trong chat
3. ❌ Phải refresh/reload mới thấy tin nhắn

## Nguyên nhân

### 1. Logic lọc tin nhắn sai trong `useChatWebSocket.js`

**Trước khi sửa:**
```javascript
// Chỉ nhận tin nhắn từ người khác, bỏ qua tin nhắn của chính mình
if (message.senderId === receiverId) {
    // Chỉ pass tin nhắn từ người nhận
    handleNewWebSocketMessage(message);
} else {
    // Bỏ qua tin nhắn từ người gửi (chính mình)
    console.log('📤 Message from current user, skipping to avoid duplicate');
}
```

**Vấn đề:** Khi user A gửi tin nhắn cho user B, backend gửi tin nhắn về cho CẢ A và B qua WebSocket. Nhưng logic cũ chỉ cho phép A nhận tin nhắn từ B, không nhận tin nhắn của chính A.

**Sau khi sửa:**
```javascript
// Nhận TẤT CẢ tin nhắn liên quan đến cuộc trò chuyện
if (isRelevantMessage) {
    handleNewWebSocketMessage(message); // Để hook quản lý message xử lý deduplication
}
```

### 2. Logic xử lý tin nhắn tạm thời trong `useMessageHandlers.js`

**Trước khi sửa:**
```javascript
// Khi gửi thành công nhưng không có realMessage
setMessages(prev => prev.map(msg => 
    msg.id === tempId
    ? { ...msg, isSending: false, isError: false } // Đánh dấu đã gửi
    : msg
));
```

**Vấn đề:** Tin nhắn tạm thời vẫn tồn tại, khi WebSocket nhận tin nhắn thật từ backend sẽ có 2 tin nhắn trùng nhau.

**Sau khi sửa:**
```javascript
// Xóa tin nhắn tạm thời, tin nhắn thật sẽ đến qua WebSocket
setMessages(prev => prev.filter(msg => msg.id !== tempId));
```

### 3. Cải thiện deduplication trong `useMessageManagement.js`

**Thêm logic:** Khi nhận tin nhắn thật từ WebSocket, tự động loại bỏ các tin nhắn tạm thời tương tự (cùng người gửi, cùng nội dung, trong vòng 10 giây).

## Kết quả sau khi sửa

1. ✅ User gửi tin nhắn → thấy ngay lập tức
2. ✅ Không có tin nhắn trùng lặp
3. ✅ WebSocket hoạt động smooth và real-time
4. ✅ Fallback mechanism vẫn hoạt động khi WebSocket lỗi

## Flow hoạt động mới

1. **User gửi tin nhắn:**
   - Tạo tin nhắn tạm thời, hiển thị ngay
   - Gửi qua WebSocket
   - Nếu thành công: xóa tin nhắn tạm thời

2. **Backend xử lý:**
   - Lưu tin nhắn vào database
   - Gửi tin nhắn thật về cho cả người gửi và người nhận qua WebSocket

3. **Client nhận tin nhắn qua WebSocket:**
   - Kiểm tra deduplication (ID đã tồn tại chưa)
   - Loại bỏ tin nhắn tạm thời tương tự (nếu có)
   - Hiển thị tin nhắn thật

4. **Kết quả:** User thấy tin nhắn của mình ngay lập tức và không bị trùng lặp 