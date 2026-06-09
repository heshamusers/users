import { db } from "./lib/db.js";

async function setup() {
  console.log("🏗️  إنشاء الجداول...");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      user_key       TEXT PRIMARY KEY,
      username       TEXT,
      phone          TEXT,
      business_name  TEXT,
      business_bio   TEXT,
      business_category TEXT,
      account_type   INTEGER DEFAULT 0,
      system_role    TEXT DEFAULT 'user',
      address        TEXT,
      location       TEXT,
      links          TEXT,
      settings       TEXT,
      is_delivery_eligible INTEGER DEFAULT 0,
      last_login_at  TEXT,
      created_at     TEXT,
      updated_at     TEXT
    )
  `);
  console.log("  ✅ users");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_contacts (
      id             TEXT PRIMARY KEY,
      user_key       TEXT NOT NULL,
      phone_number   TEXT,
      is_primary     INTEGER DEFAULT 0,
      has_whatsapp   INTEGER DEFAULT 0,
      contact_type   TEXT DEFAULT 'phone',
      created_at     TEXT,
      updated_at     TEXT
    )
  `);
  console.log("  ✅ user_contacts");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_capabilities (
      user_key                    TEXT PRIMARY KEY,
      account_type                INTEGER DEFAULT 0,
      primary_main_category_id    INTEGER,
      has_business_specialties    INTEGER DEFAULT 0,
      has_sellable_specialties    INTEGER DEFAULT 0,
      can_deliver                 INTEGER DEFAULT 0,
      normalized_business_category TEXT,
      specialty_profile_json      TEXT,
      created_at                  TEXT,
      updated_at                  TEXT
    )
  `);
  console.log("  ✅ user_capabilities");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_specialties (
      id               TEXT PRIMARY KEY,
      user_key         TEXT NOT NULL,
      main_category_id TEXT,
      sub_category_id  TEXT,
      source           TEXT,
      created_at       TEXT,
      updated_at       TEXT
    )
  `);
  console.log("  ✅ user_specialties");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_tokens (
      id         TEXT PRIMARY KEY,
      user_key   TEXT NOT NULL,
      fcm_token  TEXT,
      platform   TEXT,
      created_at TEXT
    )
  `);
  console.log("  ✅ user_tokens");

  console.log("\n✅ تم إنشاء جميع الجداول بنجاح!");
}

setup().catch((err) => {
  console.error("❌ خطأ:", err.message);
  process.exit(1);
});
