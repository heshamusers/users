# Users Identity API Calls Documentation

## Overview
This document details all API calls sent to the Users Identity service located at:
`C:\Users\hesham\Desktop\suez-bazaar-devolper\js\shared\users-identity`

## API Call Sources Mapping

### Complete List of All API Calls with Source Information

| API Call | Method | JS File | Function | HTML Page | Description |
|----------|--------|---------|----------|-----------|-------------|
| `/api/users` | GET | js/connectUsers.js | fetchUsers() | pages/login/login.html | Fetch all users (admin dashboard) |
| `/api/users` | POST | js/connectUsers.js | addUser(userData) | pages/login/login.html | Create new user |
| `/api/users` | PUT | js/connectUsers.js | updateUser(userData) | pages/login/login.html | Update single user |
| `/api/users` | PUT | js/connectUsers.js | updateUsers(updates) | pages/login/login.html | Update multiple users |
| `/api/users` | POST | js/connectUsers.js | verifyUserPassword(phone, password) | pages/login/login.html | Verify user login credentials |
| `/api/users` | DELETE | js/connectUsers.js | deleteUser(userKey) | pages/login/login.html | Delete user |
| `/api/users` | POST | js/connectUsers.js | touchUserLastLogin(userKey) | pages/login/login.html | Update last login timestamp |
| `/api/users?last_id=X&limit=500` | GET | pages/ADMIN/adminPanel-api.js | getAllUsers_() | pages/ADMIN/adminPanel.html | Fetch users with pagination (admin) |
| `/api/users` | PUT | pages/ADMIN/adminPanel-api.js | updateUserField(userKey, field, value) | pages/ADMIN/adminPanel.html | Update specific user field |
| `/api/users?user_key=X` | GET | pages/merchant-control-panel/js/control-panel-api.js | fetchMerchant(userKey) | pages/merchant-control-panel/merchant-control-panel.html | Fetch merchant data |
| `/api/users` | PUT | pages/merchant-control-panel/js/control-panel-api.js | persistFeaturedProducts(payload) | pages/merchant-control-panel/merchant-control-panel.html | Update featured products |
| `/api/users?phone=X&exists=1` | GET | pages/register/js/register-phone-helpers.js | checkPhoneAvailability(phone) | pages/register/register.html, pages/profile-modal/profile-modal.html | Check if phone number exists |
| `/api/users?user_keys=X` | GET | pages/products/shared/view/product-ratings-core.js | fetchMissingUsers(missingKeys) | pages/products/productView/productView.html | Fetch multiple users by keys |
| `/api/users?user_key=X` | GET | pages/products/productEdit/js/edit_ui_category.js | fetchOwnerData(userKey) | pages/products/productEdit/productEdit.html | Fetch product owner data |
| `/api/users?user_key=X` | GET | pages/merchant-portfolio/js/fetch/portfolio-fetch-user.js | fetchUser(userKey) | pages/merchant-portfolio/merchant-portfolio.html | Fetch user portfolio data |
| `/api/users?user_key=X` | GET | pages/merchant-portfolio/js/services/portfolio-api.js | fetchMerchant(userKey) | pages/merchant-portfolio/merchant-portfolio.html, pages/merchant-portfolio/send-request.html | Fetch merchant data |
| `/api/users?user_keys=X` | GET | pages/merchant-portfolio/js/services/portfolio-api.js | fetchMerchantsBatch(missingKeys) | pages/merchant-portfolio/merchant-portfolio.html | Fetch multiple merchants |
| `/api/users?user_key=X` | GET | pages/merchant-portfolio/js/services/send-request/send-request-api.js | fetchMerchant(merchantKey) | pages/merchant-portfolio/send-request.html | Fetch merchant for request |
| `/api/users?user_key=X` | GET | pages/merchant-portfolio/js/pharmacy-control-panel/pharmacy-featured-control.js | fetchMerchant(userKey) | pages/merchant-portfolio/pharmacy-control-panel.html | Fetch pharmacy merchant |
| `/api/users` | PUT | pages/merchant-portfolio/js/pharmacy-control-panel/pharmacy-featured-control.js | persistFeaturedProducts(payload) | pages/merchant-portfolio/pharmacy-control-panel.html | Update pharmacy featured products |
| `/api/users?mode=category_search&main_id=X&sub_id=Y` | GET | pages/main-category/main-category-api.js | getProductsByCategory(mainId, subId) | pages/main-category/main-category.html | Fetch users by category |
| `/api/users?mode=delivery_users&limit=100` | GET | orderStage/orderData/parts/admin-partials/delivery-assignment.js | fetchDeliveryUsers() | (admin partial) | Fetch delivery users |
| `/api/users?user_key=X` | GET | pages/ADMIN/adminPanel-relations.js | fetchMerchant(userKey) | pages/ADMIN/adminPanel.html | Fetch merchant for relations |
| `/api/users` | DELETE | pages/ADMIN/adminPanel-actions.js | deleteUser(targetUserKey) | pages/ADMIN/adminPanel.html | Delete user from admin |
| `/api/tokens?userKeys=X` | GET | notification/fcm-api.js | getUsersTokensByKey(usersKeys) | pages/home/home.html | Fetch FCM tokens by user keys |
| `/api/tokens` | POST | notification/fcm-api.js | sendTokenToServer(userKey, token, platform) | pages/home/home.html | Save FCM token to server |
| `/api/tokens` | DELETE | notification/fcm-api.js | deleteTokenFromServer(userKey, token) | pages/home/home.html | Delete FCM token from server |

### Direct UsersIdentityApi Client Calls

These files use `window.UsersIdentityApi.getDoc()` directly instead of `apiFetch()`:

| API Call | Method | JS File | Function | HTML Page | Description |
|----------|--------|---------|----------|-----------|-------------|
| `getDoc("users", key)` | GET | js/api-client/real-estate.js | (inline in fetchSellers) | (loaded globally) | Fetch seller data for real estate |
| `getDoc("users", user_key)` | GET | js/api-client/products/rating-mutations.js | (inline in submitRating) | (loaded globally) | Fetch seller data for product rating |
| `getDoc("users", key)` | GET | js/api-client/products/fetch-products.js | (inline in fetchSellers) | (loaded globally) | Fetch seller data for products |
| `getDoc("users", key)` | GET | js/api-client/cars.js | (inline in fetchSellers) | (loaded globally) | Fetch seller data for cars |

**Note**: These files are loaded globally via the API client infrastructure and are used across multiple pages. They call `UsersIdentityApi.getDoc()` directly to bypass the `apiFetch()` routing layer for performance optimization.

## Configuration

### Base Configuration
- **BASE_URL**: `https://users-two-delta.vercel.app/api/identity`
- **PROJECT_ID**: `users-baad9`
- **DATABASE_NAME**: `users`
- **DATABASE_ID**: `(default)`

### Owned Collections
- `users`
- `user_contacts`
- `user_tokens`
- `user_capabilities`
- `user_specialties`
- `merchant_ratings_v2`

---

## Core Client Functions

### 1. firestoreFetch(url, options)
**Description**: Main HTTP fetch function for all API calls

**Parameters**:
- `url` (string): The API endpoint URL
- `options` (object):
  - `method` (string): HTTP method (GET, POST, PATCH, DELETE)
  - `body` (string/object): Request body for POST/PATCH requests
  - `headers` (object): Additional headers

**Behavior**:
- For POST requests with body: API key is sent in `X-API-Key` header
- For GET requests: API key is sent in URL query parameter
- Returns null for 404 responses
- Throws error for non-OK responses

**Example**:
```javascript
// POST request with body
firestoreFetch("https://users-two-delta.vercel.app/api/identity", {
  method: "POST",
  body: JSON.stringify({ action: "query", collectionName: "users" })
})

// GET request
firestoreFetch("https://users-two-delta.vercel.app/api/identity?collection=users&key=API_KEY")
```

---

### 2. getDoc(collectionName, docId)
**Description**: Fetch a single document by ID

**Parameters**:
- `collectionName` (string): Name of the collection
- `docId` (string): Document ID

**API Call**:
- **Method**: GET
- **URL**: `{BASE_URL}/{collectionName}/{docId}?key={API_KEY}`
- **Headers**: `Content-Type: application/json`

**Example**:
```javascript
getDoc("users", "user123")
// GET https://users-two-delta.vercel.app/api/identity/users/user123?key=API_KEY
```

---

### 3. setDoc(collectionName, docId, data)
**Description**: Create or update a document

**Parameters**:
- `collectionName` (string): Name of the collection
- `docId` (string): Document ID
- `data` (object): Document data to save

**API Call**:
- **Method**: POST (for /api/identity) or PATCH (for Firestore REST API)
- **URL**: `{BASE_URL}/{collectionName}/{docId}`
- **Headers**: 
  - `Content-Type: application/json`
  - `X-API-Key: {API_KEY}` (for POST requests)
- **Body**: JSON-encoded document data with encoded field values

**Example**:
```javascript
setDoc("users", "user123", {
  username: "John Doe",
  phone: "+201234567890",
  account_type: 33
})
// POST https://users-two-delta.vercel.app/api/identity/users/user123
// Headers: X-API-Key: API_KEY
// Body: {"username":"John Doe","phone":"+201234567890","account_type":33}
```

---

### 4. deleteDoc(collectionName, docId)
**Description**: Delete a document by ID

**Parameters**:
- `collectionName` (string): Name of the collection
- `docId` (string): Document ID

**API Call**:
- **Method**: DELETE
- **URL**: `{BASE_URL}/{collectionName}/{docId}?key={API_KEY}`
- **Headers**: `Content-Type: application/json`

**Example**:
```javascript
deleteDoc("users", "user123")
// DELETE https://users-two-delta.vercel.app/api/identity/users/user123?key=API_KEY
```

---

### 5. runQuery(collectionName, where, options)
**Description**: Execute a query with filters and options

**Parameters**:
- `collectionName` (string): Name of the collection
- `where` (object): Firestore where clause
- `options` (object):
  - `orderBy` (array): Order by fields
  - `limit` (number): Maximum results
  - `offset` (number): Skip results

**API Call (for /api/identity)**:
- **Method**: POST
- **URL**: `{BASE_URL}`
- **Headers**: 
  - `Content-Type: application/json`
  - `X-API-Key: {API_KEY}`
- **Body**:
```json
{
  "action": "query",
  "collectionName": "users",
  "where": { "fieldFilter": { "field": { "fieldPath": "phone" }, "op": "EQUAL", "value": { "stringValue": "+201234567890" } } },
  "orderBy": [{ "field": { "fieldPath": "updated_at" }, "direction": "DESCENDING" }],
  "limit": 20,
  "offset": 0
}
```

**API Call (for Firestore REST API)**:
- **Method**: POST
- **URL**: `{BASE_URL}?key={API_KEY}`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "structuredQuery": {
    "from": [{ "collectionId": "users" }],
    "where": { "fieldFilter": { "field": { "fieldPath": "phone" }, "op": "EQUAL", "value": { "stringValue": "+201234567890" } } },
    "orderBy": [{ "field": { "fieldPath": "updated_at" }, "direction": "DESCENDING" }],
    "limit": { "value": 20 }
  }
}
```

**Example**:
```javascript
runQuery("users", 
  fieldFilter("phone", "EQUAL", "+201234567890"),
  { limit: 20, orderBy: [{ field: { fieldPath: "updated_at" }, direction: "DESCENDING" }] }
)
```

---

### 6. runQueryPaginated(collectionName, where, options)
**Description**: Execute a paginated query with cursor-based pagination

**Parameters**:
- `collectionName` (string): Name of the collection
- `where` (object): Firestore where clause
- `options` (object):
  - `pageSize` (number): Number of results per page (default: 20)
  - `orderBy` (array): Order by fields
  - `startAfterCursor` (string): Cursor for pagination

**API Call (for /api/identity)**:
- **Method**: POST
- **URL**: `{BASE_URL}`
- **Headers**: 
  - `Content-Type: application/json`
  - `X-API-Key: {API_KEY}`
- **Body**:
```json
{
  "action": "query",
  "collectionName": "users",
  "where": { "fieldFilter": { "field": { "fieldPath": "account_type" }, "op": "GREATER_THAN_OR_EQUAL", "value": { "integerValue": 32 } } },
  "orderBy": [
    { "field": { "fieldPath": "account_type" }, "direction": "ASCENDING" },
    { "field": { "fieldPath": "updated_at" }, "direction": "DESCENDING" },
    { "field": { "fieldPath": "__name__" }, "direction": "DESCENDING" }
  ],
  "limit": 21,
  "offset": 0
}
```

**API Call (for Firestore REST API)**:
- **Method**: POST
- **URL**: `{BASE_URL}?key={API_KEY}`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "structuredQuery": {
    "from": [{ "collectionId": "users" }],
    "where": { "fieldFilter": { "field": { "fieldPath": "account_type" }, "op": "GREATER_THAN_OR_EQUAL", "value": { "integerValue": 32 } } },
    "orderBy": [
      { "field": { "fieldPath": "account_type" }, "direction": "ASCENDING" },
      { "field": { "fieldPath": "updated_at" }, "direction": "DESCENDING" },
      { "field": { "fieldPath": "__name__" }, "direction": "DESCENDING" }
    ],
    "limit": { "value": 21 },
    "startAt": { "values": [...], "before": false }
  }
}
```

**Response**:
```json
{
  "docs": [...],
  "nextCursor": "20"
}
```

**Example**:
```javascript
runQueryPaginated("users",
  fieldFilter("account_type", "GREATER_THAN_OR_EQUAL", 32),
  { 
    pageSize: 20,
    orderBy: [
      { field: { fieldPath: "account_type" }, direction: "ASCENDING" },
      { field: { fieldPath: "updated_at" }, direction: "DESCENDING" },
      { field: { fieldPath: "__name__" }, direction: "DESCENDING" }
    ]
  }
)
```

---

### 7. listAllDocs(collectionName, options)
**Description**: Fetch all documents from a collection with pagination

**Parameters**:
- `collectionName` (string): Name of the collection
- `options` (object):
  - `pageSize` (number): Page size (default: 500)
  - `maxRows` (number): Maximum total rows (default: 5000)
  - `orderBy` (string): Order by field

**API Call (for /api/identity)**:
- **Method**: GET
- **URL**: `{BASE_URL}?collection={collectionName}&limit={pageSize}&offset={offset}`
- **Headers**: `Content-Type: application/json`

**API Call (for Firestore REST API)**:
- **Method**: GET
- **URL**: `{BASE_URL}/{collectionName}?pageSize={pageSize}&orderBy={orderBy}&pageToken={pageToken}&key={API_KEY}`
- **Headers**: `Content-Type: application/json`

**Example**:
```javascript
listAllDocs("users", { pageSize: 500, maxRows: 5000 })
// GET https://users-two-delta.vercel.app/api/identity?collection=users&limit=500&offset=0
```

---

### 8. findByField(collectionName, fieldPath, value, options)
**Description**: Find documents by a single field value

**Parameters**:
- `collectionName` (string): Name of the collection
- `fieldPath` (string): Field path to filter by
- `value` (any): Value to match
- `options` (object): Additional query options

**API Call**: Uses `runQuery` with fieldFilter

**Example**:
```javascript
findByField("users", "phone", "+201234567890", { limit: 1 })
// Calls runQuery with fieldFilter("phone", "EQUAL", "+201234567890")
```

---

### 9. findByFieldIn(collectionName, fieldPath, values, options)
**Description**: Find documents by multiple field values (IN operator)

**Parameters**:
- `collectionName` (string): Name of the collection
- `fieldPath` (string): Field path to filter by
- `values` (array): Array of values to match
- `options` (object): Additional query options

**API Call**: Uses `runQuery` with fieldFilter and IN operator (chunks of 30 values)

**Example**:
```javascript
findByFieldIn("users", "user_key", ["user1", "user2", "user3"])
// Calls runQuery with fieldFilter("user_key", "IN", ["user1", "user2", "user3"])
```

---

### 10. deleteByField(collectionName, fieldPath, value)
**Description**: Delete documents by field value

**Parameters**:
- `collectionName` (string): Name of the collection
- `fieldPath` (string): Field path to filter by
- `value` (any): Value to match

**API Call**: 
1. Finds documents using `findByField`
2. Deletes each document using `deleteDoc`

**Example**:
```javascript
deleteByField("user_contacts", "user_key", "user123")
// 1. Finds all user_contacts where user_key = "user123"
// 2. Deletes each found document
```

---

## Handle Users API

### Endpoint: `/api/users`

### GET Requests

#### 1. Get Max ID
**Query Parameter**: `mode=max_id`

**API Calls**:
- Calls `listAllDocs("users", { maxRows: 5000 })`
- Returns maximum ID value

**Example**:
```javascript
GET /api/users?mode=max_id
// Response: { max_id: 144 }
```

---

#### 2. Get Multiple Users by Keys
**Query Parameter**: `user_keys=user1,user2,user3`

**API Calls**:
- Checks `MerchantRegistry` cache first
- For missing keys, calls `getDoc("users", key)` for each key
- Calls `hydrateUsers` to enrich data
- Updates `MerchantRegistry` cache

**Example**:
```javascript
GET /api/users?user_keys=user1,user2,user3
// Response: [{ user: 1 }, { user: 2 }, { user: 3 }]
```

---

#### 3. Get Single User by Key
**Query Parameter**: `user_key=user123`

**API Calls**:
- Checks `MerchantRegistry` cache first
- If not cached, calls `getDoc("users", "user123")`
- Calls `hydrateUsers` to enrich data
- Updates `MerchantRegistry` cache

**Example**:
```javascript
GET /api/users?user_key=user123
// Response: { user_key: "user123", username: "John Doe", ... }
```

---

#### 4. Get User by Phone
**Query Parameter**: `phone=+201234567890`

**Optional Query Parameter**: `exists=true` (returns boolean only)

**API Calls**:
- Normalizes phone number
- Calls `findByField("users", "phone", normalizedPhone, { limit: 1 })`
- If `exists=true`, returns `{ exists: true/false }`
- Otherwise, calls `hydrateUsers` and returns full user data
- Updates `MerchantRegistry` cache

**Example**:
```javascript
GET /api/users?phone=+201234567890
// Response: { user_key: "user123", phone: "+201234567890", ... }

GET /api/users?phone=+201234567890&exists=true
// Response: { exists: true }
```

---

#### 5. List Users (Default)
**Query Parameters**: Various filters from `listUsers` function

**API Calls**:
- Calls `listUsers(params)` which uses:
  - `runQueryPaginated` for delivery mode
  - `runQuery` for other modes

**Example**:
```javascript
GET /api/users?mode=category_search&main_id=1&sub_id=1
// Response: { docs: [...], nextCursor: "20" }
```

---

### POST Requests

#### 1. Verify User (Login)
**Body**:
```json
{
  "action": "verify",
  "phone": "+201234567890",
  "password": "1234"
}
```

**API Calls**:
1. Normalizes phone number
2. Calls `findByField("users", "phone", normalizedPhone, { limit: 1 })`
3. Compares password
4. If valid, calls `setDoc("users", userKey, { ...user, last_login_at: timestamp, updated_at: timestamp })`
5. Calls `hydrateUsers` to enrich data
6. Updates `MerchantRegistry` cache

**Example**:
```javascript
POST /api/users
Body: { action: "verify", phone: "+201234567890", password: "1234" }
// Response: { user_key: "user123", last_login_at: "2026-06-10T09:00:00Z", ... }
```

---

#### 2. Touch Login
**Body**:
```json
{
  "action": "touch_login",
  "user_key": "user123"
}
```

**API Calls**:
1. Calls `getDoc("users", "user123")`
2. Calls `setDoc("users", "user123", { ...current, last_login_at: timestamp, updated_at: timestamp })`
3. Invalidates `MerchantRegistry` cache

**Example**:
```javascript
POST /api/users
Body: { action: "touch_login", user_key: "user123" }
// Response: { success: true, last_login_at: "2026-06-10T09:00:00Z" }
```

---

#### 3. Create User
**Body**:
```json
{
  "username": "John Doe",
  "phone": "+201234567890",
  "account_type": 33,
  "password": "1234",
  "settings": { "ratingEnabled": true }
}
```

**API Calls**:
1. Normalizes phone payload
2. Derives phone aliases
3. Calls `findByField("users", "phone", aliases.phone, { limit: 1 })` to check for duplicates
4. Generates user key if not provided
5. Calls `setDoc("users", userKey, user)` with full user data
6. Calls `replaceContacts(userKey, phones)`
7. Calls `syncSpecialtyState(user, "browser_create")`
8. Calls `getDoc("users", userKey)` to retrieve created user
9. Calls `hydrateUsers` to enrich data
10. Updates `MerchantRegistry` cache

**Example**:
```javascript
POST /api/users
Body: { username: "John Doe", phone: "+201234567890", account_type: 33, password: "1234" }
// Response: { user_key: "user123", username: "John Doe", created_at: "2026-06-10T09:00:00Z", ... }
```

---

### PUT Requests

#### 1. Update User(s)
**Body** (single or array):
```json
{
  "user_key": "user123",
  "username": "Updated Name",
  "account_type": 33,
  "phone": "+201234567890"
}
```

**API Calls**:
1. Calls `getDoc("users", userKey)` for each user
2. Merges updates with current data
3. If phones updated, calls `replaceContacts(userKey, phones)`
4. Calls `setDoc("users", userKey, updates)`
5. Calls `syncSpecialtyState(updates, "browser_update")`
6. Calls `getDoc("users", userKey)` to retrieve updated user
7. Calls `hydrateUsers` to enrich data
8. Updates `MerchantRegistry` cache
9. Invalidates `MerchantRegistry` lists and search if account_type changed

**Example**:
```javascript
PUT /api/users
Body: { user_key: "user123", username: "Updated Name" }
// Response: { user_key: "user123", username: "Updated Name", updated_at: "2026-06-10T09:00:00Z", ... }
```

---

### DELETE Requests

#### 1. Delete User
**Query Parameter or Body**: `user_key=user123`

**API Calls**:
1. Invalidates `MerchantRegistry` cache
2. Calls `deleteByField("user_contacts", "user_key", userKey)`
3. Calls `deleteByField("user_tokens", "user_key", userKey)`
4. Calls `deleteDoc("user_capabilities", userKey)`
5. Calls `deleteByField("user_specialties", "user_key", userKey)`
6. Calls `deleteByField("merchant_ratings_v2", "merchant_user_key", userKey)`
7. Calls `deleteByField("merchant_ratings_v2", "actor_user_key", userKey)`
8. Calls `deleteDoc("users", userKey)`

**Example**:
```javascript
DELETE /api/users?user_key=user123
// Response: { success: true, deleted: true, user_key: "user123" }
```

---

## Handle Tokens API

### Endpoint: `/api/tokens`

### GET Requests

#### 1. Get Tokens by User Keys
**Query Parameter**: `user_keys=user1,user2,user3` or `userKeys=user1,user2,user3`

**API Calls**:
- If keys provided: calls `findByFieldIn("user_tokens", "user_key", keys)`
- Otherwise: calls `listAllDocs("user_tokens")`

**Example**:
```javascript
GET /api/tokens?user_keys=user1,user2,user3
// Response: [{ user_key: "user1", fcm_token: "token1", ... }, ...]
```

---

#### 2. Get All Tokens
**No Query Parameters**

**API Calls**:
- Calls `listAllDocs("user_tokens")`

**Example**:
```javascript
GET /api/tokens
// Response: [{ user_key: "user1", fcm_token: "token1", ... }, ...]
```

---

### POST/PUT Requests

#### 1. Create/Update Token
**Body**:
```json
{
  "user_key": "user123",
  "fcm_token": "token_string",
  "platform": "android"
}
```

**API Calls**:
1. Calls `findByField("user_tokens", "fcm_token", token)` to find existing tokens
2. Deletes all existing tokens with same fcm_token using `deleteDoc`
3. Generates new token ID
4. Calls `setDoc("user_tokens", id, { id, user_key, fcm_token, platform, created_at, updated_at })`

**Example**:
```javascript
POST /api/tokens
Body: { user_key: "user123", fcm_token: "token_string", platform: "android" }
// Response: { success: true, id: "token123" }
```

---

### DELETE Requests

#### 1. Delete Tokens
**Query Parameter or Body**: `user_key=user123` and/or `token=token_string`

**API Calls**:
- If user_key provided: calls `deleteByField("user_tokens", "user_key", userKey)`
- If token provided: calls `deleteByField("user_tokens", "fcm_token", token)`

**Example**:
```javascript
DELETE /api/tokens?user_key=user123
// Response: { success: true, deleted: 5 }

DELETE /api/tokens?token=token_string
// Response: { success: true, deleted: 1 }
```

---

## Helper Functions

### fieldFilter(fieldPath, op, value)
**Description**: Creates a Firestore field filter object

**Parameters**:
- `fieldPath` (string): Field path
- `op` (string): Operator (EQUAL, GREATER_THAN, GREATER_THAN_OR_EQUAL, LESS_THAN, LESS_THAN_OR_EQUAL, IN, ARRAY_CONTAINS)
- `value` (any): Value to compare

**Returns**:
```json
{
  "fieldFilter": {
    "field": { "fieldPath": "phone" },
    "op": "EQUAL",
    "value": { "stringValue": "+201234567890" }
  }
}
```

---

## Data Encoding

### encodeValue(value)
Encodes JavaScript values to Firestore value format:
- `null` → `{ "nullValue": null }`
- `boolean` → `{ "booleanValue": true/false }`
- `number` → `{ "integerValue": "123" }` or `{ "doubleValue": 123.45 }`
- `string` → `{ "stringValue": "text" }`
- `array` → `{ "arrayValue": { "values": [...] } }`
- `object` → `{ "mapValue": { "fields": {...} } }`

### encodeDocumentFields(data)
Encodes all field values in a document using `encodeValue`

### decodeDoc(doc)
Decodes Firestore document format to JavaScript object

---

## Monitoring

All API operations are monitored via `DbOperationMonitor`:
- Operation type (READ, WRITE, DELETE)
- Method name
- Database name
- Collection name
- Documents affected
- Duration in milliseconds
- Success status
- Error message (if failed)

**Example Log**:
```
[DbMonitor] READ users/users via getDoc docs=1 543ms ok
[DbMonitor] WRITE users/users via setDoc docs=1 234ms ok
[DbMonitor] DELETE user_contacts via deleteByField docs=3 123ms ok
```

---

## Error Handling

Common error responses:
- `USER_NOT_FOUND`: User does not exist
- `INVALID_CREDENTIALS`: Wrong phone or password
- `PHONE_ALREADY_EXISTS`: Phone number already registered
- `USER_KEY_REQUIRED`: User key is required for the operation
- `UNSUPPORTED_COLLECTION`: Collection is not in OWNED_COLLECTIONS
- `METHOD_NOT_ALLOWED`: HTTP method not supported for the endpoint
- `VALIDATION_ERROR`: Missing required fields

---

## Cache Layer

### MerchantRegistry
- Caches user data to reduce API calls
- Methods:
  - `get(key)`: Get cached user
  - `set(key, user)`: Cache user
  - `delete(key)`: Remove from cache
  - `invalidateLists()`: Invalidate list caches
  - `invalidateSearch()`: Invalidate search cache

Cache is used for:
- `user_keys` queries
- `user_key` queries
- `phone` queries
- After user updates
- After user deletions

---

## Summary of All API Endpoints

### Direct Firestore API Calls
1. `GET {BASE_URL}/{collection}/{docId}?key={API_KEY}` - Get document
2. `POST {BASE_URL}/{collection}/{docId}` - Create/replace document (with X-API-Key header)
3. `PATCH {BASE_URL}/{collection}/{docId}?key={API_KEY}` - Update document
4. `DELETE {BASE_URL}/{collection}/{docId}?key={API_KEY}` - Delete document
5. `POST {BASE_URL}?key={API_KEY}` - Run query (Firestore REST API)
6. `GET {BASE_URL}/{collection}?pageSize={n}&pageToken={token}&key={API_KEY}` - List documents (Firestore REST API)

### Custom Identity API Calls
1. `POST {BASE_URL}` - Query with action=query (with X-API-Key header)
2. `GET {BASE_URL}?collection={collection}&limit={n}&offset={n}` - List documents (Identity API)

### High-Level Endpoints
1. `GET /api/users?mode=max_id` - Get max ID
2. `GET /api/users?user_keys=key1,key2` - Get multiple users
3. `GET /api/users?user_key=key` - Get single user
4. `GET /api/users?phone=number` - Get user by phone
5. `GET /api/users?mode=category_search&main_id=1&sub_id=1` - List users with filters
6. `POST /api/users` with `action=verify` - Verify login
7. `POST /api/users` with `action=touch_login` - Update login time
8. `POST /api/users` - Create user
9. `PUT /api/users` - Update user(s)
10. `DELETE /api/users?user_key=key` - Delete user
11. `GET /api/tokens?user_keys=key1,key2` - Get tokens
12. `GET /api/tokens` - Get all tokens
13. `POST /api/tokens` - Create/update token
14. `PUT /api/tokens` - Create/update token
15. `DELETE /api/tokens?user_key=key` - Delete tokens by user
16. `DELETE /api/tokens?token=token` - Delete token by token string

---

## Notes

- All timestamps are in ISO 8601 format
- Phone numbers are normalized before storage/querying
- User keys are generated randomly if not provided
- Account type is normalized using bitwise operations
- Settings are stored as JSON strings
- All write operations update `updated_at` timestamp
- Cache is invalidated on user updates and deletions
- Pagination uses cursor-based pagination for Firestore and offset-based for Identity API
