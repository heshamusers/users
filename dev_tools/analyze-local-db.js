/**
 * @file analyze-local-db.js
 * @description تحليل ملفات local_db ومقارنتها مع schema Turso
 */
import fs from 'fs';
import path from 'path';
import { db } from '../lib/db.js';
import dotenv from 'dotenv';

dotenv.config();

// قراءة ملفات JSON
const localDbPath = path.join(process.cwd(), 'local_db');
const files = {
  users: JSON.parse(fs.readFileSync(path.join(localDbPath, 'users.json'), 'utf8')),
  user_contacts: JSON.parse(fs.readFileSync(path.join(localDbPath, 'user_contacts.json'), 'utf8')),
  user_specialties: JSON.parse(fs.readFileSync(path.join(localDbPath, 'user_specialties.json'), 'utf8')),
  user_capabilities: JSON.parse(fs.readFileSync(path.join(localDbPath, 'user_capabilities.json'), 'utf8')),
  user_tokens: JSON.parse(fs.readFileSync(path.join(localDbPath, 'user_tokens.json'), 'utf8')),
};

// استخراج جميع الحقول من كل ملف
function extractFields(data) {
  const fields = new Set();
  data.forEach(item => {
    Object.keys(item).forEach(key => fields.add(key));
  });
  return Array.from(fields);
}

const localFields = {
  users: extractFields(files.users),
  user_contacts: extractFields(files.user_contacts),
  user_specialties: extractFields(files.user_specialties),
  user_capabilities: extractFields(files.user_capabilities),
  user_tokens: extractFields(files.user_tokens),
};

console.log('📊 الحقول في local_db:');
console.log('='.repeat(60));
Object.entries(localFields).forEach(([table, fields]) => {
  console.log(`\n${table}:`);
  fields.forEach(field => console.log(`  - ${field}`));
});

// جلب schema من Turso
async function getTursoSchema() {
  const tables = ['users', 'user_contacts', 'user_specialties', 'user_capabilities', 'user_tokens'];
  const tursoSchema = {};
  
  for (const tableName of tables) {
    try {
      const result = await db.execute(`PRAGMA table_info(${tableName})`);
      tursoSchema[tableName] = result.rows.map(row => row.name);
    } catch (error) {
      console.error(`❌ خطأ في جلب schema للجدول ${tableName}:`, error.message);
      tursoSchema[tableName] = [];
    }
  }
  
  return tursoSchema;
}

async function main() {
  const tursoSchema = await getTursoSchema();
  
  console.log('\n\n📋 الحقول في Turso:');
  console.log('='.repeat(60));
  Object.entries(tursoSchema).forEach(([table, fields]) => {
    console.log(`\n${table}:`);
    fields.forEach(field => console.log(`  - ${field}`));
  });
  
  // مقارنة الحقول
  console.log('\n\n🔍 الحقول الناقصة في Turso:');
  console.log('='.repeat(60));
  Object.entries(localFields).forEach(([table, localFields]) => {
    const tursoFields = tursoSchema[table] || [];
    const missingFields = localFields.filter(field => !tursoFields.includes(field));
    
    if (missingFields.length > 0) {
      console.log(`\n${table}:`);
      missingFields.forEach(field => console.log(`  - ${field}`));
    }
  });
}

main();
