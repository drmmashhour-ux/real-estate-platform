#!/usr/bin/env node
/**
 * Compare live GET /api/health, /api/db-test, /api/metrics/slo against scripts/slo-thresholds.json.
 * Requires APP_URL (origin only, no trailing slash). Never prints URLs or secrets.
 */

const fs = require("fs");
const path = require("path");

function fail(msg) {
  console.error("❌", msg);
  process.exit(1);
}

function loadThresholds() {
  const p = path.join(__dirname, "slo-thresholds.json");
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function normalizeOrigin(raw) {
  const s = raw.trim().replace(/\/$/, "");
  try {
    const u = new URL(s);
    if (u.protocol !== "http:" && u.protocol !== "https:") fail("APP_URL must use http or https");
    return u.origin;
  } catch {
    fail("APP_URL is not a valid URL");
    return "";
  }
}

async function fetchJson(origin, pathname, timeoutMs) {
  const url = new URL(pathname, origin).toString();
  const res = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(timeoutMs),
    headers: { Accept: "application/json" },
  });
  if (!res.ok) fail(`HTTP ${res.status} from monitored endpoint`);
  return res.json();
}

async function main() {
  const rawBase = process.env.APP_URL?.trim();
  if (!rawBase) fail("APP_URL is not set");

  const origin = normalizeOrigin(rawBase);
  const thresholds = loadThresholds();
  const timeoutMs = Math.min(
    Math.max(Number(process.env.SLO_CHECK_TIMEOUT_MS ?? "25000") || 25000, 3000),
    120000,
  );

  const health = await fetchJson(origin, "/api/health", timeoutMs);
  if (health.status !== "ok") fail("/api/health status not ok");

  const db = await fetchJson(origin, "/api/db-test", timeoutMs);
  if (db.status !== "ok") fail("/api/db-test status not ok");

  const slo = await fetchJson(origin, "/api/metrics/slo", timeoutMs);

  if (slo.status !== "ok") fail("/api/metrics/slo aggregate status not ok");

  if (thresholds.requireDbHealthy && slo.dbHealthy !== true) fail("dbHealthy requirement failed");

  if (typeof slo.errorRate !== "number" || slo.errorRate > thresholds.maxErrorRate) {
    fail("errorRate exceeds threshold");
  }

  if (typeof slo.p95LatencyMs !== "number" || slo.p95LatencyMs > thresholds.maxP95LatencyMs) {
    fail("p95LatencyMs exceeds threshold");
  }

  if (typeof slo.paymentErrorRate !== "number" || slo.paymentErrorRate > thresholds.maxPaymentErrorRate) {
    fail("paymentErrorRate exceeds threshold");
  }

  const brain =
    typeof slo.drBrainStatus === "string" ? slo.drBrainStatus.toUpperCase() : "";

  if (brain === "CRITICAL") fail("drBrainStatus is CRITICAL");

  const allowed = new Set(thresholds.allowedDrBrainStatuses ?? ["OK", "WARNING"]);
  if (!allowed.has(brain)) fail("drBrainStatus outside allowed band");

  if (brain === "WARNING") {
    console.warn("⚠️ DR.BRAIN WARNING — allowed by threshold policy");
  }

  console.log("✅ All SLO checks passed");
}

main().catch(() => fail("SLO check failed"));
