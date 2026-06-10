/**
 * @file api/identity.js
 * @description Generic Turso-backed identity endpoint for users project.
 * Version: 2.0 - Fixed req.json() incompatibility with Vercel serverless
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
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-API-Key, Authorization");
}

async function readBody(req) {
  // For Vercel/Node.js compatibility
  if (req.body !== undefined) {
    // Already parsed by middleware
    return typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  }
  
  // Fallback: read from stream
  return new Promise((resolve, reject) => {
    let chunks = [];
    let size = 0;
    
    req.on('data', chunk => {
      chunks.push(chunk);
      size += chunk.length;
      if (size > 1e6) {
        reject(new Error('Payload too large'));
      }
    });
    
    req.on('end', () => {
      try {
        const data = Buffer.concat(chunks).toString('utf-8');
        console.log(`[readBody] Received ${chunks.length} chunks, total size: ${size}, data length: ${data.length}`);
        resolve(data);
      } catch (e) {
        reject(e);
      }
    });
    
    req.on('error', reject);
    
    // Timeout if stream hangs
    setTimeout(() => {
      reject(new Error('Request timeout'));
    }, 30000);
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
        console.log(`[identity] Raw body received (length: ${rawBody.length}): ${rawBody.substring(0, 100)}...`);
        if (rawBody && rawBody.trim()) {
          bodyData = JSON.parse(rawBody);
          console.log(`[identity] Parsed bodyData (action: ${bodyData.action}, collectionName: ${bodyData.collectionName})`);
        }
      } catch (e) {
        console.error(`[identity] Error parsing body: ${e.message}`);
        if (req.method === 'POST') {
          return res.status(400).json({ error: `Invalid JSON body: ${e.message}` });
        }
        bodyData = {};
      }
    }
    
    // For POST with query action, bodyData is already the payload
    // For other requests, use parseIncomingPayload for backwards compatibility
    let payload = bodyData;
    if (payload && payload.action !== 'query' && !payload.collectionName) {
      payload = parseIncomingPayload(bodyData);
    }

    if (req.method === "POST") {
      console.log(`[identity] POST: action="${payload.action}", collectionName="${payload.collectionName}"`);
      if (payload.action === "query") {
        console.log(`[identity] Processing query action...`);
        if (!payload.collectionName) {
          return res.status(400).json({ error: "collectionName is required" });
        }
        const where = payload.where || null;
        const orderBy = Array.isArray(payload.orderBy) ? payload.orderBy : null;
        const limit = Number.isInteger(payload.limit) ? payload.limit : (payload.limit ? Number(payload.limit) : null);
        const offset = Number.isInteger(payload.offset) ? payload.offset : (payload.offset ? Number(payload.offset) : 0);
        
        console.log(`[identity] Calling queryCollection("${payload.collectionName}") with where=${where ? 'yes' : 'no'}...`);
        
        // Enable debug info collection
        const debugMode = new URL(`http://localhost${req.url}`).searchParams.get("debug") === "1";
        if (debugMode) {
          global._queryDebug = { sql: null, params: null };
        }
        
        const rows = await queryCollection(payload.collectionName, where, orderBy, limit, offset);
        console.log(`[identity] queryCollection returned ${rows.length} rows`);
        const docs = rows.map((row) => encodeDocument(payload.collectionName, row));
        
        // Return with debug info if requested and empty
        if (debugMode && docs.length === 0) {
          return res.status(200).json({
            debug: true,
            docs: [],
            where: where,
            debugInfo: global._queryDebug,
            message: "No results found"
          });
        }
        
        return res.status(200).json(docs);
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
