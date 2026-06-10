#!/usr/bin/env node
import 'dotenv/config';

const API = process.env.IDENTITY_API_URL || 'https://users-two-delta.vercel.app/api/identity';
const mainId = process.argv[2] || '1';
const subId = process.argv[3] || '1';

async function fetchJson(payload) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

(async () => {
  console.log(`Checking users for main=${mainId} sub=${subId} via ${API}`);

  const specialtyWhere = {
    compositeFilter: {
      op: 'AND',
      filters: [],
    },
  };
  if (mainId) specialtyWhere.compositeFilter.filters.push({ fieldFilter: { field: { fieldPath: 'main_category_id' }, op: 'EQUAL', value: { stringValue: String(mainId) } } });
  if (subId) specialtyWhere.compositeFilter.filters.push({ fieldFilter: { field: { fieldPath: 'sub_category_id' }, op: 'EQUAL', value: { stringValue: String(subId) } } });

  const specPayload = { action: 'query', collectionName: 'user_specialties', where: specialtyWhere, limit: 10000, offset: 0 };
  const specs = await fetchJson(specPayload);
  if (!Array.isArray(specs) || specs.length === 0) {
    console.log('No user_specialties found for that category.');
    process.exit(0);
  }

  const userKeys = Array.from(new Set(specs.map(s => (s.fields?.user_key?.stringValue || '').trim()).filter(Boolean)));
  console.log(`Found ${userKeys.length} user keys from specialties.`);

  // Fetch users in batches
  const batches = [];
  for (let i = 0; i < userKeys.length; i += 200) batches.push(userKeys.slice(i, i + 200));

  const users = [];
  for (const b of batches) {
    const where = {
      fieldFilter: {
        field: { fieldPath: 'user_key' },
        op: 'IN',
        value: { arrayValue: { values: b.map(k => ({ stringValue: k })) } }
      }
    };
    const payload = { action: 'query', collectionName: 'users', where, limit: 10000, offset: 0 };
    const res = await fetchJson(payload);
    if (Array.isArray(res)) users.push(...res);
  }

  console.log(`Fetched ${users.length} user documents.`);

  const missing = [];
  const withImage = [];
  for (const doc of users) {
    const f = doc.fields || {};
    const key = f.user_key?.stringValue || f.id?.stringValue || 'unknown';
    const img = f.user_image?.stringValue || null;
    if (!img) missing.push(key); else withImage.push({ key, image: img });
  }

  console.log(`Users missing user_image: ${missing.length}`);
  if (missing.length) console.log(JSON.stringify(missing.slice(0, 200), null, 2));

  console.log(`Users with user_image: ${withImage.length} (showing up to 20)`);
  console.log(JSON.stringify(withImage.slice(0, 20), null, 2));

  process.exit(0);
})();
