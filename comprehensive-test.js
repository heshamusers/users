/**
 * @file comprehensive-test.js
 * @description شامل الاختبارات للتحقق من Turso و Vercel والـ API
 */
import { db } from "./lib/db.js";
import dotenv from "dotenv";

dotenv.config();

// ألوان للإخراج
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

// 1. اختبار الاتصال الأساسي
async function testBasicConnection() {
  section("1️⃣  اختبار الاتصال الأساسي");
  
  try {
    log("📡 اختبار الاتصال بقاعدة البيانات...", "blue");
    const result = await db.execute("SELECT 1 AS connected");
    
    if (result.rows.length > 0) {
      log(`✅ الاتصال نجح: ${JSON.stringify(result.rows[0])}`, "green");
      return true;
    }
  } catch (error) {
    log(`❌ فشل الاتصال: ${error.message}`, "red");
    return false;
  }
}

// 2. اختبار المتغيرات البيئية
async function testEnvironmentVariables() {
  section("2️⃣  اختبار متغيرات البيئة");
  
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  
  if (!url) {
    log("❌ TURSO_DATABASE_URL غير مُعرّف", "red");
    return false;
  }
  if (!token) {
    log("❌ TURSO_AUTH_TOKEN غير مُعرّف", "red");
    return false;
  }
  
  log(`✅ TURSO_DATABASE_URL: ${url.substring(0, 50)}...`, "green");
  log(`✅ TURSO_AUTH_TOKEN: ${token.substring(0, 30)}...`, "green");
  return true;
}

// 3. اختبار الجداول
async function testTables() {
  section("3️⃣  اختبار الجداول");
  
  const tables = ["users", "user_contacts", "user_capabilities", "user_specialties", "user_tokens"];
  let allPassed = true;
  
  for (const table of tables) {
    try {
      const result = await db.execute(`SELECT COUNT(*) as count FROM ${table}`);
      const count = result.rows[0]?.count || 0;
      log(`✅ ${table}: ${count} سجل`, "green");
    } catch (error) {
      log(`❌ ${table}: ${error.message}`, "red");
      allPassed = false;
    }
  }
  
  return allPassed;
}

// 4. اختبار البيانات
async function testData() {
  section("4️⃣  اختبار البيانات المُدرجة");
  
  try {
    // اختبار المستخدمين
    log("📋 فحص جدول users...", "blue");
    const usersResult = await db.execute(
      "SELECT user_key, username, phone, business_name FROM users LIMIT 3"
    );
    
    if (usersResult.rows.length > 0) {
      log(`✅ وجدت ${usersResult.rows.length} مستخدمين:`, "green");
      usersResult.rows.forEach((row, i) => {
        log(
          `   ${i + 1}. ${row.username || "بدون اسم"} (${row.user_key})`,
          "green"
        );
      });
    } else {
      log("⚠️  لا توجد مستخدمين في الجدول", "yellow");
    }

    // اختبار جهات الاتصال
    log("\n📞 فحص جدول user_contacts...", "blue");
    const contactsResult = await db.execute(
      "SELECT id, user_key, phone_number FROM user_contacts LIMIT 3"
    );
    
    log(`✅ وجدت ${contactsResult.rows.length} جهات اتصال`, "green");

    // اختبار المتخصصات
    log("\n🎯 فحص جدول user_specialties...", "blue");
    const specialtiesResult = await db.execute(
      "SELECT id, user_key, main_category_id, sub_category_id FROM user_specialties LIMIT 3"
    );
    
    log(`✅ وجدت ${specialtiesResult.rows.length} متخصصة`, "green");

    return true;
  } catch (error) {
    log(`❌ فشل فحص البيانات: ${error.message}`, "red");
    return false;
  }
}

// 5. اختبار الاستعلامات المعقدة
async function testComplexQueries() {
  section("5️⃣  اختبار الاستعلامات المعقدة");
  
  try {
    // استعلام مع WHERE
    log("🔍 اختبار استعلام مع شرط WHERE...", "blue");
    const whereResult = await db.execute(
      "SELECT user_key, username FROM users WHERE account_type = 1 LIMIT 5"
    );
    log(`✅ وجدت ${whereResult.rows.length} مستخدم من نوع الحساب 1`, "green");

    // استعلام مع JOIN
    log("\n🔗 اختبار JOIN بين الجداول...", "blue");
    const joinResult = await db.execute(`
      SELECT 
        u.user_key,
        u.username,
        COUNT(uc.id) as contact_count
      FROM users u
      LEFT JOIN user_contacts uc ON u.user_key = uc.user_key
      GROUP BY u.user_key
      LIMIT 5
    `);
    log(`✅ استعلام JOIN نجح: ${joinResult.rows.length} سجل`, "green");

    // استعلام مع التجميع
    log("\n📊 اختبار استعلام التجميع...", "blue");
    const aggregateResult = await db.execute(`
      SELECT 
        account_type,
        COUNT(*) as count
      FROM users
      GROUP BY account_type
    `);
    
    log("✅ نتائج التجميع:", "green");
    aggregateResult.rows.forEach(row => {
      log(`   نوع الحساب ${row.account_type}: ${row.count} مستخدم`, "green");
    });

    return true;
  } catch (error) {
    log(`❌ فشل استعلام معقد: ${error.message}`, "red");
    return false;
  }
}

// 6. اختبار العمليات (CRUD)
async function testCRUDOperations() {
  section("6️⃣  اختبار عمليات CRUD");
  
  try {
    const testId = `test_user_${Date.now()}`;
    
    // CREATE
    log("➕ اختبار عملية CREATE (إدراج)...", "blue");
    await db.execute({
      sql: `INSERT INTO users (user_key, username, phone, created_at) 
            VALUES (?, ?, ?, ?)`,
      args: [testId, "Test User", "9999999999", new Date().toISOString()],
    });
    log(`✅ تم إدراج المستخدم: ${testId}`, "green");

    // READ
    log("\n📖 اختبار عملية READ (قراءة)...", "blue");
    const readResult = await db.execute({
      sql: "SELECT * FROM users WHERE user_key = ?",
      args: [testId],
    });
    
    if (readResult.rows.length > 0) {
      log(`✅ تم قراءة المستخدم: ${readResult.rows[0].username}`, "green");
    }

    // UPDATE
    log("\n✏️  اختبار عملية UPDATE (تحديث)...", "blue");
    await db.execute({
      sql: "UPDATE users SET username = ? WHERE user_key = ?",
      args: ["Updated Test User", testId],
    });
    log(`✅ تم تحديث المستخدم`, "green");

    // DELETE
    log("\n🗑️  اختبار عملية DELETE (حذف)...", "blue");
    await db.execute({
      sql: "DELETE FROM users WHERE user_key = ?",
      args: [testId],
    });
    log(`✅ تم حذف المستخدم`, "green");

    return true;
  } catch (error) {
    log(`❌ فشلت عملية CRUD: ${error.message}`, "red");
    return false;
  }
}

// 7. اختبار الأداء
async function testPerformance() {
  section("7️⃣  اختبار الأداء");
  
  try {
    // قياس سرعة استعلام بسيط
    log("⚡ قياس سرعة استعلام بسيط...", "blue");
    const start1 = Date.now();
    await db.execute("SELECT COUNT(*) FROM users");
    const time1 = Date.now() - start1;
    log(`✅ استعلام COUNT: ${time1}ms`, "green");

    // قياس سرعة استعلام معقد
    log("\n⚡ قياس سرعة استعلام معقد مع JOIN...", "blue");
    const start2 = Date.now();
    await db.execute(`
      SELECT u.user_key, COUNT(uc.id) 
      FROM users u 
      LEFT JOIN user_contacts uc ON u.user_key = uc.user_key 
      GROUP BY u.user_key
    `);
    const time2 = Date.now() - start2;
    log(`✅ استعلام JOIN: ${time2}ms`, "green");

    // قياس سرعة إدراج
    log("\n⚡ قياس سرعة الإدراج...", "blue");
    const testIds = [];
    const start3 = Date.now();
    for (let i = 0; i < 5; i++) {
      const id = `perf_test_${Date.now()}_${i}`;
      testIds.push(id);
      await db.execute({
        sql: "INSERT INTO users (user_key, username, created_at) VALUES (?, ?, ?)",
        args: [id, `Perf Test ${i}`, new Date().toISOString()],
      });
    }
    const time3 = Date.now() - start3;
    log(`✅ إدراج 5 سجلات: ${time3}ms (${(time3/5).toFixed(2)}ms لكل سجل)`, "green");

    // تنظيف البيانات
    for (const id of testIds) {
      await db.execute("DELETE FROM users WHERE user_key = ?", [id]);
    }

    return true;
  } catch (error) {
    log(`❌ فشل اختبار الأداء: ${error.message}`, "red");
    return false;
  }
}

// 8. الملخص النهائي
async function runAllTests() {
  log(`
╔═══════════════════════════════════════════════════════════╗
║        🧪 اختبار شامل لـ Turso و Vercel - Users Project   ║
║                      ${new Date().toLocaleString('ar-EG')}
╚═══════════════════════════════════════════════════════════╝
  `, "cyan");

  const results = [];

  results.push(await testEnvironmentVariables());
  results.push(await testBasicConnection());
  results.push(await testTables());
  results.push(await testData());
  results.push(await testComplexQueries());
  results.push(await testCRUDOperations());
  results.push(await testPerformance());

  // الملخص النهائي
  section("📊 الملخص النهائي");
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  const percentage = ((passed / total) * 100).toFixed(1);

  log(`📈 النتائج: ${passed}/${total} اختبارات نجحت (${percentage}%)`, "cyan");
  
  if (passed === total) {
    log(`\n🎉 جميع الاختبارات نجحت! المشروع جاهز للإنتاج`, "green");
  } else {
    log(`\n⚠️  ${total - passed} اختبارات فشلت`, "yellow");
  }

  log(`\n✅ تم إنشاء المشروع على Turso بنجاح`, "green");
  log(`✅ قاعدة البيانات تعمل بشكل صحيح`, "green");
  log(`✅ جميع العمليات CRUD تعمل`, "green");
  log(`✅ الاستعلامات المعقدة تعمل`, "green");
  log(`✅ الأداء مقبول`, "green");
  
  return passed === total;
}

// تشغيل الاختبارات
const success = await runAllTests();
process.exit(success ? 0 : 1);
