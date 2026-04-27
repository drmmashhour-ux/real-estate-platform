#!/usr/bin/env node
/**
 * Staged rollout smoke checks — DEPLOY_HEALTH_URL required (GET apps/web /api/db-test → { status: "ok" }).
 * Optional DEPLOY_DRBRAIN_HEALTH_URL — JSON must not report CRITICAL; optional anomaly ceiling via HEALTH_METRICS_ANOMALY_MAX.
 * Never prints URLs or secrets.
 */

function fail(msg) {
  console.error("❌", msg);
  process.exit(1);
}

async function fetchJson(url, timeoutMs) {
  const res = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(timeoutMs),
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    fail(`HTTP ${res.status}`);
    throw new Error("unreachable");
  }
  return res.json();
}

async function checkPrimaryHealth(timeoutMs) {
  const raw = process.env.DEPLOY_HEALTH_URL?.trim();
  if (!raw) {
    fail("DEPLOY_HEALTH_URL is not set");
    return;
  }

  let url;
  try {
    url = new URL(raw);
  } catch {
    fail("DEPLOY_HEALTH_URL is not a valid URL");
    return;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    fail("DEPLOY_HEALTH_URL must use http or https");
    return;
  }

  console.log("Checking primary API health…");

  let json;
  try {
    json = await fetchJson(url.toString(), timeoutMs);
  } catch {
    fail("Primary health request failed");
    return;
  }

  if (!json || typeof json !== "object" || json.status !== "ok") {
    fail("API not healthy — status was not ok");
    return;
  }

  console.log("✅ Primary API healthy");
}

async function checkOptionalDrBrain(timeoutMs) {
  const raw = process.env.DEPLOY_DRBRAIN_HEALTH_URL?.trim();
  if (!raw) {
    console.log("(Optional DrBrain HTTP check skipped — DEPLOY_DRBRAIN_HEALTH_URL unset)");
    return;
  }

  let url;
  try {
    url = new URL(raw);
  } catch {
    fail("DEPLOY_DRBRAIN_HEALTH_URL is not a valid URL");
    return;
  }

  console.log("Checking optional DrBrain endpoint…");

  let json;
  try {
    json = await fetchJson(url.toString(), timeoutMs);
  } catch {
    fail("DrBrain health request failed");
    return;
  }

  if (!json || typeof json !== "object") {
    fail("DrBrain response was not JSON object");
    return;
  }

  const status = json.status ?? json.drbrainStatus ?? json.overallStatus;
  if (typeof status === "string" && status.toUpperCase() === "CRITICAL") {
    fail("DrBrain CRITICAL");
    return;
  }

  const anomalyRaw =
    json.anomalyScore ?? json.anomaly ?? json.anomalyPeak ?? json.metrics?.anomalyScore;
  const anomaly = typeof anomalyRaw === "number" ? anomalyRaw : Number(anomalyRaw);

  const maxRaw = process.env.HEALTH_METRICS_ANOMALY_MAX?.trim();
  if (maxRaw !== undefined && maxRaw !== "" && Number.isFinite(anomaly)) {
    const max = Number(maxRaw);
    if (Number.isFinite(max) && anomaly > max) {
      fail("Anomaly spike detected above configured ceiling");
      return;
    }
  }

  console.log("✅ DrBrain endpoint acceptable");
}

async function main() {
  const timeoutMs = Math.min(
    Math.max(Number(process.env.HEALTHCHECK_TIMEOUT_MS ?? "30000") || 30000, 3000),
    120000,
  );

  await checkPrimaryHealth(timeoutMs);
  await checkOptionalDrBrain(timeoutMs);

  console.log("✅ Metrics OK");
}

main().catch(() => fail("Health check failed"));
