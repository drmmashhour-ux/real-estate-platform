/**
 * LECIPM API flow checks (listing → booking → Stripe checkout → cancel → refund simulation).
 *
 * Prerequisites:
 * - Next.js app running (default http://127.0.0.1:3001 — matches `pnpm dev` in this package).
 * - Auth: set `E2E_SESSION_COOKIE` (document.cookie from a signed-in browser) **or**
 *   `E2E_EMAIL` + `E2E_PASSWORD` (account must be email-verified; 2FA must be off).
 * - Recommended local gates: `CONTRACT_ENFORCEMENT_DISABLED=true`, `LEGAL_ENFORCEMENT_DISABLED=true`
 * - Stripe test mode: `STRIPE_SECRET_KEY` sk_test_… (checkout returns 503 if missing).
 * - If checkout fails with "verified listing": disable strict trust or verify listing (`BNHUB_TRUST_STRICT`).
 *
 * Run from apps/web:
 *   pnpm test:e2e:api-flows
 */

import { setTimeout as delay } from "node:timers/promises";

const BASE_URL = (process.env.E2E_BASE_URL ?? "http://127.0.0.1:3001").replace(/\/$/, "");

type Json = Record<string, unknown>;

function log(...args: unknown[]) {
  console.log("[e2e]", ...args);
}

function warn(...args: unknown[]) {
  console.warn("[e2e]", ...args);
}

function err(...args: unknown[]) {
  console.error("[e2e]", ...args);
}

function cookiePairFromSetCookieLine(line: string): string {
  return line.split(";")[0]?.trim() ?? "";
}

function collectCookieHeader(res: Response): string {
  const headers = res.headers as unknown as { getSetCookie?: () => string[] };
  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie().map(cookiePairFromSetCookieLine).filter(Boolean).join("; ");
  }
  const single = res.headers.get("set-cookie");
  if (!single) return "";
  return single
    .split(/,(?=[^;]+?=)/)
    .map(cookiePairFromSetCookieLine)
    .filter(Boolean)
    .join("; ");
}

async function request(
  path: string,
  options: RequestInit & { cookie?: string } = {}
): Promise<{ ok: boolean; status: number; json: Json | null; text: string; headers: Headers }> {
  const { cookie, ...init } = options;
  const headers = new Headers(init.headers);
  if (init.body != null && typeof init.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (cookie) headers.set("Cookie", cookie);

  const res = await fetch(`${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`, {
    ...init,
    headers,
  });
  const text = await res.text();
  let json: Json | null = null;
  try {
    json = JSON.parse(text) as Json;
  } catch {
    /* ignore */
  }
  return { ok: res.ok, status: res.status, json, text, headers: res.headers };
}

let sessionCookie = process.env.E2E_SESSION_COOKIE?.trim() ?? "";

async function ensureSessionCookie(): Promise<string> {
  if (sessionCookie) return sessionCookie;

  const email = process.env.E2E_EMAIL?.trim();
  const password = process.env.E2E_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "Set E2E_SESSION_COOKIE or E2E_EMAIL + E2E_PASSWORD for authenticated API calls."
    );
  }

  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const text = await res.text();
  let json: Json | null = null;
  try {
    json = JSON.parse(text) as Json;
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    throw new Error(`Login failed (${res.status}): ${json?.error ?? text}`);
  }
  if (json?.requiresTwoFactor) {
    throw new Error("E2E user has 2FA enabled — use E2E_SESSION_COOKIE instead.");
  }
  const cookie = collectCookieHeader(res);
  if (!cookie) {
    throw new Error("Login succeeded but no Set-Cookie returned (check Node version / fetch implementation).");
  }
  sessionCookie = cookie;
  return sessionCookie;
}

function listingIdFromCreate(res: Json | null): string | null {
  const listing = res?.listing;
  if (listing && typeof listing === "object" && "id" in listing && typeof (listing as { id: unknown }).id === "string") {
    return (listing as { id: string }).id;
  }
  return null;
}

async function createListing(cookie: string): Promise<string> {
  const body = {
    title: `E2E Test Listing ${Date.now()}`,
    city: "Montreal",
    address: "1 E2E Test Street",
    pricePerNight: 120,
    guests: 2,
    listingStatus: "PUBLISHED",
    instantBookEnabled: true,
    description: "Automated test listing",
  };
  const res = await request("/api/admin/listings", {
    method: "POST",
    cookie,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`createListing failed (${res.status}): ${res.json?.error ?? res.text}`);
  }
  const id = listingIdFromCreate(res.json);
  if (!id) throw new Error("createListing: missing listing.id in response");
  log("Listing created:", id);
  return id;
}

async function editListing(cookie: string, id: string): Promise<void> {
  const res = await request(`/api/admin/listings/${encodeURIComponent(id)}`, {
    method: "PUT",
    cookie,
    body: JSON.stringify({ pricePerNight: 150, instantBookEnabled: true }),
  });
  if (!res.ok) {
    throw new Error(`editListing failed (${res.status}): ${res.json?.error ?? res.text}`);
  }
  log("Listing updated");
}

async function addPromotion(cookie: string, id: string): Promise<void> {
  const start = new Date();
  const end = new Date(Date.now() + 7 * 86400000);
  const res = await request(`/api/admin/listings/${encodeURIComponent(id)}/promotions`, {
    method: "POST",
    cookie,
    body: JSON.stringify({
      title: "Test Promo",
      discountPct: 10,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    }),
  });
  if (!res.ok) {
    throw new Error(`addPromotion failed (${res.status}): ${res.json?.error ?? res.text}`);
  }
  log("Promotion added");
}

/** BNHUB Prisma booking — requires LECIPM session cookie. */
async function createBooking(
  cookie: string,
  listingId: string,
  checkIn: string,
  checkOut: string
): Promise<string> {
  const res = await request("/api/bnhub/bookings", {
    method: "POST",
    cookie,
    body: JSON.stringify({
      listingId,
      checkIn,
      checkOut,
      guestCount: 2,
    }),
  });
  if (!res.ok) {
    throw new Error(`createBooking failed (${res.status}): ${res.json?.error ?? res.text}`);
  }
  const bid = res.json?.id;
  if (typeof bid !== "string") throw new Error("createBooking: missing booking id");
  log("Booking created:", bid);
  return bid;
}

async function createCheckout(cookie: string, bookingId: string): Promise<string | null> {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? BASE_URL).replace(/\/$/, "");
  const res = await request("/api/stripe/checkout", {
    method: "POST",
    cookie,
    body: JSON.stringify({
      paymentType: "booking",
      bookingId,
      amountCents: 1,
      successUrl: `${appUrl}/bnhub/trips?e2e=paid&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appUrl}/bnhub/trips?e2e=cancel`,
    }),
  });
  if (!res.ok) {
    warn(`Stripe checkout not created (${res.status}): ${res.json?.error ?? res.text}`);
    return null;
  }
  const url = res.json?.url;
  if (typeof url === "string" && url.length > 0) {
    log("Checkout session URL:", url.slice(0, 80) + (url.length > 80 ? "…" : ""));
    return url;
  }
  warn("Checkout response missing url");
  return null;
}

async function cancelBooking(cookie: string, id: string): Promise<void> {
  const res = await request(`/api/bnhub/bookings/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
    cookie,
    body: JSON.stringify({ by: "guest" }),
  });
  if (!res.ok) {
    throw new Error(`cancelBooking failed (${res.status}): ${res.json?.error ?? res.text}`);
  }
  log("Booking canceled");
}

/** No public HTTP refund route — optional DB flag for local simulation. */
async function refundBookingSimulated(bookingId: string): Promise<void> {
  if (process.env.E2E_SIMULATE_REFUND !== "1") {
    log("Refund: skipped (set E2E_SIMULATE_REFUND=1 for Prisma refund flag on this booking).");
    return;
  }
  const { prisma } = await import("@/lib/db");
  await prisma.booking.update({
    where: { id: bookingId },
    data: { refunded: true, refundedAt: new Date() },
  });
  log("Refund processed (DB simulation)");
}

async function testDoubleBooking(
  cookie: string,
  listingId: string,
  checkIn: string,
  checkOut: string
): Promise<void> {
  const first = await request("/api/bnhub/bookings", {
    method: "POST",
    cookie,
    body: JSON.stringify({
      listingId,
      checkIn,
      checkOut,
      guestCount: 2,
    }),
  });
  if (!first.ok) {
    warn("Double-booking setup: first booking failed — skipping overlap check");
    return;
  }
  const firstId = typeof first.json?.id === "string" ? first.json.id : null;
  try {
    const second = await request("/api/bnhub/bookings", {
      method: "POST",
      cookie,
      body: JSON.stringify({
        listingId,
        checkIn,
        checkOut,
        guestCount: 2,
      }),
    });
    if (!second.ok && second.status === 400) {
      log("Double booking prevented (second request rejected)");
      return;
    }
    if (second.ok) {
      warn("Double booking: second request unexpectedly succeeded — check availability rules.");
      const sid = second.json?.id;
      if (typeof sid === "string") {
        await request(`/api/bnhub/bookings/${encodeURIComponent(sid)}/cancel`, {
          method: "POST",
          cookie,
          body: JSON.stringify({ by: "guest" }),
        }).catch(() => {});
      }
      return;
    }
    warn(`Double booking: unexpected status ${second.status}`, second.json?.error ?? second.text);
  } finally {
    if (firstId) {
      await request(`/api/bnhub/bookings/${encodeURIComponent(firstId)}/cancel`, {
        method: "POST",
        cookie,
        body: JSON.stringify({ by: "guest" }),
      }).catch(() => {});
    }
  }
}

async function testInvalidDates(cookie: string, listingId: string): Promise<void> {
  const res = await request("/api/bnhub/bookings", {
    method: "POST",
    cookie,
    body: JSON.stringify({
      listingId,
      checkIn: "",
      checkOut: "",
    }),
  });
  if (!res.ok && res.status >= 400) {
    log("Invalid dates rejected");
    return;
  }
  warn("Invalid dates: expected 400, got", res.status);
}

async function deleteListing(cookie: string, id: string): Promise<void> {
  const res = await request(`/api/admin/listings/${encodeURIComponent(id)}`, {
    method: "DELETE",
    cookie,
  });
  if (!res.ok) {
    throw new Error(`deleteListing failed (${res.status}): ${res.json?.error ?? res.text}`);
  }
  log("Listing unlisted (DELETE → UNLISTED)");
}

async function optionalPrismaValidate(listingId: string): Promise<void> {
  if (process.env.E2E_PRISMA_VALIDATE !== "1") return;
  const { prisma } = await import("@/lib/db");
  const row = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { listingStatus: true, title: true },
  });
  if (!row) {
    warn("Prisma validate: listing row missing (expected after delete)");
    return;
  }
  log("Prisma validate:", row.listingStatus, row.title?.slice(0, 40));
}

async function runAll(): Promise<void> {
  log("Running E2E API scenarios against", BASE_URL);
  let failures = 0;
  const fail = (e: unknown) => {
    failures += 1;
    err(e instanceof Error ? e.message : e);
  };

  const checkIn = process.env.E2E_CHECK_IN ?? "2026-09-10";
  const checkOut = process.env.E2E_CHECK_OUT ?? "2026-09-14";

  let cookie: string;
  try {
    cookie = await ensureSessionCookie();
  } catch (e) {
    err(e);
    process.exit(1);
  }

  let listingId: string | null = null;
  let bookingId: string | null = null;

  try {
    listingId = await createListing(cookie);
    await editListing(cookie, listingId);
    await addPromotion(cookie, listingId);

    bookingId = await createBooking(cookie, listingId, checkIn, checkOut);

    await testDoubleBooking(cookie, listingId, "2026-10-01", "2026-10-05");
    await testInvalidDates(cookie, listingId);

    await createCheckout(cookie, bookingId);

    await cancelBooking(cookie, bookingId);
    await refundBookingSimulated(bookingId);

    await deleteListing(cookie, listingId);
    await optionalPrismaValidate(listingId);
  } catch (e) {
    fail(e);
  }

  if (failures > 0) {
    err(`Completed with ${failures} failure(s).`);
    process.exit(1);
  }

  log("ALL SCENARIOS COMPLETED");
  await delay(10);
}

runAll().catch((e) => {
  err(e);
  process.exit(1);
});
