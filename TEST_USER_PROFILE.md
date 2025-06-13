# 🧪 Test UserProfileScreen 

## ✅ **Cách test nhanh:**

### **1. Từ FriendSearchScreen:**
```
1. Mở app → Login
2. Navigate to FriendSearch
3. Tìm kiếm: "nguyen" hoặc "admin" 
4. Bấm vào bất kỳ user nào trong kết quả
5. ➡️ Mở UserProfileScreen với profile của user đó
```

### **2. Test các tính năng:**
- ✅ **View Profile:** Hiển thị ảnh đại diện, tên, email, bio
- ✅ **Friendship Status:** Show correct button (Kết bạn/Đã gửi/Bạn bè)
- ✅ **Send Friend Request:** Bấm "Kết bạn" → gửi request
- ✅ **Start Chat:** Bấm "Nhắn tin" → mở NewChatScreen
- ✅ **Navigation Back:** Bấm mũi tên ← → quay về search

### **3. Expected UI:**
```
🖼️ Cover Image (200px height)
👤 Profile Image (120px, centered)
📝 Full Name (bold, 24px)
📧 Email (gray, 16px)  
💼 Occupation/Address/Education (if available)

[🔵 Kết bạn] [💬 Nhắn tin]  // 2 buttons side by side
```

### **4. Debug Console Logs:**
```
👤 Loading current user...
🔍 Checking friendship status for user: 123
📊 Profile loaded: {...}
🤝 Friend request sent successfully
```

---

## 🚀 **Ready to Test!**

**Just navigate:** `UserProfileScreen` với `{ userId: anyUserId }` 