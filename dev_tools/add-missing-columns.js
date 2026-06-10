/**
 * @file add-missing-columns.js
 * @description إضافة الأعمدة الناقصة إلى قاعدة بيانات Turso
 */
import { db } from '../lib/db.js';
import dotenv from 'dotenv';

dotenv.config();

async function addMissingColumns() {
  console.log('🔧 إضافة الأعمدة الناقصة إلى Turso...\n');

  // الأعمدة الناقصة لكل جدول
  const missingColumns = {
    users: [
      '_docId TEXT',
      '_legacy_id TEXT',
      'Password TEXT',
      'limitPackage INTEGER',
      'featured_items_data TEXT',
      'business_sub_categories TEXT',
      'contacts_snapshot TEXT',
      'read_model_updated_at TEXT',
      '_legacy TEXT',
      'read_model_version INTEGER',
      'ratings_preview TEXT',
      'ratings_summary TEXT',
      'id INTEGER',
      'business_whatsapp TEXT',
      'user_image TEXT',
      'phones TEXT',
      'isDelivered INTEGER',
      'discountPercent INTEGER',
      'primary_phone TEXT',
      'whatsapp_phone TEXT',
      'normalized_business_category TEXT',
      'fcm_token TEXT',
      'platform TEXT',
      'can_deliver INTEGER',
      'phone_link TEXT',
      'ratings TEXT',
      'specialty_profile TEXT',
    ],
    user_contacts: [
      '_docId TEXT',
      '_legacy TEXT',
    ],
    user_specialties: [
      '_docId TEXT',
    ],
    user_capabilities: [
      '_docId TEXT',
    ],
    user_tokens: [
      '_docId TEXT',
      '_legacy TEXT',
      'updated_at TEXT',
    ],
  };

  for (const [tableName, columns] of Object.entries(missingColumns)) {
    console.log(`📋 الجدول: ${tableName}`);
    console.log('='.repeat(60));

    for (const columnDef of columns) {
      const [columnName] = columnDef.split(' ');
      try {
        // التحقق من وجود العمود أولاً
        const checkResult = await db.execute(
          `PRAGMA table_info(${tableName})`
        );
        const columnExists = checkResult.rows.some(row => row.name === columnName);

        if (!columnExists) {
          await db.execute(
            `ALTER TABLE ${tableName} ADD COLUMN ${columnDef}`
          );
          console.log(`  ✅ تم إضافة: ${columnName}`);
        } else {
          console.log(`  ⏭️  موجود بالفعل: ${columnName}`);
        }
      } catch (error) {
        console.error(`  ❌ خطأ في إضافة ${columnName}:`, error.message);
      }
    }
    console.log();
  }

  console.log('✨ تم الانتهاء من إضافة الأعمدة الناقصة!');
}

addMissingColumns();
