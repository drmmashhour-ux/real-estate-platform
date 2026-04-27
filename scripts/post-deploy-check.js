#!/usr/bin/env node
/**
 * Smoke-check a deployed apps/web instance via GET /api/db-test (JSON { status: "ok" }).
 * Uses DEPLOY_HEALTH_URL only — never prints URLs or secrets (avoid leaking tokens in query strings).
 */

function fail(msg) {
  console.error("❌", msg);
  process.exit(1);
}

async function main() {
  const raw = process.env.DEPLOY_HEALTH_URL?.trim();
  if (!raw) {
    fail("DEPLOY_HEALTH_URL is not set — configure GitHub Actions secret with base URL including path (e.g. …/api/db-test)");
  }

  let url;
  try {
    url = new URL(raw);
  } catch {
    fail("DEPLOY_HEALTH_URL is not a valid URL");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    fail("DEPLOY_HEALTH_URL must use http or https");
  }

  const timeoutMs = Math.min(
    Math.max(Number(process.env.HEALTHCHECK_TIMEOUT_MS ?? "30000") || 30000, 3000),
    120000,
  );

  console.log("Checking remote API health…");

  let res;
  try {
    res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { Accept: "application/json" },
    });
  } catch {
    fail("Post-deploy health request failed (network or timeout)");
    return;
  }

  if (!res.ok) {
    fail(`HTTP ${res.status}`);
    return;
  }

  let json;
  try {
    json = await res.json();
  } catch {
    fail("Response was not JSON");
    return;
  }

  if (!json || typeof json !== "object" || json.status !== "ok") {
    fail("API health failed — status was not ok");
    return;
  }

  console.log("✅ API healthy");
}

main().catch(() => fail("Post-deploy health check failed"));
