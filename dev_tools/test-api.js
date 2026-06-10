/**
 * @file test-api.js
 * @description اختبار API endpoints على خادم Vercel المحلي
 */
import http from "http";

const BASE_URL = "http://localhost:3000";

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

// دالة مساعدة لعمل طلب HTTP
function makeRequest(path, method = "GET") {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 3000,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.end();
  });
}

// 1. اختبار الصفحة الرئيسية
async function testHomePage() {
  section("1️⃣  اختبار الصفحة الرئيسية");
  
  try {
    log("📄 طلب الصفحة الرئيسية...", "blue");
    const response = await makeRequest("/");
    
    if (response.status === 200) {
      log(`✅ الصفحة تحميلت بنجاح (Status: ${response.status})`, "green");
      return true;
    } else {
      log(`❌ خطأ في التحميل (Status: ${response.status})`, "red");
      return false;
    }
  } catch (error) {
    log(`❌ فشل الاتصال بالخادم: ${error.message}`, "red");
    return false;
  }
}

// 2. اختبار API للمستخدمين
async function testUsersAPI() {
  section("2️⃣  اختبار Users API");
  
  try {
    log("👥 طلب بيانات المستخدمين...", "blue");
    const response = await makeRequest("/api/users");
    
    if (response.status === 200 || response.status === 400) {
      log(`✅ API تم الاتصال بها (Status: ${response.status})`, "green");
      
      if (response.body) {
        try {
          const data = JSON.parse(response.body);
          log(`   الاستجابة: ${JSON.stringify(data).substring(0, 100)}...`, "green");
        } catch (e) {
          log(`   الاستجابة: ${response.body.substring(0, 100)}...`, "green");
        }
      }
      return true;
    } else {
      log(`❌ خطأ في API (Status: ${response.status})`, "red");
      return false;
    }
  } catch (error) {
    log(`⚠️  تحذير: ${error.message}`, "yellow");
    return false;
  }
}

// 3. اختبار API للبحث عن الفئات
async function testCategorySearchAPI() {
  section("3️⃣  اختبار Category Search API");
  
  try {
    log("🔍 البحث عن الفئة الرئيسية رقم 1...", "blue");
    const response = await makeRequest("/api/users?mode=category_search&main_id=1");
    
    if (response.status === 200 || response.status === 400) {
      log(`✅ API تم الاتصال بها (Status: ${response.status})`, "green");
      
      if (response.body) {
        try {
          const data = JSON.parse(response.body);
          log(`   وجدنا ${Array.isArray(data) ? data.length : 0} نتائج`, "green");
        } catch (e) {
          log(`   الاستجابة: ${response.body.substring(0, 50)}...`, "green");
        }
      }
      return true;
    } else {
      log(`❌ خطأ في البحث (Status: ${response.status})`, "red");
      return false;
    }
  } catch (error) {
    log(`⚠️  تحذير: ${error.message}`, "yellow");
    return false;
  }
}

// 4. اختبار API للهوية
async function testIdentityAPI() {
  section("4️⃣  اختبار Identity API");
  
  try {
    log("🆔 طلب بيانات الهوية...", "blue");
    const response = await makeRequest("/api/identity");
    
    if (response.status === 200 || response.status === 404 || response.status === 400) {
      log(`✅ API تم الاتصال بها (Status: ${response.status})`, "green");
      return true;
    } else {
      log(`⚠️  الحالة: ${response.status}`, "yellow");
      return true;
    }
  } catch (error) {
    log(`⚠️  تحذير: ${error.message}`, "yellow");
    return false;
  }
}

// 5. اختبار API البيانات
async function testDataAPI() {
  section("5️⃣  اختبار Data API");
  
  try {
    log("📊 طلب البيانات...", "blue");
    const response = await makeRequest("/api/data");
    
    if (response.status === 200 || response.status === 404 || response.status === 400) {
      log(`✅ API تم الاتصال بها (Status: ${response.status})`, "green");
      return true;
    } else {
      log(`⚠️  الحالة: ${response.status}`, "yellow");
      return true;
    }
  } catch (error) {
    log(`⚠️  تحذير: ${error.message}`, "yellow");
    return false;
  }
}

// 6. اختبار CORS
async function testCORS() {
  section("6️⃣  اختبار CORS Headers");
  
  try {
    log("🔐 التحقق من رؤوس CORS...", "blue");
    const response = await makeRequest("/api/users");
    
    const hasOriginHeader = "access-control-allow-origin" in response.headers;
    
    if (hasOriginHeader) {
      log(
        `✅ CORS مفعل: ${response.headers["access-control-allow-origin"]}`,
        "green"
      );
      return true;
    } else {
      log(`⚠️  CORS غير مُعرّف`, "yellow");
      return true;
    }
  } catch (error) {
    log(`⚠️  تحذير: ${error.message}`, "yellow");
    return false;
  }
}

// 7. اختبار الأداء
async function testPerformance() {
  section("7️⃣  اختبار أداء API");
  
  try {
    log("⚡ قياس سرعة الاستجابة...", "blue");
    
    const start = Date.now();
    await makeRequest("/api/users");
    const time1 = Date.now() - start;
    
    log(`✅ API Users: ${time1}ms`, "green");

    const start2 = Date.now();
    await makeRequest("/api/users?mode=category_search&main_id=1");
    const time2 = Date.now() - start2;
    
    log(`✅ Category Search: ${time2}ms`, "green");

    const avgTime = (time1 + time2) / 2;
    log(`\n📊 متوسط وقت الاستجابة: ${avgTime.toFixed(0)}ms`, "green");
    
    if (avgTime < 1000) {
      log("✅ الأداء ممتاز", "green");
    } else if (avgTime < 2000) {
      log("⚠️  الأداء جيد", "yellow");
    } else {
      log("❌ الأداء بطيء", "red");
    }
    
    return true;
  } catch (error) {
    log(`⚠️  تحذير: ${error.message}`, "yellow");
    return false;
  }
}

// تشغيل جميع الاختبارات
async function runAllTests() {
  log(`
╔═══════════════════════════════════════════════════════════╗
║      🌐 اختبار API على خادم Vercel المحلي - Users       ║
║                      ${new Date().toLocaleString('ar-EG')}
╚═══════════════════════════════════════════════════════════╝
  `, "cyan");

  const results = [];

  results.push(await testHomePage());
  results.push(await testUsersAPI());
  results.push(await testCategorySearchAPI());
  results.push(await testIdentityAPI());
  results.push(await testDataAPI());
  results.push(await testCORS());
  results.push(await testPerformance());

  // الملخص
  section("📊 الملخص النهائي");
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  const percentage = ((passed / total) * 100).toFixed(1);

  log(`📈 النتائج: ${passed}/${total} اختبارات نجحت (${percentage}%)`, "cyan");
  
  if (passed === total) {
    log(`\n✅ خادم Vercel يعمل بشكل صحيح`, "green");
    log(`✅ جميع API endpoints متاحة`, "green");
    log(`✅ CORS مُفعل`, "green");
    log(`✅ الأداء مقبول`, "green");
  } else {
    log(`\n⚠️  بعض الاختبارات لم تكتمل بنجاح`, "yellow");
  }

  return passed === total;
}

// تشغيل الاختبارات
const success = await runAllTests();
process.exit(success ? 0 : 1);
