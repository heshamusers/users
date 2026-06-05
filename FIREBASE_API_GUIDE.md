# Pure Firestore REST API Architecture Guide

> Project: `users-baad9` · Deployed: `https://users-d5m.pages.dev/`

---

> [!IMPORTANT]
> **STRICT ARCHITECTURAL RULE: ZERO COMPUTATIONAL BACKEND**
>
> Under no circumstances shall this project utilize, deploy, or maintain:
> 1. **Custom Servers** (Node.js, Express, Go, Python, etc.)
> 2. **Serverless Functions** (Firebase Functions, AWS Lambda, Google Cloud Functions, etc.)
> 3. **Edge Compute Middlewares** (Cloudflare Workers, Cloudflare Pages Functions, Next.js API Routes, etc.)
> 4. **Containerized / VPS Hosts** (Docker, Kubernetes, VM instances)
>
> All operations **MUST** be performed directly via the **Firebase Firestore REST API** from the client (browser, local CLI, or backup scripts).

---

## 1. Project Configuration & Base URL

| Key | Value |
|---|---|
| **Project ID** | `users-baad9` |
| **Base REST Endpoint** | `https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents` |
| **Auth Endpoint** | `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=[API_KEY]` |
| **API Key** | `AIzaSyCAqgZgcpd9hEQjs5J0VwjVcUVeTnZJcZo` |

Every database command is a standard HTTP request (`GET`, `POST`, `PATCH`, `DELETE`, `POST :runQuery`) directed to this base endpoint.

---

## 2. Collections Reference

| Collection | Document ID | Description |
|---|---|---|
| `users` | `user_key` (e.g. `dl14v1k7`) | Core user profiles |
| `user_contacts` | UUID | Phone numbers linked to users |
| `user_capabilities` | `user_key` | Roles, specialties, delivery eligibility |
| `user_specialties` | auto-id | Category/trade mappings |
| `user_tokens` | `user_key` | FCM push notification tokens |
| `merchant_ratings_v2` | `mrt_<id>` | Merchant rating records |

---

## 3. CRUD Commands

### A. `users` Collection

```bash
# Get all users (paginated, 300/page)
curl -X GET "https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents/users?pageSize=300"

# Get single user by user_key
curl -X GET "https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents/users/dl14v1k7"

# Create user
curl -X POST "https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents/users?documentId=new_user_key" \
     -H "Content-Type: application/json" \
     -d '{
       "fields": {
         "username":    { "stringValue": "Mohammed Ali" },
         "phone":       { "stringValue": "+201012345678" },
         "account_type":{ "integerValue": "1" },
         "system_role": { "stringValue": "user" },
         "updated_at":  { "stringValue": "2026-01-01T00:00:00.000Z" }
       }
     }'

# Patch (update specific fields only)
curl -X PATCH "https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents/users/dl14v1k7?updateMask.fieldPaths=username&updateMask.fieldPaths=updated_at" \
     -H "Content-Type: application/json" \
     -d '{
       "fields": {
         "username":   { "stringValue": "Mohammed Ali (Updated)" },
         "updated_at": { "stringValue": "2026-06-05T10:00:00.000Z" }
       }
     }'

# Delete user
curl -X DELETE "https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents/users/dl14v1k7"
```

### B. `user_contacts` Collection

```bash
# Get all contacts
curl -X GET "https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents/user_contacts"

# Create contact
curl -X POST "https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents/user_contacts?documentId=contact_uuid_101" \
     -H "Content-Type: application/json" \
     -d '{
       "fields": {
         "user_key":     { "stringValue": "dl14v1k7" },
         "number":       { "stringValue": "+201122334455" },
         "is_primary":   { "booleanValue": true },
         "has_whatsapp": { "booleanValue": true }
       }
     }'
```

### C. `user_capabilities` Collection

```bash
# Get capability by user_key
curl -X GET "https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents/user_capabilities/dl14v1k7"

# Set capability (merge)
curl -X PATCH "https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents/user_capabilities/dl14v1k7" \
     -H "Content-Type: application/json" \
     -d '{
       "fields": {
         "system_role":  { "stringValue": "admin" },
         "account_type": { "integerValue": "17" }
       }
     }'
```

### D. `merchant_ratings_v2` Collection

```bash
# Create/Update rating
curl -X PATCH "https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents/merchant_ratings_v2/mrt_example_1" \
     -H "Content-Type: application/json" \
     -d '{
       "fields": {
         "merchant_user_key": { "stringValue": "merchant_key" },
         "actor_user_key":    { "stringValue": "rater_key" },
         "actor_name":        { "stringValue": "Rater Name" },
         "rating":            { "integerValue": "5" },
         "note":              { "stringValue": "Excellent merchant" },
         "updated_at":        { "stringValue": "2026-06-05T10:00:00.000Z" }
       }
     }'

# Delete rating
curl -X DELETE "https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents/merchant_ratings_v2/mrt_example_1"
```

---

## 4. Structured Queries (`:runQuery`)

The most powerful endpoint. Supports server-side filtering, ordering, and pagination.

**Endpoint:** `POST https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents:runQuery`

### A. Filter by field value (EQUAL)

```bash
curl -X POST "https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents:runQuery" \
     -H "Content-Type: application/json" \
     -d '{
       "structuredQuery": {
         "from": [{ "collectionId": "users" }],
         "where": {
           "fieldFilter": {
             "field": { "fieldPath": "phone" },
             "op": "EQUAL",
             "value": { "stringValue": "+201012345678" }
           }
         },
         "limit": 1
       }
     }'
```

### B. Filter by account_type (delivery users: bit 32 set)

```bash
curl -X POST "https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents:runQuery" \
     -H "Content-Type: application/json" \
     -d '{
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
           { "field": { "fieldPath": "__name__" },     "direction": "ASCENDING" }
         ],
         "limit": 20
       }
     }'
```

### C. Username prefix search (range query)

```bash
# Finds all users whose username starts with "ahmed"
curl -X POST "https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents:runQuery" \
     -H "Content-Type: application/json" \
     -d '{
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
           { "field": { "fieldPath": "username" },    "direction": "ASCENDING" },
           { "field": { "fieldPath": "__name__" },    "direction": "ASCENDING" }
         ],
         "limit": 20
       }
     }'
```

### D. Cursor-based pagination (startAt)

Used to continue fetching from a specific document. The `before: false` flag gives "startAfter" semantics.

```bash
curl -X POST "https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents:runQuery" \
     -H "Content-Type: application/json" \
     -d '{
       "structuredQuery": {
         "from": [{ "collectionId": "users" }],
         "orderBy": [
           { "field": { "fieldPath": "updated_at" }, "direction": "DESCENDING" },
           { "field": { "fieldPath": "__name__" },   "direction": "DESCENDING" }
         ],
         "startAt": {
           "values": [
             { "stringValue": "2026-06-01T10:00:00.000Z" },
             { "referenceValue": "projects/users-baad9/databases/(default)/documents/users/dl14v1k7" }
           ],
           "before": false
         },
         "limit": 20
       }
     }'
```

### E. IN filter (fetch multiple users by key)

```bash
curl -X POST "https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents:runQuery" \
     -H "Content-Type: application/json" \
     -d '{
       "structuredQuery": {
         "from": [{ "collectionId": "users" }],
         "where": {
           "fieldFilter": {
             "field": { "fieldPath": "phone" },
             "op": "IN",
             "value": {
               "arrayValue": {
                 "values": [
                   { "stringValue": "+201012345678" },
                   { "stringValue": "+201198765432" }
                 ]
               }
             }
           }
         }
       }
     }'
```

---

## 5. `listUsers` API — Response Envelope (v2)

The `firestore-identity-api.js` `listUsers()` function now returns a **paginated envelope**:

```json
{
  "users": [ { "user_key": "...", "username": "...", "...": "..." } ],
  "nextCursor": "base64_encoded_cursor_or_null",
  "count": 20
}
```

| Field | Type | Description |
|---|---|---|
| `users` | `Array` | Array of hydrated user objects for current page |
| `nextCursor` | `string \| null` | Pass as `?cursor=` to fetch next page. `null` = last page |
| `count` | `number` | Number of users returned in this response |

### Query Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `limit` | int | `20` | Results per page (max: `100`) |
| `cursor` | string | — | Cursor from previous `nextCursor` |
| `mode` | string | — | `delivery_users`, `category_search` |
| `role` | int | — | Filter by exact `account_type` value |
| `searchTerm` | string | — | Prefix search on `username` (server-side when possible) |
| `main_id` | string | — | Category filter (triggers full scan) |
| `sub_id` | string | — | Subcategory filter (triggers full scan) |
| `offset` | int | `0` | Offset for category_search mode (in-memory pagination) |
| `last_id` | int | — | Legacy: filter users with `id > last_id` |

### Example — Paginated Fetch

```javascript
// Page 1
const res1 = await apiFetch('/api/users?limit=20');
// { users: [...], nextCursor: "WyIyMDI2LTA2LTAxVDEwOjAwOjAwLjAwMFoiLCJkbDE0djFrNyJd", count: 20 }

// Page 2
const res2 = await apiFetch(`/api/users?limit=20&cursor=${res1.nextCursor}`);
// { users: [...], nextCursor: null, count: 15 }  ← null = end
```

---

## 6. Required Firestore Composite Indexes

> [!IMPORTANT]
> The following composite indexes **must** be created in Firebase Console → Firestore → Indexes for server-side queries to work. Without them, Firestore will return an error with a direct link to create the index automatically.

| Collection | Fields | Order | Used For |
|---|---|---|---|
| `users` | `updated_at` DESC, `__name__` DESC | DESC, DESC | Default list pagination |
| `users` | `account_type` ASC, `updated_at` DESC, `__name__` DESC | ASC, DESC, DESC | Role filter + pagination |
| `users` | `username` ASC, `updated_at` DESC, `__name__` DESC | ASC, DESC, DESC | Username prefix search |

**Quick-create via Firebase CLI:**
```bash
firebase firestore:indexes
```

Or paste this in `firestore.indexes.json`:
```json
{
  "indexes": [
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "updated_at", "order": "DESCENDING" },
        { "fieldPath": "__name__",   "order": "DESCENDING" }
      ]
    },
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
    }
  ]
}
```

---

## 7. JSON Type Mapping

| JavaScript Type | Firestore REST Field | Example |
|---|---|---|
| `string` | `stringValue` | `{ "stringValue": "Hassan" }` |
| `number` (int) | `integerValue` | `{ "integerValue": "42" }` ← quoted string |
| `number` (float) | `doubleValue` | `{ "doubleValue": 3.14 }` |
| `boolean` | `booleanValue` | `{ "booleanValue": true }` |
| `null` | `nullValue` | `{ "nullValue": null }` |
| `Array` | `arrayValue` | `{ "arrayValue": { "values": [...] } }` |
| `Object/Map` | `mapValue` | `{ "mapValue": { "fields": { "key": {...} } } }` |
| `Date` (ISO) | `timestampValue` | `{ "timestampValue": "2026-06-05T10:00:00Z" }` |

---

## 8. Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client (Browser/Script)
    participant A as Firebase Auth API
    participant F as Firestore REST API

    C->>A: POST /accounts:signUp?key=[API_KEY] (anonymous)
    A-->>C: { idToken, refreshToken, expiresIn: 3600 }
    C->>F: GET /users/dl14v1k7 (Authorization: Bearer idToken)
    F-->>C: User document (authenticated & authorized)
```

### Step 1: Get Anonymous Token

```bash
curl -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyCAqgZgcpd9hEQjs5J0VwjVcUVeTnZJcZo" \
     -H "Content-Type: application/json" \
     -d '{ "returnSecureToken": true }'
```

Response:
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIs...",
  "refreshToken": "...",
  "expiresIn": "3600"
}
```

### Step 2: Authenticated Request

```bash
curl -X GET "https://firestore.googleapis.com/v1/projects/users-baad9/databases/(default)/documents/users/dl14v1k7" \
     -H "Authorization: Bearer [ID_TOKEN]"
```

---

## 9. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Public read-only for categories/specialties
    match /user_specialties/{doc} {
      allow read:  if true;
      allow write: if false;
    }

    // Authenticated access for core user data
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

    match /merchant_ratings_v2/{doc} {
      allow read:  if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 10. `npm run db:backup` — Local Backup Tool

Backs up all 6 Firestore collections to `local_db/` as JSON files.

```bash
npm run db:backup
```

**Output files per collection:**

| File | Description |
|---|---|
| `local_db/<collection>.json` | Flattened, human-readable records |
| `local_db/<collection>.raw.json` | Raw Firestore REST format (for re-import) |
| `local_db/_backup_meta.json` | Backup summary: counts, timing, errors |

**Features:**
- 🔁 **Retry logic** — 3 automatic retries with backoff on 429/network errors
- 📊 **Diff detection** — shows `+N new` / `-N removed` vs previous backup
- ⏱ **Timing** — per-collection and total elapsed time
- 🎨 **Colored output** — green/yellow/red status indicators
- 📋 **Metadata file** — `_backup_meta.json` with full stats

**Example output:**
```
═══════════════════════════════════════
  Firestore Backup — Project: users-baad9
═══════════════════════════════════════
  Started: 6/5/2026, 10:30:00 AM

ℹ  Authenticating anonymously with Firebase Auth...
✔  Authentication successful.

ℹ  Backing up 6 collections to: C:\...\local_db

  users — fetching...
   Page 1: 300 documents loaded...
   Page 2: 543 documents loaded...
✔  users: 543 docs in 4.2s (+12 new)

  user_contacts — fetching...
   Page 1: 128 documents loaded...
✔  user_contacts: 128 docs in 1.1s (no change)
...
═══════════════════════════════════════
✔  Backup complete!
   Total documents : 1024
   Total time      : 18.3s
   Output folder   : C:\...\local_db
```
