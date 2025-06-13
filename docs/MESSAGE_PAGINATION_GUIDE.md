# Hướng dẫn sử dụng phân trang tin nhắn (Message Pagination)

## Tổng quan

Hệ thống tin nhắn đã được cập nhật để hỗ trợ phân trang, giúp tối ưu hiệu suất khi tải tin nhắn và cải thiện trải nghiệm người dùng.

## Các tính năng mới

### 1. **MessagesService với phân trang**
- `getMessagesBetweenUsersPaginated()` - Load tin nhắn với phân trang
- `loadFirstPage()`, `loadNextPage()`, `loadPreviousPage()` - Utility methods
- Tương thích ngược với code cũ

### 2. **WebSocket hỗ trợ phân trang**
- Endpoint `/app/get-messages` với parameter `enablePagination: true`
- Response format mới với thông tin pagination
- Fallback tự động về REST API nếu WebSocket fail

### 3. **React Hook: useMessagePagination**
- Hook tích hợp sẵn để quản lý phân trang trong React components
- Tự động load trang đầu tiên và listen real-time messages
- Hỗ trợ infinite scroll và page navigation

## Cách sử dụng

### A. Sử dụng MessagesService trực tiếp

```javascript
import messagesService from '../services/messagesService';

// 1. Load tin nhắn với phân trang
const result = await messagesService.getMessagesBetweenUsersPaginated(user1Id, user2Id, {
    page: 0,
    size: 20,
    sortBy: 'timestamp',
    order: 'desc'
});

console.log('Messages:', result.messages);
console.log('Pagination info:', result.pagination);

// 2. Sử dụng utility methods
const firstPage = await messagesService.loadFirstPage(user1Id, user2Id, 20);
const nextPage = await messagesService.loadNextPage(user1Id, user2Id, currentPage);

// 3. Load all messages (backward compatibility)
const allMessages = await messagesService.getMessagesBetweenUsers(user1Id, user2Id);
```

### B. Sử dụng React Hook

```javascript
import useMessagePagination from '../hooks/useMessagePagination';

function ChatComponent({ user1Id, user2Id }) {
    const {
        messages,
        pagination,
        loading,
        error,
        loadNextPage,
        hasNextPage,
        currentPage,
        totalPages,
        refresh
    } = useMessagePagination(user1Id, user2Id, 20);

    return (
        <div>
            {loading && <div>Loading...</div>}
            {error && <div>Error: {error}</div>}
            
            <div className="messages">
                {messages.map(message => (
                    <MessageItem key={message.id} message={message} />
                ))}
            </div>
            
            {hasNextPage && (
                <button onClick={loadNextPage}>
                    Load More
                </button>
            )}
            
            <div className="pagination-info">
                Page {currentPage + 1} of {totalPages}
            </div>
        </div>
    );
}
```

### C. Infinite Scroll Implementation

```javascript
import { useRef, useEffect } from 'react';
import useMessagePagination from '../hooks/useMessagePagination';

function InfiniteScrollChat({ user1Id, user2Id }) {
    const {
        messages,
        loading,
        loadNextPage,
        hasNextPage
    } = useMessagePagination(user1Id, user2Id, 20);
    
    const observerRef = useRef();

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && hasNextPage && !loading) {
                    loadNextPage();
                }
            },
            { threshold: 1.0 }
        );

        if (observerRef.current) {
            observer.observe(observerRef.current);
        }

        return () => observer.disconnect();
    }, [hasNextPage, loading, loadNextPage]);

    return (
        <div className="chat-container">
            {messages.map(message => (
                <MessageItem key={message.id} message={message} />
            ))}
            
            {hasNextPage && (
                <div ref={observerRef} className="loading-trigger">
                    {loading ? 'Loading...' : 'Scroll for more'}
                </div>
            )}
        </div>
    );
}
```

## Response Format

### Paginated Response
```javascript
{
    messages: [
        {
            id: "msg123",
            content: "Hello",
            senderId: 1,
            receiverId: 2,
            timestamp: "2024-01-01T10:00:00Z",
            read: false
        },
        // ... more messages
    ],
    pagination: {
        currentPage: 0,
        totalPages: 5,
        totalElements: 98,
        size: 20,
        hasNext: true,
        hasPrevious: false,
        first: true,
        last: false
    }
}
```

### Non-paginated Response (Backward Compatibility)
```javascript
[
    {
        id: "msg123",
        content: "Hello",
        // ... message fields
    },
    // ... more messages
]
```

## Tham số Configuration

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 0 | Số trang (bắt đầu từ 0) |
| `size` | number | 20 | Số tin nhắn mỗi trang (1-100) |
| `sortBy` | string | 'timestamp' | Trường sắp xếp |
| `order` | string | 'desc' | Thứ tự: 'asc' hoặc 'desc' |

## WebSocket Events

### Gửi request
```javascript
// Với phân trang
stompClient.send("/app/get-messages", {}, JSON.stringify({
    user1Id: 123,
    user2Id: 456,
    enablePagination: true,
    page: 0,
    size: 20
}));

// Không phân trang (backward compatibility)
stompClient.send("/app/get-messages", {}, JSON.stringify({
    user1Id: 123,
    user2Id: 456
}));
```

### Nhận response
```javascript
stompClient.subscribe("/user/queue/messages-history", function(message) {
    const response = JSON.parse(message.body);
    
    if (response.pagination) {
        // Paginated response
        console.log('Messages:', response.messages);
        console.log('Pagination:', response.pagination);
    } else {
        // Array of messages (backward compatibility)
        console.log('All messages:', response);
    }
});
```

## Performance Tips

1. **Sử dụng page size phù hợp**: 20-50 messages mỗi trang
2. **Cache messages**: Hook tự động cache messages đã load
3. **Infinite scroll**: Tốt cho mobile experience
4. **Page navigation**: Tốt cho desktop với nhiều tin nhắn

## Migration từ code cũ

### Before
```javascript
const messages = await messagesService.getMessagesBetweenUsers(user1Id, user2Id);
```

### After
```javascript
// Option 1: Keep old behavior
const messages = await messagesService.getMessagesBetweenUsers(user1Id, user2Id);

// Option 2: Use pagination
const result = await messagesService.getMessagesBetweenUsersPaginated(user1Id, user2Id);
const messages = result.messages;

// Option 3: Use React Hook
const { messages } = useMessagePagination(user1Id, user2Id);
```

## Troubleshooting

### WebSocket connection issues
- Service tự động fallback về REST API
- Check console logs để debug

### Performance issues
- Giảm page size nếu load chậm
- Tăng page size nếu có quá nhiều requests

### Memory issues
- Hook tự động manage memory với Map cache
- Clear cache khi navigate away khỏi chat

## Browser Support

- Chrome 80+
- Firefox 78+
- Safari 13+
- Edge 80+ 