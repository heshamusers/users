import { db } from "./db.js";

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

function decodeValue(encoded) {
  if (encoded === null || encoded === undefined) return null;
  if (typeof encoded !== "object") return encoded;
  if (Object.prototype.hasOwnProperty.call(encoded, "nullValue")) return null;
  if (Object.prototype.hasOwnProperty.call(encoded, "booleanValue")) return encoded.booleanValue;
  if (Object.prototype.hasOwnProperty.call(encoded, "integerValue")) return Number(encoded.integerValue);
  if (Object.prototype.hasOwnProperty.call(encoded, "doubleValue")) return Number(encoded.doubleValue);
  if (Object.prototype.hasOwnProperty.call(encoded, "stringValue")) return encoded.stringValue;
  if (Object.prototype.hasOwnProperty.call(encoded, "timestampValue")) return encoded.timestampValue;
  if (Object.prototype.hasOwnProperty.call(encoded, "arrayValue")) {
    return (encoded.arrayValue.values || []).map(decodeValue);
  }
  if (Object.prototype.hasOwnProperty.call(encoded, "mapValue")) {
    return Object.fromEntries(
      Object.entries(encoded.mapValue.fields || {}).map(([key, child]) => [key, decodeValue(child)])
    );
  }
  return encoded;
}

function encodeValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (Number.isInteger(value)) return { integerValue: String(value) };
  if (typeof value === "number") return { doubleValue: value };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(encodeValue) } };
  }
  if (typeof value === "object") {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(value).map(([key, item]) => [key, encodeValue(item)])
        ),
      },
    };
  }
  return { stringValue: String(value) };
}

function parseIncomingPayload(body) {
  if (body && typeof body === "object" && body.fields && typeof body.fields === "object") {
    return Object.fromEntries(
      Object.entries(body.fields).map(([key, value]) => [key, decodeValue(value)])
    );
  }
  return body || {};
}

function encodeDocument(collection, row) {
  const primaryKey = PRIMARY_KEYS[collection];
  const id = row?.[primaryKey] != null ? String(row[primaryKey]) : null;
  const fields = Object.fromEntries(
    Object.entries(row || {}).map(([key, value]) => [key, encodeValue(value)])
  );
  return {
    name: `projects/users/databases/(default)/documents/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`,
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

function buildWhereClause(where, params = []) {
  console.log(`[buildWhereClause] Called with where:`, JSON.stringify(where, null, 2).substring(0, 200));
  if (!where || typeof where !== "object") return { sql: "", params };

  if (where.fieldFilter) {
    const fieldName = parseFieldPath(where.fieldFilter.field?.fieldPath);
    const op = String(where.fieldFilter.op || "").toUpperCase();
    const value = decodeValue(where.fieldFilter.value);

    console.log(`[buildWhereClause] fieldFilter: fieldName="${fieldName}", op="${op}", value=${JSON.stringify(value)}, params.length=${params.length}`);

    if (fieldName === "__name__") {
      throw new Error("Unsupported __name__ filter for identity API");
    }

    if (op === "IN") {
      if (!Array.isArray(value) || !value.length) {
        return { sql: "1=0", params };
      }
      const placeholders = value.map(() => "?").join(", ");
      params.push(...value);
      console.log(`[buildWhereClause] IN filter: added ${value.length} params, total=${params.length}, sql="${placeholders}"`);
      return { sql: `"${fieldName}" IN (${placeholders})`, params };
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
      throw new Error(`Unsupported query operator: ${op}`);
    }

    if (op === "ARRAY_CONTAINS") {
      params.push(`%${String(value)}%`);
      console.log(`[buildWhereClause] ARRAY_CONTAINS: added param, total=${params.length}`);
      return { sql: `"${fieldName}" LIKE ?`, params };
    }

    params.push(value);
    const resultSql = `"${fieldName}" ${sqlOperator} ?`;
    console.log(`[buildWhereClause] EQUAL/comparison: added param="${value}", total=${params.length}, sql="${resultSql}"`);
    return { sql: resultSql, params };
  }

  if (where.compositeFilter) {
    const op = String(where.compositeFilter.op || "").toUpperCase();
    const filters = Array.isArray(where.compositeFilter.filters) ? where.compositeFilter.filters : [];
    console.log(`[buildWhereClause] compositeFilter: op="${op}", filters count=${filters.length}, currentParamsLength=${params.length}`);
    
    if (!filters.length) return { sql: "", params };

    const parts = filters.map((child, idx) => {
      console.log(`[buildWhereClause] Processing filter[${idx}] before call: params.length=${params.length}`);
      const parsed = buildWhereClause(child, params);
      console.log(`[buildWhereClause] filter[${idx}] after call: sql="${parsed.sql}", params.length=${params.length}`);
      return parsed.sql ? `(${parsed.sql})` : "";
    }).filter(Boolean);

    if (!parts.length) return { sql: "", params };
    const joiner = op === "OR" ? " OR " : " AND ";
    const finalSql = parts.join(joiner);
    console.log(`[buildWhereClause] final SQL: "${finalSql}", totalParams=${params.length}, values=${JSON.stringify(params)}`);
    return { sql: finalSql, params };
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
    return `"${field}" ${direction}`;
  }).filter(Boolean);
  return parts.length ? ` ORDER BY ${parts.join(", ")}` : "";
}

async function executeSql(sql, parameters = []) {
  console.log(`[executeSql] Executing: sql="${sql.substring(0, 150)}"`);
  console.log(`[executeSql] Parameters (${parameters.length}): ${JSON.stringify(parameters)}`);
  try {
    // Log the exact format being sent
    const executePayload = { sql, args: parameters };
    console.log(`[executeSql] Payload keys: ${Object.keys(executePayload).join(", ")}`);
    
    const result = await db.execute(executePayload);
    console.log(`[executeSql] Result: ${result?.rows?.length || 0} rows`);
    if (result?.rows && result.rows.length > 0) {
      console.log(`[executeSql] First row keys: ${Object.keys(result.rows[0]).join(", ")}`);
      console.log(`[executeSql] First row main_category_id: "${result.rows[0].main_category_id}"`);
    }
    return result;
  } catch (error) {
    console.error(`[executeSql] Error: ${error.message}`);
    throw error;
  }
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
    `SELECT * FROM "${collection}" WHERE "${primaryKey}" = ? LIMIT 1`,
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

  let sql = `SELECT * FROM "${collection}"`;
  if (whereClause.sql) sql += ` WHERE ${whereClause.sql}`;
  sql += orderByClause;
  if (safeLimit !== null) sql += ` LIMIT ${safeLimit}`;
  if (safeOffset) sql += ` OFFSET ${safeOffset}`;

  // Debug logging for ALL queries
  console.log(`[identity-store] Query for "${collection}":`, {
    sql,
    params: params.length > 0 ? params : "none",
    wherePresent: !!where,
    whereClauseBuilt: whereClause,
  });

  // Store debug info if global debug mode is enabled
  if (global._queryDebug) {
    global._queryDebug.sql = sql;
    global._queryDebug.params = params;
  }

  const result = await executeSql(sql, params);
  console.log(`[identity-store] Query returned ${result?.rows?.length || 0} rows`);
  
  return (result?.rows || []).map((row) => parseJsonColumns(collection, row));
}

async function upsertDoc(collection, id, data) {
  await ensureCollection(collection);
  const input = parseIncomingPayload(data);
  const record = { ...input };
  if (id) {
    record[PRIMARY_KEYS[collection]] = id;
  }
  if (!record[PRIMARY_KEYS[collection]]) {
    throw new Error(`Missing primary key for collection ${collection}`);
  }

  const columns = Object.keys(record).filter(isValidIdentifier);
  const placeholders = columns.map(() => "?").join(", ");
  const values = columns.map((key) => normalizeValue(record[key]));

  const sql = `INSERT OR REPLACE INTO "${collection}" (${columns.map((col) => `"${col}"`).join(", ")}) VALUES (${placeholders})`;
  await executeSql(sql, values);
  return getDocById(collection, record[PRIMARY_KEYS[collection]]);
}

async function deleteDocById(collection, id) {
  await ensureCollection(collection);
  if (!id) return false;
  const primaryKey = PRIMARY_KEYS[collection];
  await executeSql(`DELETE FROM "${collection}" WHERE "${primaryKey}" = ?`, [id]);
  return true;
}

async function deleteByField(collection, field, value) {
  await ensureCollection(collection);
  const fieldName = parseFieldPath(field);
  await executeSql(`DELETE FROM "${collection}" WHERE "${fieldName}" = ?`, [normalizeValue(value)]);
  return true;
}

export {
  PRIMARY_KEYS,
  decodeValue,
  encodeValue,
  parseIncomingPayload,
  encodeDocument,
  buildWhereClause,
  buildOrderByClause,
  ensureCollection,
  getDocById,
  queryCollection,
  upsertDoc,
  deleteDocById,
  deleteByField,
};
