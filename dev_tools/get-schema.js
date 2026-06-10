/**

 * @file get-schema.js

 * @description جلب شيما قاعدة البيانات من Turso

 */

import { db } from "./lib/db.js";

import dotenv from "dotenv";



dotenv.config();



async function getSchema() {

  const tables = [

    "users",

    "user_contacts",

    "user_capabilities",

    "user_specialties",

    "user_tokens",

  ];



  for (const tableName of tables) {

    console.log(`\n📋 الجدول: ${tableName}`);

    console.log("=".repeat(60));



    try {

      const result = await db.execute(

        `PRAGMA table_info(${tableName})`

      );

      

      if (result.rows && result.rows.length > 0) {

        result.rows.forEach((col) => {

          console.log(

            `  - ${col.name}: ${col.type} ${col.notnull ? "NOT NULL" : ""} ${

              col.pk ? "PRIMARY KEY" : ""

            }`

          );

        });

      }

    } catch (error) {

      console.log(`❌ خطأ: ${error.message}`);

    }

  }

}



getSchema();

