/**
 * Manual staging DB reset (same as cron). Requires NEXT_PUBLIC_ENV=staging and DATABASE_URL.
 *
 *   cd apps/web && NEXT_PUBLIC_ENV=staging npm run demo:reset
 */
import path from "node:path";
import { config } from "dotenv";
import { resetDemoDatabase } from "../lib/demo-reset";

config({ path: path.join(__dirname, "../.env") });

resetDemoDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
