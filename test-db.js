import { db } from "./lib/db.js";

async function test() {
  const result = await db.execute("SELECT 1");
  console.log(result);
}

test();
