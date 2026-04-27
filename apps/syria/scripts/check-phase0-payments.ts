/**
 * Static Phase 0 checklist for SYBNB payments (no network, no secrets printed).
 * Loads `.env` / `.env.local` if present. Run: `pnpm payments:phase0` from `apps/syria`.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";

const root = join(__dirname, "..");
config({ path: join(root, ".env") });
config({ path: join(root, ".env.local"), override: true });

const paymentIntentPath = join(root, "src/app/api/sybnb/payment-intent/route.ts");

let failed = 0;
function check(label: string, pass: boolean, hint: string): void {
  const ok = pass ? "PASS" : "FAIL";
  console.log(`[${ok}] ${label}${pass ? "" : ` — ${hint}`}`);
  if (!pass) failed += 1;
}

check(
  "SYBNB production lock: unset or not 'false' (default = locked safe)",
  process.env.SYBNB_PRODUCTION_LOCK_MODE !== "false",
  "only controlled staging/sandbox may set SYBNB_PRODUCTION_LOCK_MODE=false",
);

check(
  "Phase 0: SYBNB_PAYMENTS_ENABLED is not 'true' (default off / manual-first)",
  process.env.SYBNB_PAYMENTS_ENABLED !== "true",
  "keep false until Phase 1 sandbox; see docs/payment-activation-checklist.md",
);

check(
  "Kill switches off (not 'true')",
  process.env.SYBNB_PAYMENTS_KILL_SWITCH !== "true" && process.env.SYBNB_PAYOUTS_KILL_SWITCH !== "true",
  "set SYBNB_PAYMENTS_KILL_SWITCH or SYBNB_PAYOUTS_KILL_SWITCH only for emergency",
);

let intentOk = false;
if (existsSync(paymentIntentPath)) {
  const src = readFileSync(paymentIntentPath, "utf8");
  intentOk =
    /stub|Stub|no charge|demo/i.test(src) &&
    src.includes("assertSybnbPaymentCompleteAsync");
}
check("payment-intent route: stub / gated (no direct live Stripe in this file)", intentOk, "src/app/api/sybnb/payment-intent/route.ts");

const webhookPath = join(root, "src/app/api/sybnb/webhook/route.ts");
let webhookOk = false;
if (existsSync(webhookPath)) {
  const w = readFileSync(webhookPath, "utf8");
  webhookOk = w.includes("stripe-signature") && w.includes("verifySybnbAppWebhookSecret");
}
check("Webhook enforces production signature + shared secret path", webhookOk, "src/app/api/sybnb/webhook/route.ts");

console.log(
  "\nAlso run: `pnpm env:check` (DB safety). For production: INVESTOR_DEMO_MODE not on prod DB, staging DSN != prod.",
);
console.log("See: docs/payment-activation-checklist.md\n");

if (failed > 0) {
  process.exit(1);
}
process.exit(0);
