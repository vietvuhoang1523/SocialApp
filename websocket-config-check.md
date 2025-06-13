# ✅ Kiểm tra cấu hình WebSocket (Backend vs Frontend)

## 📊 **Tóm tắt tình trạng:**
- **Backend**: ✅ Config hoàn chỉnh và đúng
- **Frontend**: ✅ Config hoàn chỉnh và đúng  
- **Đồng bộ**: ✅ BE và FE đã khớp nhau về cấu hình

## 🔧 **Backend Configuration (CORRECT)**

### WebSocket Config
```yaml
# application.yml - ✅ ĐÚNG
server:
  port: 8082
  address: 192.168.0.102

app:
  websocket:
    enabled: true
    allowed-origins: "*"
    connection:
      max-connections: 1000
      max-connections-per-ip: 100
    heartbeat:
      client: 10000  # 10 giây
      server: 10000  # 10 giây
```

### Endpoints WebSocket 
```java
// WebSocketMessageController.java - ✅ ĐÚNG
@MessageMapping("/send")                    // Client gửi: /app/send
@MessageMapping("/get-messages")            // Client gửi: /app/get-messages  
@MessageMapping("/get-conversations")       // Client gửi: /app/get-conversations
@MessageMapping("/mark-read")              // Client gửi: /app/mark-read
```

### WebSocket Server Endpoint
```java
// WebSocketConfig.java - ✅ ĐÚNG
registry.addEndpoint("/ws")                 // Endpoint: http://192.168.0.102:8082/ws
    .setAllowedOriginPatterns("*")
    .withSockJS();
```

### Authentication
```java
// ✅ ĐÚNG - Sử dụng JWT Bearer token trong header
connectHeaders = {
    'Authorization': 'Bearer <jwt-token>'
}
```

## 🔧 **Frontend Configuration (CORRECT)**

### WebSocket Service Config
```javascript
// WebSocketService.js - ✅ ĐÚNG
this.config = {
    serverUrl: 'http://192.168.0.102:8082/ws',  // ✅ Khớp backend
    heartbeatIncoming: 10000,                    // ✅ Khớp backend: 10s
    heartbeatOutgoing: 10000,                    // ✅ Khớp backend: 10s
    connectionTimeout: 30000
};
```

### Subscription Paths
```javascript
// ✅ ĐÚNG - Subscribe các queue nhận data từ backend
/user/${userEmail}/queue/messages           // Nhận tin nhắn mới
/user/${userEmail}/queue/messages-history   // Nhận lịch sử tin nhắn
/user/${userEmail}/queue/conversations      // Nhận danh sách cuộc trò chuyện  
/user/${userEmail}/queue/read-success       // Xác nhận đánh dấu đã đọc
/user/${userEmail}/queue/typing             // Thông báo đang gõ
/user/${userEmail}/queue/unread-count       // Số tin nhắn chưa đọc
```

### Sending Messages
```javascript
// ✅ ĐÚNG - Gửi message đến backend endpoints
this.client.send('/app/send', {}, JSON.stringify(messageData));
this.client.send('/app/get-messages', {}, JSON.stringify(queryParams));
this.client.send('/app/get-conversations', {}, '{}');
this.client.send('/app/mark-read', {}, JSON.stringify({messageId}));
```

## ✅ **Những điểm đã config ĐÚNG:**

### 1. URL và Port
- **Backend**: `192.168.0.102:8082/ws` ✅
- **Frontend**: `http://192.168.0.102:8082/ws` ✅

### 2. Heartbeat
- **Backend**: client=10000, server=10000 ✅
- **Frontend**: incoming=10000, outgoing=10000 ✅

### 3. Authentication Flow
- **Backend**: Validate JWT trong WebSocketConfig ✅
- **Frontend**: Gửi `Bearer ${token}` trong connect headers ✅

### 4. Message Routing
- **Backend**: `/app/*` endpoints + `/user/{email}/queue/*` responses ✅  
- **Frontend**: Gửi đến `/app/*` + subscribe `/user/{email}/queue/*` ✅

### 5. Error Handling
- **Backend**: Try-catch với error responses ✅
- **Frontend**: Connection retry với exponential backoff ✅

## 🚨 **Những điểm cần kiểm tra khi debug:**

### 1. Network Connectivity
```bash
# Kiểm tra backend có chạy không
curl http://192.168.0.102:8082/health

# Kiểm tra WebSocket endpoint có accessible không  
curl http://192.168.0.102:8082/ws
```

### 2. JWT Token
```javascript
// Frontend - Kiểm tra token có hợp lệ không
const token = await AsyncStorage.getItem('accessToken');
console.log('Token exists:', !!token);
console.log('Token format:', token?.startsWith('eyJ') ? 'JWT' : 'Invalid');
```

### 3. Backend Logs
```bash
# Xem logs backend khi frontend connect
tail -f logs/application.log | grep WebSocket
```

### 4. Frontend Debug
```javascript
// Bật debug mode
this.client.debug = (str) => {
    console.log('STOMP Debug:', str);
};
```

## 📱 **Test Connection Flow:**

### 1. Backend Ready Check
```bash
curl -X GET http://192.168.0.102:8082/ws
# Expected: WebSocket handshake or upgrade response
```

### 2. Frontend Connection Test  
```javascript
// Trong app, test connect
await webSocketService.connect();
console.log('Connected:', webSocketService.isConnected());
```

### 3. Message Send Test
```javascript
// Test gửi tin nhắn
await webSocketService.sendMessage({
    receiverId: 2,
    content: "Test message",
    messageType: "TEXT"
});
```

## 🏆 **Kết luận:**
Config WebSocket **ĐÃ ĐÚNG** cả Backend và Frontend. Các endpoint, authentication, heartbeat, và routing đều đã được config chính xác và đồng bộ với nhau.

Nếu vẫn gặp lỗi kết nối, cần kiểm tra:
1. Backend server có đang chạy không
2. Network có accessible không  
3. JWT token có hợp lệ không
4. Firewall có block port 8082 không 