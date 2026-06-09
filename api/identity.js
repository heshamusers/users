/**
 * @file api/identity.js
 * @description Generic Turso-backed identity endpoint for users project.
 */
import {
  PRIMARY_KEYS,
  parseIncomingPayload,
  encodeDocument,
  getDocById,
  queryCollection,
  upsertDoc,
  deleteDocById,
  deleteByField,
} from "../lib/identity-store.js";

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
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
        const doc = row ? encodeDocument(collection, row) : null;
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
        const docs = rows.map((row) => encodeDocument(collection, row));
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
        const docs = rows.map((row) => encodeDocument(collection, row));
        return res.status(200).json(docs);
      }

      const rows = await queryCollection(collection, null, null, Number(params.get("limit") || 500), Number(params.get("offset") || 0));
      const docs = rows.map((row) => encodeDocument(collection, row));
      return res.status(200).json(docs);
    }

    let bodyData = {};
    if (req.method === 'POST' || req.method === 'PUT') {
      try {
        const rawBody = await readBody(req);
        bodyData = rawBody ? JSON.parse(rawBody) : {};
      } catch (e) {
        bodyData = {};
      }
    }
    const payload = parseIncomingPayload(bodyData);

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
        const docs = rows.map((row) => encodeDocument(payload.collectionName, row));
        return res.status(200).json({ docs });
      }
      const collectionName = payload.collection || collection;
      if (!collectionName) {
        return res.status(400).json({ error: "collection is required" });
      }
      const docId = payload.id || payload[PRIMARY_KEYS[collectionName]];
      const doc = await upsertDoc(collectionName, docId, payload);
      return res.status(200).json(encodeDocument(collectionName, doc));
    }

    if (req.method === "PUT") {
      if (!collection) {
        return res.status(400).json({ error: "collection is required" });
      }
      const body = payload;
      const docId = params.get("id") || body.id || body[PRIMARY_KEYS[collection]];
      const doc = await upsertDoc(collection, docId, body);
      return res.status(200).json(encodeDocument(collection, doc));
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
