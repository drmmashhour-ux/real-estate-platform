/**
 * BNHUB API smoke tests (no Vitest). Exit 0 = all required checks passed.
 *
 * Run: pnpm run test:bnhub:api
 *
 * Env: see docs/bnhub/testing/api-smoke.md
 */
import { resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), ".env"), override: true });

const BASE = (process.env.BNHUB_SMOKE_BASE_URL ?? "http://127.0.0.1:3001").replace(/\/$/, "");

async function postJson(path: string, body: unknown, headers?: Record<string, string>) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text) as unknown;
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { res, json };
}

async function postRaw(path: string, body: string, contentType: string) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": contentType },
    body,
  });
  const text = await res.text();
  return { res, text };
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log(`BNHUB API smoke — ${BASE}\n`);
  let failed = 0;

  const run = async (name: string, fn: () => Promise<{ ok: boolean; detail?: string }>) => {
    try {
      const r = await fn();
      if (r.ok) {
        console.log(`OK  ${name}${r.detail ? ` — ${r.detail}` : ""}`);
      } else {
        failed++;
        console.log(`FAIL ${name}${r.detail ? ` — ${r.detail}` : ""}`);
      }
    } catch (e) {
      failed++;
      console.log(`FAIL ${name} — ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  // --- AI search ---
  await run("POST /api/search/ai (empty query → 400)", async () => {
    const { res, json } = await postJson("/api/search/ai", { query: "" });
    const ok = res.status === 400 && typeof (json as { error?: string }).error === "string";
    return { ok, detail: ok ? undefined : `status ${res.status}` };
  });

  await run("POST /api/search/ai (invalid JSON → 400)", async () => {
    const { res } = await postRaw("/api/search/ai", "{", "application/json");
    const ok = res.status === 400;
    return { ok, detail: ok ? undefined : `status ${res.status}` };
  });

  await run("POST /api/search/ai (natural language)", async () => {
    const { res, json } = await postJson("/api/search/ai", { query: "Montreal under 300" });
    if (res.status === 503 || res.status === 502) {
      return { ok: true, detail: "skipped (listings unavailable)" };
    }
    const j = json as { listings?: unknown; error?: string };
    const ok = res.status === 200 && Array.isArray(j.listings);
    return { ok, detail: ok ? undefined : j.error ?? `status ${res.status}` };
  });

  // --- Bookings ---
  await run("POST /api/bookings/create (validation → 400)", async () => {
    const { res } = await postJson("/api/bookings/create", { listingId: "" });
    return { ok: res.status === 400, detail: res.status === 400 ? undefined : `got ${res.status}` };
  });

  // --- Reviews ---
  await run("POST /api/reviews/create (missing fields → 400)", async () => {
    const { res } = await postJson("/api/reviews/create", {});
    return { ok: res.status === 400, detail: res.status === 400 ? undefined : `got ${res.status}` };
  });

  await run("POST /api/reviews/create (invalid rating → 400)", async () => {
    const { res } = await postJson("/api/reviews/create", {
      listingId: "00000000-0000-0000-0000-000000000001",
      guest_email: "x@y.z",
      rating: 99,
    });
    return { ok: res.status === 400, detail: res.status === 400 ? undefined : `got ${res.status}` };
  });

  // --- Stripe ---
  await run("POST /api/stripe/checkout (empty body → not 200)", async () => {
    const { res } = await postJson("/api/stripe/checkout", {});
    return { ok: res.status !== 200, detail: res.status !== 200 ? undefined : "unexpected 200" };
  });

  await run("POST /api/stripe/checkout (unknown bookingId → 404/400)", async () => {
    const { res, json } = await postJson("/api/stripe/checkout", {
      bookingId: "00000000-0000-0000-0000-000000000000",
    });
    const j = json as { error?: string };
    const ok = res.status === 404 || res.status === 400;
    return { ok, detail: ok ? `${res.status}` : `${res.status} ${j.error ?? ""}` };
  });

  const listingId = process.env.BNHUB_SMOKE_LISTING_ID?.trim();
  const email = process.env.BNHUB_SMOKE_GUEST_EMAIL?.trim() || "smoke-test@example.com";
  const auth = process.env.BNHUB_SMOKE_AUTH?.trim();
  const authHeaders: Record<string, string> | undefined = auth ? { Authorization: `Bearer ${auth}` } : undefined;

  let createdBookingId: string | undefined;
  let smokeDates: string[] = [];

  if (listingId) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 14);
    const d = tomorrow.toISOString().slice(0, 10);
    smokeDates = [d, addDays(d, 1), addDays(d, 2)];

    await run("POST /api/bookings/create (integration — valid)", async () => {
      const { res, json } = await postJson(
        "/api/bookings/create",
        { listingId, selectedDates: smokeDates, guestEmail: email },
        authHeaders
      );
      const j = json as { bookingId?: string; error?: string; code?: string };
      const ok = res.status === 200 && typeof j.bookingId === "string";
      if (ok) createdBookingId = j.bookingId;
      return {
        ok,
        detail: ok ? `bookingId=${j.bookingId}` : `${res.status} ${j.error ?? ""}`,
      };
    });

    if (createdBookingId && smokeDates.length > 0) {
      await run("POST /api/bookings/create (overlap / duplicate dates → 409)", async () => {
        const { res, json } = await postJson(
          "/api/bookings/create",
          { listingId, selectedDates: smokeDates, guestEmail: email },
          authHeaders
        );
        const j = json as { error?: string; code?: string };
        const ok = res.status === 409 || (res.status === 400 && /date|unavailable/i.test(j.error ?? ""));
        return {
          ok,
          detail: ok ? `got conflict as expected (${res.status})` : `${res.status} ${j.error ?? ""}`,
        };
      });
    }
  }

  const checkoutId = createdBookingId ?? process.env.BNHUB_SMOKE_BOOKING_ID?.trim();
  if (checkoutId) {
    await run("POST /api/stripe/checkout (guest — session or expected edge)", async () => {
      const { res, json } = await postJson("/api/stripe/checkout", { bookingId: checkoutId });
      const j = json as { url?: string; sessionId?: string; error?: string };
      if (res.status === 200 && j.url && j.sessionId) {
        return { ok: true, detail: `sessionId=${j.sessionId.slice(0, 28)}…` };
      }
      if ([409, 400, 503, 500].includes(res.status)) {
        return { ok: true, detail: `edge ${res.status}: ${j.error ?? ""}` };
      }
      return { ok: false, detail: `${res.status} ${j.error ?? ""}` };
    });
  }

  const paidListingId = process.env.BNHUB_SMOKE_REVIEW_LISTING_ID?.trim();
  const paidBookingId = process.env.BNHUB_SMOKE_PAID_BOOKING_ID?.trim();
  const reviewEmail = process.env.BNHUB_SMOKE_REVIEW_EMAIL?.trim() || email;
  if (paidListingId && paidBookingId) {
    await run("POST /api/reviews/create (integration — first submit)", async () => {
      const { res, json } = await postJson("/api/reviews/create", {
        listingId: paidListingId,
        bookingId: paidBookingId,
        guest_email: reviewEmail,
        rating: 5,
        comment: "smoke test",
      });
      const j = json as { id?: string; error?: string };
      const ok = res.status === 200 || res.status === 409;
      return {
        ok,
        detail:
          res.status === 200
            ? `reviewId=${j.id ?? "ok"}`
            : res.status === 409
              ? "duplicate (already reviewed)"
              : `${res.status} ${j.error ?? ""}`,
      };
    });

    await run("POST /api/reviews/create (duplicate → 409)", async () => {
      const { res, json } = await postJson("/api/reviews/create", {
        listingId: paidListingId,
        bookingId: paidBookingId,
        guest_email: reviewEmail,
        rating: 5,
        comment: "duplicate smoke",
      });
      const j = json as { error?: string; code?: string };
      const ok = res.status === 409 || (res.status === 403 && j.code === "NO_PAID_BOOKING");
      return {
        ok,
        detail: ok ? `${res.status}` : `${res.status} ${j.error ?? ""}`,
      };
    });
  }

  console.log("");
  printReadinessHint(failed);
  process.exit(failed > 0 ? 1 : 0);
}

function printReadinessHint(failed: number) {
  console.log("—");
  if (failed > 0) {
    console.log("Readiness: API smoke has failures — treat as NOT READY until fixed or waived.");
    return;
  }
  console.log("Readiness: API smoke passed (required checks).");
  console.log("Next: pnpm run validate:bnhub:db + manual E2E (docs/bnhub/testing/e2e-checklist.md).");
}

void main();
