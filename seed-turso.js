import { db } from "./lib/db.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const localDb = join(__dirname, "local_db");

function readJson(file) {
  return JSON.parse(readFileSync(join(localDb, file), "utf-8"));
}

function s(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

function n(val) {
  const v = Number(val);
  return isNaN(v) ? 0 : v;
}

async function seedUsers() {
  const rows = readJson("users.json");
  let count = 0;
  for (const r of rows) {
    await db.execute({
      sql: `INSERT OR REPLACE INTO users
        (user_key, username, phone, business_name, business_bio,
         business_category, account_type, system_role, address, location,
         links, settings, is_delivery_eligible, last_login_at, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        s(r.user_key),
        s(r.username),
        s(r.phone),
        s(r.business_name),
        s(r.business_bio),
        s(r.business_category),
        n(r.account_type),
        s(r.system_role) ?? "user",
        s(r.Address),
        s(r.location),
        s(r.links),
        s(r.settings),
        n(r.is_delivery_eligible),
        s(r.last_login_at),
        s(r.created_at),
        s(r.updated_at),
      ],
    });
    count++;
  }
  console.log(`  ✅ users: ${count} سجل`);
}

async function seedContacts() {
  const rows = readJson("user_contacts.json");
  let count = 0;
  for (const r of rows) {
    const id = s(r.id) ?? s(r._docId) ?? `contact_${count}`;
    await db.execute({
      sql: `INSERT OR REPLACE INTO user_contacts
        (id, user_key, phone_number, is_primary, has_whatsapp, contact_type, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?)`,
      args: [
        id,
        s(r.user_key),
        s(r.phone_number),
        n(r.is_primary),
        n(r.has_whatsapp),
        s(r.contact_type) ?? "phone",
        s(r.created_at),
        s(r.updated_at),
      ],
    });
    count++;
  }
  console.log(`  ✅ user_contacts: ${count} سجل`);
}

async function seedCapabilities() {
  const rows = readJson("user_capabilities.json");
  let count = 0;
  for (const r of rows) {
    await db.execute({
      sql: `INSERT OR REPLACE INTO user_capabilities
        (user_key, account_type, primary_main_category_id, has_business_specialties,
         has_sellable_specialties, can_deliver, normalized_business_category,
         specialty_profile_json, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?)`,
      args: [
        s(r.user_key),
        n(r.account_type),
        r.primary_main_category_id ?? null,
        n(r.has_business_specialties),
        n(r.has_sellable_specialties),
        n(r.can_deliver),
        s(r.normalized_business_category),
        s(r.specialty_profile_json),
        s(r.created_at),
        s(r.updated_at),
      ],
    });
    count++;
  }
  console.log(`  ✅ user_capabilities: ${count} سجل`);
}

async function seedSpecialties() {
  const rows = readJson("user_specialties.json");
  let count = 0;
  for (const r of rows) {
    const id = s(r.id) ?? s(r._docId) ?? `spec_${count}`;
    await db.execute({
      sql: `INSERT OR REPLACE INTO user_specialties
        (id, user_key, main_category_id, sub_category_id, source, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?)`,
      args: [
        id,
        s(r.user_key),
        s(r.main_category_id),
        s(r.sub_category_id),
        s(r.source),
        s(r.created_at),
        s(r.updated_at),
      ],
    });
    count++;
  }
  console.log(`  ✅ user_specialties: ${count} سجل`);
}

async function seedTokens() {
  const rows = readJson("user_tokens.json");
  let count = 0;
  for (const r of rows) {
    const id = s(r.id) ?? s(r._docId) ?? `token_${count}`;
    await db.execute({
      sql: `INSERT OR REPLACE INTO user_tokens
        (id, user_key, fcm_token, platform, created_at)
        VALUES (?,?,?,?,?)`,
      args: [
        id,
        s(r.user_key),
        s(r.fcm_token),
        s(r.platform),
        s(r.created_at),
      ],
    });
    count++;
  }
  console.log(`  ✅ user_tokens: ${count} سجل`);
}

async function seed() {
  console.log("📤 رفع البيانات إلى Turso...\n");
  await seedUsers();
  await seedContacts();
  await seedCapabilities();
  await seedSpecialties();
  await seedTokens();
  console.log("\n🎉 تم رفع جميع البيانات بنجاح!");
}

seed().catch((err) => {
  console.error("❌ خطأ:", err.message);
  process.exit(1);
});
