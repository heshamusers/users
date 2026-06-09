import { db } from "../lib/db.js";

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const [usersRes, contactsRes, capabilitiesRes, specialtiesRes, tokensRes] = await Promise.all([
      db.execute("SELECT * FROM users ORDER BY username ASC"),
      db.execute("SELECT * FROM user_contacts"),
      db.execute("SELECT * FROM user_capabilities"),
      db.execute("SELECT * FROM user_specialties"),
      db.execute("SELECT * FROM user_tokens")
    ]);

    const users = usersRes.rows.map(row => {
      let business_category = null;
      let links = null;
      let settings = null;

      try {
        if (row.business_category) business_category = JSON.parse(row.business_category);
      } catch (e) {
        console.error("Error parsing business_category for", row.user_key, e);
      }

      try {
        if (row.links) links = JSON.parse(row.links);
      } catch (e) {
        console.error("Error parsing links for", row.user_key, e);
      }

      try {
        if (row.settings) settings = JSON.parse(row.settings);
      } catch (e) {
        console.error("Error parsing settings for", row.user_key, e);
      }

      return {
        ...row,
        business_category,
        links,
        settings,
        _docId: row.user_key
      };
    });

    const contacts = contactsRes.rows.map(row => ({
      ...row,
      _docId: row.id
    }));

    const capabilities = capabilitiesRes.rows.map(row => {
      let normalized_business_category = null;
      let specialty_profile_json = null;

      try {
        if (row.normalized_business_category) {
          normalized_business_category = JSON.parse(row.normalized_business_category);
        }
      } catch (e) {
        console.error("Error parsing normalized_business_category for", row.user_key, e);
      }

      try {
        if (row.specialty_profile_json) {
          specialty_profile_json = JSON.parse(row.specialty_profile_json);
        }
      } catch (e) {
        console.error("Error parsing specialty_profile_json for", row.user_key, e);
      }

      return {
        ...row,
        normalized_business_category,
        specialty_profile_json,
        _docId: row.user_key
      };
    });

    const specialties = specialtiesRes.rows.map(row => ({
      ...row,
      _docId: row.id
    }));

    const tokens = tokensRes.rows.map(row => ({
      ...row,
      _docId: row.id
    }));

    return res.status(200).json({
      users,
      contacts,
      capabilities,
      specialties,
      tokens
    });
  } catch (error) {
    console.error("Database query error:", error);
    return res.status(500).json({ error: error.message });
  }
}
