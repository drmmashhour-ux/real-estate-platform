/**
 * Phase 1: Confirm STRIPE_SECRET_KEY from apps/web/.env only (override) can list
 * and create Express connected accounts. Stops with a clear message if Connect is not enabled.
 *
 * Run: cd apps/web && npx tsx scripts/verify-stripe-connect-platform.ts
 */
import { config } from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Stripe from "stripe";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "../.env"), override: true });

const sk = process.env.STRIPE_SECRET_KEY?.trim() ?? "";

async function main(): Promise<void> {
  if (!sk.startsWith("sk_test_") && !sk.startsWith("sk_live_")) {
    console.error("STOP: STRIPE_SECRET_KEY missing or invalid in apps/web/.env (expected sk_test_* or sk_live_*).");
    process.exit(1);
  }

  const stripe = new Stripe(sk);

  try {
    await stripe.accounts.list({ limit: 1 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("STOP: stripe.accounts.list failed — invalid key or API error:", msg);
    process.exit(1);
  }

  let probeId: string | null = null;
  try {
    const acct = await stripe.accounts.create({
      type: "express",
      country: "CA",
    });
    probeId = acct.id;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/signed up for Connect/i.test(msg) || /You can only create new accounts if you've signed up for Connect/i.test(msg)) {
      console.log("STRIPE ACCOUNT MISMATCH — CONNECT NOT ENABLED FOR THIS KEY");
      process.exit(1);
    }
    console.error("STOP: stripe.accounts.create failed:", msg);
    process.exit(1);
  }

  if (probeId) {
    try {
      await stripe.accounts.del(probeId);
    } catch {
      /* probe cleanup best-effort */
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        message: "Connect account creation succeeded for this platform key (probe account deleted).",
      },
      null,
      2
    )
  );
}

void main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
