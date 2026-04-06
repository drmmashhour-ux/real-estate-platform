/**
 * Daily launch content: SEO + social + email rows via autopilot (requires `autopilot_content_items` / Prisma).
 * Run: pnpm --filter @lecipm/web run ai:daily-content
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { runDailyAutopilotContent } from "../src/modules/ai/contentEngine";

for (const envPath of [resolve(process.cwd(), ".env"), resolve(process.cwd(), "apps/web/.env")]) {
  if (existsSync(envPath)) {
    config({ path: envPath });
    break;
  }
}

async function main() {
  const city = process.env.AUTOPILOT_DEFAULT_CITY?.trim() || "Montreal";
  const publish = process.env.AUTOPILOT_DRY_RUN === "1" ? false : true;
  const r = await runDailyAutopilotContent({ city, publish });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ ok: true, ...r }, null, 2));
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
