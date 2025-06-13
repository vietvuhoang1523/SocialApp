# 🔧 Fix: Duplicate Messages Issue

## ❌ **Vấn đề:**
Khi gửi tin nhắn, message bị **duplicated**:
- Lưu vào database **2 lần**
- Hiển thị trong UI **2 lần**
- Gây confuse cho user

## 🔍 **Nguyên nhân:**

### **1. WebSocket Listener Receive Own Messages**
```javascript
// TRƯỚC: useChatWebSocket.js nhận TẤT CẢ messages
const handleNewMessage = (message) => {
    // ❌ Cả message từ mình VÀ từ người khác đều được pass
    if (isRelevantMessage) {
        setLastMessage(message);
        handleNewWebSocketMessage(message); // ← DUPLICATE HERE
    }
};
```

### **2. Double Send Flow**
```javascript
// useMessageHandlers.js
1. Add temporary message to UI  ← First display
2. Send via WebSocket → Server saves to DB
3. Server broadcasts message back via WebSocket
4. useChatWebSocket receives it → handleNewWebSocketMessage ← Second display
```

### **3. Button Press Issues** 
- `onSubmitEditing` + button press → double trigger
- Không có debounce protection

## ✅ **Giải pháp:**

### **1. Filter WebSocket Messages (useChatWebSocket.js)**
```javascript
const handleNewMessage = (message) => {
    console.log('📨 Tin nhắn mới qua WebSocket:', message);
    
    const isRelevantMessage = 
        (message.senderId === currentUserId && message.receiverId === receiverId) ||
        (message.senderId === receiverId && message.receiverId === currentUserId);
    
    if (isRelevantMessage) {
        // ⚡ FIX: Chỉ pass message từ NGƯỜI KHÁC
        if (message.senderId === receiverId) {
            console.log('📨 Message from other user, passing to handleNewWebSocketMessage');
            setLastMessage(message);
            setIsOtherUserTyping(false);
            
            // Pass to message management hook
            if (typeof handleNewWebSocketMessage === 'function') {
                handleNewWebSocketMessage(message);
            }
        } else {
            console.log('📤 Message from current user, skipping to avoid duplicate');
            // Still update lastMessage for status tracking, but don't pass to UI
            setLastMessage(message);
        }
    }
};
```

### **2. Remove Auto-Refresh After Send (useMessageHandlers.js)**
```javascript
// ❌ REMOVED: Don't fetch new messages after sending to avoid duplicates
// The message will arrive via WebSocket automatically
// setTimeout(() => {
//     fetchNewMessages?.();
// }, 1000);
```

### **3. Smart Fallback Logic (useMessageHandlers.js)**
```javascript
// Fallback to messagesService ONLY if WebSocket completely failed
if (!success && !wsConnected) {
    // Only use REST API when WebSocket is disconnected
    const response = await messagesService.sendMessage(messageData);
}
```

### **4. Debounce Button Press (NewMessageInput.js)**
```javascript
const handleSend = useCallback(() => {
    // ⚡ Debounce protection - prevent double press
    if (sending || disabled) {
        console.log('⚠️ Send blocked - sending:', sending, 'disabled:', disabled);
        return;
    }
    
    if (messageText.trim().length > 0 || attachment) {
        console.log('📤 Triggering send message...');
        onSend();
        // ...
    }
}, [messageText, attachment, onSend, scaleAnim, sending, disabled]);

// Remove onSubmitEditing to prevent double trigger
<TextInput
    returnKeyType="default" // Changed from "send"
    // onSubmitEditing={handleSend} ← REMOVED
    blurOnSubmit={false}
/>
```

## 🎯 **Kết quả:**
- ✅ Tin nhắn chỉ hiển thị **1 lần**
- ✅ Chỉ lưu vào database **1 lần**  
- ✅ WebSocket chỉ pass message từ **người khác**
- ✅ Button có debounce protection
- ✅ Smart fallback logic

## 🧪 **Test:**
1. Gửi tin nhắn → Check chỉ có 1 message trong UI
2. Check database logs → Chỉ có 1 INSERT
3. Nhấn nút send liên tục → Chỉ gửi 1 lần
4. Test với WebSocket disconnected → REST API fallback hoạt động

## 📝 **Files đã sửa:**
- `src/hook/useChatWebSocket.js` - Filter own messages
- `src/hook/useMessageHandlers.js` - Remove auto-refresh, smart fallback
- `src/components/chat/NewMessageInput.js` - Debounce protection
- `src/screens/Messages/NewChatScreen.js` - Pass handleNewWebSocketMessage parameter 