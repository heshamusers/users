/**
 * @file api/users.js
 * @description Users API endpoint - handles category search and other user queries
 */
import {
  PRIMARY_KEYS,
  queryCollection,
} from "../lib/identity-store.js";

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function fieldFilter(fieldPath, op, value) {
  const encodeValue = (v) => {
    if (v === null || v === undefined) return { nullValue: null };
    if (typeof v === "number") return { integerValue: String(v) };
    return { stringValue: String(v) };
  };
  
  return {
    fieldFilter: {
      field: { fieldPath },
      op,
      value: encodeValue(value)
    },
  };
}

function compositeFilter(filters) {
  if (filters.length === 0) return null;
  if (filters.length === 1) return filters[0];
  return {
    compositeFilter: {
      op: "AND",
      filters,
    },
  };
}

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const url = new URL(req.url, "http://localhost");
    const params = url.searchParams;
    const mode = params.get("mode");
    const mainId = params.get("main_id");
    const subId = params.get("sub_id");
    const limit = Number(params.get("limit") || 100);
    const offset = Number(params.get("offset") || 0);

    if (req.method === "GET") {
      // Handle category_search mode
      if (mode === "category_search" && (mainId || subId)) {
        // Query user_specialties for matching categories
        const specialtyFilters = [];
        if (mainId) specialtyFilters.push(fieldFilter("main_category_id", "EQUAL", mainId));
        if (subId) specialtyFilters.push(fieldFilter("sub_category_id", "EQUAL", subId));

        const where = compositeFilter(specialtyFilters);
        const specialtyRows = await queryCollection("user_specialties", where, null, 10000, 0);
        
        // Extract unique user keys
        const userKeys = Array.from(new Set(
          specialtyRows.map(row => String(row.user_key || "").trim()).filter(Boolean)
        ));

        if (userKeys.length === 0) {
          return res.status(200).json([]);
        }

        // Query users by user_keys
        const encodeValue = (v) => {
          if (v === null || v === undefined) return { nullValue: null };
          if (typeof v === "number") return { integerValue: String(v) };
          return { stringValue: String(v) };
        };
        
        const userWhere = {
          fieldFilter: {
            field: { fieldPath: "user_key" },
            op: "IN",
            value: {
              arrayValue: {
                values: userKeys.map(key => ({ stringValue: key }))
              }
            }
          }
        };

        // Return flat row objects (parsed JSON columns) so frontend gets fields like `user_image` directly.
        const userRows = await queryCollection("users", userWhere, null, limit, offset);
        return res.status(200).json(userRows);
      }

      // Default: list all users
      const userRows = await queryCollection("users", null, null, limit, offset);
      return res.status(200).json(userRows);
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("[users]", error);
    res.status(500).json({ error: error.message || "Server error" });
  }
}
