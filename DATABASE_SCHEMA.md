# وصف قاعدة بيانات users-baad9 الشامل

## معلومات المشروع

| الخاصية | القيمة |
|---------|--------|
| **Project ID** | users-baad9 |
| **Base URL** | https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents |
| **API Key** | AIzaSyCAqgZgcpd9hEQjs5J0VwjVcUVeTnZJcZo |
| **نوع قاعدة البيانات** | Firebase Firestore (NoSQL) |
| **النشر** | https://users-d5m.pages.dev/ |
| **آخر نسخة احتياطية** | 2026-06-08T17:24:25.238Z |

---

## المجموعات (Collections)

### ملخص المجموعات

| المجموعة | عدد المستندات | Document ID | الوصف |
|---------|--------------|-------------|--------|
| users | 144 | user_key | بيانات المستخدمين الأساسية |
| user_contacts | 155 | UUID | أرقام الهواتف المرتبطة بالمستخدمين |
| user_capabilities | 144 | user_key | القدرات والصلاحيات للمستخدمين |
| user_specialties | 236 | user_key_mainId_subId | التخصصات والفئات المرتبطة بالمستخدمين |
| user_tokens | 38 | user_key | رموز FCM للإشعارات |
| merchant_ratings_v2 | 0 | mrt_<id> | تقييمات التجار (فارغة حالياً) |

**إجمالي المستندات**: 717

---

## 1. مجموعة users

### الوصف
تحتوي على بيانات المستخدمين الأساسية والتاجرين. هذه هي المجموعة الرئيسية في قاعدة البيانات.

### معرف المستند (Document ID)
- **النوع**: user_key (مثل: `011vw3`, `dl14v1k7`)
- **الوصف**: معرف فريد لكل مستخدم

### الحقول (Fields)

| الحقل | النوع | الوصف | مثال |
|-------|-------|-------|------|
| user_key | string | المعرف الفريد للمستخدم | "011vw3" |
| username | string | اسم المستخدم/التاجر | "عبد المبدي للموبيليات" |
| phone | string | رقم الهاتف الرئيسي | "+201000565489" |
| Password | string | كلمة المرور (مشفرة) | "1170" |
| account_type | integer | نوع الحساب (بتات) | 33 |
| system_role | string | دور النظام | "user", "admin" |
| Address | string | العنوان | "ش الجيش بجوار ميدان الترعه..." |
| location | string | الإحداثيات | "29.9918951, 32.4843479" |
| business_category | object | الفئات التجارية | {"5": ["1", "2"]} |
| business_sub_categories | object | الفئات الفرعية التجارية | null |
| settings | object | إعدادات المستخدم | {...} |
| links | object | روابط التواصل الاجتماعي | {...} |
| featured_items_data | object | بيانات العناصر المميزة | null |
| limitPackage | string | باقة الحد | null |
| contacts_snapshot | array | لقطة جهات الاتصال | [{...}] |
| created_at | timestamp | تاريخ الإنشاء | "2026-02-24T23:51:26.696Z" |
| updated_at | timestamp | تاريخ التحديث | "2026-02-24T23:51:26.696Z" |
| last_login_at | timestamp | آخر تسجيل دخول | "2026-06-05T10:00:00.000Z" |
| read_model_updated_at | timestamp | تاريخ تحديث نموذج القراءة | "2026-06-08T14:43:30.151Z" |
| _firestore_id | string | معرف Firestore | "011vw3" |
| _docId | string | معرف المستند | "011vw3" |
| _legacy | object | معلومات الترحيل | {...} |

### تفاصيل الحقول المهمة

#### account_type (نوع الحساب)
يستخدم نظام البتات (Bitwise) لتعديد الأدوار:
- **بت 1 (1)**: مشتري (Buyer)
- **بت 2 (2)**: بائع (Seller)
- **بت 4 (4)**: مقدم خدمة (Service Provider)
- **بت 8 (8)**: مالك (Owner)
- **بت 16 (16)**: مدير (Manager)
- **بت 32 (32)**: موصل (Delivery)

**الأمثلة الشائعة**:
- `1`: مشتري فقط
- `33` (1 + 32): مشتري + موصل
- `17` (1 + 16): مشتري + مالك
- `3` (1 + 2): مشتري + بائع

#### settings (الإعدادات)
```json
{
  "productRatingMode": "stars_comments",
  "isDelivered": 0,
  "ratingMode": "stars_comments",
  "productRatingEnabled": true,
  "ratingEnabled": true
}
```

#### links (الروابط)
```json
{
  "tiktok": "https://www.tiktok.com/@user",
  "instagram": "",
  "website": "",
  "telegram": "",
  "facebook": "https://www.facebook.com/share/...",
  "x": ""
}
```

#### business_category (الفئات التجارية)
```json
{
  "5": ["1", "2"]
}
```
- المفتاح: معرف الفئة الرئيسية
- القيمة: مصفوفة من معرفات الفئات الفرعية

#### contacts_snapshot (لقطة جهات الاتصال)
```json
[
  {
    "number": "+201000565489",
    "is_primary": true,
    "has_whatsapp": true
  }
]
```

### قواعد الأمان
```javascript
match /users/{userId} {
  allow read, write: if request.auth != null;
}
```
- يتطلب مصادقة للقراءة والكتابة

### الفهارس المركبة
1. `account_type` ASC, `updated_at` DESC, `__name__` DESC
2. `username` ASC, `updated_at` DESC, `__name__` DESC
3. `account_type` ASC, `username` ASC, `updated_at` DESC, `__name__` DESC

---

## 2. مجموعة user_contacts

### الوصف
تحتوي على أرقام الهواتف المرتبطة بكل مستخدم. يمكن للمستخدم أن يمتلك عدة أرقام هاتف.

### معرف المستند (Document ID)
- **النوع**: UUID (مثل: `contact_0080aa06-76ac-459c-aa56-cac1a46f667f`)
- **الوصف**: معرف فريد لكل جهة اتصال

### الحقول (Fields)

| الحقل | النوع | الوصف | مثال |
|-------|-------|-------|------|
| id | string | معرف جهة الاتصال | "contact_0080aa06-76ac-459c-aa56-cac1a46f667f" |
| user_key | string | معرف المستخدم المرتبط | "4dpz993e" |
| phone_number | string | رقم الهاتف | "+201280936579" |
| is_primary | integer/boolean | هل هو الرقم الأساسي؟ | 1 / true |
| has_whatsapp | integer/boolean | هل يدعم واتساب؟ | 1 / true |
| contact_type | string | نوع جهة الاتصال | "phone" |
| created_at | timestamp | تاريخ الإنشاء | "2026-04-10T05:53:03.440Z" |
| updated_at | timestamp | تاريخ التحديث | "2026-04-10T05:53:03.440Z" |
| _docId | string | معرف المستند | "contact_0080aa06-76ac-459c-aa56-cac1a46f667f" |
| _legacy | object | معلومات الترحيل | {...} |

### العلاقات
- **user_key** → users.user_key (علاقة واحد-إلى-متعدد)

### قواعد الأمان
```javascript
match /user_contacts/{doc} {
  allow read, write: if request.auth != null;
}
```
- يتطلب مصادقة للقراءة والكتابة

---

## 3. مجموعة user_capabilities

### الوصف
تحتوي على القدرات والصلاحيات لكل مستخدم، بما في ذلك التخصصات التجارية وإمكانية التوصيل.

### معرف المستند (Document ID)
- **النوع**: user_key (مثل: `011vw3`)
- **الوصف**: نفس معرف المستخدم في مجموعة users

### الحقول (Fields)

| الحقل | النوع | الوصف | مثال |
|-------|-------|-------|------|
| user_key | string | معرف المستخدم | "011vw3" |
| account_type | integer | نوع الحساب (بتات) | 33 |
| primary_main_category_id | integer | معرف الفئة الرئيسية الأساسية | 5 |
| has_business_specialties | integer | هل لديه تخصصات تجارية؟ | 1 / 0 |
| has_sellable_specialties | integer | هل لديه تخصصات قابلة للبيع؟ | 1 / 0 |
| can_deliver | integer | هل يمكنه التوصيل؟ | 0 / 1 |
| normalized_business_category | string | الفئات التجارية الموحدة (JSON) | "{\"5\":[\"1\",\"2\"]}" |
| specialty_profile_json | string | ملف تعريف التخصصات (JSON) | "{\"version\":1,...}" |
| created_at | timestamp | تاريخ الإنشاء | "2026-04-08T05:19:41.447Z" |
| updated_at | timestamp | تاريخ التحديث | "2026-05-21T02:31:15.611Z" |
| _docId | string | معرف المستند | "011vw3" |

### تفاصيل الحقول المهمة

#### normalized_business_category
سلسلة JSON تحتوي على الفئات التجارية الموحدة:
```json
{
  "5": ["1", "2"]
}
```

#### specialty_profile_json
سلسلة JSON تحتوي على ملف تعريف التخصصات الكامل:
```json
{
  "version": 1,
  "accountType": 33,
  "categoryMap": {
    "5": ["1", "2"]
  },
  "entries": [
    {
      "mainId": "5",
      "subId": "1"
    },
    {
      "mainId": "5",
      "subId": "2"
    }
  ],
  "mainCategoryIds": ["5"],
  "subCategoryIds": ["1", "2"],
  "nonDeliveryMainCategoryIds": ["5"],
  "primaryMainCategoryId": "5",
  "hasBusinessSpecialties": true,
  "hasSellableSpecialties": true,
  "isBuyer": true,
  "isServiceProvider": true,
  "canDeliver": false,
  "settings": {
    "isDelivered": 0,
    "ratingMode": "stars_comments",
    "productRatingMode": "stars_comments",
    "productRatingEnabled": true,
    "ratingEnabled": true
  }
}
```

### العلاقات
- **user_key** → users.user_key (علاقة واحد-إلى-واحد)

### قواعد الأمان
```javascript
match /user_capabilities/{userId} {
  allow read, write: if request.auth != null;
}
```
- يتطلب مصادقة للقراءة والكتابة

---

## 4. مجموعة user_specialties

### الوصف
تحتوي على التخصصات والفئات المرتبطة بكل مستخدم. كل سجل يمثل رابطاً بين مستخدم وفئة معينة.

### معرف المستند (Document ID)
- **النوع**: user_key_mainId_subId (مثل: `682dri6b_1_1`)
- **الوصف**: معرف فريد يتكون من معرف المستخدم ومعرف الفئة الرئيسية ومعرف الفئة الفرعية

### الحقول (Fields)

| الحقل | النوع | الوصف | مثال |
|-------|-------|-------|------|
| id | string | معرف التخصص | "682dri6b_1_1" |
| user_key | string | معرف المستخدم | "682dri6b" |
| main_category_id | integer | معرف الفئة الرئيسية | 1 |
| sub_category_id | integer | معرف الفئة الفرعية | 1 |
| source | string | مصدر التخصص | "browser_update", "browser_create" |
| created_at | timestamp | تاريخ الإنشاء | "2026-06-05T02:53:45.082Z" |
| updated_at | timestamp | تاريخ التحديث | "2026-06-05T02:53:45.082Z" |
| _docId | string | معرف المستند | "682dri6b_1_1" |

### العلاقات
- **user_key** → users.user_key (علاقة واحد-إلى-متعدد)
- **main_category_id** → فئات النظام
- **sub_category_id** → فئات فرعية للنظام

### قواعد الأمان
```javascript
match /user_specialties/{doc} {
  allow read:  if true;
  allow write: if false;
}
```
- قراءة عامة للجميع
- كتابة ممنوعة (تتم عبر syncSpecialtyState)

---

## 5. مجموعة user_tokens

### الوصف
تحتوي على رموز FCM (Firebase Cloud Messaging) للإشعارات لكل مستخدم.

### معرف المستند (Document ID)
- **النوع**: user_key (مثل: `12097`)
- **الوصف**: معرف المستخدم

### الحقول (Fields)

| الحقل | النوع | الوصف | مثال |
|-------|-------|-------|------|
| id | integer/string | معرف الرمز | 12097 |
| user_key | string | معرف المستخدم | "q2pnmi" |
| fcm_token | string | رمز FCM للإشعارات | "c1dvb7qnSmOBRUIB3NN1jt:APA91b..." |
| platform | string | المنصة | "android", "ios" |
| created_at | timestamp | تاريخ الإنشاء | "2026-01-08 20:30:01" |
| _docId | string | معرف المستند | "12097" |
| _legacy | object | معلومات الترحيل | {...} |

### العلاقات
- **user_key** → users.user_key (علاقة واحد-إلى-واحد)

### قواعد الأمان
```javascript
match /user_tokens/{userId} {
  allow read, write: if request.auth != null;
}
```
- يتطلب مصادقة للقراءة والكتابة

---

## 6. مجموعة merchant_ratings_v2

### الوصف
تحتوي على تقييمات التجار. هذه المجموعة فارغة حالياً.

### معرف المستند (Document ID)
- **النوع**: mrt_<id> (مثل: `mrt_example_1`)
- **الوصف**: معرف فريد لكل تقييم

### الحقول (Fields) (متوقعة)

| الحقل | النوع | الوصف | مثال |
|-------|-------|-------|------|
| id | string | معرف التقييم | "mrt_example_1" |
| merchant_user_key | string | معرف التاجر | "merchant_key" |
| actor_user_key | string | معرف المقيم | "rater_key" |
| actor_name | string | اسم المقيم | "Rater Name" |
| rating | integer | التقييم (1-5) | 5 |
| note | string | ملاحظة | "Excellent merchant" |
| created_at | timestamp | تاريخ الإنشاء | "2026-06-05T10:00:00.000Z" |
| updated_at | timestamp | تاريخ التحديث | "2026-06-05T10:00:00.000Z" |

### العلاقات
- **merchant_user_key** → users.user_key (التاجر)
- **actor_user_key** → users.user_key (المقيم)

### قواعد الأمان
```javascript
match /merchant_ratings_v2/{doc} {
  allow read:  if true;
  allow write: if request.auth != null;
}
```
- قراءة عامة للجميع
- كتابة تتطلب مصادقة

---

## العلاقات بين المجموعات

```mermaid
graph TD
    A[users] -->|user_key| B[user_contacts]
    A -->|user_key| C[user_capabilities]
    A -->|user_key| D[user_tokens]
    A -->|user_key| E[user_specialties]
    A -->|user_key| F[merchant_ratings_v2 as merchant]
    A -->|user_key| G[merchant_ratings_v2 as actor]
    
    style A fill:#e1f5ff
    style B fill:#fff4e1
    style C fill:#ffe1f5
    style D fill:#f5ffe1
    style E fill:#ffe1f5
    style F fill:#fff4e1
    style G fill:#fff4e1
```

### وصف العلاقات

1. **users → user_contacts**: واحد-إلى-متعدد
   - كل مستخدم يمكن أن يمتلك عدة أرقام هاتف
   - user_contacts.user_key = users.user_key

2. **users → user_capabilities**: واحد-إلى-واحد
   - كل مستخدم لديه سجل قدرات واحد
   - user_capabilities.user_key = users.user_key

3. **users → user_tokens**: واحد-إلى-واحد
   - كل مستخدم لديه رمز إشعارات واحد
   - user_tokens.user_key = users.user_key

4. **users → user_specialties**: واحد-إلى-متعدد
   - كل مستخدم يمكن أن يمتلك عدة تخصصات
   - user_specialties.user_key = users.user_key

5. **users → merchant_ratings_v2 (as merchant)**: واحد-إلى-متعدد
   - كل تاجر يمكن أن يتلقى عدة تقييمات
   - merchant_ratings_v2.merchant_user_key = users.user_key

6. **users → merchant_ratings_v2 (as actor)**: واحد-إلى-متعدد
   - كل مستخدم يمكن أن يقيم عدة تجار
   - merchant_ratings_v2.actor_user_key = users.user_key

---

## قواعد الأمان (Security Rules)

### الكامل
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // قراءة عامة للتخصصات
    match /user_specialties/{doc} {
      allow read:  if true;
      allow write: if false;
    }

    // بيانات المستخدم الأساسية — تتطلب مصادقة
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }

    match /user_contacts/{doc} {
      allow read, write: if request.auth != null;
    }

    match /user_capabilities/{userId} {
      allow read, write: if request.auth != null;
    }

    match /user_tokens/{userId} {
      allow read, write: if request.auth != null;
    }

    // التقييمات — قراءة عامة، كتابة تتطلب مصادقة
    match /merchant_ratings_v2/{doc} {
      allow read:  if true;
      allow write: if request.auth != null;
    }
  }
}
```

### ملخص الصلاحيات

| المجموعة | قراءة (Read) | كتابة (Write) |
|---------|-------------|---------------|
| users | مصادقة | مصادقة |
| user_contacts | مصادقة | مصادقة |
| user_capabilities | مصادقة | مصادقة |
| user_tokens | مصادقة | مصادقة |
| user_specialties | عامة | ممنوعة |
| merchant_ratings_v2 | عامة | مصادقة |

---

## الفهارس المركبة (Composite Indexes)

### الفهارس المعرفة

| # | المجموعة | الحقول | الترتيب | الاستخدام |
|---|---------|--------|---------|-----------|
| 1 | users | account_type, updated_at, __name__ | ASC, DESC, DESC | فلترة account_type + ترقيم |
| 2 | users | username, updated_at, __name__ | ASC, DESC, DESC | البحث باسم المستخدم + ترقيم |
| 3 | users | account_type, username, updated_at, __name__ | ASC, ASC, DESC, DESC | فلترة account_type + username + ترقيم |

### ملف الفهارس (firestore.indexes.json)
```json
{
  "indexes": [
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "account_type", "order": "ASCENDING" },
        { "fieldPath": "updated_at",   "order": "DESCENDING" },
        { "fieldPath": "__name__",     "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "username",   "order": "ASCENDING" },
        { "fieldPath": "updated_at", "order": "DESCENDING" },
        { "fieldPath": "__name__",   "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "account_type", "order": "ASCENDING" },
        { "fieldPath": "username",     "order": "ASCENDING" },
        { "fieldPath": "updated_at",   "order": "DESCENDING" },
        { "fieldPath": "__name__",     "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

---

## العمليات المدعومة

### عمليات القراءة (Read Operations)

| العملية | الوصف | المجموعات |
|---------|-------|-----------|
| getDoc | جلب مستند واحد | جميع المجموعات |
| listDocs | قائمة المستندات مع ترقيم | جميع المجموعات |
| listAllDocs | قائمة جميع المستندات | جميع المجموعات |
| runQuery | استعلام معقد | جميع المجموعات |
| runQueryPaginated | استعلام مع ترقيم بالكورسور | users, user_specialties |
| findByField | البحث بحقل واحد | جميع المجموعات |
| findByFieldIn | البحث بحقل IN (متعدد) | users, user_specialties |

### عمليات الكتابة (Write Operations)

| العملية | الوصف | المجموعات |
|---------|-------|-----------|
| setDoc | إنشاء/تحديث مستند | جميع المجموعات |
| deleteDoc | حذف مستند | جميع المجموعات |
| deleteByField | حذف بحقل | جميع المجموعات |
| deleteWhereAny | حذف بأي شرط | جميع المجموعات |

---

## أمثلة البيانات

### مثال مستخدم (users)
```json
{
  "_docId": "011vw3",
  "system_role": "user",
  "created_at": "2026-02-24T23:51:26.696Z",
  "Address": "ش الجيش بجوار ميدان الترعه امام اول السور",
  "user_key": "011vw3",
  "account_type": 33,
  "_firestore_id": "011vw3",
  "business_category": {
    "5": ["1", "2"]
  },
  "username": "عبد المبدي للموبيليات",
  "Password": "1170",
  "updated_at": "2026-02-24T23:51:26.696Z",
  "limitPackage": null,
  "location": "29.9918951, 32.4843479",
  "settings": {
    "productRatingMode": "stars_comments",
    "isDelivered": 0,
    "ratingMode": "stars_comments",
    "productRatingEnabled": true,
    "ratingEnabled": true
  },
  "featured_items_data": null,
  "business_sub_categories": null,
  "contacts_snapshot": [
    {
      "number": "+201000565489",
      "is_primary": true,
      "has_whatsapp": true
    }
  ],
  "read_model_updated_at": "2026-06-08T14:43:30.151Z",
  "_legacy": {
    "migratedAt": "2026-05-21T02:26:12.397Z",
    "source": "turso",
    "table": "users"
  },
  "links": {
    "tiktok": "https://www.tiktok.com/@abd_el_mobdy?_r=1&_t=ZS-94CXuCO6rrR",
    "instagram": "",
    "website": "",
    "telegram": "",
    "facebook": "https://www.facebook.com/share/1ECGqmL3XR/",
    "x": ""
  }
}
```

### مثال جهة اتصال (user_contacts)
```json
{
  "_docId": "contact_0080aa06-76ac-459c-aa56-cac1a46f667f",
  "created_at": "2026-04-10T05:53:03.440Z",
  "phone_number": "+201280936579",
  "id": "contact_0080aa06-76ac-459c-aa56-cac1a46f667f",
  "user_key": "4dpz993e",
  "_legacy": {
    "source": "turso",
    "migratedAt": "2026-05-21T02:26:23.603Z",
    "table": "user_contacts"
  },
  "is_primary": 1,
  "updated_at": "2026-04-10T05:53:03.440Z",
  "has_whatsapp": 1,
  "contact_type": "phone"
}
```

### مثال قدرات (user_capabilities)
```json
{
  "_docId": "011vw3",
  "updated_at": "2026-05-21T02:31:15.611Z",
  "normalized_business_category": "{\"5\":[\"1\",\"2\"]}",
  "account_type": 33,
  "has_sellable_specialties": 1,
  "specialty_profile_json": "{\"version\":1,\"accountType\":33,\"categoryMap\":{\"5\":[\"1\",\"2\"]},\"entries\":[{\"mainId\":\"5\",\"subId\":\"1\"},{\"mainId\":\"5\",\"subId\":\"2\"}],\"mainCategoryIds\":[\"5\"],\"subCategoryIds\":[\"1\",\"2\"],\"nonDeliveryMainCategoryIds\":[\"5\"],\"primaryMainCategoryId\":\"5\",\"hasBusinessSpecialties\":true,\"hasSellableSpecialties\":true,\"isBuyer\":true,\"isServiceProvider\":true,\"canDeliver\":false,\"settings\":{\"isDelivered\":0,\"ratingMode\":\"stars_comments\",\"productRatingMode\":\"stars_comments\",\"productRatingEnabled\":true,\"ratingEnabled\":true}}",
  "has_business_specialties": 1,
  "can_deliver": 0,
  "primary_main_category_id": 5,
  "user_key": "011vw3",
  "created_at": "2026-04-08T05:19:41.447Z"
}
```

### مثال تخصص (user_specialties)
```json
{
  "_docId": "682dri6b_1_1",
  "user_key": "682dri6b",
  "created_at": "2026-06-05T02:53:45.082Z",
  "main_category_id": "1",
  "source": "browser_update",
  "updated_at": "2026-06-05T02:53:45.082Z",
  "sub_category_id": "1",
  "id": "682dri6b_1_1"
}
```

### مثال رمز إشعارات (user_tokens)
```json
{
  "_docId": "12097",
  "platform": "android",
  "created_at": "2026-01-08 20:30:01",
  "user_key": "q2pnmi",
  "_legacy": {
    "source": "turso",
    "migratedAt": "2026-05-21T02:26:50.197Z",
    "table": "user_tokens"
  },
  "fcm_token": "c1dvb7qnSmOBRUIB3NN1jt:APA91bGwMegKYwPDjjFbiHcHxGzZZgQPV5Xm-aahQ0q6yr-Ela9qqEuO8SCd07fMrAsRxjF4SbwJFzVTFLD9PlDFAPKsoWa0MLOC0Ix1rkzyyrwAfvc9BdY",
  "id": 12097
}
```

---

## إحصائيات قاعدة البيانات

### إحصائيات النسخة الاحتياطية (آخر نسخة: 2026-06-08)

| المجموعة | عدد المستندات | وقت النسخ (ثانية) |
|---------|--------------|-------------------|
| users | 144 | 1.4 |
| user_contacts | 155 | 0.4 |
| user_capabilities | 144 | 0.6 |
| user_specialties | 236 | 0.4 |
| user_tokens | 38 | 0.3 |
| merchant_ratings_v2 | 0 | 0.2 |
| **الإجمالي** | **717** | **3.8** |

### توزيع account_type (من البيانات الفعلية)
- **33** (مشتري + موصل): الأكثر شيوعاً
- **17** (مشتري + مالك): شائع
- **1** (مشتري فقط): شائع
- **3** (مشتري + بائع): شائع

### توزيع الفئات (من user_specialties)
- الفئة **1** (السيارات): الأكثر شيوعاً
- الفئة **2** (العقارات): شائعة
- الفئة **5** (الصيدليات): شائعة

---

## الملفات المصدر

### ملفات التكوين
- `firestore.rules` - قواعد الأمان
- `firestore.indexes.json` - الفهارس المركبة
- `firebase.json` - تكوين Firebase
- `.firebaserc` - إعدادات المشروع

### ملفات البيانات المحلية
- `local_db/users.json` - بيانات المستخدمين
- `local_db/user_contacts.json` - بيانات جهات الاتصال
- `local_db/user_capabilities.json` - بيانات القدرات
- `local_db/user_specialties.json` - بيانات التخصصات
- `local_db/user_tokens.json` - بيانات رموز الإشعارات
- `local_db/merchant_ratings_v2.json` - بيانات التقييمات
- `local_db/_backup_meta.json` - معلومات النسخ الاحتياطي

### ملفات الوثائق
- `FIREBASE_API_GUIDE.md` - دليل API
- `README.md` - ملف القراءة
- `API_CALLS_FROM_SUEZ_BAZAAR.md` - استدعاءات API من suez-bazaar-devolper
- `READ_FLOW_GRAPH.md` - مخطط تدفق القراءات

### ملفات الأدوات
- `backup.js` - أداة النسخ الاحتياطي
- `deploy-indexes.js` - أداة نشر الفهارس
- `package.json` - تبعيات npm

---

## الملاحظات الهامة

### 1. نظام البتات في account_type
يستخدم نظام البتات (Bitwise) لتعديد الأدوار. هذا يسمح للمستخدم بامتلاك عدة أدوار في نفس الوقت.

### 2. البيانات المتداخلة (Nested Data)
بعض الحقول تحتوي على بيانات JSON متداخلة مثل:
- `business_category` (object)
- `settings` (object)
- `links` (object)
- `normalized_business_category` (string JSON)
- `specialty_profile_json` (string JSON)

### 3. الترحيل (Migration)
البيانات تحتوي على حقل `_legacy` الذي يشير إلى أن البيانات تم ترحيلها من مصدر آخر (turso).

### 4. الكاش المحلي
التطبيق يستخدم MerchantRegistry للكاش المحلي لتقليل الاستدعاءات إلى قاعدة البيانات.

### 5. الترطيب (Hydration)
عند جلب مستخدم، يتم تحميل البيانات المرتبطة من المجموعات الأخرى (user_contacts, user_capabilities, user_specialties) عبر دالة hydrateUsers.

### 6. المجموعات للقراءة العامة
- `user_specialties`: قراءة عامة للجميع
- `merchant_ratings_v2`: قراءة عامة للجميع

### 7. المجموعات المحمية
- `users`, `user_contacts`, `user_capabilities`, `user_tokens`: تتطلب مصادقة للقراءة والكتابة

### 8. الفهارس المركبة
الفهارس المركبة ضرورية للاستعلامات المعقدة على مجموعة users. بدونها، ستفشل الاستعلامات.

---

**تاريخ الإنشاء**: 2026-06-09  
**المصدر**: C:\Users\hesham\Desktop\users  
**Project ID**: users-baad9
