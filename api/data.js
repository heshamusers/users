import { db } from "../lib/db.js";

function normalizeSearch(value) {
  return String(value || "").toLowerCase().trim();
}

function parseAccountLabels(user, capability) {
  const value = Number(capability?.account_type ?? user?.account_type ?? 0);
  const labels = [];

  if (user?.system_role === "admin") labels.push("إدارة");
  if ((value & 1) === 1 || value === 0) labels.push("مشتري");
  if ((value & 2) === 2) labels.push("تاجر");
  if ((value & 4) === 4 || Number(capability?.can_deliver || user?.is_delivery_eligible || 0) === 1) {
    labels.push("توصيل");
  }

  return labels.length ? [...new Set(labels)] : ["غير محدد"];
}

function matchesAccountFilter(user, capability, accountFilter) {
  if (!accountFilter || accountFilter === "all") return true;

  const labels = parseAccountLabels(user, capability);
  const map = {
    buyer: "مشتري",
    merchant: "تاجر",
    delivery: "توصيل",
    admin: "إدارة",
  };

  return labels.includes(map[accountFilter]);
}

function buildSearchText(user, contacts, capability, specialties) {
  return normalizeSearch([
    user.username,
    user.phone,
    user.user_key,
    user.business_name,
    user.business_bio,
    user.business_category,
    user.business_sub_categories,
    user.system_role,
    contacts.map((item) => item.phone_number).join(" "),
    capability?.primary_main_category_id,
    specialties.map((item) => `${item.main_category_id} ${item.sub_category_id}`).join(" "),
  ].join(" "));
}

function applyQueryFilters({ users, contacts, capabilities, specialties, tokens }, search, accountFilter) {
  if (!search && (!accountFilter || accountFilter === "all")) {
    return { users, contacts, capabilities, specialties, tokens };
  }

  const capabilityByUser = new Map(capabilities.map((item) => [item.user_key, item]));
  const contactsByUser = new Map();
  const specialtiesByUser = new Map();

  contacts.forEach((item) => {
    if (!contactsByUser.has(item.user_key)) contactsByUser.set(item.user_key, []);
    contactsByUser.get(item.user_key).push(item);
  });

  specialties.forEach((item) => {
    if (!specialtiesByUser.has(item.user_key)) specialtiesByUser.set(item.user_key, []);
    specialtiesByUser.get(item.user_key).push(item);
  });

  const filteredUsers = users.filter((user) => {
    const capability = capabilityByUser.get(user.user_key);
    const userContacts = contactsByUser.get(user.user_key) || [];
    const userSpecialties = specialtiesByUser.get(user.user_key) || [];

    const matchesSearch = !search || buildSearchText(user, userContacts, capability, userSpecialties).includes(search);
    const matchesFilter = matchesAccountFilter(user, capability, accountFilter);

    return matchesSearch && matchesFilter;
  });

  const allowedKeys = new Set(filteredUsers.map((user) => user.user_key));

  return {
    users: filteredUsers,
    contacts: contacts.filter((item) => allowedKeys.has(item.user_key)),
    capabilities: capabilities.filter((item) => allowedKeys.has(item.user_key)),
    specialties: specialties.filter((item) => allowedKeys.has(item.user_key)),
    tokens: tokens.filter((item) => allowedKeys.has(item.user_key)),
  };
}

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

    const search = normalizeSearch(new URL(req.url, "http://localhost").searchParams.get("search") || "");
    const accountFilter = new URL(req.url, "http://localhost").searchParams.get("accountFilter") || "all";

    const filtered = applyQueryFilters({ users, contacts, capabilities, specialties, tokens }, search, accountFilter);

    return res.status(200).json(filtered);
  } catch (error) {
    console.error("Database query error:", error);
    return res.status(500).json({ error: error.message });
  }
}
