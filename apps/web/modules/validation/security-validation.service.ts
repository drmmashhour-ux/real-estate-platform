/**
 * Security-focused probes (unauthorized access, invalid input, rate-limit signal).
 */
import type { SecurityCheckResult } from "./types";

export async function runSecurityProbes(baseUrl: string): Promise<SecurityCheckResult[]> {
  const out: SecurityCheckResult[] = [];
  const root = baseUrl.replace(/\/$/, "");

  // 1) Dashboard API without session → expect 401
  try {
    const r = await fetch(`${root}/api/dashboard/projects`, {
      method: "GET",
      redirect: "manual",
      headers: { "User-Agent": "LECIPM-PlatformValidation/1.0" },
      signal: AbortSignal.timeout(15_000),
    });
    const ok = r.status === 401 || r.status === 403;
    out.push({
      name: "dashboard_api_without_cookie",
      status: ok ? "pass" : "fail",
      errors: ok ? [] : [`expected_401_or_403_got_${r.status}`],
      warnings: [],
      evidence: { httpStatus: r.status },
    });
  } catch (e) {
    out.push({
      name: "dashboard_api_without_cookie",
      status: "fail",
      errors: [e instanceof Error ? e.message : String(e)],
      warnings: [],
    });
  }

  // 2) Invalid JSON to a JSON POST endpoint (auth/login already in api probes) — stripe checkout without auth
  try {
    const r = await fetch(`${root}/api/stripe/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invalid: true }),
      signal: AbortSignal.timeout(15_000),
    });
    const acceptable = r.status === 400 || r.status === 401 || r.status === 403 || r.status === 422;
    out.push({
      name: "stripe_checkout_rejects_bad_payload_or_auth",
      status: acceptable ? "pass" : "warn",
      errors: [],
      warnings: acceptable ? [] : [`unexpected_status_${r.status}`],
      evidence: { httpStatus: r.status },
    });
  } catch (e) {
    out.push({
      name: "stripe_checkout_rejects_bad_payload_or_auth",
      status: "fail",
      errors: [e instanceof Error ? e.message : String(e)],
      warnings: [],
    });
  }

  // 3) Rate limit: many parallel hits to /api/ready — should not crash (may 429 if global middleware)
  try {
    const batch = await Promise.all(
      Array.from({ length: 30 }, () =>
        fetch(`${root}/api/ready`, { signal: AbortSignal.timeout(10_000) }).then((x) => x.status),
      ),
    );
    const crashed = batch.some((s) => s >= 500);
    const throttled = batch.some((s) => s === 429);
    out.push({
      name: "ready_endpoint_under_burst",
      status: crashed ? "fail" : "pass",
      errors: crashed ? ["server_error_in_burst"] : [],
      warnings: throttled ? ["some_429_under_burst"] : [],
      evidence: { statuses: batch.slice(0, 5) },
    });
  } catch (e) {
    out.push({
      name: "ready_endpoint_under_burst",
      status: "fail",
      errors: [e instanceof Error ? e.message : String(e)],
      warnings: [],
    });
  }

  return out;
}
