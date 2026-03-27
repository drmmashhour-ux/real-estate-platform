export type ExecutionMetricKey = "activation" | "retention" | "conversion";

export type ExecutionAlert = {
  metric: ExecutionMetricKey;
  severity: "warning";
  message: string;
  current: number | null;
  previous: number | null;
  deltaPoints: number | null;
};

const DEFAULT_RELATIVE_DROP_PCT = 12;
const DEFAULT_ABSOLUTE_DROP_POINTS = 2.5;

function pctDrop(prev: number, curr: number): number {
  if (prev <= 0) return 0;
  return ((prev - curr) / prev) * 100;
}

/** True if `curr` is meaningfully worse than `prev` for a percentage rate. */
export function shouldAlertRateDrop(
  current: number | null,
  previous: number | null,
  opts?: { minPrev?: number; relativePct?: number; absolutePoints?: number }
): boolean {
  if (current == null || previous == null) return false;
  const minPrev = opts?.minPrev ?? 3;
  if (previous < minPrev) return false;
  const rel = opts?.relativePct ?? DEFAULT_RELATIVE_DROP_PCT;
  const abs = opts?.absolutePoints ?? DEFAULT_ABSOLUTE_DROP_POINTS;
  if (current >= previous) return false;
  return pctDrop(previous, current) >= rel || previous - current >= abs;
}

export function buildExecutionAlerts(
  current: {
    activationRate: number | null;
    retentionRate: number | null;
    conversionRate: number | null;
  },
  previous: {
    activationRate: number | null;
    retentionRate: number | null;
    conversionRate: number | null;
  }
): ExecutionAlert[] {
  const alerts: ExecutionAlert[] = [];

  const push = (
    metric: ExecutionMetricKey,
    label: string,
    cur: number | null,
    prev: number | null
  ) => {
    if (!shouldAlertRateDrop(cur, prev)) return;
    const delta = cur != null && prev != null ? Math.round((prev - cur) * 100) / 100 : null;
    alerts.push({
      metric,
      severity: "warning",
      message: `${label} dropped vs prior period (${prev ?? "—"}% → ${cur ?? "—"}%). Review onboarding, product value, and checkout friction.`,
      current: cur,
      previous: prev,
      deltaPoints: delta,
    });
  };

  push("activation", "Activation rate", current.activationRate, previous.activationRate);
  push("retention", "Return-user rate (retention)", current.retentionRate, previous.retentionRate);
  push("conversion", "Upgrade conversion rate", current.conversionRate, previous.conversionRate);

  return alerts;
}
