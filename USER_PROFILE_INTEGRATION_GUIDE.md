# 🧑‍🤝‍🧑 Hướng dẫn tích hợp UserProfileScreen

## 📋 **Tổng quan:**
UserProfileScreen cho phép hiển thị trang cá nhân của người dùng khác (không phải chính mình) với các chức năng:
- Xem thông tin cá nhân
- Gửi lời mời kết bạn
- Nhắn tin trực tiếp
- Xem trạng thái kết bạn

## 🚀 **Cách sử dụng:**

### 1. **Từ FriendSearchScreen (đã tích hợp)**
```javascript
// Trong FriendSearchScreen.js - dòng 233
const renderUserItem = ({ item }) => (
    <TouchableOpacity
        style={styles.userItem}
        onPress={() => navigation.navigate('UserProfileScreen', { userId: item.id })}
        activeOpacity={0.7}
    >
        {/* User item content */}
    </TouchableOpacity>
);
```

### 2. **Từ bất kỳ screen nào khác:**
```javascript
// Ví dụ: từ danh sách bạn bè, comments, etc.
const viewUserProfile = (userId) => {
    navigation.navigate('UserProfileScreen', { userId: userId });
};

// Sử dụng trong TouchableOpacity
<TouchableOpacity onPress={() => viewUserProfile(user.id)}>
    <Text>Xem trang cá nhân</Text>
</TouchableOpacity>
```

## 🎨 **Tính năng của UserProfileScreen:**

### **1. Hiển thị thông tin cơ bản**
- ✅ Ảnh đại diện và ảnh bìa
- ✅ Tên đầy đủ và email
- ✅ Bio/Giới thiệu
- ✅ Thông tin công việc, địa chỉ, học vấn

### **2. Trạng thái kết bạn**
- 🟢 `ACCEPTED` - Đã là bạn bè
- 🟡 `PENDING_SENT` - Đã gửi lời mời
- 🟠 `PENDING_RECEIVED` - Đã nhận lời mời
- ⚪ `NOT_FRIEND` - Chưa kết bạn

### **3. Actions buttons**
- **Kết bạn** - Gửi lời mời kết bạn
- **Nhắn tin** - Chuyển đến NewChatScreen
- **Chấp nhận** - Nếu đã nhận lời mời

### **4. Posts/Photos**
- Hiển thị 6 ảnh bài viết gần nhất (nếu có)

## 🔧 **Backend Requirements:**

### **API Endpoints cần thiết:**
```
GET /api/v1/users/profile/{userId}     - Lấy thông tin profile
POST /api/v1/connections/send-request/{userId} - Gửi lời mời kết bạn
POST /api/v1/connections/batch-status  - Check friendship status
```

### **Response format:**
```json
{
    "id": 123,
    "fullName": "Nguyễn Văn A",
    "email": "user@example.com",
    "bio": "Giới thiệu bản thân...",
    "profilePictureUrl": "https://...",
    "coverImageUrl": "https://...",
    "occupation": "Software Developer",
    "address": "Hà Nội",
    "education": "Đại học ABC",
    "postImages": ["url1", "url2", ...]
}
```

## 📱 **Navigation Setup:**

### **1. Đã thêm vào App.js:**
```javascript
import UserProfileScreen from "./src/screens/profile/UserProfileScreen";

// Trong Stack.Navigator:
<Stack.Screen
    name="UserProfileScreen"
    component={UserProfileScreen}
    options={{ headerShown: false }}
/>
```

### **2. Navigation params:**
```javascript
navigation.navigate('UserProfileScreen', { 
    userId: 123  // Required - ID của user cần xem
});
```

## 🎯 **Use Cases:**

### **1. Từ Search Results** ✅
- User tìm kiếm bạn bè → bấm vào kết quả → xem profile

### **2. Từ Friends List**
```javascript
// Trong FriendsSection.js
const viewFriendProfile = (friend) => {
    const friendData = determineFriendData(friend, currentUser?.id);
    navigation.navigate('UserProfileScreen', { userId: friendData.id });
};
```

### **3. Từ Comments**
```javascript
// Trong CommentsScreen.js
const viewCommenterProfile = (comment) => {
    navigation.navigate('UserProfileScreen', { userId: comment.userId });
};
```

### **4. Từ Posts**
```javascript
// Trong InstagramHomeScreen.js
const viewPostAuthorProfile = (post) => {
    navigation.navigate('UserProfileScreen', { userId: post.authorId });
};
```

## 🔄 **Integration Examples:**

### **Example 1: Friend Card Component**
```javascript
const FriendCard = ({ friend, onPress }) => (
    <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('UserProfileScreen', { userId: friend.id })}
    >
        <Image source={{ uri: friend.avatar }} style={styles.avatar} />
        <Text style={styles.name}>{friend.name}</Text>
    </TouchableOpacity>
);
```

### **Example 2: Comment Author**
```javascript
const CommentItem = ({ comment }) => (
    <View style={styles.comment}>
        <TouchableOpacity onPress={() => navigation.navigate('UserProfileScreen', { userId: comment.authorId })}>
            <Image source={{ uri: comment.authorAvatar }} style={styles.avatar} />
        </TouchableOpacity>
        <Text>{comment.content}</Text>
    </View>
);
```

## 🚨 **Error Handling:**

### **1. User not found:**
- Hiển thị error screen với retry button
- Navigate back nếu user không tồn tại

### **2. Permission denied:**
- Hiển thị message "Profile không public"
- Offer to send friend request

### **3. Network errors:**
- Loading states
- Retry functionality
- Graceful fallbacks

## 🔒 **Security Considerations:**

### **1. Privacy Settings:**
- Respect user privacy settings
- Only show allowed information
- Hide sensitive data based on friendship status

### **2. Blocked Users:**
- Handle blocked relationships
- Don't allow viewing blocked user profiles
- Show appropriate messages

## 📊 **Testing:**

### **Test Cases:**
1. ✅ View friend's profile
2. ✅ View stranger's profile  
3. ✅ Send friend request
4. ✅ Start conversation
5. ✅ Handle loading states
6. ✅ Handle errors
7. ✅ Navigation back
8. ✅ Different friendship statuses

---

## 🎉 **Ready to Use!**

UserProfileScreen đã hoàn tất và sẵn sàng sử dụng. Chỉ cần:

1. **Navigate với userId:**
   ```javascript
   navigation.navigate('UserProfileScreen', { userId: targetUserId });
   ```

2. **Backend server đang chạy** (để load profile data)

3. **Đã restart app** để load navigation changes

**Perfect for social interactions! 🚀** 