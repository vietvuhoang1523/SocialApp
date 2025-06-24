# 🔗 API Endpoint Mapping Guide

## Tóm tắt cấu trúc chuẩn

### Backend Controllers vs Frontend Services

| **Backend Controller** | **Frontend Service** | **Mục đích** |
|------------------------|---------------------|--------------|
| `SportsPostController.java` | `SportsPostService.js` | CRUD bài đăng + hiển thị participants |
| `SportsPostParticipantController.java` | `SportsPostParticipantService.js` | Quản lý participants (join/leave/manage) |

---

## 📋 Chi tiết Endpoints

### 1️⃣ **SportsPostController.java** ↔️ **SportsPostService.js**

**Base URL:** `/api/sports-posts`

#### **Participants Endpoints (cho hiển thị UI):**
```javascript
// ✅ Lấy participants đã ACCEPTED (không bao gồm creator) - cho hiển thị UI
GET /api/sports-posts/{postId}/participants
→ sportsPostService.getParticipants(postId)
→ Trả về: Page<ParticipantResponse> - chỉ ACCEPTED participants

// ✅ Join bài đăng  
POST /api/sports-posts/{postId}/join
→ sportsPostService.toggleJoin(postId)

// ✅ Leave bài đăng
POST /api/sports-posts/{postId}/leave  
→ sportsPostService.toggleJoin(postId)
```

#### **CRUD Operations:**
```javascript
// Lấy tất cả bài đăng
GET /api/sports-posts → sportsPostService.getSportsPosts()

// Lấy chi tiết bài đăng
GET /api/sports-posts/{postId} → sportsPostService.getSportsPostById()

// Tạo bài đăng mới
POST /api/sports-posts → sportsPostService.createSportsPost()

// Tìm kiếm bài đăng
POST /api/sports-posts/search → sportsPostService.searchSportsPosts()
```

---

### 2️⃣ **SportsPostParticipantController.java** ↔️ **SportsPostParticipantService.js**

**Base URL:** `/api/sports-posts/participants`

#### **Participant Management (cho quản lý admin):**
```javascript
// ✅ Lấy TẤT CẢ participants (bao gồm PENDING) - cho admin quản lý
GET /api/sports-posts/participants/{postId}
→ participantService.getParticipants(postId)  
→ Trả về: Page<ParticipantResponse> - TẤT CẢ participants (PENDING + ACCEPTED)

// ✅ Chỉ lấy participants đã ACCEPTED
GET /api/sports-posts/participants/{postId}/accepted
→ participantService.getAcceptedParticipants(postId)

// ✅ Chỉ lấy requests đang PENDING  
GET /api/sports-posts/participants/{postId}/pending
→ participantService.getPendingRequests(postId)

// ✅ Join bài đăng (alternative method)
POST /api/sports-posts/participants/{postId}/join  
→ participantService.joinSportsPost(postId, message)

// ✅ Leave bài đăng (alternative method)
DELETE /api/sports-posts/participants/{postId}/leave
→ participantService.leaveSportsPost(postId)

// ✅ Duyệt/từ chối request (cho creator)
POST /api/sports-posts/participants/{postId}/participants/{participantId}/respond
→ participantService.respondToJoinRequest(postId, participantId, approve, message)
```

---

## 🎯 **Khi nào dùng endpoint nào?**

### **Để hiển thị danh sách participants trong UI:**
```javascript
// ✅ ĐÚNG: Dùng SportsPostService  
import sportsPostService from './SportsPostService';
const participants = await sportsPostService.getParticipants(postId);
// → Trả về: Chỉ participants đã ACCEPTED, không bao gồm creator
// → Phù hợp cho hiển thị "Người tham gia (5)" trong UI
```

### **Để quản lý participants (cho creator):**
```javascript
// ✅ ĐÚNG: Dùng SportsPostParticipantService
import participantService from './SportsPostParticipantService';

// Lấy tất cả để quản lý
const allParticipants = await participantService.getParticipants(postId);
// → Trả về: TẤT CẢ participants (PENDING + ACCEPTED)

// Lấy chỉ pending để duyệt
const pendingRequests = await participantService.getPendingRequests(postId);
// → Trả về: Chỉ requests đang chờ duyệt
```

### **Để join/leave bài đăng:**
```javascript
// Cách 1: Qua SportsPostService (recommended)
await sportsPostService.toggleJoin(postId);

// Cách 2: Qua SportsPostParticipantService (alternative)  
await participantService.joinSportsPost(postId, "Tôi muốn tham gia!");
await participantService.leaveSportsPost(postId);
```

---

## ⚠️ **Lỗi thường gặp:**

### **❌ SAI:**
```javascript
// Gọi sai endpoint - sẽ gây 404 error
GET /api/sports-posts/participants/123/participants  // ❌ Sai đường dẫn
```

### **✅ ĐÚNG:**
```javascript
// Cách 1: Để hiển thị UI
GET /api/sports-posts/123/participants              // ✅ Từ SportsPostController

// Cách 2: Để quản lý admin  
GET /api/sports-posts/participants/123              // ✅ Từ SportsPostParticipantController
```

---

## 🔧 **Debug Checklist:**

1. **Kiểm tra Base URL:**
   - SportsPostService: `/api/sports-posts`
   - SportsPostParticipantService: `/api/sports-posts/participants`

2. **Kiểm tra endpoint pattern:**
   - SportsPost: `/{postId}/participants`
   - SportsPostParticipant: `/{postId}` (participants đã có trong base URL)

3. **Kiểm tra Console Logs:**
   ```javascript
   // Nên thấy logs như này:
   console.log('🎯 Using endpoint: GET /api/sports-posts/123/participants');
   console.log('📋 This endpoint returns ACCEPTED participants EXCLUDING creator');
   ```

4. **Verify Network Tab:**
   - URL đúng format: `http://localhost:8080/api/sports-posts/123/participants`
   - Status 200 OK
   - Response có structure: `{ content: [...], totalElements: X }`

---

## 🎯 **Recommendation:**

Để tránh nhầm lẫn, luôn sử dụng:
- **`SportsPostService.getParticipants()`** cho hiển thị UI
- **`SportsPostParticipantService.getParticipants()`** cho quản lý admin

Đây là 2 endpoints khác nhau với mục đích khác nhau! 