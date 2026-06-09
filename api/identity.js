/**
 * @file api/identity.js
 * @description Generic Turso-backed identity endpoint for users project.
 */
import { db } from "../lib/db.js";

const VALID_COLLECTIONS = new Set([
  "users",
  "user_contacts",
  "user_capabilities",
  "user_specialties",
  "user_tokens",
  "merchant_ratings_v2",
]);

const PRIMARY_KEYS = {
  users: "user_key",
  user_contacts: "id",
  user_capabilities: "user_key",
  user_specialties: "id",
  user_tokens: "id",
  merchant_ratings_v2: "id",
};

const JSON_COLUMNS = {
  users: ["business_category", "links", "settings"],
  user_capabilities: ["normalized_business_category", "specialty_profile_json"],
};

const IDENTIFIER_RE = /^[A-Za-z0-9_]+$/;

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function parseBooleanValue(value) {
  if (value === "true" || value === true) return true;
  if (value === "false" || value === false) return false;
  return null;
}

function isValidIdentifier(value) {
  return typeof value === "string" && IDENTIFIER_RE.test(value);
}

function normalizeValue(value) {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value) || typeof value === "object") {
    return JSON.stringify(value);
  }
  return value;
}

function decodeFirestoreValue(encoded) {
  if (encoded === null || encoded === undefined) return null;
  if (typeof encoded !== "object") return encoded;
  if (Object.prototype.hasOwnProperty.call(encoded, "nullValue")) return null;
  if (Object.prototype.hasOwnProperty.call(encoded, "booleanValue")) return encoded.booleanValue;
  if (Object.prototype.hasOwnProperty.call(encoded, "integerValue")) return Number(encoded.integerValue);
  if (Object.prototype.hasOwnProperty.call(encoded, "doubleValue")) return Number(encoded.doubleValue);
  if (Object.prototype.hasOwnProperty.call(encoded, "stringValue")) return encoded.stringValue;
  if (Object.prototype.hasOwnProperty.call(encoded, "timestampValue")) return encoded.timestampValue;
  if (Object.prototype.hasOwnProperty.call(encoded, "arrayValue")) {
    return (encoded.arrayValue.values || []).map(decodeFirestoreValue);
  }
  if (Object.prototype.hasOwnProperty.call(encoded, "mapValue")) {
    return Object.fromEntries(
      Object.entries(encoded.mapValue.fields || {}).map(([key, child]) => [key, decodeFirestoreValue(child)])
    );
  }
  return encoded;
}

function encodeFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (Number.isInteger(value)) return { integerValue: String(value) };
  if (typeof value === "number") return { doubleValue: value };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(encodeFirestoreValue) } };
  }
  if (typeof value === "object") {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(value).map(([key, item]) => [key, encodeFirestoreValue(item)])
        ),
      },
    };
  }
  return { stringValue: String(value) };
}

function parseIncomingPayload(body) {
  if (body && typeof body === "object" && body.fields && typeof body.fields === "object") {
    return Object.fromEntries(
      Object.entries(body.fields).map(([key, value]) => [key, decodeFirestoreValue(value)])
    );
  }
  return body || {};
}

function encodeFirestoreDoc(collection, row) {
  const primaryKey = PRIMARY_KEYS[collection];
  const id = row?.[primaryKey] != null ? String(row[primaryKey]) : null;
  const fields = Object.fromEntries(
    Object.entries(row || {}).map(([key, value]) => [key, encodeFirestoreValue(value)])
  );
  return {
    name: `projects/firestore/databases/(default)/documents/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`,
    fields,
  };
}

function sanitizeFieldName(field) {
  if (!isValidIdentifier(field)) {
    throw new Error(`Invalid field name: ${String(field)}`);
  }
  return field;
}

function parseFieldPath(fieldPath) {
  if (typeof fieldPath !== "string") {
    throw new Error("Invalid fieldPath");
  }

  if (fieldPath === "__name__") {
    return "__name__";
  }

  return sanitizeFieldName(fieldPath);
}

function buildWhereClause(where, params = []) {
  if (!where || typeof where !== "object") return { sql: "", params };

  if (where.fieldFilter) {
    const fieldName = parseFieldPath(where.fieldFilter.field?.fieldPath);
    const op = String(where.fieldFilter.op || "").toUpperCase();
    const value = decodeFirestoreValue(where.fieldFilter.value);

    if (fieldName === "__name__") {
      throw new Error("Unsupported __name__ filter for identity API");
    }

    if (op === "IN") {
      if (!Array.isArray(value) || !value.length) {
        return { sql: "1=0", params };
      }
      const placeholders = value.map(() => "?").join(", ");
      params.push(...value);
      return { sql: `\"${fieldName}\" IN (${placeholders})`, params };
    }

    const operators = {
      EQUAL: "=",
      GREATER_THAN: ">",
      GREATER_THAN_OR_EQUAL: ">=",
      LESS_THAN: "<",
      LESS_THAN_OR_EQUAL: "<=",
      ARRAY_CONTAINS: "LIKE",
    };

    const sqlOperator = operators[op];
    if (!sqlOperator) {
      throw new Error(`Unsupported Firestore operator: ${op}`);
    }

    if (op === "ARRAY_CONTAINS") {
      params.push(`%${String(value)}%`);
      return { sql: `\"${fieldName}\" LIKE ?`, params };
    }

    params.push(value);
    return { sql: `\"${fieldName}\" ${sqlOperator} ?`, params };
  }

  if (where.compositeFilter) {
    const op = String(where.compositeFilter.op || "").toUpperCase();
    const filters = Array.isArray(where.compositeFilter.filters) ? where.compositeFilter.filters : [];
    if (!filters.length) return { sql: "", params };

    const parts = filters.map((child) => {
      const parsed = buildWhereClause(child, params);
      return parsed.sql ? `(${parsed.sql})` : "";
    }).filter(Boolean);

    if (!parts.length) return { sql: "", params };
    const joiner = op === "OR" ? " OR " : " AND ";
    return { sql: parts.join(joiner), params };
  }

  return { sql: "", params };
}

function buildOrderByClause(orderBy) {
  if (!Array.isArray(orderBy) || !orderBy.length) return "";
  const parts = orderBy.map((item) => {
    const fieldPath = item?.field?.fieldPath;
    if (!fieldPath) return null;
    const field = fieldPath === "__name__" ? null : parseFieldPath(fieldPath);
    const direction = String(item.direction || "ASCENDING").toUpperCase() === "DESCENDING" ? "DESC" : "ASC";
    if (!field) return null;
    return `\"${field}\" ${direction}`;
  }).filter(Boolean);
  return parts.length ? ` ORDER BY ${parts.join(", ")}` : "";
}

function parseJsonColumns(collection, row) {
  const jsonKeys = JSON_COLUMNS[collection] || [];
  for (const key of jsonKeys) {
    if (typeof row[key] === "string") {
      try {
        row[key] = JSON.parse(row[key]);
      } catch (error) {
        // Leave as raw string if parsing fails.
      }
    }
  }
  return row;
}

async function executeSql(sql, parameters = []) {
  return db.execute({ sql, parameters });
}

async function ensureCollection(collection) {
  if (!VALID_COLLECTIONS.has(collection)) {
    throw new Error(`Unsupported collection: ${collection}`);
  }
  return collection;
}

async function getDocById(collection, id) {
  await ensureCollection(collection);
  if (!id) return null;
  const primaryKey = PRIMARY_KEYS[collection];
  const result = await executeSql(
    `SELECT * FROM \"${collection}\" WHERE \"${primaryKey}\" = ? LIMIT 1`,
    [id]
  );
  const row = result?.rows?.[0] || null;
  return row ? parseJsonColumns(collection, row) : null;
}

async function queryCollection(collection, where, orderBy, limit, offset) {
  await ensureCollection(collection);
  const params = [];
  const whereClause = buildWhereClause(where, params);
  const orderByClause = buildOrderByClause(orderBy);
  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : null;
  const safeOffset = Number.isInteger(offset) && offset >= 0 ? offset : 0;

  let sql = `SELECT * FROM \"${collection}\"`;
  if (whereClause.sql) sql += ` WHERE ${whereClause.sql}`;
  sql += orderByClause;
  if (safeLimit !== null) sql += ` LIMIT ${safeLimit}`;
  if (safeOffset) sql += ` OFFSET ${safeOffset}`;

  const result = await executeSql(sql, params);
  return (result?.rows || []).map((row) => parseJsonColumns(collection, row));
}

async function upsertDoc(collection, id, data) {
  await ensureCollection(collection);
  const primaryKey = PRIMARY_KEYS[collection];
  const input = parseIncomingPayload(data);
  const record = { ...input };
  if (id) {
    record[primaryKey] = id;
  }
  if (!record[primaryKey]) {
    throw new Error(`Missing primary key for collection ${collection}`);
  }

  const columns = Object.keys(record).filter(isValidIdentifier);
  const placeholders = columns.map(() => "?").join(", ");
  const values = columns.map((key) => normalizeValue(record[key]));

  const sql = `INSERT OR REPLACE INTO \"${collection}\" (${columns.map((col) => `\"${col}\"`).join(", ")}) VALUES (${placeholders})`;
  await executeSql(sql, values);
  return getDocById(collection, record[primaryKey]);
}

async function deleteDocById(collection, id) {
  await ensureCollection(collection);
  if (!id) return false;
  const primaryKey = PRIMARY_KEYS[collection];
  await executeSql(`DELETE FROM \"${collection}\" WHERE \"${primaryKey}\" = ?`, [id]);
  return true;
}

async function deleteByField(collection, field, value) {
  await ensureCollection(collection);
  const fieldName = parseFieldPath(field);
  const deleted = await executeSql(`DELETE FROM \"${collection}\" WHERE \"${fieldName}\" = ?`, [normalizeValue(value)]);
  return true;
}

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const url = new URL(req.url, "http://localhost");
    const params = url.searchParams;
    const collection = params.get("collection");

    if (req.method === "GET") {
      if (!collection) {
        return res.status(400).json({ error: "collection is required" });
      }
      const id = params.get("id");
      if (id) {
        const row = await getDocById(collection, id);
        const doc = row ? encodeFirestoreDoc(collection, row) : null;
        return res.status(200).json(doc);
      }

      const field = params.get("field");
      const value = params.get("value");
      const values = params.get("values");
      if (field && value !== null) {
        const where = {
          fieldFilter: {
            field: { fieldPath: field },
            op: "EQUAL",
            value: { stringValue: value },
          },
        };
        const rows = await queryCollection(collection, where, null, Number(params.get("limit") || 500), Number(params.get("offset") || 0));
        const docs = rows.map((row) => encodeFirestoreDoc(collection, row));
        return res.status(200).json(docs);
      }
      if (field && values) {
        const parsedValues = values.split(",").filter(Boolean).map((item) => item.trim());
        const where = {
          fieldFilter: {
            field: { fieldPath: field },
            op: "IN",
            value: { arrayValue: { values: parsedValues.map((item) => ({ stringValue: item })) } },
          },
        };
        const rows = await queryCollection(collection, where, null, Number(params.get("limit") || 500), Number(params.get("offset") || 0));
        const docs = rows.map((row) => encodeFirestoreDoc(collection, row));
        return res.status(200).json(docs);
      }

      const rows = await queryCollection(collection, null, null, Number(params.get("limit") || 500), Number(params.get("offset") || 0));
      const docs = rows.map((row) => encodeFirestoreDoc(collection, row));
      return res.status(200).json(docs);
    }

    const payload = parseIncomingPayload(await req.json().catch(() => ({})));

    if (req.method === "POST") {
      if (payload.action === "query") {
        if (!payload.collectionName) {
          return res.status(400).json({ error: "collectionName is required" });
        }
        const where = payload.where || null;
        const orderBy = Array.isArray(payload.orderBy) ? payload.orderBy : null;
        const limit = Number.isInteger(payload.limit) ? payload.limit : (payload.limit ? Number(payload.limit) : null);
        const offset = Number.isInteger(payload.offset) ? payload.offset : (payload.offset ? Number(payload.offset) : 0);
        const rows = await queryCollection(payload.collectionName, where, orderBy, limit, offset);
        const docs = rows.map((row) => encodeFirestoreDoc(payload.collectionName, row));
        return res.status(200).json({ docs });
      }
      const collectionName = payload.collection || collection;
      if (!collectionName) {
        return res.status(400).json({ error: "collection is required" });
      }
      const docId = payload.id || payload[PRIMARY_KEYS[collectionName]];
      const doc = await upsertDoc(collectionName, docId, payload);
      return res.status(200).json(encodeFirestoreDoc(collectionName, doc));
    }

    if (req.method === "PUT") {
      if (!collection) {
        return res.status(400).json({ error: "collection is required" });
      }
      const body = payload;
      const docId = params.get("id") || body.id || body[PRIMARY_KEYS[collection]];
      const doc = await upsertDoc(collection, docId, body);
      return res.status(200).json(encodeFirestoreDoc(collection, doc));
    }

    if (req.method === "DELETE") {
      if (!collection) {
        return res.status(400).json({ error: "collection is required" });
      }
      const id = params.get("id") || payload.id;
      if (id) {
        await deleteDocById(collection, id);
        return res.status(200).json({ success: true, id });
      }
      const field = params.get("field") || payload.field;
      const value = params.get("value") || payload.value;
      if (field && value !== undefined) {
        await deleteByField(collection, field, value);
        return res.status(200).json({ success: true, field, value });
      }
      return res.status(400).json({ error: "id or field/value query required for delete" });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("[identity]", error);
    res.status(500).json({ error: error.message || "Server error" });
  }
}
