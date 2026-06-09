# خطة تحسين قراءة Firestore الشاملة (Full System Rewrite Plan)

## 🎯 الهدف الأساسي

تقليل عمليات القراءة من Firestore بنسبة 80% إلى 95% من خلال:
- إزالة الترطيب (hydration) بالكامل
- إيقاف نمط القراءة من مجموعات متعددة
- إعادة هيكلة البيانات (denormalization)
- إنشاء نظام عرض مادي (materialized view)
- تنفيذ طبقات كاش متعددة

---

## ⚠️ القواعد غير القابلة للتفاوض (Hard Constraints)

### 1. إزالة الترطيب بالكامل
❌ **ممنوع**:
- `hydrateUsers()`
- `getDoc()` متداخل داخل عمليات القائمة
- عمليات الربط (joins) بين المجموعات في وقت التشغيل

### 2. إيقاف نمط القراءة من مجموعات متعددة
❌ **ممنوع**:
- قراءة `user_contacts` لكل مستخدم
- قراءة `user_capabilities` لكل مستخدم
- قراءة `user_specialties` لكل مستخدم
- قراءة `user_tokens` لكل مستخدم

### 3. إعادة هيكلة مجموعة users (إلزامي)
✅ **مطلوب**: دمج جميع البيانات المرتبطة في مستند واحد

### 4. تقسيم مستويات API
✅ **مطلوب**: فصل API للقوائم (shallow) و API للملفات الشخصية (full)

### 5. إنشاء نظام عرض مادي
✅ **مطلوب**: مجموعة `users_view` للبحث والفلترة

### 6. استبدال منطق البحث
✅ **مطلوب**: استخدام استعلام واحد على `users_view` فقط

### 7. تنفيذ طبقات الكاش
✅ **مطلوب**: 3 طبقات كاش (Server, Edge, Client)

### 8. اتباع قواعد استعلام Firestore
✅ **مسموح**: getDoc واحد، runQuery ضحل، استعلامات users_view
❌ **ممنوع**: قراءات متعددة، joins، hydration

### 9. إعادة تصميم API
✅ **مطلوب**: `/api/users` (خفيف)، `/api/user_profile` (كامل)، `/api/search_users` (users_view)

### 10. تحقيق أهداف الأداء
✅ **مطلوب**: قائمة 5-15 قراءات، ملف شخصي 1 قراءة، بحث 1-3 قراءات

---

## 📋 المرحلة 1: التحليل والتخطيط (المدة: 2-3 أيام)

### 1.1 تدقيق النظام الحالي
**الهدف**: فهم الوضع الحالي تماماً

**المهام**:
- [ ] تحليل جميع نقاط استخدام `hydrateUsers()`
- [ ] تحليل جميع عمليات القراءة من مجموعات متعددة
- [ ] تحليل جميع استعلامات البحث الحالية
- [ ] تحليل جميع نقاط استخدام `findByField` و `findByFieldIn`
- [ ] تحليل جميع نقاط استخدام `MerchantRegistry`
- [ ] إنشاء خريطة كاملة لتدفق البيانات الحالي

**الملفات المراجعة**:
- `js/shared/firestore-identity/handle-users.js`
- `js/shared/firestore-identity/list-users.js`
- `js/shared/firestore-identity/hydrate-users.js`
- `js/api-client/db-clients.js`
- `js/shared/firestore-identity/specialties.js`

**المخرجات**:
- تقرير تدقيق شامل
- خريطة تدفق البيانات الحالية
- قائمة بجميع النقاط التي تحتاج تعديل

### 1.2 تصميم الهيكل الجديد
**الهدف**: تصميم الهيكل المعاد هيكلته

**المهام**:
- [ ] تصميم هيكل `users` المعاد هيكلته
- [ ] تصميم هيكل `users_view`
- [ ] تصميم نقاط النهاية الجديدة للـ API
- [ ] تصميم استراتيجية الكاش
- [ ] تصميم استراتيجية الترحيل

**المخرجات**:
- مواصفات الهيكل الجديد
- مواصفات API الجديدة
- مواصفات الكاش
- خطة الترحيل

---

## 📋 المرحلة 2: إنشاء البنية التحتية الجديدة (المدة: 3-4 أيام)

### 2.1 إنشاء مجموعة users_view
**الهدف**: إنشاء مجموعة العرض المادي للبحث

**الهيكل المقترح**:
```json
{
  "user_key": "011vw3",
  "username": "عبد المبدي للموبيليات",
  "search_tokens": [
    "عبد",
    "المبدي",
    "للموبيليات",
    "+201000565489"
  ],
  "category_keys": [
    "5_1",
    "5_2"
  ],
  "is_delivery": false,
  "account_type": 33,
  "location": "29.9918951, 32.4843479",
  "updated_at": "2026-06-09T00:00:00.000Z"
}
```

**الفهارس المطلوبة**:
```json
{
  "indexes": [
    {
      "collectionGroup": "users_view",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "search_tokens", "order": "ASCENDING" },
        { "fieldPath": "username", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "users_view",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "category_keys", "order": "ASCENDING" },
        { "fieldPath": "updated_at", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "users_view",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "is_delivery", "order": "ASCENDING" },
        { "fieldPath": "updated_at", "order": "DESCENDING" }
      ]
    }
  ]
}
```

**المهام**:
- [ ] إنشاء `firestore.indexes.json` للفهارس الجديدة
- [ ] نشر الفهارس إلى Firebase Console
- [ ] إنشاء سكريبت الترحيل الأولي لـ `users_view`
- [ ] تنفيذ الترحيل الأولي
- [ ] التحقق من صحة البيانات

**سكريبت الترحيل الأولي**:
```javascript
// migrate-to-users-view.js
const { getDoc, listAllDocs, setDoc } = require('./db-clients');

async function migrateToUsersView() {
  const users = await listAllDocs('users');
  
  for (const user of users) {
    const searchTokens = [
      user.username?.toLowerCase(),
      user.phone,
      user.username?.split(' ').map(w => w.toLowerCase())
    ].flat().filter(Boolean);
    
    const categoryKeys = [];
    if (user.business_category) {
      Object.entries(user.business_category).forEach(([main, subs]) => {
        subs.forEach(sub => categoryKeys.push(`${main}_${sub}`));
      });
    }
    
    const isDelivery = (user.account_type & 32) === 32;
    
    await setDoc('users_view', user.user_key, {
      user_key: user.user_key,
      username: user.username,
      search_tokens: searchTokens,
      category_keys: categoryKeys,
      is_delivery: isDelivery,
      account_type: user.account_type,
      location: user.location,
      updated_at: user.updated_at
    });
  }
}
```

### 2.2 إعادة هيكلة مجموعة users
**الهدف**: دمج جميع البيانات المرتبطة في مستند واحد

**الهيكل الجديد المقترح**:
```json
{
  "user_key": "011vw3",
  "username": "عبد المبدي للموبيليات",
  "phone": "+201000565489",
  "Password": "1170",
  "account_type": 33,
  "system_role": "user",
  
  "profile": {
    "address": "ش الجيش بجوار ميدان الترعه امام اول السور",
    "location": "29.9918951, 32.4843479",
    "links": {
      "tiktok": "https://www.tiktok.com/@abd_el_mobdy",
      "facebook": "https://www.facebook.com/share/1ECGqmL3XR/",
      "instagram": "",
      "website": "",
      "telegram": "",
      "x": ""
    },
    "settings": {
      "productRatingMode": "stars_comments",
      "isDelivered": 0,
      "ratingMode": "stars_comments",
      "productRatingEnabled": true,
      "ratingEnabled": true
    }
  },
  
  "capabilities": {
    "can_deliver": false,
    "main_category_id": 5,
    "categories": {
      "5": ["1", "2"]
    },
    "has_business_specialties": true,
    "has_sellable_specialties": true
  },
  
  "contacts": [
    {
      "phone": "+201000565489",
      "is_primary": true,
      "has_whatsapp": true,
      "contact_type": "phone"
    }
  ],
  
  "specialties": [
    { "main": 5, "sub": 1 },
    { "main": 5, "sub": 2 }
  ],
  
  "search_index": {
    "username_lower": "عبد المبدي للموبيليات",
    "phone_normalized": "+201000565489"
  },
  
  "created_at": "2026-02-24T23:51:26.696Z",
  "updated_at": "2026-06-09T00:00:00.000Z",
  "last_login_at": "2026-06-05T10:00:00.000Z"
}
```

**المهام**:
- [ ] إنشاء سكريبت إعادة الهيكلة
- [ ] تنفيذ إعادة الهيكلة على جميع المستخدمين الحاليين
- [ ] التحقق من صحة البيانات
- [ ] تحديث الفهارس إذا لزم الأمر

**سكريبت إعادة الهيكلة**:
```javascript
// denormalize-users.js
const { getDoc, listAllDocs, setDoc, findByField } = require('./db-clients');

async function denormalizeUsers() {
  const users = await listAllDocs('users');
  
  for (const user of users) {
    // جلب البيانات المرتبطة
    const contacts = await findByField('user_contacts', 'user_key', user.user_key);
    const capabilities = await getDoc('user_capabilities', user.user_key);
    const specialties = await findByField('user_specialties', 'user_key', user.user_key);
    
    // بناء الهيكل الجديد
    const denormalizedUser = {
      user_key: user.user_key,
      username: user.username,
      phone: user.phone,
      Password: user.Password,
      account_type: user.account_type,
      system_role: user.system_role,
      
      profile: {
        address: user.Address,
        location: user.location,
        links: user.links || {},
        settings: user.settings || {}
      },
      
      capabilities: {
        can_deliver: capabilities?.can_deliver === 1,
        main_category_id: capabilities?.primary_main_category_id,
        categories: user.business_category || {},
        has_business_specialties: capabilities?.has_business_specialties === 1,
        has_sellable_specialties: capabilities?.has_sellable_specialties === 1
      },
      
      contacts: contacts.map(c => ({
        phone: c.phone_number,
        is_primary: c.is_primary === 1,
        has_whatsapp: c.has_whatsapp === 1,
        contact_type: c.contact_type
      })),
      
      specialties: specialties.map(s => ({
        main: s.main_category_id,
        sub: s.sub_category_id
      })),
      
      search_index: {
        username_lower: user.username?.toLowerCase(),
        phone_normalized: user.phone
      },
      
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login_at: user.last_login_at
    };
    
    await setDoc('users', user.user_key, denormalizedUser);
  }
}
```

### 2.3 إنشاء طبقة الكاش
**الهدف**: تنفيذ 3 طبقات كاش

#### 2.3.1 كاش الذاكرة على السيرفر (Server Memory Cache)
**التقنية**: LRU Cache
**TTL**: 5-10 دقائق

**المفاتيح**:
- `users:list:{params_hash}` - قوائم المستخدمين
- `user:profile:{user_key}` - ملفات المستخدمين
- `search:{query_hash}` - نتائج البحث

**التنفيذ**:
```javascript
// cache/server-cache.js
const LRU = require('lru-cache');

const serverCache = new LRU({
  max: 500,
  ttl: 1000 * 60 * 10, // 10 دقائق
  updateAgeOnGet: true
});

function getCacheKey(type, params) {
  return `${type}:${JSON.stringify(params)}`;
}

async function getCached(type, params) {
  const key = getCacheKey(type, params);
  return serverCache.get(key);
}

async function setCached(type, params, data) {
  const key = getCacheKey(type, params);
  serverCache.set(key, data);
}

async function invalidateUser(userKey) {
  // إبطال جميع الكاش المرتبط بالمستخدم
  for (const [key] of serverCache.entries()) {
    if (key.includes(userKey)) {
      serverCache.delete(key);
    }
  }
}

module.exports = { getCached, setCached, invalidateUser };
```

#### 2.3.2 كاش الحافة (Edge Cache)
**التقنية**: HTTP Cache Headers
**TTL**: 60 ثانية

**التنفيذ**:
```javascript
// cache/edge-cache.js
function setCacheHeaders(res, maxAge = 60) {
  res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
  res.setHeader('ETag', generateETag(res.data));
}

function generateETag(data) {
  return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
}
```

#### 2.3.3 كاش العميل (Client Cache)
**التقنية**: IndexedDB
**الاستراتيجية**: كاش منفصل للملفات الشخصية والقوائم

**التنفيذ**:
```javascript
// cache/client-cache.js
class ClientCache {
  constructor() {
    this.dbName = 'users-cache';
    this.db = null;
  }
  
  async init() {
    this.db = await idb.openDB(this.dbName, 1, {
      upgrade(db) {
        db.createObjectStore('profiles', { keyPath: 'user_key' });
        db.createObjectStore('lists', { keyPath: 'key' });
      }
    });
  }
  
  async getProfile(userKey) {
    return await this.db.get('profiles', userKey);
  }
  
  async setProfile(userKey, data) {
    await this.db.put('profiles', { user_key: userKey, ...data, cached_at: Date.now() });
  }
  
  async getList(key) {
    return await this.db.get('lists', key);
  }
  
  async setList(key, data) {
    await this.db.put('lists', { key, ...data, cached_at: Date.now() });
  }
  
  async invalidate() {
    await this.db.clear('lists');
  }
}
```

---

## 📋 المرحلة 3: إعادة تصميم API (المدة: 3-4 أيام)

### 3.1 إعادة تصميم /api/users (LIST API)
**الهدف**: API خفيف يعيد بيانات ضحلة فقط

**الاستجابة الجديدة**:
```json
{
  "users": [
    {
      "user_key": "011vw3",
      "username": "عبد المبدي للموبيليات",
      "account_type": 33,
      "location": "29.9918951, 32.4843479"
    }
  ],
  "nextCursor": "base64_cursor",
  "count": 20
}
```

**المعاملات المسموح بها**:
- `limit` - عدد النتائج (max: 100)
- `cursor` - كورسور للترقيم
- `mode` - delivery_users, default
- `role` - فلترة account_type

**التنفيذ**:
```javascript
// api/users-list.js
async function handleUsersList(params) {
  // التحقق من الكاش
  const cacheKey = `users:list:${JSON.stringify(params)}`;
  const cached = await getCached(cacheKey);
  if (cached) return cached;
  
  // استعلام واحد فقط
  let query;
  if (params.get('mode') === 'delivery_users') {
    query = {
      where: fieldFilter('is_delivery', 'EQUAL', true),
      orderBy: [
        { field: { fieldPath: 'updated_at' }, direction: 'DESCENDING' }
      ],
      limit: parseInt(params.get('limit') || '20')
    };
  } else {
    query = {
      orderBy: [
        { field: { fieldPath: 'updated_at' }, direction: 'DESCENDING' }
      ],
      limit: parseInt(params.get('limit') || '20')
    };
  }
  
  const result = await runQueryPaginated('users', query.where, {
    pageSize: query.limit,
    orderBy: query.orderBy,
    startAfterCursor: params.get('cursor')
  });
  
  // استجابة ضحلة فقط
  const users = result.docs.map(doc => ({
    user_key: doc.user_key,
    username: doc.username,
    account_type: doc.account_type,
    location: doc.profile?.location
  }));
  
  const response = {
    users,
    nextCursor: result.nextCursor,
    count: users.length
  };
  
  // حفظ في الكاش
  await setCached(cacheKey, response);
  
  return response;
}
```

### 3.2 إنشاء /api/user_profile (PROFILE API)
**الهدف**: API جديد يعيد المستند المعاد هيكلته بالكامل

**الاستجابة**:
```json
{
  "user_key": "011vw3",
  "username": "عبد المبدي للموبيليات",
  "phone": "+201000565489",
  "account_type": 33,
  "profile": { ... },
  "capabilities": { ... },
  "contacts": [ ... ],
  "specialties": [ ... ],
  "search_index": { ... },
  "created_at": "2026-02-24T23:51:26.696Z",
  "updated_at": "2026-06-09T00:00:00.000Z"
}
```

**المعاملات**:
- `user_key` - معرف المستخدم (مطلوب)

**التنفيذ**:
```javascript
// api/user-profile.js
async function handleUserProfile(params) {
  const userKey = params.get('user_key');
  if (!userKey) {
    return { error: 'user_key required', code: 'INVALID_REQUEST' };
  }
  
  // التحقق من الكاش
  const cacheKey = `user:profile:${userKey}`;
  const cached = await getCached(cacheKey);
  if (cached) return cached;
  
  // قراءة واحدة فقط
  const user = await getDoc('users', userKey);
  if (!user) {
    return { error: 'User not found', code: 'USER_NOT_FOUND' };
  }
  
  // حفظ في الكاش
  await setCached(cacheKey, user);
  
  return user;
}
```

### 3.3 إنشاء /api/search_users (SEARCH API)
**الهدف**: API جديد للبحث باستخدام users_view فقط

**الاستجابة**:
```json
{
  "users": [
    {
      "user_key": "011vw3",
      "username": "عبد المبدي للموبيليات",
      "account_type": 33,
      "location": "29.9918951, 32.4843479"
    }
  ],
  "nextCursor": "base64_cursor",
  "count": 20
}
```

**المعاملات**:
- `searchTerm` - نص البحث
- `main_category_id` - الفئة الرئيسية
- `sub_category_id` - الفئة الفرعية
- `is_delivery` - فلترة الموصلين
- `limit` - عدد النتائج
- `cursor` - كورسور للترقيم

**التنفيذ**:
```javascript
// api/search-users.js
async function handleSearchUsers(params) {
  const searchTerm = params.get('searchTerm');
  const mainId = params.get('main_category_id');
  const subId = params.get('sub_category_id');
  const isDelivery = params.get('is_delivery');
  const limit = parseInt(params.get('limit') || '20');
  
  // التحقق من الكاش
  const cacheKey = `search:${JSON.stringify(params)}`;
  const cached = await getCached(cacheKey);
  if (cached) return cached;
  
  // بناء الاستعلام
  const filters = [];
  
  if (searchTerm) {
    filters.push(fieldFilter('search_tokens', 'ARRAY_CONTAINS', searchTerm.toLowerCase()));
  }
  
  if (mainId && subId) {
    filters.push(fieldFilter('category_keys', 'ARRAY_CONTAINS', `${mainId}_${subId}`));
  }
  
  if (isDelivery) {
    filters.push(fieldFilter('is_delivery', 'EQUAL', true));
  }
  
  const where = filters.length > 0 ? compositeFilter(filters) : null;
  
  const result = await runQueryPaginated('users_view', where, {
    pageSize: limit,
    orderBy: [
      { field: { fieldPath: 'updated_at' }, direction: 'DESCENDING' }
    ],
    startAfterCursor: params.get('cursor')
  });
  
  // استجابة ضحلة
  const users = result.docs.map(doc => ({
    user_key: doc.user_key,
    username: doc.username,
    account_type: doc.account_type,
    location: doc.location
  }));
  
  const response = {
    users,
    nextCursor: result.nextCursor,
    count: users.length
  };
  
  // حفظ في الكاش
  await setCached(cacheKey, response);
  
  return response;
}
```

### 3.4 تحديث handle-users.js
**الهدف**: إزالة الترطيب واستخدام الهياكل الجديدة

**التغييرات**:
- [ ] إزالة جميع استدعاءات `hydrateUsers()`
- [ ] إزالة جميع قراءات المجموعات المتعددة
- [ ] استخدام البيانات المعاد هيكلتها من `users`
- [ ] تحديث منطق التحقق من كلمة المرور
- [ ] تحديث منطق إنشاء المستخدم
- [ ] تحديث منطق تحديث المستخدم
- [ ] تحديث منطق حذف المستخدم

**التنفيذ المحدث**:
```javascript
// handle-users.js (محدث)
async function handleUsers(endpoint, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const url = new URL(endpoint, global.location.origin);
  const params = url.searchParams;
  
  if (method === "GET") {
    if (params.get("mode") === "max_id") {
      const rows = await listAllDocs("users", { maxRows: 5000 });
      return { max_id: rows.reduce((max, row) => Math.max(max, Number(row.id || 0)), 0) };
    }
    
    if (params.get("user_keys")) {
      const keys = params.get("user_keys").split(",").map(k => k.trim()).filter(Boolean);
      const cached = await getCached('users:batch', keys);
      const missing = keys.filter(k => !cached[k]);
      
      if (missing.length === 0) return Object.values(cached);
      
      const docs = await Promise.all(missing.map(k => getDoc("users", k)));
      const result = {};
      
      docs.forEach(doc => {
        result[doc.user_key] = {
          user_key: doc.user_key,
          username: doc.username,
          account_type: doc.account_type,
          location: doc.profile?.location
        };
      });
      
      return Object.values({ ...cached, ...result });
    }
    
    if (params.get("user_key")) {
      // استخدام API الملف الشخصي الجديد
      return handleUserProfile(params);
    }
    
    if (params.get("phone")) {
      const phone = normalizePhone(params.get("phone"));
      const rows = await findByField("users", "search_index.phone_normalized", phone, { limit: 1 });
      if (!rows[0]) return { error: "المستخدم غير موجود.", code: "USER_NOT_FOUND" };
      return rows[0];
    }
    
    // استخدام API القائمة الجديد
    return handleUsersList(params);
  }
  
  const payload = options.body && typeof options.body === "string" ? JSON.parse(options.body) : (options.body || {});
  
  if (method === "POST") {
    if (payload.action === "verify") {
      const phone = normalizePhone(payload.phone);
      const rows = await findByField("users", "search_index.phone_normalized", phone, { limit: 1 });
      const user = rows[0];
      if (!user || String(user.Password || "") !== String(payload.password || "")) {
        return { error: "كلمة المرور أو رقم الهاتف غير صحيح.", code: "INVALID_CREDENTIALS" };
      }
      const timestamp = nowIso();
      await setDoc("users", user.user_key, { ...user, last_login_at: timestamp, updated_at: timestamp });
      await invalidateUser(user.user_key);
      return { ...user, last_login_at: timestamp, updated_at: timestamp };
    }
    
    // إنشاء مستخدم جديد مع هيكل معاد هيكلته
    const phones = normalizePhonesPayload(payload.phones, payload);
    const aliases = derivePhoneAliases(phones);
    const existing = aliases.phone ? await findByField("users", "search_index.phone_normalized", aliases.phone, { limit: 1 }) : [];
    if (existing[0]) return { error: "رقم الهاتف هذا مسجل بالفعل.", code: "PHONE_ALREADY_EXISTS" };
    
    const timestamp = nowIso();
    const userKey = payload.user_key || randomId("user");
    
    const user = {
      user_key: userKey,
      username: payload.username,
      phone: aliases.phone,
      Password: payload.Password,
      account_type: normalizeAccountTypeValue(payload.account_type),
      system_role: "user",
      
      profile: {
        address: payload.Address,
        location: payload.location,
        links: payload.links || {},
        settings: payload.settings || {}
      },
      
      capabilities: {
        can_deliver: false,
        main_category_id: null,
        categories: {},
        has_business_specialties: false,
        has_sellable_specialties: false
      },
      
      contacts: phones.map(p => ({
        phone: p.number,
        is_primary: p.is_primary,
        has_whatsapp: p.has_whatsapp,
        contact_type: "phone"
      })),
      
      specialties: [],
      
      search_index: {
        username_lower: payload.username?.toLowerCase(),
        phone_normalized: aliases.phone
      },
      
      created_at: timestamp,
      updated_at: timestamp,
      last_login_at: timestamp
    };
    
    await setDoc("users", userKey, user);
    
    // تحديث users_view
    await updateUserView(user);
    
    await invalidateUser(userKey);
    
    return user;
  }
  
  if (method === "PUT") {
    const items = Array.isArray(payload) ? payload : [payload];
    const updated = [];
    
    for (const item of items) {
      const userKey = item.user_key || "";
      if (!userKey) continue;
      
      const current = await getDoc("users", userKey);
      if (!current) continue;
      
      const updates = { ...current, updated_at: nowIso() };
      
      if (item.username !== undefined) {
        updates.username = item.username;
        updates.search_index.username_lower = item.username.toLowerCase();
      }
      
      if (item.phone !== undefined) {
        updates.phone = item.phone;
        updates.search_index.phone_normalized = item.phone;
      }
      
      if (item.account_type !== undefined) {
        updates.account_type = normalizeAccountTypeValue(item.account_type);
      }
      
      if (item.profile) {
        updates.profile = { ...updates.profile, ...item.profile };
      }
      
      if (item.capabilities) {
        updates.capabilities = { ...updates.capabilities, ...item.capabilities };
      }
      
      if (item.contacts) {
        updates.contacts = item.contacts;
      }
      
      if (item.specialties) {
        updates.specialties = item.specialties;
      }
      
      await setDoc("users", userKey, updates);
      
      // تحديث users_view
      await updateUserView(updates);
      
      await invalidateUser(userKey);
      
      updated.push(updates);
    }
    
    return Array.isArray(payload) ? updated : updated[0];
  }
  
  if (method === "DELETE") {
    const userKey = payload.user_key || params.get("user_key");
    if (!userKey) return { error: "مفتاح المستخدم مطلوب للحذف.", code: "USER_KEY_REQUIRED" };
    
    await invalidateUser(userKey);
    
    await Promise.all([
      deleteDoc("users", userKey),
      deleteDoc("users_view", userKey)
    ]);
    
    return { success: true, deleted: true, user_key: userKey };
  }
  
  return { error: "Method Not Allowed", code: "METHOD_NOT_ALLOWED" };
}

async function updateUserView(user) {
  const searchTokens = [
    user.username?.toLowerCase(),
    user.phone,
    user.username?.split(' ').map(w => w.toLowerCase())
  ].flat().filter(Boolean);
  
  const categoryKeys = [];
  if (user.capabilities?.categories) {
    Object.entries(user.capabilities.categories).forEach(([main, subs]) => {
      subs.forEach(sub => categoryKeys.push(`${main}_${sub}`));
    });
  }
  
  const isDelivery = (user.account_type & 32) === 32;
  
  await setDoc("users_view", user.user_key, {
    user_key: user.user_key,
    username: user.username,
    search_tokens: searchTokens,
    category_keys: categoryKeys,
    is_delivery: isDelivery,
    account_type: user.account_type,
    location: user.profile?.location,
    updated_at: user.updated_at
  });
}
```

---

## 📋 المرحلة 4: إزالة الكود القديم (المدة: 2-3 أيام)

### 4.1 إزالة الترطيب
**المهام**:
- [ ] حذف `js/shared/firestore-identity/hydrate-users.js`
- [ ] إزالة جميع استدعاءات `hydrateUsers()`
- [ ] إزالة جميع استدعاءات `hydrateContacts()`
- [ ] إزالة جميع استدعاءات `hydrateCapabilities()`
- [ ] إزالة جميع استدعاءات `hydrateSpecialties()`

### 4.2 إزالة المجموعات القديمة
**المهام**:
- [ ] إيقاف الكتابة إلى `user_contacts`
- [ ] إيقاف الكتابة إلى `user_capabilities`
- [ ] إيقاف الكتابة إلى `user_specialties`
- [ ] إيقاف الكتابة إلى `user_tokens`
- [ ] الاحتفاظ بالبيانات للرجوع إليها (read-only)
- [ ] تحديث قواعد الأمان لمنع الكتابة

### 4.3 إزالة الملفات القديمة
**المهام**:
- [ ] حذف `js/shared/firestore-identity/relations.js`
- [ ] حذف `js/shared/firestore-identity/specialties.js` (أو تحديثه لاستخدام الهيكل الجديد)
- [ ] تحديث `js/shared/firestore-identity/list-users.js` لاستخدام users_view
- [ ] تحديث `js/api-client/db-clients.js` لإزالة دوال غير المستخدمة

---

## 📋 المرحلة 5: الاختبار والتحقق (المدة: 3-4 أيام)

### 5.1 اختبار الوحدة (Unit Tests)
**المهام**:
- [ ] اختبار API القائمة الجديد
- [ ] اختبار API الملف الشخصي الجديد
- [ ] اختبار API البحث الجديد
- [ ] اختبار طبقة الكاش
- [ ] اختبار إعادة الهيكلة
- [ ] اختبار users_view

### 5.2 اختبار التكامل (Integration Tests)
**المهام**:
- [ ] اختبار تدفق إنشاء المستخدم
- [ ] اختبار تدفق تحديث المستخدم
- [ ] اختبار تدفق حذف المستخدم
- [ ] اختبار تدفق البحث
- [ ] اختبار تدفق القوائم
- [ ] اختبار التزامن

### 5.3 اختبار الأداء (Performance Tests)
**المهام**:
- [ ] قياس عدد القراءات لكل عملية
- [ ] قياس زمن الاستجابة لكل عملية
- [ ] مقارنة الأداء قبل وبعد
- [ ] اختبار الحمل (Load Testing)
- [ ] اختبار الكاش

**أهداف الأداء**:
| العملية | الحد الأقصى للقراءات | الحد الأقصى للزمن |
|---------|---------------------|------------------|
| قائمة المستخدمين (صفحة) | 5-15 | < 500ms |
| ملف المستخدم | 1 | < 200ms |
| بحث المستخدمين | 1-3 | < 300ms |
| إنشاء المستخدم | 2-3 | < 500ms |
| تحديث المستخدم | 2-3 | < 500ms |

### 5.4 اختبار الكاش
**المهام**:
- [ ] اختبار كاش الذاكرة على السيرفر
- [ ] اختبار كاش الحافة
- [ ] اختبار كاش العميل
- [ ] اختبار إبطال الكاش
- [ ] اختبار TTL

---

## 📋 المرحلة 6: النشر والمراقبة (المدة: 2-3 أيام)

### 6.1 استراتيجية النشر
**النهج**: النشر التدريجي (Blue-Green Deployment)

**الخطوات**:
1. نشر الإصدار الجديد في بيئة الاختبار
2. مراقبة الأداء والأخطاء
3. نشر لـ 10% من المستخدمين
4. مراقبة المقاييس
5. زيادة إلى 50%
6. مراقبة المقاييس
7. زيادة إلى 100%

### 6.2 المراقبة
**المقاييس المراقبة**:
- عدد القراءات من Firestore لكل عملية
- زمن الاستجابة لكل عملية
- معدل إصابة الكاش (Cache Hit Rate)
- معدل الأخطاء
- استخدام الذاكرة
- استخدام الشبكة

**أدوات المراقبة**:
- Firebase Console
- Google Cloud Monitoring
- Custom Dashboard

### 6.3 خطة التراجع (Rollback Plan)
**الشروط للتراجع**:
- معدل أخطاء > 5%
- زمن استجابة > 2 ثانية
- عدد قراءات > 1000/دقيقة
- شكاوى المستخدمين

**خطوات التراجع**:
1. إعادة النشر إلى الإصدار القديم
2. تحليل السبب
3. إصلاح المشكلة
4. إعادة المحاولة

---

## 📋 المرحلة 7: التوثيق والتدريب (المدة: 1-2 يوم)

### 7.1 التوثيق الفني
**المهام**:
- [ ] تحديث `FIREBASE_API_GUIDE.md`
- [ ] إنشاء `API_REFERENCE.md` للـ API الجديد
- [ ] تحديث `DATABASE_SCHEMA.md` بالهيكل الجديد
- [ ] إنشاء `CACHE_STRATEGY.md`
- [ ] إنشاء `MIGRATION_GUIDE.md`

### 7.2 التوثيق للمطورين
**المهام**:
- [ ] إنشاء دليل استخدام API الجديد
- [ ] إنشاء دليل استخدام الكاش
- [ ] إنشاء دليل استكشاف الأخطاء
- [ ] إنشاء أمثلة الكود

### 7.3 تدريب الفريق
**المهام**:
- [ ] ورشة عمل حول الهيكل الجديد
- [ ] ورشة عمل حول API الجديد
- [ ] ورشة عمل حول الكاش
- [ ] جلسة أسئلة وأجوبة

---

## 📊 ملخص الجدول الزمني

| المرحلة | المدة | المخرجات |
|---------|------|---------|
| 1. التحليل والتخطيط | 2-3 أيام | تقرير تدقيق، خطة تصميم |
| 2. إنشاء البنية التحتية | 3-4 أيام | users_view، users المعاد هيكلته، الكاش |
| 3. إعادة تصميم API | 3-4 أيام | API الجديد، handle-users.js محدث |
| 4. إزالة الكود القديم | 2-3 أيام | كود نظيف، مجموعات قديمة متوقفة |
| 5. الاختبار والتحقق | 3-4 أيام | اختبارات، مقاييس الأداء |
| 6. النشر والمراقبة | 2-3 أيام | نشر تدريجي، مراقبة |
| 7. التوثيق والتدريب | 1-2 يوم | توثيق شامل، تدريب |
| **الإجمالي** | **16-23 يوم** | **نظام محسن بالكامل** |

---

## 🎯 أهداف النظام النهائي

### قبل التحسين
- قائمة المستخدمين: 50-100 قراءة
- ملف المستخدم: 5-10 قراءات
- بحث المستخدمين: 20-50 قراءة
- يومي: 50,000+ قراءة

### بعد التحسين
- قائمة المستخدمين: 5-15 قراءة ✅
- ملف المستخدم: 1 قراءة ✅
- بحث المستخدمين: 1-3 قراءات ✅
- يومي: <10,000 قراءة ✅

**التخفيض المتوقع**: 80-95% ✅

---

## 📝 نقاط التحقق (Checklist)

### قبل البدء
- [ ] مراجعة جميع القواعد غير القابلة للتفاوض
- [ ] فهم الهيكل الحالي تماماً
- [ ] الموافقة على الخطة من الفريق
- [ ] تحديد الموارد المطلوبة

### أثناء التنفيذ
- [ ] اتباع الخطة بدقة
- [ ] التواصل المستمر مع الفريق
- [ ] مراجعة الكود بانتظام
- [ ] اختبار كل مرحلة قبل الانتقال للتالية

### بعد الانتهاء
- [ ] تحقيق جميع أهداف الأداء
- [ ] مراجعة جميع الاختبارات
- [ ] توثيق كل شيء
- [ ] تدريب الفريق
- [ ] مراقبة النظام لمدة أسبوع

---

## ⚠️ المخاطر والتخفيف

### المخاطر المحتملة
1. **فقدان البيانات أثناء الترحيل**
   - التخفيف: نسخ احتياطي كامل قبل الترحيل، اختبار الترحيل على عينة

2. **تدهور الأداء المؤقت**
   - التخفيف: نشر تدريجي، مراقبة مستمرة

3. **أخطاء في الكاش**
   - التخفيف: TTL قصير، آلية إبطال صحيحة

4. **مقاومة التغيير من الفريق**
   - التخفيف: تدريب شامل، توثيق واضح

5. **مشاكل التوافق**
   - التخفيف: اختبار شامل، خطة تراجع واضحة

---

## 📞 نقاط الاتصال

**مدير المشروع**: [الاسم]
**قاعدة البيانات**: [الاسم]
**التطوير**: [الاسم]
**الاختبار**: [الاسم]
**العمليات**: [الاسم]

---

**تاريخ الإنشاء**: 2026-06-09  
**الإصدار**: 1.0  
**الحالة**: قيد المراجعة
