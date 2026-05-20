const fs = require("fs");
const path = require("path");
const { createClient } = require("@libsql/client");
const admin = require("firebase-admin");

const SOURCE_PROJECT_DIR = process.env.SOURCE_PROJECT_DIR
  || "C:\\Users\\hesham\\Desktop\\suez-bazaar-devolper";
const TARGET_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "users-baad9";
const EXPORT_DIR = path.resolve(__dirname, "..", "migration-export");
const FIREBASE_WEB_CONFIG = {
  apiKey: "AIzaSyCAqgZgcpd9hEQjs5J0VwjVcUVeTnZJcZo",
  authDomain: "users-baad9.firebaseapp.com",
  projectId: "users-baad9",
  storageBucket: "users-baad9.firebasestorage.app",
  messagingSenderId: "582900180281",
  appId: "1:582900180281:web:4c06c2efb7b7b11939b4e8",
};

const TABLES = [
  {
    name: "users",
    idColumn: "user_key",
    orderBy: "id",
  },
  {
    name: "user_contacts",
    idColumn: "id",
    orderBy: "user_key, is_primary DESC, created_at",
  },
  {
    name: "user_tokens",
    idColumn: "id",
    orderBy: "id",
  },
  {
    name: "user_capabilities",
    idColumn: "user_key",
    orderBy: "user_key",
  },
  {
    name: "user_specialties",
    idColumn: "id",
    orderBy: "user_key, main_category_id, sub_category_id, id",
  },
];

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;

    let value = match[2].trim();
    if (
      (value.startsWith("\"") && value.endsWith("\""))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[match[1]] === undefined) {
      process.env[match[1]] = value;
    }
  }
}

function parseMaybeJson(value) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  if (!["{", "["].includes(trimmed[0])) return value;

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function normalizeRow(row, tableName) {
  const data = {};
  for (const [key, value] of Object.entries(row)) {
    data[key] = parseMaybeJson(value);
  }

  data._legacy = {
    source: "turso",
    table: tableName,
    migratedAt: new Date().toISOString(),
  };

  return data;
}

function getDocumentId(row, table) {
  const rawId = row[table.idColumn];
  if (rawId !== null && rawId !== undefined && String(rawId).trim() !== "") {
    return String(rawId);
  }

  throw new Error(`Missing document id column "${table.idColumn}" in table "${table.name}".`);
}

async function getSourceDb() {
  loadEnvFile(path.join(SOURCE_PROJECT_DIR, ".env"));

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Set it or keep it in the source project .env file.");
  }

  return createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

async function getFirestoreClient() {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    || process.env.FIREBASE_SERVICE_ACCOUNT;

  if (serviceAccountPath) {
    const absolutePath = path.resolve(serviceAccountPath);
    const serviceAccount = require(absolutePath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: TARGET_PROJECT_ID,
    });
    return {
      mode: "admin",
      db: admin.firestore(),
      serverTimestamp: () => admin.firestore.FieldValue.serverTimestamp(),
    };
  }

  const { initializeApp } = await import("firebase/app");
  const {
    getFirestore,
    collection,
    doc,
    writeBatch,
    serverTimestamp,
  } = await import("firebase/firestore");

  const app = initializeApp(FIREBASE_WEB_CONFIG);
  return {
    mode: "web",
    db: getFirestore(app),
    collection,
    doc,
    writeBatch,
    serverTimestamp,
  };
}

async function exportTable(db, table) {
  const sql = `SELECT * FROM ${table.name} ORDER BY ${table.orderBy}`;
  const result = await db.execute(sql);
  return result.rows.map((row) => ({ ...row }));
}

async function writeCollection(client, table, rows) {
  let batch = client.mode === "admin"
    ? client.db.batch()
    : client.writeBatch(client.db);
  let pending = 0;
  let written = 0;

  for (const row of rows) {
    const docId = getDocumentId(row, table);
    const ref = client.mode === "admin"
      ? client.db.collection(table.name).doc(docId)
      : client.doc(client.collection(client.db, table.name), docId);
    batch.set(ref, normalizeRow(row, table.name), { merge: true });
    pending += 1;
    written += 1;

    if (pending === 450) {
      await batch.commit();
      batch = client.mode === "admin"
        ? client.db.batch()
        : client.writeBatch(client.db);
      pending = 0;
    }
  }

  if (pending > 0) {
    await batch.commit();
  }

  return written;
}

async function writeMigrationManifest(firestore, summary) {
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const data = {
    source: "turso",
    targetProjectId: TARGET_PROJECT_ID,
    tables: summary,
    createdAt: firestore.serverTimestamp(),
  };

  if (firestore.mode === "admin") {
    await firestore.db.collection("_migration_runs").doc(runId).set(data);
    return;
  }

  const batch = firestore.writeBatch(firestore.db);
  const ref = firestore.doc(firestore.collection(firestore.db, "_migration_runs"), runId);
  batch.set(ref, data);
  await batch.commit();
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  fs.mkdirSync(EXPORT_DIR, { recursive: true });

  const db = await getSourceDb();
  const firestore = dryRun ? null : await getFirestoreClient();
  const summary = {};

  for (const table of TABLES) {
    const rows = await exportTable(db, table);
    const exportPath = path.join(EXPORT_DIR, `${table.name}.json`);
    fs.writeFileSync(exportPath, JSON.stringify(rows, null, 2), "utf8");

    const copied = dryRun ? 0 : await writeCollection(firestore, table, rows);
    summary[table.name] = {
      sourceRows: rows.length,
      copiedRows: copied,
      documentId: table.idColumn,
      exportPath,
    };

    console.log(`[migration] ${table.name}: exported ${rows.length}, copied ${copied}`);
  }

  if (!dryRun) {
    await writeMigrationManifest(firestore, summary);
  }

  fs.writeFileSync(
    path.join(EXPORT_DIR, "summary.json"),
    JSON.stringify(summary, null, 2),
    "utf8"
  );

  console.log("[migration] Done.");
}

main().catch((error) => {
  console.error("[migration] Failed:", error.stack || error.message);
  process.exit(1);
});
