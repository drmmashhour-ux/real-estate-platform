import type { DrBrainReport } from "@repo/drbrain";

export type DrBrainExplanation = {
  summary: string;
  causes: string[];
  impact: string;
  recommendedActions: string[];
};

function mentionsDb(check: string, msg: string): boolean {
  const s = `${check} ${msg}`.toLowerCase();
  return (
    s.includes("database") ||
    s.includes(" prisma") ||
    s.includes("connection") ||
    s.includes("sql") ||
    check.includes("database.")
  );
}

function mentionsBlockedPayments(check: string): boolean {
  return (
    check.includes("blocked_payment") ||
    check.includes("blocked_payment_signals") ||
    check.includes("checkout_payment_blocked") ||
    check.includes("payment_intent_blocked")
  );
}

function mentionsFraudSpike(check: string): boolean {
  return check === "anomalies.fraud_spike" || check.includes("fraud");
}

/**
 * Deterministic “AI explanation” layer — rule templates only (no LLM, no secrets).
 */
export function explainDrBrainIssues(report: DrBrainReport): DrBrainExplanation {
  const causes: string[] = [];
  let blockedSpike = false;
  let dbIssue = false;
  let fraudSpike = false;

  for (const r of report.results) {
    if (!r.ok || r.level === "WARNING" || r.level === "CRITICAL") {
      if (mentionsDb(r.check, r.message)) {
        dbIssue = true;
        causes.push(`${r.check}: ${r.message}`);
      }
      if (mentionsBlockedPayments(r.check)) blockedSpike = true;
      if (mentionsFraudSpike(r.check)) fraudSpike = true;
      if (r.level === "CRITICAL" && r.check.startsWith("payments.")) {
        causes.push(`${r.check}: ${r.message}`);
      }
    }
  }

  if (blockedSpike || fraudSpike) {
    causes.push(
      "High number of blocked payments detected. Likely caused by validation rules, fraud detection, or user misuse.",
    );
  }
  if (dbIssue) {
    causes.push("Database instability detected. Possible connection or provider issue.");
  }
  if (fraudSpike) {
    causes.push(
      "Suspicious activity detected. Recommend enabling stricter fraud controls.",
    );
  }

  const deduped = [...new Set(causes)].slice(0, 12);

  let summary = "Operational posture looks stable for this DR.BRAIN run.";
  if (report.status === "CRITICAL") {
    summary = "Critical findings require immediate operator attention.";
  } else if (report.status === "WARNING") {
    summary = "Warnings detected — review before increasing traffic or changing payments.";
  }

  let impact =
    "Limited or no user-visible impact expected if addressed during the current maintenance window.";
  if (report.status === "CRITICAL") {
    impact =
      "Checkout, payouts, or trust signals may be unreliable until mitigations land — treat as production-impacting.";
  } else if (report.status === "WARNING") {
    impact =
      "Degraded UX or elevated review load is possible until signals return to normal.";
  }

  const recommendedActions = [
    ...report.recommendations.slice(0, 6),
    ...(fraudSpike || blockedSpike
      ? ["Tighten fraud / compliance posture and monitor SYBNB audit counters."]
      : []),
    ...(dbIssue ? ["Verify DATABASE_URL health, provider status, and recent migrations."] : []),
  ];

  return {
    summary,
    causes: deduped.length > 0 ? deduped : ["No abnormal rule-based causes were inferred for this snapshot."],
    impact,
    recommendedActions: [...new Set(recommendedActions)].slice(0, 12),
  };
}
