/**
 * LECIPM Deployment Safety v1 — aggregates remote checks for go / no-go (post CI predeploy).
 * Target health/Stripe state comes from the **remote** origin only (runner env is not validated here).
 */

export type ReleaseReadinessResult = {
  go: boolean;
  blocked: boolean;
  reasons: string[];
  checks: Record<string, { ok: boolean; detail?: string }>;
};

const DEFAULT_TIMEOUT_MS = 25_000;

async function timedFetch(
  url: string,
  timeoutMs: number,
): Promise<{ ok: boolean; status: number; ms: number; error?: string }> {
  const t0 = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { redirect: "follow", signal: controller.signal });
    return { ok: res.ok, status: res.status, ms: Date.now() - t0 };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch_failed";
    return { ok: false, status: 0, ms: Date.now() - t0, error: msg };
  } finally {
    clearTimeout(timer);
  }
}

async function timedJsonFetch(
  url: string,
  timeoutMs: number,
): Promise<{ ok: boolean; status: number; ms: number; json?: unknown; error?: string }> {
  const t0 = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { redirect: "follow", signal: controller.signal });
    const ms = Date.now() - t0;
    const json = (await res.json()) as unknown;
    return { ok: res.ok, status: res.status, ms, json };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch_failed";
    return { ok: false, status: 0, ms: Date.now() - t0, error: msg };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Remote smoke: health (deep), ready, Stripe snapshot on shallow health.
 */
export async function evaluateRemoteReleaseReadiness(
  origin: string,
  opts?: { timeoutMs?: number },
): Promise<ReleaseReadinessResult> {
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const base = origin.replace(/\/$/, "");
  const reasons: string[] = [];
  const checks: Record<string, { ok: boolean; detail?: string }> = {};

  const healthDeep = await timedFetch(`${base}/api/health?deep=1`, timeoutMs);
  checks.health_deep = {
    ok: healthDeep.ok,
    detail: healthDeep.error ?? `${healthDeep.status} ${healthDeep.ms}ms`,
  };
  if (!healthDeep.ok) reasons.push(`GET /api/health?deep=1 failed (${healthDeep.error ?? healthDeep.status})`);

  const ready = await timedFetch(`${base}/api/ready`, timeoutMs);
  checks.ready = { ok: ready.ok, detail: ready.error ?? `${ready.status} ${ready.ms}ms` };
  if (!ready.ok) reasons.push(`GET /api/ready failed (${ready.error ?? ready.status})`);

  const healthShallow = await timedJsonFetch(`${base}/api/health`, timeoutMs);
  if (healthShallow.error) {
    checks.stripe_remote = { ok: false, detail: healthShallow.error };
    reasons.push(`GET /api/health failed (${healthShallow.error})`);
  } else if (!healthShallow.ok) {
    checks.stripe_remote = { ok: false, detail: `http_${healthShallow.status}` };
    reasons.push(`GET /api/health returned ${healthShallow.status}`);
  } else if (healthShallow.json && typeof healthShallow.json === "object") {
    const stripe = (healthShallow.json as { stripe?: string }).stripe;
    const stripeInvalid = stripe === "invalid";
    checks.stripe_remote = { ok: !stripeInvalid, detail: stripe };
    if (stripeInvalid) reasons.push("Stripe configuration invalid per GET /api/health");
  } else {
    checks.stripe_remote = { ok: false, detail: "unexpected_body" };
    reasons.push("GET /api/health: unexpected JSON body");
  }

  const blocked = reasons.length > 0;
  return {
    go: !blocked,
    blocked,
    reasons,
    checks,
  };
}

/**
 * Used when predeploy / postdeploy scripts already ran in CI — pass their exit success flags.
 */
export function evaluateCiGate(input: {
  predeployOk: boolean;
  postdeployOk?: boolean;
  remote?: ReleaseReadinessResult | null;
}): { go: boolean; blocked: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (!input.predeployOk) reasons.push("predeploy_check failed");
  if (input.postdeployOk === false) reasons.push("postdeploy_test failed");
  if (input.remote && !input.remote.go) reasons.push(...input.remote.reasons);
  return { go: reasons.length === 0, blocked: reasons.length > 0, reasons };
}
