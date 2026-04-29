#!/usr/bin/env node
/**
 * Post-deploy production smoke test — GET `${DEPLOY_HEALTH_BASE_URL||APP_URL}/api/db-test`.
 * Uses fetch only (no shell injection). Never prints tokens or DATABASE_URL.
 *
 * Required secret (repository): APP_URL — production origin only, no trailing slash preferred.
 * Alternative: DEPLOY_HEALTH_BASE_URL — overrides APP_URL for this script only.
 */

"use strict";

async function fail(msg) {
  console.error("❌", msg);
  process.exit(1);
}

function trimOrigin(raw) {
  const s = String(raw ?? "").trim();
  return s.replace(/\/$/, "");
}

async function main() {
  const raw = trimOrigin(process.env.DEPLOY_HEALTH_BASE_URL || process.env.APP_URL);
  if (!raw) {
    await fail(
      "Missing DEPLOY_HEALTH_BASE_URL or APP_URL — set repository secret APP_URL (production origin only).",
    );
  }

  let url;
  try {
    url = new URL("/api/db-test", raw.endsWith("/") ? raw : `${raw}/`);
  } catch {
    await fail("Invalid APP_URL / DEPLOY_HEALTH_BASE_URL — must be a valid HTTP(S) origin.");
  }

  console.log("Checking API health (GET /api/db-test)…");

  let res;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      redirect: "manual",
      signal: AbortSignal.timeout(25_000),
    });
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    await fail(`Request failed: ${err}`);
  }

  if (!res.ok) {
    await fail(`HTTP ${res.status} from ${url.pathname}`);
  }

  let json;
  try {
    json = await res.json();
  } catch {
    await fail("Response was not JSON.");
  }

  if (json?.status !== "ok") {
    await fail(`API health failed — expected status ok, got ${JSON.stringify(json?.status)}`);
  }

  console.log("✅ API healthy");
}

main().catch(async (e) => {
  await fail(e instanceof Error ? e.message : String(e));
});
