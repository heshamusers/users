/**
 * @file test-local-db.js
 * @description اختبار قاعدة البيانات المحلية
 */
import dotenv from "dotenv";

dotenv.config();

// تفعيل استخدام النسخة المحلية
process.env.USE_LOCAL_DB = "true";

import { db } from "./lib/db.js";

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

async function testLocalDb() {
  log(`
╔═══════════════════════════════════════════════════════════╗
║       🧪 اختبار قاعدة البيانات المحلية (SQLite)          ║
║                      ${new Date().toLocaleString('ar-EG')}
╚═══════════════════════════════════════════════════════════╝
  `, "cyan");

  try {
    // اختبار الاتصال
    section("1️⃣  اختبار الاتصال");
    log("📡 فحص الاتصال...", "blue");
    const result = await db.execute("SELECT 1 AS connected");
    
    if (result.rows.length > 0) {
      log(`✅ الاتصال نجح`, "green");
    } else {
      log(`❌ فشل الاتصال`, "red");
      return false;
    }

    // اختبار الجداول
    section("2️⃣  اختبار الجداول");
    
    const tables = [
      "users",
      "user_contacts",
      "user_capabilities",
      "user_specialties",
      "user_tokens",
    ];

    for (const table of tables) {
      const countResult = await db.execute(
        `SELECT COUNT(*) as count FROM ${table}`
      );
      const count = countResult.rows[0]?.count || 0;
      log(`✅ ${table}: ${count} سجل`, "green");
    }

    // اختبار البيانات
    section("3️⃣  اختبار البيانات");
    
    log("📋 فحص جدول users...", "blue");
    const usersResult = await db.execute(
      "SELECT user_key, username FROM users LIMIT 3"
    );
    
    if (usersResult.rows.length > 0) {
      log(`✅ وجدنا ${usersResult.rows.length} مستخدمين:`, "green");
      usersResult.rows.forEach((row, i) => {
        log(`   ${i + 1}. ${row.username} (${row.user_key})`, "green");
      });
    }

    // اختبار الاستعلامات المعقدة
    section("4️⃣  اختبار الاستعلامات المعقدة");
    
    log("🔍 اختبار استعلام مع WHERE...", "blue");
    const whereResult = await db.execute(
      "SELECT COUNT(*) as count FROM users WHERE account_type = 1"
    );
    log(`✅ المستخدمون من نوع الحساب 1: ${whereResult.rows[0]?.count || 0}`, "green");

    // ملخص
    section("✅ الملخص النهائي");
    log("✅ جميع الاختبارات نجحت", "green");
    log("✅ قاعدة البيانات المحلية تعمل بشكل صحيح", "green");
    log("✅ يمكنك الآن استخدام النسخة المحلية للاختبار", "green");

    return true;
  } catch (error) {
    log(`❌ خطأ: ${error.message}`, "red");
    console.error(error);
    return false;
  }
}

// تشغيل الاختبار
const success = await testLocalDb();
process.exit(success ? 0 : 1);
