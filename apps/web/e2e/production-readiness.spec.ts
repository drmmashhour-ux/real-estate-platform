/**
 * Production-mode smoke + route coverage.
 * Prerequisites: `pnpm build` in apps/web
 * Optional: E2E_ADMIN_EMAIL + E2E_ADMIN_PASSWORD (e.g. seed admin), E2E_GUEST_EMAIL + E2E_GUEST_PASSWORD
 */
import { expect, test, type Page } from "@playwright/test";

const SEED_LISTING_ID = "seed-fsbo-seller-live-001";

type RouteResult = {
  path: string;
  finalUrl: string;
  status: "OK" | "FAIL";
  loadMs: number;
  consoleErrors: string[];
  pageErrors: string[];
  note?: string;
};

let reportRows: RouteResult[] = [];

function attachListeners(page: Page, consoleErrors: string[], pageErrors: string[]) {
  const onConsole = (msg: { type: () => string; text: () => string }) => {
    if (msg.type() !== "error") return;
    const t = msg.text();
    if (/favicon|ResizeObserver|Failed to load resource.*404|Failed to load resource.*401|net::ERR/i.test(t))
      return;
    consoleErrors.push(t.slice(0, 500));
  };
  const onPageError = (err: Error) => {
    const m = String(err.message || err);
    // Chromium + React `performance.measure` can throw on fast redirects / hydration; not an app defect.
    if (/cannot have a negative time stamp|Negative time stamp/i.test(m)) return;
    pageErrors.push(m.slice(0, 500));
  };
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  return () => {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
  };
}

async function checkPage(page: Page, path: string, note?: string): Promise<RouteResult> {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const detach = attachListeners(page, consoleErrors, pageErrors);

  const t0 = Date.now();
  const res = await page.goto(path, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForLoadState("networkidle", { timeout: 25_000 }).catch(() => {});
  const loadMs = Date.now() - t0;
  const ok = res === null || (res.status() >= 200 && res.status() < 400);
  const finalUrl = page.url();

  const bodyText = await page.locator("body").innerText().catch(() => "");
  const compact = bodyText.replace(/\s/g, "");
  const looksLikeShell =
    compact.length > 50 ||
    /sign in|sign up|password|email|dashboard|lecipm|portfolio|listings|broker|admin|projects|users|leads|hub|forbidden|access denied|unauthorized|create account|welcome/i.test(
      bodyText,
    );

  detach();

  const fatal = pageErrors.length > 0 || !ok;
  const status: "OK" | "FAIL" = fatal || !looksLikeShell ? "FAIL" : "OK";

  const row: RouteResult = {
    path,
    finalUrl,
    status,
    loadMs,
    consoleErrors: [...new Set(consoleErrors)].slice(0, 8),
    pageErrors,
    note,
  };
  if (row.status === "OK" && consoleErrors.length > 0) {
    row.note = (row.note ? `${row.note}; ` : "") + `console: ${consoleErrors.length} error line(s)`;
  }
  reportRows.push(row);
  return row;
}

test.describe("Backend readiness", () => {
  test("GET /api/ready — Prisma DB", async ({ request }) => {
    const res = await request.get("/api/ready");
    expect(res.ok(), `ready status ${res.status()}`).toBeTruthy();
    const j = (await res.json()) as { ready?: boolean; db?: string };
    expect(j.ready).toBe(true);
    expect(j.db).toBe("connected");
  });
});

test.describe("Supabase (optional)", () => {
  test("anon client reaches project (auth health)", async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    test.skip(!url || !key, "NEXT_PUBLIC_SUPABASE_URL / ANON_KEY not set");
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(url!, key!);
    const { error } = await sb.auth.getSession();
    expect(error).toBeNull();
  });
});

test.describe("RPC create_broker_lead_with_distribution", () => {
  test("documented gap", async () => {
    test.skip(
      true,
      "No RPC in repo — validate in Supabase SQL editor / staging with service role when you add the function.",
    );
  });
});

test.describe("Public routes", () => {
  test("core pages render", async ({ page }) => {
    reportRows = [];
    for (const p of ["/", "/listings", `/listings/${SEED_LISTING_ID}`, "/map-search", `/property/${SEED_LISTING_ID}`]) {
      const r = await checkPage(page, p);
      expect.soft(r.status, p).toBe("OK");
    }
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#hubs")).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: /buy, sell, bnhub|ecosystem hubs/i }),
    ).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Auth routes", () => {
  test("login and signup shells", async ({ page }) => {
    reportRows = [];
    for (const p of ["/login", "/auth/login", "/signup"]) {
      const r = await checkPage(page, p);
      expect.soft(r.status, p).toBe("OK");
    }
  });
});

test.describe("User routes (gate or OK)", () => {
  test("dashboard / favorites / saved-searches", async ({ page }) => {
    for (const p of ["/dashboard", "/favorites", "/saved-searches"]) {
      const r = await checkPage(page, p);
      expect.soft(r.pageErrors.length, `${p} no thrown page errors`).toBe(0);
      const authGate = /login|auth|sign/i.test(r.finalUrl);
      expect.soft(r.status === "OK" || authGate, `${p} renders or redirects to auth`).toBeTruthy();
    }
  });
});

test.describe("Broker routes", () => {
  test("broker profile + dashboard alias", async ({ page }) => {
    reportRows = [];
    const r1 = await checkPage(page, "/broker/mohamed-al-mashhour");
    expect.soft(r1.pageErrors.length).toBe(0);
    expect.soft(r1.finalUrl.includes("broker")).toBeTruthy();

    const r2 = await checkPage(page, "/broker-dashboard");
    const brokerDashOk =
      r2.finalUrl.includes("/broker/dashboard") || r2.finalUrl.includes("%2Fbroker%2Fdashboard");
    expect.soft(brokerDashOk, `broker-dashboard alias → ${r2.finalUrl}`).toBeTruthy();
    expect.soft(r2.pageErrors.length).toBe(0);
  });
});

test.describe("Admin routes", () => {
  test("admin pages (authenticated or login gate)", async ({ page }) => {
    reportRows = [];
    const email = process.env.E2E_ADMIN_EMAIL?.trim();
    const password = process.env.E2E_ADMIN_PASSWORD?.trim();

    if (email && password) {
      await page.goto("/auth/login");
      await page.locator('input[name="email"]').fill(email);
      await page.locator('input[name="password"]').fill(password);
      await page.getByRole("button", { name: /sign in/i }).click();
      await page.waitForTimeout(2000);
    }

    for (const p of ["/admin", "/admin/users", "/admin/listings", "/admin/leads"]) {
      const r = await checkPage(page, p);
      expect.soft(r.pageErrors.length, p).toBe(0);
      const u = r.finalUrl;
      const authGate = /\/auth\/login/i.test(u);
      const roleRedirect = u.includes("/dashboard");
      /** `/admin/leads` redirects to dashboard CRM or login (see `app/admin/leads/page.tsx`). */
      const acceptable =
        u.includes("/admin") ||
        authGate ||
        roleRedirect ||
        (p === "/admin/leads" && (u.includes("/dashboard/leads") || authGate));
      expect.soft(acceptable, `${p} → ${u}`).toBeTruthy();
    }
  });
});

test.describe("Guest journey", () => {
  test("login → projects → listing → map search page", async ({ page }) => {
    const email = process.env.E2E_GUEST_EMAIL ?? "guest@demo.com";
    const password = process.env.E2E_GUEST_PASSWORD ?? "DemoGuest2024!";

    await page.goto("/auth/login");
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForTimeout(3000);

    await page.goto("/projects", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();

    await page.goto(`/listings/${SEED_LISTING_ID}`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();

    const map = await checkPage(page, "/bnhub/stays");
    expect(map.pageErrors.length).toBe(0);
  });
});

test.afterAll(async () => {
  console.log("\n========== E2E ROUTE REPORT ==========");
  for (const r of reportRows) {
    const flag = r.status === "OK" ? "✓" : "✗";
    console.log(`${flag} ${r.loadMs}ms ${r.path} → ${r.finalUrl}`);
    if (r.consoleErrors.length) console.log("   console:", r.consoleErrors.slice(0, 2).join(" | "));
    if (r.pageErrors.length) console.log("   pageError:", r.pageErrors.join(" | "));
    if (r.note) console.log("   note:", r.note);
  }
  console.log("======================================\n");
});
