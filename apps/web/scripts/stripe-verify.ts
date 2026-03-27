/**
 * Verifies STRIPE_SECRET_KEY can talk to Stripe (creates a throwaway Checkout Session).
 * Run from apps/web: npm run stripe:verify
 *
 * Requires .env with STRIPE_SECRET_KEY=sk_test_... (from Stripe Dashboard → API keys).
 */
import path from "node:path";
import { config } from "dotenv";
import Stripe from "stripe";

config({ path: path.join(__dirname, "../.env") });

const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";

if (!key) {
  console.error(
    "STRIPE_SECRET_KEY is empty. Add it to apps/web/.env from https://dashboard.stripe.com/test/apikeys (Secret key, starts with sk_test_)."
  );
  process.exit(1);
}

if (key.startsWith("pk_")) {
  console.error(
    "STRIPE_SECRET_KEY must be the Secret key (sk_test_…), not the Publishable key (pk_test_). Put pk_test_ in NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY only."
  );
  process.exit(1);
}

if (!key.startsWith("sk_test_") && !key.startsWith("sk_live_")) {
  console.error("STRIPE_SECRET_KEY must start with sk_test_ or sk_live_.");
  process.exit(1);
}

async function main() {
  const stripe = new Stripe(key);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "cad",
          unit_amount: 100,
          product_data: { name: "Stripe connectivity check (discard)" },
        },
        quantity: 1,
      },
    ],
    success_url: "https://example.com/success?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: "https://example.com/cancel",
  });

  console.log("OK — Stripe API accepted the secret key.");
  console.log("Session id:", session.id);
  console.log("Checkout URL (test):", session.url?.slice(0, 80) + "…");
}

main().catch((e: Error) => {
  console.error("Stripe error:", e.message);
  process.exit(1);
});
