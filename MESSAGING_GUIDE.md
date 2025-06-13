# Hướng dẫn sử dụng hệ thống Messaging

## Tổng quan

Hệ thống messaging đã được cải thiện với các tính năng mới:
- **NewMessagesScreen**: Hiển thị danh sách cuộc trò chuyện và bạn bè
- **FriendSearchScreen**: Tìm kiếm và kết bạn với người dùng mới
- **NewChatScreen**: Màn hình chat với tin nhắn real-time

## Các màn hình chính

### 1. NewMessagesScreen

Màn hình chính để quản lý tin nhắn với 2 tab:

#### Tab "Trò chuyện"
- Hiển thị danh sách cuộc trò chuyện đã có
- Hiển thị tin nhắn cuối cùng và thời gian
- Badge số tin nhắn chưa đọc
- Chỉ báo trạng thái online của bạn bè
- Tìm kiếm trong danh sách cuộc trò chuyện

#### Tab "Bạn bè"
- Hiển thị danh sách bạn bè
- Trạng thái online/offline
- Nút "Tin nhắn" để bắt đầu cuộc trò chuyện mới
- Tìm kiếm trong danh sách bạn bè

**Cách sử dụng:**
```javascript
// Navigation
navigation.navigate('NewMessagesScreen', {
    currentUser: userData
});
```

### 2. FriendSearchScreen

Màn hình tìm kiếm và kết bạn với người dùng mới.

**Tính năng:**
- Tìm kiếm theo tên hoặc email (debounce 500ms)
- Hiển thị trạng thái kết bạn (bạn bè, đã gửi, chờ chấp nhận, etc.)
- Gửi lời mời kết bạn
- Xem profile người dùng

**Các trạng thái kết bạn:**
- `NOT_FRIEND`: Hiển thị nút "Kết bạn"
- `PENDING_SENT`: Hiển thị "Đã gửi"
- `PENDING_RECEIVED`: Hiển thị nút "Chấp nhận"
- `ACCEPTED`: Hiển thị "Bạn bè"
- `BLOCKED`: Hiển thị "Đã chặn"

**Cách sử dụng:**
```javascript
// Navigation
navigation.navigate('FriendSearchScreen');
```

### 3. NewChatScreen

Màn hình chat với tin nhắn real-time.

**Tính năng:**
- Gửi/nhận tin nhắn real-time qua WebSocket
- Hiển thị trạng thái typing
- Scroll to bottom button
- Đánh dấu tin nhắn đã đọc
- Load more messages (pagination)

**Cách sử dụng:**
```javascript
// Navigation từ NewMessagesScreen
navigation.navigate('NewChatScreen', {
    user: friendData, // Thông tin người bạn
    currentUser: currentUserData,
    conversationId: conversationId || null // null cho cuộc trò chuyện mới
});
```

## Integration với Navigation

### Stack Navigator Setup

```javascript
// Trong App.js hoặc navigation stack
import NewMessagesScreen from './src/screens/Messages/NewMessagesScreen';
import FriendSearchScreen from './src/screens/Friend/FriendSearchScreen';
import NewChatScreen from './src/screens/Messages/NewChatScreen';

const MessagesStack = createStackNavigator();

function MessagesStackScreen() {
    return (
        <MessagesStack.Navigator screenOptions={{ headerShown: false }}>
            <MessagesStack.Screen 
                name="NewMessagesScreen" 
                component={NewMessagesScreen} 
            />
            <MessagesStack.Screen 
                name="FriendSearchScreen" 
                component={FriendSearchScreen} 
            />
            <MessagesStack.Screen 
                name="NewChatScreen" 
                component={NewChatScreen} 
            />
        </MessagesStack.Navigator>
    );
}
```

### Tab Navigator Integration

```javascript
// Trong main tab navigator
<Tab.Screen 
    name="Messages" 
    component={MessagesStackScreen}
    options={{
        tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
        ),
        title: 'Tin nhắn'
    }}
/>
```

## Services cần thiết

### 1. WebSocketService
- Kết nối WebSocket cho tin nhắn real-time
- Xử lý các event: tin nhắn mới, typing, online status
- Auto-reconnect khi mất kết nối

### 2. MessagesService
- Lấy danh sách cuộc trò chuyện
- Gửi tin nhắn
- Đánh dấu đã đọc
- Pagination cho tin nhắn

### 3. FriendService
- Lấy danh sách bạn bè
- Gửi lời mời kết bạn
- Lấy trạng thái kết bạn batch
- Chấp nhận/từ chối lời mời

### 4. UserProfileService
- Tìm kiếm người dùng
- Lấy thông tin profile

## Cấu trúc dữ liệu

### CurrentUser
```javascript
{
    id: number,
    fullName: string,
    email: string,
    profilePictureUrl?: string
}
```

### Conversation
```javascript
{
    id: string,
    otherUser: {
        id: number,
        fullName: string,
        username: string,
        avatar?: string
    },
    lastMessage: {
        id: string,
        content: string,
        senderId: number,
        receiverId: number,
        timestamp: string,
        read: boolean
    },
    unreadCount: number,
    updatedAt: string
}
```

### Friend
```javascript
{
    id: number,
    sender: User,
    receiver: User,
    status: 'ACCEPTED' | 'PENDING' | 'BLOCKED'
}
```

### SearchUser
```javascript
{
    id: number,
    fullName: string,
    email: string,
    profilePictureUrl?: string,
    mutualFriendsCount?: number
}
```

## Backend Requirements

### WebSocket Endpoints
- `/app/send` - Gửi tin nhắn
- `/app/get-messages` - Lấy tin nhắn (có hỗ trợ pagination)
- `/app/get-conversations` - Lấy danh sách cuộc trò chuyện
- `/app/mark-read` - Đánh dấu đã đọc
- `/app/typing` - Thông báo đang gõ

### REST API Endpoints
- `GET /api/v1/users/search` - Tìm kiếm người dùng
- `GET /api/v1/connections/friends` - Lấy danh sách bạn bè
- `POST /api/v1/connections/send-request/{userId}` - Gửi lời mời kết bạn
- `GET /api/v1/connections/batch-status` - Lấy trạng thái kết bạn batch

## Troubleshooting

### 1. WebSocket không kết nối được
- Kiểm tra URL WebSocket trong `WebSocketService.js`
- Đảm bảo backend WebSocket server đang chạy
- Kiểm tra token authentication

### 2. Không nhận được tin nhắn real-time
- Kiểm tra WebSocket connection status
- Verify subscription channels
- Kiểm tra logic `canSendMessageToUser` trong backend

### 3. Danh sách bạn bè không load
- Kiểm tra API endpoint `/api/v1/connections/friends`
- Verify token authentication
- Kiểm tra format response từ backend

### 4. Tìm kiếm không hoạt động
- Kiểm tra API endpoint `/api/v1/users/search`
- Verify query parameters
- Kiểm tra pagination trong response

## Performance Tips

### 1. WebSocket Connection
- Implement connection pooling
- Auto-reconnect với exponential backoff
- Heartbeat để maintain connection

### 2. Memory Management
- Cleanup listeners khi unmount component
- Limit số tin nhắn trong memory
- Implement virtual scrolling cho danh sách dài

### 3. Search Optimization
- Debounce search input (500ms)
- Cache search results
- Implement search history

### 4. Image Loading
- Lazy loading cho avatars
- Cache images với Expo Image
- Placeholder images khi loading

## Error Handling

### 1. Network Errors
```javascript
try {
    const response = await api.call();
    // Handle success
} catch (error) {
    if (error.code === 'NETWORK_ERROR') {
        // Show retry option
    } else if (error.code === 'AUTH_ERROR') {
        // Redirect to login
    } else {
        // Show generic error
    }
}
```

### 2. WebSocket Errors
```javascript
webSocketService.on('error', (error) => {
    console.error('WebSocket error:', error);
    // Show connection status indicator
    // Attempt reconnection
});
```

### 3. Validation Errors
- Client-side validation trước khi gửi request
- Server-side validation errors handling
- User-friendly error messages

## Testing

### 1. Unit Tests
- Test services methods
- Mock WebSocket connections
- Test utility functions

### 2. Integration Tests
- Test navigation flow
- Test WebSocket message flow
- Test friendship flow

### 3. E2E Tests
- Test complete messaging flow
- Test friend search and add flow
- Test real-time messaging

## Migration từ version cũ

### 1. Update Navigation
```javascript
// Old
navigation.navigate('ChatScreen', { user });

// New
navigation.navigate('NewChatScreen', { 
    user, 
    currentUser, 
    conversationId 
});
```

### 2. Update Service Calls
```javascript
// Old
await messagesService.getMessages(userId1, userId2);

// New
await messagesService.getMessagesBetweenUsers(userId1, userId2, {
    enablePagination: true,
    page: 0,
    size: 50
});
```

### 3. Update Event Listeners
```javascript
// Old
webSocketService.onMessage((message) => {
    // Handle message
});

// New
messagesService.on('newMessage', (message) => {
    // Handle message
});
``` 