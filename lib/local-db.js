/**
 * @file lib/local-db.js
 * @description اتصال قاعدة البيانات المحلية SQLite
 */
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, "..", "local_db", "users.db");

// إنشاء اتصال قاعدة البيانات
const database = new Database(dbPath);

// تفعيل المفاتيح الأجنبية
database.pragma("foreign_keys = ON");

// إنشاء كائن يحاكي واجهة Turso
export const db = {
  execute: async (sql, args = []) => {
    try {
      // التعامل مع الاستعلامات المختلفة
      if (
        sql.toUpperCase().startsWith("SELECT") ||
        sql.toUpperCase().startsWith("WITH")
      ) {
        // استعلام للقراءة فقط
        const stmt = database.prepare(sql);
        const rows = stmt.all(...args);
        return { rows, rowsAffected: 0 };
      } else if (
        sql.toUpperCase().startsWith("INSERT") ||
        sql.toUpperCase().startsWith("UPDATE") ||
        sql.toUpperCase().startsWith("DELETE")
      ) {
        // استعلام للكتابة
        const stmt = database.prepare(sql);
        const info = stmt.run(...args);
        return {
          rows: [],
          rowsAffected: info.changes,
          lastInsertRowid: info.lastInsertRowid,
        };
      } else {
        // استعلامات أخرى
        const stmt = database.prepare(sql);
        const result = stmt.run(...args);
        return { rows: [], rowsAffected: result.changes };
      }
    } catch (error) {
      throw error;
    }
  },

  // دالة مساعدة للاستعلامات المعقدة
  query: async (sql, args = []) => {
    const stmt = database.prepare(sql);
    return stmt.all(...args);
  },

  // دالة مساعدة للعمليات الواحدة
  run: async (sql, args = []) => {
    const stmt = database.prepare(sql);
    return stmt.run(...args);
  },

  // دالة للإغلاق
  close: () => {
    database.close();
  },
};

export default db;
