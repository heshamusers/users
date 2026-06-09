
**الهدف الأساسي:**
1. **مشروع `users`**: نقل جميع البيانات من Firestore → Turso، وتوفير HTTP API عبر `https://users-d5m.pages.dev/`
2. **مشروع `suez-bazaar-devolper`**: يجلب كل البيانات من `https://users-d5m.pages.dev/` فقط (لا يتعامل مع Firestore نهائياً)


## خطة معدلة: ربط suez-bazaar-devolper مع users عبر HTTPS API

**الملخص التنفيذي:**
- 🎯 توسيع `users/api/data.js` بـ endpoints محددة
- 🎯 إنشاء `HttpIdentityApi` في suez-bazaar-devolper
- 🎯 استبدال كل استدعاءات Firestore بـ HTTP calls إلى `https://users-d5m.pages.dev/`
- 🎯 دعم offline mode عبر localStorage
- 🎯 حذف Firestore من مشروع users

---

### **المرحلة 1: API في مشروع users** 
**الملف:** users/api/data.js

Endpoints المطلوبة:
```javascript
// مستخدم واحد مع البيانات المرتبطة
GET /api/users?user_key=KEY

// عدة مستخدمين
GET /api/users?user_keys=K1,K2,K3

// حسب التخصص (category)
GET /api/users?mode=category&main_id=1&sub_id=2

// مقدمي الخدمات
GET /api/users?mode=delivery_users

// بحث + فلترة
GET /api/users?search=TERM&role=merchant

// بحث برقم هاتف
GET /api/users?phone=PHONE

// للـ offline backup
GET /api/backup?type=users
```

---

### **المرحلة 2: تحديث suez-bazaar-devolper**
**الملفات:**
- router.js - تحديث routing
- **js/shared/firestore-identity/http-identity-api.js** - فئة جديدة تماماً
- list-users.js - استبدال queries
- hydrate.js - استبدال queries
- network.js - إضافة offline handling

**الخطوات:**
1. بناء HttpIdentityApi (نفس methods لكن HTTP بدلاً من Firestore)
2. تحديث router ليوجه إلى HttpIdentityApi
3. استبدال كل Firestore queries بـ HTTP API calls
4. إضافة localStorage fallback

---

### **المرحلة 3: Offline Mode**
**الملفات:**
- js/shared/firestore-identity/http-identity-api.js (تحديث)
- merchant-registry.js (تحديث)

---

### **المرحلة 4: حذف Firestore**
**مشروع users:**
- حذف: firestore.rules
- حذف: firestore.indexes.json
- تحديث: firebase.json
- تحديث: firebase.js

---