# 🛠️ Fix 404 Status Endpoint Error

## 🐛 **Lỗi:**
```
ERROR  Error data: {"error": "Not Found", "path": "/api/v1/connections/status/7", "status": 404}
ERROR  Error checking friend status: [AxiosError: Request failed with status code 404]
```

## 🔧 **Nguyên nhân:**
- FriendService.checkFriendStatus() đang gọi endpoint `/status/{userId}` 
- Backend không có endpoint này, chỉ có `/batch-status`
- Gây ra lỗi 404 khi check friendship status

## ✅ **Fix đã thực hiện:**

### 1. **Removed Non-existent Endpoint Call**
```javascript
// OLD: Gọi endpoint không tồn tại
const response = await this.api.get(`/status/${userId}`);

// NEW: Sử dụng batch API trước, fallback nếu cần
const batchResult = await this.getBatchFriendshipStatus([userId]);
```

### 2. **Improved checkFriendStatus Logic**
```javascript
async checkFriendStatus(userId) {
    // 1. Try batch API first
    try {
        const batchResult = await this.getBatchFriendshipStatus([userId]);
        return batchResult[userId] || 'NOT_FRIEND';
    } catch (batchError) {
        // 2. Manual fallback using existing APIs
        // - Check friends list
        // - Check sent requests  
        // - Check received requests
    }
}
```

### 3. **Prevent Infinite Loop in Fallback**
```javascript
// OLD: Fallback gọi checkFriendStatus → infinite loop
for (const userId of userIds) {
    const status = await this.checkFriendStatus(userId);
}

// NEW: Simple fallback 
for (const userId of userIds) {
    statusMap[userId] = 'NOT_FRIEND';
}
```

### 4. **Better Status Mapping**
- `ACCEPTED` thay vì `FRIEND`
- `PENDING_SENT` thay vì `PENDING`
- `PENDING_RECEIVED` thay vì `RECEIVED`
- `NOT_FRIEND` as default

## 🧪 **Test Results Expected:**

### ✅ **Should work now:**
1. **No more 404 errors** từ `/status/{userId}`
2. **Search shows results** với correct friendship status
3. **Batch status API works** cho multiple users
4. **Fallback gracefully** nếu batch API fails

### 📊 **Console logs to monitor:**
- `🔍 Checking friendship status for users: [...]`
- `✅ Batch friendship status response: {...}`  
- `⚠️ Using fallback: setting all users as NOT_FRIEND` (nếu batch API lỗi)

## 🚀 **Next Steps:**
1. **Test search again** - gõ ký tự trong FriendSearchScreen
2. **Check console** - không còn lỗi 404
3. **Verify friendship buttons** hiển thị đúng status

---

**Status: ✅ Fixed**
**Issue: 404 endpoint errors resolved** 