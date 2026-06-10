/**
 * @file sync-to-local.js
 * @description نسخ البيانات من Turso إلى SQLite محلي
 */
import { db as remoteDb } from "./lib/db.js";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, "local_db", "users.db");

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  log(`\n${"=".repeat(60)}`, "cyan");
  log(title, "cyan");
  log(`${"=".repeat(60)}\n`, "cyan");
}

async function syncToLocal() {
  log(`
╔═══════════════════════════════════════════════════════════╗
║       🔄 نسخ البيانات من Turso إلى SQLite المحلي       ║
║                      ${new Date().toLocaleString('ar-EG')}
╚═══════════════════════════════════════════════════════════╝
  `, "cyan");

  try {
    // إنشاء أو فتح قاعدة البيانات المحلية
    section("1️⃣  إنشاء قاعدة البيانات المحلية");
    log("📂 إنشاء ملف قاعدة البيانات...", "blue");
    const localDb = new Database(dbPath);
    localDb.pragma("foreign_keys = ON");
    log(`✅ تم إنشاء قاعدة البيانات المحلية: ${dbPath}`, "green");

    // إنشاء الجداول
    section("2️⃣  إنشاء الجداول");

    const tables = [
      {
        name: "users",
        sql: `
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
        `,
      },
      {
        name: "user_contacts",
        sql: `
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
        `,
      },
      {
        name: "user_capabilities",
        sql: `
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
        `,
      },
      {
        name: "user_specialties",
        sql: `
          CREATE TABLE IF NOT EXISTS user_specialties (
            id                    TEXT PRIMARY KEY,
            user_key              TEXT NOT NULL,
            main_category_id      TEXT,
            sub_category_id       TEXT,
            source                TEXT,
            created_at            TEXT,
            updated_at            TEXT
          )
        `,
      },
      {
        name: "user_tokens",
        sql: `
          CREATE TABLE IF NOT EXISTS user_tokens (
            id            TEXT PRIMARY KEY,
            user_key      TEXT NOT NULL,
            fcm_token     TEXT,
            platform      TEXT,
            created_at    TEXT,
            updated_at    TEXT
          )
        `,
      },
    ];

    for (const table of tables) {
      localDb.exec(table.sql);
      log(`✅ ${table.name}`, "green");
    }

    // نسخ البيانات من Turso
    section("3️⃣  نسخ البيانات من Turso");

    const tableNames = [
      "users",
      "user_contacts",
      "user_capabilities",
      "user_specialties",
      "user_tokens",
    ];

    for (const tableName of tableNames) {
      log(`📥 نسخ جدول ${tableName}...`, "blue");

      // جلب جميع البيانات من Turso
      const result = await remoteDb.execute(`SELECT * FROM ${tableName}`);
      const rows = result.rows;

      if (rows.length === 0) {
        log(`   ⚠️  لا توجد بيانات`, "yellow");
        continue;
      }

      // حذف البيانات القديمة (إن وجدت)
      localDb.exec(`DELETE FROM ${tableName}`);

      // إدراج البيانات الجديدة
      if (rows.length > 0) {
        const columns = Object.keys(rows[0]);
        const placeholders = columns.map(() => "?").join(",");
        const insertSql = `INSERT INTO ${tableName} (${columns.join(
          ","
        )}) VALUES (${placeholders})`;
        const stmt = localDb.prepare(insertSql);

        let inserted = 0;
        for (const row of rows) {
          const values = columns.map((col) => row[col]);
          stmt.run(...values);
          inserted++;
        }

        log(`   ✅ تم إدراج ${inserted} سجل`, "green");
      }
    }

    // التحقق من البيانات
    section("4️⃣  التحقق من البيانات");

    for (const tableName of tableNames) {
      const countResult = localDb
        .prepare(`SELECT COUNT(*) as count FROM ${tableName}`)
        .all();
      const count = countResult[0]?.count || 0;
      log(`   ${tableName}: ${count} سجل`, "green");
    }

    // إنشاء ملف معلومات
    section("5️⃣  إنشاء ملف معلومات");

    const infoContent = {
      type: "local_database",
      name: "Users Local Database (SQLite)",
      location: dbPath,
      createdAt: new Date().toISOString(),
      sourceDatabase: "Turso",
      tables: {
        users: "بيانات المستخدمين الأساسية",
        user_contacts: "جهات اتصال المستخدمين",
        user_capabilities: "قدرات وصلاحيات المستخدمين",
        user_specialties: "تخصصات المستخدمين",
        user_tokens: "رموز المستخدمين",
      },
      usage: {
        development: "استخدم lib/local-db.js بدلاً من lib/db.js",
        production: "استخدم lib/db.js للاتصال بـ Turso",
      },
    };

    localDb.close();

    log(`\n✅ تم حفظ ملف قاعدة البيانات: ${dbPath}`, "green");

    // الملخص النهائي
    section("📊 ملخص النسخ");

    log("✅ تم نسخ جميع البيانات بنجاح", "green");
    log("✅ قاعدة البيانات المحلية جاهزة للاستخدام", "green");
    log(`✅ الموقع: ${dbPath}`, "green");
    log(`✅ التاريخ والوقت: ${new Date().toLocaleString('ar-EG')}`, "green");

    log("\n📝 لاستخدام قاعدة البيانات المحلية:", "cyan");
    log("   1. عدّل lib/db.js ليستخدم lib/local-db.js", "cyan");
    log("   2. أو قم بتشغيل local-server.js", "cyan");
    log("   3. يمكنك الآن الاختبار بدون الإنترنت", "cyan");

    return true;
  } catch (error) {
    log(`❌ فشل النسخ: ${error.message}`, "red");
    console.error(error);
    return false;
  }
}

// تشغيل النسخ
const success = await syncToLocal();
process.exit(success ? 0 : 1);
