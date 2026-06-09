# جميع الاستدعاءات API على قاعدة بيانات users من مشروع suez-bazaar-devolper

## معلومات المشروع

**المصدر**: C:\Users\hesham\Desktop\suez-bazaar-devolper  
**الهدف**: C:\Users\hesham\Desktop\users (قاعدة بيانات Firebase Firestore)  
**Project ID**: users-baad9  
**API Key**: AIzaSyCAqgZgcpd9hEQjs5J0VwjVcUVeTnZJcZo  
**Base URL**: https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents

---

## المجموعات (Collections)

### 1. users
**الوصف**: بيانات المستخدمين والتاجر الأساسية  
**Document ID**: user_key

### 2. user_contacts
**الوصف**: أرقام الهواتف المرتبطة بالمستخدمين  
**Document ID**: UUID

### 3. user_tokens
**الوصف**: رموز FCM للإشعارات  
**Document ID**: user_key

### 4. user_capabilities
**الوصف**: القدرات والصلاحيات للمستخدمين  
**Document ID**: user_key

### 5. user_specialties
**الوصف**: التخصصات والفئات المرتبطة بالمستخدمين  
**Document ID**: user_key_mainId_subId

### 6. merchant_ratings_v2
**الوصف**: تقييمات التجار  
**Document ID**: mrt_<id>

---

## الاستدعاءات حسب المجموعة

### Collection: users

#### العمليات المدعومة:
- **getDoc(collectionName, docId)** - جلب مستند واحد
- **setDoc(collectionName, docId, data)** - إنشاء/تحديث مستند
- **deleteDoc(collectionName, docId)** - حذف مستند
- **runQuery(collectionName, where, options)** - تشغيل استعلام
- **listDocs(collectionName, options)** - قائمة المستندات
- **listAllDocs(collectionName, options)** - قائمة جميع المستندات
- **findByField(collectionName, fieldPath, value)** - البحث بحقل
- **findByFieldIn(collectionName, fieldPath, values)** - البحث بحقل IN
- **deleteByField(collectionName, fieldPath, value)** - حذف بحقل

#### الاستدعاءات الفعلية من suez-bazaar-devolper:

**1. جلب مستخدم واحد**
```javascript
// من FirestoreIdentityApi.getDoc()
GET https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents/users/{user_key}?key=AIzaSyCAqgZgcpd9hEQjs5J0VwjVcUVeTnZJcZo
```

**2. جلب قائمة المستخدمين (listUsers)**
```javascript
// من list-users.js - وضع delivery_users
POST https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents:runQuery?key=AIzaSyCAqgZgcpd9hEQjs5J0VwjVcUVeTnZJcZo
Body: {
  "structuredQuery": {
    "from": [{ "collectionId": "users" }],
    "where": {
      "fieldFilter": {
        "field": { "fieldPath": "account_type" },
        "op": "GREATER_THAN_OR_EQUAL",
        "value": { "integerValue": "32" }
      }
    },
    "orderBy": [
      { "field": { "fieldPath": "account_type" }, "direction": "ASCENDING" },
      { "field": { "fieldPath": "updated_at" }, "direction": "DESCENDING" },
      { "field": { "fieldPath": "__name__" }, "direction": "DESCENDING" }
    ],
    "limit": 20
  }
}
```

**3. البحث ببادئة اسم المستخدم**
```javascript
// من list-users.js - username prefix search
POST https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents:runQuery?key=AIzaSyCAqgZgcpd9hEQjs5J0VwjVcUVeTnZJcZo
Body: {
  "structuredQuery": {
    "from": [{ "collectionId": "users" }],
    "where": {
      "compositeFilter": {
        "op": "AND",
        "filters": [
          {
            "fieldFilter": {
              "field": { "fieldPath": "username" },
              "op": "GREATER_THAN_OR_EQUAL",
              "value": { "stringValue": "ahmed" }
            }
          },
          {
            "fieldFilter": {
              "field": { "fieldPath": "username" },
              "op": "LESS_THAN",
              "value": { "stringValue": "ahmet" }
            }
          }
        ]
      }
    },
    "orderBy": [
      { "field": { "fieldPath": "username" }, "direction": "ASCENDING" },
      { "field": { "fieldPath": "updated_at" }, "direction": "DESCENDING" },
      { "field": { "fieldPath": "__name__" }, "direction": "DESCENDING" }
    ],
    "limit": 20
  }
}
```

**4. البحث بحقل user_key (IN query)**
```javascript
// من list-users.js - category search
POST https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents:runQuery?key=AIzaSyCAqgZgcpd9hEQjs5J0VwjVcUVeTnZJcZo
Body: {
  "structuredQuery": {
    "from": [{ "collectionId": "users" }],
    "where": {
      "fieldFilter": {
        "field": { "fieldPath": "user_key" },
        "op": "IN",
        "value": {
          "arrayValue": {
            "values": [
              { "stringValue": "user1" },
              { "stringValue": "user2" }
            ]
          }
        }
      }
    }
  }
}
```

**5. إنشاء/تحديث مستخدم**
```javascript
// من FirestoreIdentityApi.setDoc()
PATCH https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents/users/{user_key}?key=AIzaSyCAqgZgcpd9hEQjs5J0VwjVcUVeTnZJcZo
Body: {
  "fields": {
    "username": { "stringValue": "Mohammed Ali" },
    "phone": { "stringValue": "+201012345678" },
    "account_type": { "integerValue": "33" },
    "updated_at": { "timestampValue": "2026-06-09T00:00:00.000Z" }
  }
}
```

**6. حذف مستخدم**
```javascript
// من FirestoreIdentityApi.deleteDoc()
DELETE https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents/users/{user_key}?key=AIzaSyCAqgZgcpd9hEQjs5J0VwjVcUVeTnZJcZo
```

---

### Collection: user_contacts

#### الاستدعاءات الفعلية:

**1. جلب جهات اتصال مستخدم**
```javascript
GET https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents/user_contacts/{contact_id}?key=AIzaSyCAqgZgcpd9hEQjs5J0VwjVcUVeTnZJcZo
```

**2. البحث بحقل user_key**
```javascript
POST https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents:runQuery?key=AIzaSyCAqgZgcpd9hEQjs5J0VwjVcUVeTnZJcZo
Body: {
  "structuredQuery": {
    "from": [{ "collectionId": "user_contacts" }],
    "where": {
      "fieldFilter": {
        "field": { "fieldPath": "user_key" },
        "op": "EQUAL",
        "value": { "stringValue": "user_key" }
      }
    }
  }
}
```

**3. إنشاء/تحديث جهة اتصال**
```javascript
PATCH https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents/user_contacts/{contact_id}?key=AIzaSyCAqgZgcpd9hEQjs5J0VwjVcUVeTnZJcZo
Body: {
  "fields": {
    "user_key": { "stringValue": "user_key" },
    "phone_number": { "stringValue": "+201012345678" },
    "is_primary": { "booleanValue": true },
    "has_whatsapp": { "booleanValue": true }
  }
}
```

**4. حذف جهة اتصال**
```javascript
DELETE https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents/user_contacts/{contact_id}?key=AIzaSyCAqgZgcpd9hEQjs5J0VwjVcUVeTnZJcZo
```

---

### Collection: user_tokens

#### الاستدعاءات الفعلية:

**1. جلب رمز مستخدم**
```javascript
GET https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents/user_tokens/{user_key}?key=AIzaSyCAqgZgcpd9hEQjs5J0VwjVcUVeTnZJcZo
```

**2. إنشاء/تحديث رمز**
```javascript
PATCH https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents/user_tokens/{user_key}?key=AIzaSyCAqgZgcpd9hEQjs5J0VwjVcUVeTnZJcZo
Body: {
  "fields": {
    "user_key": { "stringValue": "user_key" },
    "fcm_token": { "stringValue": "fcm_token_string" },
    "platform": { "stringValue": "android" },
    "updated_at": { "timestampValue": "2026-06-09T00:00:00.000Z" }
  }
}
```

**3. حذف رمز**
```javascript
DELETE https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents/user_tokens/{user_key}?key=AIzaSyCAqgZgcpd9hEQjs5J0VwjVcUVeTnZJcZo
```

---

### Collection: user_capabilities

#### الاستدعاءات الفعلية:

**1. جلب قدرات مستخدم**
```javascript
GET https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents/user_capabilities/{user_key}?key=AIzaSyCAqgZgcpd9hEQjs5J0VwjVcUVeTnZJcZo
```

**2. إنشاء/تحديث قدرات (syncSpecialtyState)**
```javascript
// من specialties.js
PATCH https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents/user_capabilities/{user_key}?key=AIzaSyCAqgZgcpd9hEQjs5J0VwjVcUVeTnZJcZo
Body: {
  "fields": {
    "user_key": { "stringValue": "user_key" },
    "account_type": { "integerValue": "33" },
    "primary_main_category_id": { "integerValue": "5" },
    "has_business_specialties": { "integerValue": "1" },
    "has_sellable_specialties": { "integerValue": "1" },
    "can_deliver": { "integerValue": "0" },
    "normalized_business_category": { "stringValue": "{\"5\":[\"1\",\"2\"]}" },
    "specialty_profile_json": { "stringValue": "{\"version\":1,\"accountType\":33,...}" },
    "updated_at": { "timestampValue": "2026-06-09T00:00:00.000Z" }
  }
}
```

**3. حذف قدرات**
```javascript
DELETE https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents/user_capabilities/{user_key}?key=AIzaSyCAqgZgcpd9hEQjs5J0VwjVcUVeTnZJcZo
```

---

### Collection: user_specialties

#### الاستدعاءات الفعلية:

**1. جلب تخصصات حسب الفئة**
```javascript
// من list-users.js - category search
POST https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents:runQuery?key=AIzaSyCAqgZgcpd9hEQjs5J0VwjVcUVeTnZJcZo
Body: {
  "structuredQuery": {
    "from": [{ "collectionId": "user_specialties" }],
    "where": {
      "compositeFilter": {
        "op": "AND",
        "filters": [
          {
            "fieldFilter": {
              "field": { "fieldPath": "main_category_id" },
              "op": "EQUAL",
              "value": { "integerValue": "5" }
            }
          },
          {
            "fieldFilter": {
              "field": { "fieldPath": "sub_category_id" },
              "op": "EQUAL",
              "value": { "integerValue": "1" }
            }
          }
        ]
      }
    }
  }
}
```

**2. إنشاء تخصص (syncSpecialtyState)**
```javascript
// من specialties.js
PATCH https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents/user_specialties/{user_key}_{mainId}_{subId}?key=AIzaSyCAqgZgcpd9hEQjs5J0VwjVcUVeTnZJcZo
Body: {
  "fields": {
    "id": { "stringValue": "user_key_5_1" },
    "user_key": { "stringValue": "user_key" },
    "main_category_id": { "integerValue": "5" },
    "sub_category_id": { "integerValue": "1" },
    "source": { "stringValue": "browser" },
    "created_at": { "timestampValue": "2026-06-09T00:00:00.000Z" },
    "updated_at": { "timestampValue": "2026-06-09T00:00:00.000Z" }
  }
}
```

**3. حذف تخصصات مستخدم**
```javascript
// من specialties.js - deleteByField
DELETE https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents/user_specialties/{doc_id}?key=AIzaSyCAqgZgcpd9hEQjs5J0VwjVcUVeTnZJcZo
```

---

### Collection: merchant_ratings_v2

#### الاستدعاءات الفعلية:

**1. جلب تقييمات تاجر**
```javascript
GET https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents/merchant_ratings_v2/{rating_id}?key=AIzaSyCAqgZgcpd9hEQjs5J0VwjVcUVeTnZJcZo
```

**2. إنشاء/تحديث تقييم**
```javascript
PATCH https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents/merchant_ratings_v2/{rating_id}?key=AIzaSyCAqgZgcpd9hEQjs5J0VwjVcUVeTnZJcZo
Body: {
  "fields": {
    "merchant_user_key": { "stringValue": "merchant_key" },
    "actor_user_key": { "stringValue": "rater_key" },
    "actor_name": { "stringValue": "Rater Name" },
    "rating": { "integerValue": "5" },
    "note": { "stringValue": "Excellent merchant" },
    "updated_at": { "timestampValue": "2026-06-09T00:00:00.000Z" }
  }
}
```

**3. حذف تقييم**
```javascript
DELETE https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents/merchant_ratings_v2/{rating_id}?key=AIzaSyCAqgZgcpd9hEQjs5J0VwjVcUVeTnZJcZo
```

---

## الاستدعاءات حسب الصفحات (Pages)

### صفحة تسجيل الدخول (login.html)
```javascript
// التحقق من كلمة المرور
POST /api/users
Body: { action: "verify", phone: "+201012345678", Password: "1234" }

// جلب بيانات المستخدم
GET /api/users?phone=+201012345678
```

### صفحة التسجيل (register.html)
```javascript
// إنشاء مستخدم جديد
POST /api/users
Body: { 
  user_key: "new_user_key",
  username: "New User",
  phone: "+201012345678",
  Password: "1234"
}
```

### صفحة البحث (search.html)
```javascript
// البحث عن تجار
GET /api/users?searchTerm=ahmed&mainCategory=5&subCategory=1&limit=20&offset=0

// البحث عن مستخدم واحد
GET /api/users?user_key=user_key
```

### صفحة محفظة التاجر (merchant-portfolio.html)
```javascript
// جلب بيانات التاجر
GET /api/users?user_key=merchant_key
```

### صفحة عرض المنتج (productView.html)
```javascript
// جلب بيانات البائع
GET /api/users?user_key=seller_key
```

---

## الاستدعاءات حسب العمليات (Operations)

### عمليات القراءة (Read Operations)
1. **getDoc** - جلب مستند واحد
2. **runQuery** - تشغيل استعلام معقد
3. **listDocs** - قائمة المستندات مع ترقيم الصفحات
4. **listAllDocs** - قائمة جميع المستندات
5. **findByField** - البحث بحقل واحد
6. **findByFieldIn** - البحث بحقل IN (متعدد القيم)

### عمليات الكتابة (Write Operations)
1. **setDoc** - إنشاء/تحديث مستند (PATCH)
2. **deleteDoc** - حذف مستند
3. **deleteByField** - حذف بحقل
4. **deleteWhereAny** - حذف بأي شرط

---

## الاستدعاءات من الملفات المحددة

### من js/shared/firestore-identity/list-users.js
```javascript
// listUsers function - قائمة المستخدمين مع فلاتر متعددة
POST /api/users
Query Parameters:
- mode: delivery_users | category_search
- searchTerm: "ahmed"
- main_id: "5"
- sub_id: "1"
- role: "33"
- cursor: "base64_cursor"
- limit: 20
- offset: 0
- last_id: 123
- skip_relations: true
```

### من js/shared/firestore-identity/specialties.js
```javascript
// syncSpecialtyState function - مزامنة التخصصات
// 1. حذف التخصصات القديمة
DELETE user_specialties where user_key = user_key

// 2. إنشاء تخصصات جديدة
PATCH user_specialties/{user_key}_{mainId}_{subId}

// 3. تحديث القدرات
PATCH user_capabilities/{user_key}
```

### من js/api-client/db-clients.js
```javascript
// FirestoreRestClient class - جميع العمليات الأساسية
const usersClient = new FirestoreRestClient("users");

// استخدام:
usersClient.getDoc("users", user_key)
usersClient.setDoc("users", user_key, data)
usersClient.deleteDoc("users", user_key)
usersClient.runQuery("users", where, options)
usersClient.listDocs("users", options)
usersClient.listAllDocs("users", options)
usersClient.findByField("users", "phone", phone_value)
usersClient.findByFieldIn("users", "user_key", user_keys)
usersClient.deleteByField("users", "user_key", user_key)
```

### من js/shared/firestore-identity/config.js
```javascript
// إعدادات المشروع
const PROJECT_ID = "users-baad9";
const API_KEY = "AIzaSyCAqgZgcpd9hEQjs5J0VwjVcUVeTnZJcZo";
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const OWNED_COLLECTIONS = new Set([
  "users",
  "user_contacts",
  "user_tokens",
  "user_capabilities",
  "user_specialties",
  "merchant_ratings_v2",
]);
```

---

## الاستدعاءات من الاختبارات (Tests)

### من tools/testing/smoke/smoke-test-phones.js
```javascript
// اختبار المستخدم الإداري
GET /api/users?user_key=dl14v1k7

// اختبار مستخدم تم إصلاحه
GET /api/users?user_key=pngukw
```

### من tools/audit/tests/register-suite/live-api/create-and-verify-live-user.js
```javascript
// إنشاء مستخدم حي
POST /api/users
Body: { phone, Password, user_key, username, ... }

// التحقق من المستخدم
GET /api/users?user_key={user_key}
```

### من tools/audit/tests/profile-suite/live-api/verify-live-user-password.js
```javascript
// التحقق من كلمة المرور
POST /api/users
Body: { action: "verify", phone, Password }
```

### من tools/audit/tests/profile-suite/live-api/update-and-verify-live-user.js
```javascript
// تحديث مستخدم
PUT /api/users
Body: { username, phone, ... }

// التحقق من التحديث
GET /api/users?user_key={user_key}
```

---

## ملخص الاستدعاءات

### إجمالي العمليات:
- **GET**: جلب المستندات والقوائم
- **PATCH**: إنشاء/تحديث المستندات
- **DELETE**: حذف المستندات
- **POST**: تشغيل الاستعلامات المعقدة (:runQuery)

### المجموعات الأكثر استخداماً:
1. **users** - الأكثر استخداماً (جلب، بحث، إنشاء، تحديث، حذف)
2. **user_specialties** - للبحث حسب الفئات
3. **user_capabilities** - لمزامنة القدرات
4. **user_contacts** - لإدارة أرقام الهواتف
5. **user_tokens** - لإدارة رموز الإشعارات
6. **merchant_ratings_v2** - للتقييمات

### الأنماط الشائعة:
1. **البحث بحقل واحد**: findByField
2. **البحث بحقل IN**: findByFieldIn (للمفاتيح المتعددة)
3. **البحث بالنطاق**: GREATER_THAN_OR_EQUAL + LESS_THAN (لبادئة النص)
4. **الترقيم بالكورسور**: startAfterCursor في runQueryPaginated
5. **الفلترة المركبة**: compositeFilter مع AND

---

## ملاحظات مهمة

1. **جميع الاستدعاءات تتطلب API Key**: `?key=AIzaSyCAqgZgcpd9hEQjs5J0VwjVcUVeTnZJcZo`
2. **المصادقة**: بعض الاستدعاءات تتطلب Firebase Auth token في Header
3. **الكاش**: المشروع يستخدم MerchantRegistry للكاش المحلي
4. **المراقبة**: DbOperationMonitor يراقب جميع عمليات قاعدة البيانات
5. **التشفير**: البيانات يتم تشفيرها/فك تشفيرها باستخدام encodeValue/decodeValue

---

## الملفات المصدر في suez-bazaar-devolper

1. `js/shared/firestore-identity/config.js` - إعدادات المشروع
2. `js/shared/firestore-identity/list-users.js` - قائمة المستخدمين
3. `js/shared/firestore-identity/specialties.js` - مزامنة التخصصات
4. `js/shared/firestore-identity/client.js` - عميل Firestore
5. `js/shared/firestore-identity/handle-users.js` - معالجة طلبات المستخدمين
6. `js/shared/firestore-identity-api.js` - واجهة API العامة
7. `js/api-client/db-clients.js` - عملاء قاعدة البيانات
8. `js/network.js` - توجيه الشبكة
9. `important/api-client-analysis-report.md` - تقرير تحليل API
10. `important/api-calls-by-page-events.md` - الاستدعاءات حسب الصفحات

---

**تاريخ الإنشاء**: 2026-06-09  
**المصدر**: C:\Users\hesham\Desktop\suez-bazaar-devolper  
**الهدف**: C:\Users\hesham\Desktop\users
