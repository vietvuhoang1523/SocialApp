# Hướng dẫn Tìm kiếm và Kết bạn

## Tổng quan

Hệ thống tìm kiếm và kết bạn đã được hoàn thiện với đầy đủ các trạng thái kết bạn từ backend và hiển thị tương ứng trên Frontend.

## Các trạng thái kết bạn

### Backend (FriendshipStatus enum)
```java
public enum FriendshipStatus {
    // Trạng thái trong DB
    PENDING,     // Đang chờ xác nhận
    ACCEPTED,    // Đã chấp nhận
    BLOCKED,     // Đã chặn

    // Trạng thái bổ sung cho API response
    NOT_FRIEND,      // Chưa là bạn bè
    PENDING_SENT,    // Đã gửi lời mời kết bạn
    PENDING_RECEIVED, // Đã nhận lời mời kết bạn
    SELF            // Chính mình
}
```

### Frontend hiển thị
- **ACCEPTED**: Hiển thị "Bạn bè" (màu xanh lá với icon tick)
- **PENDING_SENT**: Hiển thị "Đã gửi" (màu xám, có thể hủy)
- **PENDING_RECEIVED**: Hiển thị "Chấp nhận" (màu xanh lá, có thể chấp nhận)
- **BLOCKED**: Hiển thị "Đã chặn" (màu xám nhạt)
- **NOT_FRIEND**: Hiển thị "Kết bạn" (màu hồng với gradient)
- **SELF**: Không hiển thị gì (ẩn item)

## Chức năng chính

### 1. Tìm kiếm người dùng
- **Endpoint**: `GET /api/v1/users/search?query={keyword}&page={page}&limit={limit}`
- **Frontend**: `UserProfileService.searchUsers()`
- **Tính năng**: 
  - Tìm theo tên hoặc email
  - Phân trang
  - Debounce 500ms
  - Loại bỏ tài khoản hiện tại khỏi kết quả

### 2. Gửi lời mời kết bạn
- **Endpoint**: `POST /api/v1/connections/send-request/{userId}`
- **Frontend**: `FriendService.sendFriendRequestById()`
- **Cập nhật UI**: Trạng thái chuyển từ "Kết bạn" → "Đã gửi"

### 3. Chấp nhận lời mời
- **Endpoint**: `PUT /api/v1/connections/accept/{friendshipId}`
- **Frontend**: `FriendService.acceptFriendRequest()`
- **Cập nhật UI**: Trạng thái chuyển từ "Chấp nhận" → "Bạn bè"

### 4. Hủy lời mời đã gửi
- **Endpoint**: `DELETE /api/v1/connections/cancel-request/{friendshipId}`
- **Frontend**: `FriendService.cancelFriendRequest()`
- **Cập nhật UI**: Trạng thái chuyển từ "Đã gửi" → "Kết bạn"

## Cách Backend xử lý

### 1. API tìm kiếm (`/api/v1/users/search`)
```java
@Override
public Page<UserProfileResponse> searchUsers(String query, Pagination pagination) {
    // Tìm kiếm người dùng
    Page<User> userPage = userRepository.searchUsers(query.trim(), currentUserId, pageRequest);
    
    // Lấy trạng thái kết bạn cho tất cả người dùng trong một lần
    Map<Long, String> friendshipStatusMap = connectionService.getBatchFriendshipStatus(currentUserId, userIds);
    
    // Áp dụng trạng thái vào kết quả
    return userPage.map(user -> {
        String statusStr = friendshipStatusMap.getOrDefault(user.getId(), "NOT_FRIEND");
        FriendshipStatus friendshipStatus = FriendshipStatus.valueOf(statusStr);
        
        UserMapper.UserProfileContext context = UserMapper.UserProfileContext.create(
            isSameUser, isFriend, friendshipStatus
        );
        
        return userMapper.toUserProfileResponse(user, context);
    });
}
```

### 2. Batch friendship status checking
```java
@Override
public Map<Long, String> getBatchFriendshipStatus(Long currentUserId, List<Long> targetUserIds) {
    // 1. Tìm tất cả bạn bè đã chấp nhận
    // 2. Tìm tất cả yêu cầu đã gửi
    // 3. Tìm tất cả yêu cầu đã nhận
    // 4. Gán trạng thái cho các ID còn lại
}
```

## Cấu trúc dữ liệu Frontend

### UserProfileResponse
```javascript
{
    id: Long,
    fullName: String,
    email: String,
    profilePictureUrl: String,
    isFriend: Boolean,
    friendshipStatus: "ACCEPTED" | "PENDING_SENT" | "PENDING_RECEIVED" | "NOT_FRIEND" | "SELF",
    friendshipId: Long, // ID để thực hiện các thao tác
    // ... other fields
}
```

## File liên quan

### Backend
- `ConnectionController.java` - API endpoints
- `UserController.java` - Search API
- `ConnectionServiceImpl.java` - Business logic
- `UserServiceImpl.java` - Search implementation
- `FriendshipStatus.java` - Enum trạng thái

### Frontend
- `FriendSearchScreen.js` - UI tìm kiếm chính
- `FriendService.js` - API service
- `UserProfileService.js` - User search service
- `UserSearchItem.js` - Component hiển thị người dùng

## Gợi ý cải tiến

### 1. Cache trạng thái kết bạn
- Lưu trạng thái vào AsyncStorage
- Invalidate khi có thay đổi

### 2. Real-time updates
- Sử dụng WebSocket để cập nhật trạng thái real-time
- Subscribe channel `/topic/friendship-updates`

### 3. Pagination optimization
- Implement infinite scroll
- Pre-load next page

### 4. Search optimization
- Search history
- Popular searches
- Autocomplete

## Troubleshooting

### Lỗi thường gặp
1. **"Cannot read property 'friendshipStatus'"**: Kiểm tra backend có trả về đúng format không
2. **Button không hoạt động**: Kiểm tra `friendshipId` có được trả về không
3. **Trạng thái không cập nhật**: Kiểm tra logic update state trong component

### Debug tips
- Check console logs trong `FriendService`
- Verify API response format
- Test với nhiều trạng thái khác nhau 