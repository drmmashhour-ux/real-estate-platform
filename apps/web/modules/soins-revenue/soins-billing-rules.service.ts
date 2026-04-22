import type {
  BillingAccountStatus,
  BillingNotificationTrigger,
  BillingRulesConfig,
  ProrationInput,
  ProrationResult,
  SubscriptionOverdueInput,
} from "./soins-revenue.types";

export const DEFAULT_BILLING_RULES: BillingRulesConfig = {
  graceDays: 5,
  suspendAfterOverdueDays: 21,
  remindBeforeDueDays: 3,
};

/** Calendar-day proration within [periodStart, periodEnd]. */
export function proratePartialMonth(input: ProrationInput): ProrationResult {
  if (input.serviceStart.getTime() > input.periodEnd.getTime()) {
    return { billableFraction: 0, proratedAmount: 0 };
  }
  const totalDays = Math.max(
    1,
    daysInclusive(input.periodStart, input.periodEnd),
  );
  const start = clampDate(input.serviceStart, input.periodStart, input.periodEnd);
  const billableDays = Math.max(0, daysInclusive(start, input.periodEnd));
  const billableFraction = Math.min(1, billableDays / totalDays);
  const proratedAmount = Math.round(input.monthlyAmount * billableFraction * 100) / 100;
  return { billableFraction, proratedAmount };
}

function daysInclusive(a: Date, b: Date): number {
  const msDay = 86400000;
  const diff = Math.round((b.getTime() - a.getTime()) / msDay);
  return diff + 1;
}

function clampDate(d: Date, min: Date, max: Date): Date {
  const t = d.getTime();
  return new Date(Math.min(Math.max(t, min.getTime()), max.getTime()));
}

export function classifyOverdueStatus(input: SubscriptionOverdueInput, rules: BillingRulesConfig): BillingAccountStatus {
  if (input.status === "CANCELLED" || input.status === "SUSPENDED") return input.status;
  if (input.paidDate) return "CURRENT";

  const msDay = 86400000;
  const daysLate = Math.floor((input.now.getTime() - input.dueDate.getTime()) / msDay);

  if (daysLate <= 0) return "CURRENT";
  if (daysLate <= rules.graceDays) return "GRACE";
  if (daysLate >= rules.suspendAfterOverdueDays) return "SUSPENDED";
  return "OVERDUE";
}

export function billingNotificationTriggers(input: {
  status: BillingAccountStatus;
  daysUntilDue: number | null;
  daysPastDue: number | null;
  addOnChanged: boolean;
  rules: BillingRulesConfig;
}): BillingNotificationTrigger[] {
  const out: BillingNotificationTrigger[] = [];

  if (input.addOnChanged) out.push("ADD_ON_CHANGED");

  if (input.daysUntilDue != null && input.daysUntilDue <= input.rules.remindBeforeDueDays && input.daysUntilDue >= 0) {
    out.push("PAYMENT_DUE_SOON");
  }

  if (input.status === "OVERDUE" || input.status === "SUSPENDED") {
    out.push("OVERDUE");
  }

  if (input.status === "SUSPENDED") {
    out.push("SERVICE_SUSPENDED");
  }

  return [...new Set(out)];
}

/** Recommend suspension when overdue exceeds policy (operational flag, not legal advice). */
export function shouldSuspendService(daysPastDue: number, rules: BillingRulesConfig): boolean {
  return daysPastDue >= rules.suspendAfterOverdueDays;
}
