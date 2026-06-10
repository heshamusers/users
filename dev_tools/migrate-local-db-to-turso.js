/**
 * @file migrate-local-db-to-turso.js
 * @description ترحيل البيانات من local_db إلى Turso
 */
import fs from 'fs';
import path from 'path';
import { db } from '../lib/db.js';
import dotenv from 'dotenv';

dotenv.config();

const localDbPath = path.join(process.cwd(), 'local_db');

// قراءة ملفات JSON
const files = {
  users: JSON.parse(fs.readFileSync(path.join(localDbPath, 'users.json'), 'utf8')),
  user_contacts: JSON.parse(fs.readFileSync(path.join(localDbPath, 'user_contacts.json'), 'utf8')),
  user_specialties: JSON.parse(fs.readFileSync(path.join(localDbPath, 'user_specialties.json'), 'utf8')),
  user_capabilities: JSON.parse(fs.readFileSync(path.join(localDbPath, 'user_capabilities.json'), 'utf8')),
  user_tokens: JSON.parse(fs.readFileSync(path.join(localDbPath, 'user_tokens.json'), 'utf8')),
};

// تحويل القيم إلى نص JSON للحقول المعقدة
function serializeValue(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

// ترحيل البيانات
async function migrateTable(tableName, data) {
  console.log(`📋 ترحيل الجدول: ${tableName}`);
  console.log('='.repeat(60));

  let successCount = 0;
  let errorCount = 0;

  for (const item of data) {
    try {
      // استبعاد الحقول الداخلية
      const { _docId, ...cleanItem } = item;

      // تحويل القيم
      const columns = Object.keys(cleanItem);
      const values = columns.map(col => serializeValue(cleanItem[col]));
      const placeholders = columns.map(() => '?').join(', ');
      const columnNames = columns.join(', ');

      const query = `
        INSERT OR REPLACE INTO ${tableName} (${columnNames})
        VALUES (${placeholders})
      `;

      await db.execute(query, values);
      successCount++;
    } catch (error) {
      errorCount++;
      console.error(`  ❌ خطأ في ترحيل ${item.user_key || item.id}:`, error.message);
    }
  }

  console.log(`  ✅ تم ترحيل: ${successCount} سجل`);
  console.log(`  ❌ أخطاء: ${errorCount} سجل`);
  console.log();
}

async function main() {
  console.log('🚀 بدء ترحيل البيانات من local_db إلى Turso...\n');

  await migrateTable('users', files.users);
  await migrateTable('user_contacts', files.user_contacts);
  await migrateTable('user_specialties', files.user_specialties);
  await migrateTable('user_capabilities', files.user_capabilities);
  await migrateTable('user_tokens', files.user_tokens);

  console.log('✨ تم الانتهاء من ترحيل البيانات!');
}

main();
