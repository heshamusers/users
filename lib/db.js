import dotenv from "dotenv";
import { createClient } from "@libsql/client";

dotenv.config();

// تحديد نوع الاتصال بناءً على متغير البيئة
const USE_LOCAL_DB = process.env.USE_LOCAL_DB === "true";

let db;

if (USE_LOCAL_DB) {
  console.log("📁 استخدام قاعدة البيانات المحلية (SQLite)");
  try {
    // استخدام require للاستيراد المتزامن
    const Database = (await import("better-sqlite3")).default;
    const { dirname, join } = await import("path");
    const { fileURLToPath } = await import("url");
    
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const dbPath = join(__dirname, "..", "local_db", "users.db");
    
    const database = new Database(dbPath);
    database.pragma("foreign_keys = ON");
    
    db = {
      execute: (sql, args = []) => {
        const stmt = database.prepare(sql);
        if (sql.toUpperCase().startsWith("SELECT") || sql.toUpperCase().startsWith("WITH")) {
          return Promise.resolve({ rows: stmt.all(...args), rowsAffected: 0 });
        } else {
          const info = stmt.run(...args);
          return Promise.resolve({ rows: [], rowsAffected: info.changes });
        }
      },
    };
    console.log(`✅ استخدام قاعدة البيانات المحلية من: ${dbPath}`);
  } catch (error) {
    console.error("❌ خطأ في تحميل قاعدة البيانات المحلية:", error.message);
    console.log("☁️  رجوع إلى قاعدة البيانات السحابية");
    db = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
} else {
  console.log("☁️  استخدام قاعدة البيانات السحابية (Turso)");
  db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

export { db };
export default db;
