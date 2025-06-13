# 🚨 Debug Guide: mark-all-read Loop Issue

## ❌ **Problem:**
`/app/mark-all-read` endpoint được gọi lặp lại rất nhiều lần, có thể do:
1. useEffect dependency loop
2. WebSocket listener bị register nhiều lần
3. Component re-render liên tục

## ✅ **Đã sửa:**

### **1. Removed from useEffect dependency array:**
```javascript
// TRƯỚC (GAY LOOP):
useEffect(() => {
    // ... setup chat
    markAllMessagesAsRead(); // ← Gọi function trong dependency
}, [fetchMessages, markAllMessagesAsRead, resetTyping]); // ← markAllMessagesAsRead ở đây

// SAU (FIXED):
useEffect(() => {
    // ... setup chat
    // Direct call to service, không qua function
    await messagesService.markAllMessagesAsRead(currentUser.id, user.id);
}, [fetchMessages, resetTyping]); // ← Xóa markAllMessagesAsRead
```

### **2. Direct service call thay vì hook:**
```javascript
// TRƯỚC:
const { markAllMessagesAsRead } = useMessageHandlers(...);
markAllMessagesAsRead(); // ← Hook với dependencies

// SAU:  
import messagesService from '../../services/messagesService';
await messagesService.markAllMessagesAsRead(currentUser.id, user.id); // ← Direct call
```

### **3. Only call once on mount:**
```javascript
// Chỉ gọi 1 lần khi setup chat, không gọi lại
if (currentUser?.id && user?.id) {
    console.log('✅ Marking messages as read on chat setup...');
    try {
        await messagesService.markAllMessagesAsRead(currentUser.id, user.id);
        console.log('✅ Messages marked as read successfully');
    } catch (error) {
        console.error('❌ Error marking messages as read:', error);
    }
}
```

## 🔍 **Monitor cho hiệu quả:**

### **Console logs sẽ hiện:**
```
🚀 Setting up chat...
✅ Marking messages as read on chat setup...
✅ Messages marked as read successfully  
✅ Chat setup complete
```

**Chỉ thấy 1 lần, không loop!**

### **Backend logs sẽ giảm:**
- Trước: `/app/mark-all-read` được gọi liên tục
- Sau: `/app/mark-all-read` chỉ gọi 1 lần khi mở chat

### **Network tab:**
- Kiểm tra Chrome DevTools → Network
- Chỉ thấy 1 request `/app/mark-all-read` khi mở chat

## 🎯 **Test scenarios:**

1. **Mở chat → Chỉ 1 call**
2. **Send message → Không gọi mark-all-read**  
3. **Receive message → Không gọi mark-all-read**
4. **Close/reopen chat → Chỉ 1 call mới**

## 🚨 **Nếu vẫn loop:**

### **Check WebSocket Service:**
```javascript
// Trong WebSocketService.js
// Đảm bảo không có listener nào tự động gọi markAllMessagesAsRead
```

### **Check messagesService:**
```javascript
// Trong messagesService.js  
// Kiểm tra method markAllMessagesAsRead không gọi chính nó
```

### **Check useMessageManagement:**
```javascript
// Đảm bảo không có useEffect nào khác gọi mark-all-read
```

---

## ✅ **Expected Result:**
- `/app/mark-all-read` chỉ gọi 1 lần khi mở chat
- Không có loop requests
- Chat performance tốt hơn
- Backend server không bị spam requests

**Restart app và test thôi!** 🚀 