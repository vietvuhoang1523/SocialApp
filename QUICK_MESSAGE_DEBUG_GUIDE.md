# Quick Message Debug Guide

## 🎯 Vấn đề: Tin nhắn không hiển thị ngay sau khi gửi

### ⚡ Quick Test để xác định vấn đề

**Bước 1: Bật Message Monitoring**
```javascript
// Trong React Native debugger console hoặc app
import webSocketMessageDebugger from './WebSocketMessageDebugger';

// Bắt đầu monitor tất cả WebSocket messages
webSocketMessageDebugger.startMonitoring();
```

**Bước 2: Gửi tin nhắn và monitor**
```javascript
// Test gửi tin nhắn và xem có nhận được không
webSocketMessageDebugger.testSendAndMonitor(2, 'Test message debug');
```

**Bước 3: Xem report**
```javascript
// Sau khi gửi tin nhắn, xem report
webSocketMessageDebugger.getReport();
```

### 🔍 Kết quả có thể và giải pháp

#### Scenario 1: ❌ Không nhận được new messages qua WebSocket
```
MESSAGE COUNTS BY TYPE:
  connectionStatus: 1
  // Không có newMessage entries
```

**💡 Giải pháp:**
- Backend không gửi message về cho người gửi
- Cần check backend logs
- Hoặc backend chỉ gửi cho người nhận

#### Scenario 2: ✅ Nhận được new messages nhưng UI không update
```
MESSAGE COUNTS BY TYPE:
  newMessage: 1
  connectionStatus: 1
```

**💡 Giải pháp:**
- WebSocket hoạt động nhưng UI logic có vấn đề
- Check logs: "📨 Relevant message, passing to handleNewWebSocketMessage"

#### Scenario 3: 🔄 Messages bị filter hoặc dedup
```
Logs hiển thị: "📨 Message not relevant to current conversation, ignoring"
```

**💡 Giải pháp:**
- User ID mapping sai
- Conversation filtering logic sai

### 🛠️ Fixes đã áp dụng

#### 1. **Keep Temporary Message Visible**
```javascript
// OLD: Remove temp message immediately
setMessages(prev => prev.filter(msg => msg.id !== tempId));

// NEW: Keep temp message until real message arrives
setMessages(prev => prev.map(msg => 
    msg.id === tempId 
        ? { ...msg, isSending: false, isError: false, isSent: true }
        : msg
));
```

#### 2. **Fallback Fetch**
```javascript
// Add fallback to fetch messages if WebSocket doesn't deliver
setTimeout(() => {
    console.log('🔄 Fetching new messages as fallback');
    fetchNewMessages?.();
}, 3000);
```

#### 3. **Better Deduplication**
```javascript
// Improved logic to replace temp messages with real messages
const isSameSender = msg.senderId === newMessage.senderId;
const hasSimilarContent = msg.content?.trim() === newMessage.content?.trim();
const isRecent = Math.abs(new Date(newMessage.timestamp) - new Date(msg.timestamp)) < 30000;
```

### 🚀 Test Steps

1. **Restart app** để apply fixes mới
2. **Open debugger console**
3. **Run debug commands:**

```javascript
// 1. Monitor WebSocket messages
import webSocketMessageDebugger from './WebSocketMessageDebugger';
webSocketMessageDebugger.startMonitoring();

// 2. Send a test message và check logs
// Gửi tin nhắn qua UI

// 3. Check logs sau 5 giây
webSocketMessageDebugger.getReport();

// 4. Nếu cần debug connection
import webSocketDebugTool from './WebSocketDebugTool';
webSocketDebugTool.debugConnectionStatus();
```

### 📊 Expected Results với fixes

**Scenario A: WebSocket gửi message về**
```
✅ Message sent successfully, keeping temp message visible
📨 [NEW MESSAGE RECEIVED] // Should appear in logs
🔄 Real message arrived, replacing temporary message
```

**Scenario B: WebSocket không gửi message về**
```
✅ Message sent successfully, keeping temp message visible
🔄 Fetching new messages as fallback // After 3 seconds
📥 Loading paginated messages // Fallback triggers
```

### 🎯 Expected User Experience

1. **User gửi tin nhắn** → Tin nhắn hiển thị ngay với status "sending"
2. **WebSocket gửi thành công** → Status chuyển thành "sent"
3. **Nếu có real message từ WebSocket** → Replace temp message
4. **Nếu không có real message** → Fallback fetch sau 3 giây

### 📞 Next Steps

Nếu vẫn có vấn đề:

1. **Share debug logs** từ `webSocketMessageDebugger.getReport()`
2. **Share backend logs** nếu có access
3. **Check network tab** để xem WebSocket traffic
4. **Verify user IDs** đang sử dụng đúng chưa

---

**Lưu ý:** Fixes đã apply vào code, restart app để test. 