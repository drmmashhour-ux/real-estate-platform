/**
 * Source-of-truth gate: `launch_events` counts + Stripe env (apps/web/.env).
 *
 * Run from `apps/web`: `pnpm validate:platform` or `npx tsx scripts/validate-platform.ts`
 * (`node` alone will not execute TypeScript).
 */

import { config } from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import { assertStripeSecretsForScripts } from "../lib/stripe/stripeEnvGate";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "../.env") });

assertStripeSecretsForScripts();

const TRACKED_EVENTS = [
  "USER_SIGNUP",
  "USER_LOGIN",
  "VIEW_LISTING",
  "CONTACT_BROKER",
  "CREATE_BOOKING",
  "PAYMENT_SUCCESS",
  "CHECKOUT_BLOCKED",
] as const;

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  const counts: Record<string, number> = {};
  try {
    for (const ev of TRACKED_EVENTS) {
      counts[ev] = await prisma.launchEvent
        .count({ where: { event: ev } })
        .catch(() => 0);
    }

    const issues: string[] = [];
    for (const ev of TRACKED_EVENTS) {
      if ((counts[ev] ?? 0) < 1) {
        issues.push(`${ev}: need >= 1 row, got ${counts[ev] ?? 0}`);
      }
    }

    const ready = issues.length === 0;

    console.log("\n--- validate-platform (launch_events) ---");
    for (const ev of TRACKED_EVENTS) {
      console.log(`  ${ev}: ${counts[ev] ?? 0}`);
    }
    if (issues.length) {
      console.log("\nNOT READY — missing items:");
      for (const i of issues) console.log(`  - ${i}`);
    }
    console.log(`\nResult: ${ready ? "READY" : "NOT READY"}\n`);

    process.exit(ready ? 0 : 1);
  } catch (e) {
    console.error("validate-platform failed:", e instanceof Error ? e.message : e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
