type Meta = Record<string, string | number | boolean | null | undefined>;

function safeMeta(meta: Meta): Record<string, string | number | boolean> {
  const o: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (v === null || v === undefined) continue;
    if (typeof v === "string" && v.length > 160) o[k] = `${v.slice(0, 157)}...`;
    else if (typeof v === "number" || typeof v === "boolean") o[k] = v;
    else if (typeof v === "string") o[k] = v;
  }
  return o;
}

function logLine(event: string, meta: Meta): void {
  try {
    const payload = safeMeta(meta);
    console.info(`[legal-intelligence] ${event}`, payload);
  } catch {
    /* no throw */
  }
}

export function trackLegalIntelligenceSignalGenerated(meta: Meta): void {
  logLine("signal_generated", { kind: "signal", ...meta });
}

export function trackLegalAnomalyDetected(meta: Meta): void {
  logLine("anomaly_detected", { kind: "anomaly", ...meta });
}

export function trackLegalFraudIndicatorFlagged(meta: Meta): void {
  logLine("fraud_indicator_flagged", { kind: "risk_indicator", ...meta });
}

export function trackLegalQueuePrioritized(meta: Meta): void {
  logLine("queue_prioritized", { kind: "queue", ...meta });
}

export function trackLegalReviewDelayRisk(meta: Meta): void {
  logLine("review_delay_risk", { kind: "delay", ...meta });
}
