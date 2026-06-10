/**
 * @file local-server.js
 * @description خادم Node محلي لاختبار API
 */
import http from "http";
import dotenv from "dotenv";
import { db } from "./lib/db.js";

dotenv.config();

const PORT = 3000;

// دالة المعالج
async function handleRequest(req, res) {
  // تعيين رؤوس CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // التعامل مع طلبات OPTIONS
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const searchParams = url.searchParams;

  console.log(`${req.method} ${pathname}`);

  try {
    // الصفحة الرئيسية
    if (pathname === "/") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "✅ Server is running",
          timestamp: new Date().toISOString(),
          endpoints: {
            home: "/",
            users: "/api/users",
            identity: "/api/identity",
            data: "/api/data",
            health: "/api/health",
          },
        })
      );
      return;
    }

    // API Health Check
    if (pathname === "/api/health") {
      try {
        const result = await db.execute("SELECT 1");
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "✅ Database is healthy",
            database: "Turso",
            timestamp: new Date().toISOString(),
          })
        );
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "❌ Database is unavailable",
            error: error.message,
          })
        );
      }
      return;
    }

    // Users API
    if (pathname === "/api/users") {
      const mode = searchParams.get("mode");
      const limit = Number(searchParams.get("limit") || 10);
      const offset = Number(searchParams.get("offset") || 0);
      const mainId = searchParams.get("main_id");
      const subId = searchParams.get("sub_id");

      try {
        if (mode === "category_search" && (mainId || subId)) {
          // البحث عن الفئات
          let query = "SELECT DISTINCT user_key FROM user_specialties WHERE 1=1";
          const args = [];

          if (mainId) {
            query += " AND main_category_id = ?";
            args.push(mainId);
          }
          if (subId) {
            query += " AND sub_category_id = ?";
            args.push(subId);
          }

          const specialtyResult = await db.execute(query, args);
          const userKeys = specialtyResult.rows.map((r) => r.user_key);

          if (userKeys.length === 0) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify([]));
            return;
          }

          // جلب بيانات المستخدمين
          const placeholders = userKeys.map(() => "?").join(",");
          const userQuery = `SELECT * FROM users WHERE user_key IN (${placeholders}) LIMIT ? OFFSET ?`;
          const userResult = await db.execute(userQuery, [
            ...userKeys,
            limit,
            offset,
          ]);

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(userResult.rows));
        } else {
          // جلب جميع المستخدمين
          const result = await db.execute(
            `SELECT user_key, username, phone, business_name FROM users LIMIT ? OFFSET ?`,
            [limit, offset]
          );

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(result.rows));
        }
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: error.message,
          })
        );
      }
      return;
    }

    // Identity API
    if (pathname === "/api/identity") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Identity API endpoint",
          status: "✅ Available",
        })
      );
      return;
    }

    // Data API
    if (pathname === "/api/data") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Data API endpoint",
          status: "✅ Available",
        })
      );
      return;
    }

    // 404
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "Not Found",
        path: pathname,
      })
    );
  } catch (error) {
    console.error("Error:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: error.message,
      })
    );
  }
}

// إنشاء الخادم
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║   🚀 خادم محلي قيد التشغيل على المنفذ ${PORT}         ║
╚════════════════════════════════════════════════════════╝
  `);
  console.log(`✅ الخادم متاح على: http://localhost:${PORT}`);
  console.log(`✅ اختبر الـ API: http://localhost:${PORT}/api/health`);
  console.log(`✅ المستخدمين: http://localhost:${PORT}/api/users`);
});

// التعامل مع الأخطاء
server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`❌ المنفذ ${PORT} مستخدم بالفعل`);
  } else {
    console.error("خطأ في الخادم:", error);
  }
  process.exit(1);
});

// التعامل مع الإشارات
process.on("SIGINT", () => {
  console.log("\n🛑 إيقاف الخادم...");
  server.close(() => {
    console.log("✅ تم إيقاف الخادم");
    process.exit(0);
  });
});
