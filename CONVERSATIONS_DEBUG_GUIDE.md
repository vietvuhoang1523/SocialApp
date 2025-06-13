# 🐛 Debug Guide: Conversations không hiển thị

## ❌ **Vấn đề:**
Danh sách tin nhắn (conversations) không hiển thị những người đã nhắn tin

## ✅ **Đã sửa:**

### **1. Loại bỏ sample data logic:**
```javascript
// TRƯỚC: Tạo fake data khi không có conversations
if (convs.length === 0) {
    const sampleConversations = createSampleConversations(); // ← FAKE DATA
    setConversations(sampleConversations);
}

// SAU: Hiển thị empty state thực
setConversations(normalizedConversations); // ← REAL DATA ONLY
```

### **2. Xử lý đúng format từ backend:**
```javascript
// Backend trả về: 
// {
//   conversations: [
//     {
//       id: "123", 
//       partner: { id, fullName, avatarUrl, email },
//       lastMessage: { content, senderId, timestamp },
//       unreadCount: 2
//     }
//   ],
//   count: 5,
//   status: "success"
// }

// Transform to UI format:
const normalizedConversations = conversationsData.map(conv => ({
    id: conv.id,
    otherUser: {
        id: conv.partner.id,
        fullName: conv.partner.fullName || conv.partner.email,
        username: conv.partner.email,
        avatar: conv.partner.avatarUrl
    },
    lastMessage: conv.lastMessage,
    unreadCount: conv.unreadCount || 0,
    updatedAt: conv.lastActivity
}));
```

### **3. Thêm debug logs:**
```javascript
console.log('🔍 Raw conversations response:', response);
console.log(`📊 Found ${conversationsData.length} conversations`);
console.log('📝 First conversation:', normalizedConversations[0]);
```

## 🔍 **Debug Steps:**

### **1. Kiểm tra WebSocket connection:**
```javascript
// Trong NewMessagesScreen, check logs:
console.log('🔌 WebSocket connected:', webSocketService.isConnected());

// Expected: true
```

### **2. Kiểm tra backend response:**
```javascript
// Trong loadConversations, check logs:
console.log('🔍 Raw conversations response:', response);

// Expected formats:
// - { conversations: [...], count: X }  // Wrapped format
// - [conversation1, conversation2, ...] // Array format
```

### **3. Kiểm tra data transformation:**
```javascript
console.log(`📊 Found ${conversationsData.length} conversations`);
console.log('📝 First conversation:', normalizedConversations[0]);

// Expected: Valid conversation objects with otherUser data
```

### **4. Kiểm tra backend có gửi conversations không:**
- Xem backend logs có nhận request `/app/get-conversations` không
- Xem có response gửi về `/user/{email}/queue/conversations` không

## 🎯 **Test Scenarios:**

### **Có conversations thực:**
1. Mở messages screen
2. Check console logs
3. Thấy conversations được load từ backend
4. UI hiển thị danh sách conversations thực

### **Chưa có conversations:**
1. Mở messages screen với user chưa chat
2. Thấy empty state với nút "Làm mới"
3. Không thấy sample/fake data

## 🚨 **Nếu vẫn không hiển thị:**

### **Check Backend:**
```bash
# Kiểm tra backend logs
# Tìm:
# - "Received /app/get-conversations"
# - "Sent X conversations to user"
```

### **Check WebSocket:**
```javascript
// Test manual:
messagesService.getConversations()
  .then(convs => console.log('Conversations:', convs))
  .catch(err => console.error('Error:', err));
```

### **Check Network:**
- Chrome DevTools → WebSocket connections
- Xem có messages `/app/get-conversations` không
- Xem có response từ `/user/queue/conversations` không

---

## ✅ **Expected Results:**
- Conversations thực hiển thị trong danh sách
- Không có fake/sample data
- Empty state khi chưa có conversations
- Debug logs rõ ràng về data flow

**Restart app và check logs!** 🚀 