/**
 * LECIPM Safe Deployment v1 — smoke tests against a deployed base URL.
 *
 *   POSTDEPLOY_BASE_URL=https://your-app.vercel.app pnpm --filter @lecipm/web run postdeploy:test
 *   (PRELAUNCH_BASE_URL is also accepted, same as postlaunch-check)
 *
 * Exits non-zero if critical probes fail or any probe returns 5xx / times out.
 */
function resolveOrigin(): string {
  const raw = (
    process.env.POSTDEPLOY_BASE_URL?.trim() ||
    process.env.PRELAUNCH_BASE_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    "http://127.0.0.1:3001"
  ).trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

const origin = resolveOrigin();
const TIMEOUT_MS = Math.max(5_000, Number(process.env.POSTDEPLOY_TIMEOUT_MS ?? 30_000) || 30_000);

async function timedFetch(
  label: string,
  url: string,
  init: RequestInit | undefined,
  ok: (r: Response) => boolean,
): Promise<void> {
  const t0 = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const ms = Date.now() - t0;
    if (res.status >= 500) {
      throw new Error(`${label} server error: ${url} → ${res.status} (${ms}ms)`);
    }
    if (!ok(res)) {
      throw new Error(`${label} failed: ${url} → ${res.status} (${ms}ms)`);
    }
    console.log(`[postdeploy] OK ${label} (${res.status}) ${ms}ms`);
  } catch (e) {
    const ms = Date.now() - t0;
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error(`${label} timeout after ${TIMEOUT_MS}ms (${url})`);
    }
    throw e instanceof Error ? e : new Error(String(e) + ` (${ms}ms)`);
  } finally {
    clearTimeout(timer);
  }
}

async function main(): Promise<void> {
  console.log(`[postdeploy] Base: ${origin}`);
  console.log(`[postdeploy] Timeout: ${TIMEOUT_MS}ms\n`);

  await timedFetch(
    "Health (deep)",
    `${origin}/api/health?deep=1`,
    undefined,
    (r) => r.ok,
  );
  await timedFetch("Health (shallow)", `${origin}/api/health`, undefined, (r) => r.ok && r.status < 500);
  {
    const res = await fetch(`${origin}/api/ready`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (res.status >= 500) throw new Error(`/api/ready server error: ${res.status}`);
    if (!res.ok) throw new Error(`/api/ready failed: ${res.status}`);
    const body = (await res.json()) as { status?: string; ready?: boolean; db?: string };
    if (body.ready !== true) {
      throw new Error(`/api/ready: expected ready: true, got ${JSON.stringify(body)}`);
    }
    if (body.status !== "ok" && body.status !== "degraded") {
      throw new Error(`/api/ready: unexpected status: ${String(body.status)}`);
    }
    console.log(`[postdeploy] OK Ready (JSON: status=${body.status}, ready=true, db=${body.db})`);
  }

  await timedFetch("Homepage", `${origin}/`, undefined, (r) => r.ok && r.status < 500);
  await timedFetch("Listings browse", `${origin}/listings`, undefined, (r) => r.ok && r.status < 500);
  await timedFetch("Dashboard shell", `${origin}/dashboard`, undefined, (r) => r.ok && r.status < 500);

  await timedFetch(
    "Listings API (public)",
    `${origin}/api/listings?country=ca`,
    undefined,
    (r) => r.ok,
  );
  {
    const r = await fetch(`${origin}/api/leads`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (r.status >= 500) throw new Error(`/api/leads: ${r.status} (expected 401 without session)`);
    if (r.status !== 401) {
      throw new Error(`/api/leads: expected 401 unauthenticated, got ${r.status}`);
    }
    console.log(`[postdeploy] OK /api/leads unauthenticated → ${r.status}`);
  }
  {
    const r = await fetch(`${origin}/api/deals`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (r.status >= 500) throw new Error(`/api/deals: ${r.status} (expected 401 without session)`);
    if (r.status !== 401) {
      throw new Error(`/api/deals: expected 401 unauthenticated, got ${r.status}`);
    }
    console.log(`[postdeploy] OK /api/deals unauthenticated → ${r.status}`);
  }

  const bookingProbe = await fetch(`${origin}/api/mobile/broker/home`, { method: "GET" });
  if (![401, 403].includes(bookingProbe.status)) {
    throw new Error(`Booking-related API gate unexpected: ${bookingProbe.status}`);
  }
  console.log(`[postdeploy] OK Protected broker API returns ${bookingProbe.status} (unauthenticated)`);

  await timedFetch(
    "Stripe checkout smoke (expect 4xx validation)",
    `${origin}/api/stripe/checkout`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    },
    (r) => r.status < 500,
  );

  const co = await fetch(`${origin}/api/stripe/checkout`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      paymentType: "booking",
      bookingId: "00000000-0000-0000-0000-000000000000",
      successUrl: "https://example.com/ok",
      cancelUrl: "https://example.com/cancel",
      amountCents: 100,
    }),
  });
  if (![401, 403].includes(co.status)) {
    throw new Error(`Booking checkout without session: expected 401/403, got ${co.status}`);
  }
  console.log(`[postdeploy] OK Stripe booking checkout unauthenticated → ${co.status}`);

  const stripeHealth = await fetch(`${origin}/api/health`);
  const hj = (await stripeHealth.json()) as { stripe?: string };
  if (hj.stripe === "invalid") {
    throw new Error("Stripe configuration invalid per /api/health");
  }
  console.log(`[postdeploy] OK Stripe readiness: ${hj.stripe ?? "unknown"}`);

  console.log("\n[postdeploy] All smoke tests passed.");
  console.log(`
--- AUTOMATED SMOKE (this script) ---
Frontend shell (/):     PASS
Health + ready:         PASS
Dashboard route:        PASS
Listings API:           PASS
Leads/Deals (no auth):  PASS (401 — routes reachable, no 5xx)
Stripe checkout probe:  PASS (see logs above)
--- MANUAL (browser / Vercel / DB) ---
Auth (sign-in session):  NOT COVERED — test in browser
BNHub (search, book CTA): NOT COVERED — test in browser
Stripe hosted redirect:  NOT COVERED — complete a test payment in Stripe test mode
Vercel logs:             NOT COVERED — check dashboard for 5xx / Prisma
DB persistence:         NOT COVERED — confirm rows in your DB / Supabase
`);
}

main().catch((e) => {
  console.error("[postdeploy] FAILED:", e);
  process.exit(1);
});
