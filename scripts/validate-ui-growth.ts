/**
 * Local validation: hit dev-login, then growth dashboard HTML checks.
 * Run with dev server: pnpm --filter @lecipm/web dev (default port 3001)
 *
 *   VALIDATION_BASE_URL=http://localhost:3000 npx tsx scripts/validate-ui-growth.ts
 *   VALIDATION_LISTING_ID=<uuid> optional — BNHub/residential listing id for /listings/[id] smoke
 */

function cookieHeaderFromResponse(res: Response): string {
  const h = res.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof h.getSetCookie === "function") {
    return h
      .getSetCookie()
      .map((c) => c.split(";")[0]!.trim())
      .join("; ");
  }
  const raw = res.headers.get("set-cookie");
  if (!raw) return "";
  return raw
    .split(/,(?=\s*[a-zA-Z_][a-zA-Z0-9_-]*=)/)
    .map((s) => s.split(";")[0]!.trim())
    .join("; ");
}

async function main() {
  const base = (process.env.VALIDATION_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const listingId = process.env.VALIDATION_LISTING_ID?.trim();

  const loginRes = await fetch(`${base}/api/dev-login`, { redirect: "manual" });

  let dashboardVisible = false;
  let funnelVisible = false;
  let croVisible = false;
  let listingCro: { cta: boolean; trust: boolean; urgency: boolean } | undefined;

  if (loginRes.status === 404) {
    console.log(
      JSON.stringify(
        {
          dashboardVisible,
          funnelVisible,
          croVisible,
          note: "dev-login returned 404 — use NODE_ENV=development or hit local dev server only",
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  if (loginRes.status !== 307 && loginRes.status !== 302) {
    const body = await loginRes.text();
    console.log(
      JSON.stringify(
        {
          dashboardVisible,
          funnelVisible,
          croVisible,
          error: `dev-login unexpected status ${loginRes.status}`,
          body: body.slice(0, 200),
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  const cookie = cookieHeaderFromResponse(loginRes);
  const dashRes = await fetch(`${base}/en/ca/dashboard/growth`, {
    headers: cookie ? { Cookie: cookie } : {},
    redirect: "manual",
  });

  if (dashRes.ok) {
    dashboardVisible = true;
    const html = await dashRes.text();
    funnelVisible =
      html.includes("data-growth-ads-landing-funnel") ||
      html.includes("Ads landing funnel (platform · 90d)") ||
      html.includes("Ads landing funnel");
    croVisible =
      html.includes("data-growth-cro-section") ||
      /Conversion Optimization/i.test(html);
  }

  if (listingId) {
    const lp = await fetch(`${base}/en/ca/listings/${encodeURIComponent(listingId)}`, {
      headers: cookie ? { Cookie: cookie } : {},
    });
    if (lp.ok) {
      const html = await lp.text();
      listingCro = {
        cta: /Book now|Reserve your stay|Check availability/i.test(html),
        trust: /Verified listing|Secure payment|Trusted platform|Book with confidence/i.test(html),
        urgency: /viewed this today|Limited availability|Booked \d+ time/i.test(html),
      };
    }
  }

  const out = {
    dashboardVisible,
    funnelVisible,
    croVisible,
    ...(listingId ? { listingId, listingCro } : {}),
  };
  console.log(JSON.stringify(out, null, 2));

  const ok = dashboardVisible && funnelVisible && croVisible;
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
