#!/usr/bin/env node
/**
 * Shadow GET-only comparison between CURRENT_APP_URL (baseline) and CANDIDATE_APP_URL (preview).
 * Hits /api/health, /api/db-test, /api/metrics/slo — read-only; never prints origins or secrets.
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

function normalizeOrigin(raw, label) {
  const s = raw.trim().replace(/\/$/, "");
  try {
    const u = new URL(s);
    if (u.protocol !== "http:" && u.protocol !== "https:") fail(`${label} must use http or https`);
    return u.origin;
  } catch {
    fail(`${label} is not a valid URL`);
    return "";
  }
}

async function fetchTriplet(origin, timeoutMs) {
  async function one(pathname) {
    const url = new URL(pathname, origin).toString();
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) fail(`HTTP ${res.status}`); // generic — no URL logged
    return res.json();
  }

  const health = await one("/api/health");
  const db = await one("/api/db-test");
  const slo = await one("/api/metrics/slo");
  return { health, db, slo };
}

function tierRank(s) {
  const x = String(s ?? "").toUpperCase();
  if (x === "CRITICAL") return 3;
  if (x === "WARNING") return 2;
  if (x === "OK") return 1;
  return 0;
}

async function main() {
  const curRaw = process.env.CURRENT_APP_URL?.trim();
  const candRaw = process.env.CANDIDATE_APP_URL?.trim();
  if (!curRaw) fail("CURRENT_APP_URL is not set");
  if (!candRaw) fail("CANDIDATE_APP_URL is not set");

  const currentOrigin = normalizeOrigin(curRaw, "CURRENT_APP_URL");
  const candidateOrigin = normalizeOrigin(candRaw, "CANDIDATE_APP_URL");

  const thresholds = loadThresholds();
  const timeoutMs = Math.min(
    Math.max(Number(process.env.SHADOW_CHECK_TIMEOUT_MS ?? "25000") || 25000, 3000),
    120000,
  );

  const cur = await fetchTriplet(currentOrigin, timeoutMs);
  const cand = await fetchTriplet(candidateOrigin, timeoutMs);

  if (cand.health.status !== "ok") fail("candidate /api/health not ok");
  if (cand.db.status !== "ok") fail("candidate /api/db-test not ok");
  if (cand.slo.status !== "ok") fail("candidate /api/metrics/slo aggregate not ok");

  const dEr = thresholds.shadowMaxDeltaErrorRate ?? 0.012;
  const dP95 = thresholds.shadowMaxDeltaP95LatencyMs ?? 150;
  const dPay = thresholds.shadowMaxDeltaPaymentErrorRate ?? 0.008;

  const cs = cand.slo;
  const ks = cur.slo;

  if (ks.dbHealthy === true && cs.dbHealthy !== true) fail("candidate DB health worse than baseline");

  if (
    typeof ks.errorRate === "number" &&
    typeof cs.errorRate === "number" &&
    cs.errorRate > ks.errorRate + dEr
  ) {
    fail("candidate errorRate worse than baseline band");
  }

  if (
    typeof ks.p95LatencyMs === "number" &&
    typeof cs.p95LatencyMs === "number" &&
    cs.p95LatencyMs > ks.p95LatencyMs + dP95
  ) {
    fail("candidate p95LatencyMs worse than baseline band");
  }

  if (
    typeof ks.paymentErrorRate === "number" &&
    typeof cs.paymentErrorRate === "number" &&
    cs.paymentErrorRate > ks.paymentErrorRate + dPay
  ) {
    fail("candidate paymentErrorRate worse than baseline band");
  }

  if (tierRank(cs.drBrainStatus) > tierRank(ks.drBrainStatus)) {
    fail("candidate DR.BRAIN tier worse than baseline");
  }

  if (String(cs.drBrainStatus ?? "").toUpperCase() === "CRITICAL") {
    fail("candidate DR.BRAIN CRITICAL");
  }

  console.log("✅ Shadow traffic comparison passed");
}

main().catch(() => fail("Shadow traffic check failed"));
