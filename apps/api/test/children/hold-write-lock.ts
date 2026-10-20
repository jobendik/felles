// Test child: opens the database, takes the write lock with BEGIN IMMEDIATE, holds it for N milliseconds and
// then commits. Usage: node --import tsx hold-write-lock.ts <dbPath> <holdMs>
import { openDatabase } from "../../src/platform/db";

const [dbPath, holdArg] = process.argv.slice(2);
if (dbPath === undefined || holdArg === undefined)
  throw new Error("usage: hold-write-lock <dbPath> <holdMs>");

const db = openDatabase({ dbPath, nodeEnv: "test", isVitest: true });
db.exec("BEGIN IMMEDIATE");
process.stdout.write("locked\n");

setTimeout(() => {
  db.exec("COMMIT");
  process.stdout.write("released\n");
  db.close();
  process.exit(0);
}, Number(holdArg));
