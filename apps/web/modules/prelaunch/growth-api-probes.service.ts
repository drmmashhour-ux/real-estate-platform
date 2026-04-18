/**
 * Phase 10 — growth / launch API probes (auth + flag gates; evidence-based).
 */
import type { GrowthApiProbe } from "./final-launch-report.types";

function base(): string {
  return (process.env.VALIDATION_BASE_URL ?? process.env.PRELAUNCH_BASE_URL ?? "http://127.0.0.1:3001").replace(
    /\/$/,
    "",
  );
}

/**
 * Without PRELAUNCH_AUTH_COOKIE, authenticated GETs are expected to return 401 — we record that as OK (route + auth enforced).
 * With cookie, expect 200 or 403 if feature flag off.
 */
export async function runGrowthApiProbes(): Promise<GrowthApiProbe[]> {
  const root = base();
  const cookie = process.env.PRELAUNCH_AUTH_COOKIE?.trim();
  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": "LECIPM-Prelaunch/1.0",
  };
  if (cookie) {
    headers.Cookie = cookie;
  }

  const paths: { name: string; method: string; path: string; body?: unknown }[] = [
    { name: "soft_launch_plan", method: "GET", path: "/api/launch/v1/soft-launch-plan?city=Montréal" },
    { name: "first_users_pack", method: "GET", path: "/api/launch/v1/first-users-pack?city=Montréal" },
    { name: "ads_campaign_draft", method: "GET", path: "/api/ads/v1/campaign-draft?city=Montréal&audience=buyer" },
    {
      name: "funnel_visualization_soft_launch",
      method: "GET",
      path: "/api/marketing-system/v2/funnel-visualization?preset=soft_launch&days=90",
    },
  ];

  const out: GrowthApiProbe[] = [];

  for (const p of paths) {
    try {
      const res = await fetch(`${root}${p.path}`, {
        method: p.method,
        headers,
        signal: AbortSignal.timeout(25_000),
      });
      const status = res.status;
      let ok = false;
      let expectation = "";
      let detail = "";

      if (!cookie) {
        ok = status === 401 || status === 403;
        expectation = "unauthenticated_request_rejected_with_401_or_403";
        detail = ok ? `http_${status}` : `expected_401_or_403_got_${status}`;
      } else {
        ok = status >= 200 && status < 300;
        if (status === 403) {
          ok = true;
          expectation = "authenticated_but_feature_disabled_403_is_acceptable";
          detail = "feature_flag_off";
        } else {
          expectation = "authenticated_success_2xx";
          detail = `http_${status}`;
        }
      }

      out.push({
        name: p.name,
        method: p.method,
        path: p.path,
        httpStatus: status,
        ok,
        expectation,
        detail,
      });
    } catch (e) {
      out.push({
        name: p.name,
        method: p.method,
        path: p.path,
        ok: false,
        expectation: "network",
        detail: e instanceof Error ? e.message : String(e),
      });
    }
  }

  /* POST soft-launch event — anonymous-safe; may 200 with skipped if flags off */
  try {
    const res = await fetch(`${root}/api/marketing-intelligence/v1/soft-launch/event`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        step: "landing_view",
        sessionId: "prelaunch-probe",
        path: "/en/ca",
        beacon: "soft_launch",
      }),
      signal: AbortSignal.timeout(25_000),
    });
    const status = res.status;
    const ok = status === 200 || status === 400;
    out.push({
      name: "marketing_intelligence_soft_launch_event",
      method: "POST",
      path: "/api/marketing-intelligence/v1/soft-launch/event",
      httpStatus: status,
      ok,
      expectation: "returns_200_or_validation_400",
      detail: `http_${status}`,
    });
  } catch (e) {
    out.push({
      name: "marketing_intelligence_soft_launch_event",
      method: "POST",
      path: "/api/marketing-intelligence/v1/soft-launch/event",
      ok: false,
      expectation: "network",
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  return out;
}
