// Test child: waits until a start instant, then runs the migration runner and prints the applied versions as
// JSON. Used to race several processes on one fresh database.
// Usage: node --import tsx migrate-child.ts <dbPath> <migrationsDir> <startAtEpochMs>
import { openDatabase } from "../../src/platform/db";
import { migrate } from "../../src/platform/migrate";

const [dbPath, dir, startAt] = process.argv.slice(2);
if (dbPath === undefined || dir === undefined || startAt === undefined) {
  throw new Error("usage: migrate-child <dbPath> <migrationsDir> <startAtEpochMs>");
}

const db = openDatabase({ dbPath, nodeEnv: "test", isVitest: true });
const wait = Number(startAt) - Date.now();
setTimeout(
  () => {
    try {
      const result = migrate(db, { dir });
      process.stdout.write(`result ${JSON.stringify(result.applied)}\n`);
    } catch (error) {
      process.stdout.write(`error ${(error as Error).message}\n`);
    }
    db.close();
    process.exit(0);
  },
  Math.max(0, wait),
);
