import type { ExecutionDay } from "@prisma/client";

export type ExecutionAlert = {
  level: "warning" | "critical";
  code: string;
  message: string;
};

/**
 * Surface gaps for the current UTC execution day (discipline nudges).
 * Fires when the day row is missing or counters are still zero.
 */
export function buildExecutionAlerts(today: ExecutionDay | null): ExecutionAlert[] {
  const alerts: ExecutionAlert[] = [];
  const messagesSent = today?.messagesSent ?? 0;
  const bookingsCompleted = today?.bookingsCompleted ?? 0;
  const revenue = today?.revenue ?? 0;

  if (messagesSent === 0) {
    alerts.push({
      level: "warning",
      code: "NO_MESSAGES",
      message: "No messages logged today — hit your outbound minimum to stay on the path to $100K.",
    });
  }

  if (bookingsCompleted === 0) {
    alerts.push({
      level: "warning",
      code: "NO_BOOKINGS",
      message: "No bookings completed today — push at least one confirmed stay / transaction through.",
    });
  }

  if (revenue === 0) {
    alerts.push({
      level: "critical",
      code: "ZERO_REVENUE",
      message: "Execution-day revenue is $0 — log fees or attach ledger revenue so progress toward $100K is visible.",
    });
  }

  return alerts;
}
