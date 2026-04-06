import type {
  AiMetricsSlice,
  BookingMetricsSlice,
  ErrorMetricsSlice,
  HealthSubsystem,
  LaunchHealthSummary,
  MonitoringAlert,
  NotificationMetricsSlice,
  PaymentMetricsSlice,
} from "./types";

const AWAITING_HOST_WARN = 25;
const MANUAL_PENDING_WARN = 20;
const PAYMENT_FAIL_RATIO_WARN = 0.15;
const ERROR_BURST_WARN = 50;
const WEBHOOK_GAP_WARN = 5;

function trafficFrom(ok: boolean, warn: boolean): "green" | "yellow" | "red" {
  if (!ok) return "red";
  if (warn) return "yellow";
  return "green";
}

export function buildLaunchHealth(args: {
  bookings: BookingMetricsSlice;
  payments: PaymentMetricsSlice;
  errors: ErrorMetricsSlice;
  ai: AiMetricsSlice;
  notifications: NotificationMetricsSlice;
}): LaunchHealthSummary {
  const alerts: MonitoringAlert[] = [];
  const { bookings, payments, errors, ai, notifications } = args;

  const bookingOk = bookings.awaitingHostApproval < AWAITING_HOST_WARN * 2;
  const bookingWarn = bookings.awaitingHostApproval >= AWAITING_HOST_WARN || bookings.pendingManualSettlement >= MANUAL_PENDING_WARN;
  if (bookings.awaitingHostApproval >= AWAITING_HOST_WARN * 2) {
    alerts.push({
      id: "host-queue",
      severity: "warning",
      title: "Many bookings awaiting host approval",
      detail: `${bookings.awaitingHostApproval} rows in AWAITING_HOST_APPROVAL.`,
    });
  }
  if (bookings.pendingManualSettlement >= MANUAL_PENDING_WARN) {
    alerts.push({
      id: "manual-pending",
      severity: "warning",
      title: "Manual payments pending review",
      detail: `${bookings.pendingManualSettlement} bookings with manual settlement PENDING.`,
    });
  }

  const payAttempts = payments.completed + payments.failed;
  const failRatio = payAttempts > 0 ? payments.failed / payAttempts : 0;
  const paymentOk = payments.failed === 0 || failRatio < PAYMENT_FAIL_RATIO_WARN * 2;
  const paymentWarn = failRatio >= PAYMENT_FAIL_RATIO_WARN || payments.failed >= 3;
  if (failRatio >= PAYMENT_FAIL_RATIO_WARN && payAttempts >= 5) {
    alerts.push({
      id: "stripe-fail-rate",
      severity: "critical",
      title: "Elevated Stripe payment failures",
      detail: `${payments.failed} failed vs ${payments.completed} completed in window.`,
    });
  }
  if (payments.completed > 0 && payments.webhookEvents < WEBHOOK_GAP_WARN && payments.withCheckoutSession >= 10) {
    alerts.push({
      id: "webhook-gap",
      severity: "warning",
      title: "Checkout volume high but few webhook logs",
      detail: "Compare growth_stripe_webhook_logs vs successful checkouts.",
    });
  }

  const errorOk = errors.totalInRange < ERROR_BURST_WARN * 2;
  const errorWarn = errors.totalInRange >= ERROR_BURST_WARN;
  if (errors.totalInRange >= ERROR_BURST_WARN * 3) {
    alerts.push({
      id: "error-burst",
      severity: "critical",
      title: "High volume of recorded ErrorEvent rows",
      detail: `${errors.totalInRange} errors in selected window.`,
    });
  }

  const aiOk = ai.approvalPending < 40;
  const aiWarn = ai.approvalPending >= 20;
  if (ai.approvalPending >= 40) {
    alerts.push({
      id: "ai-approvals",
      severity: "warning",
      title: "Autopilot approvals backing up",
      detail: `${ai.approvalPending} pending approval requests.`,
    });
  }

  const notifOk = true;
  const notifWarn = notifications.notificationsCreated === 0 && bookings.createdInRange > 5;

  const manualOpsOk = bookings.pendingManualSettlement < MANUAL_PENDING_WARN * 2;
  const manualOpsWarn = bookings.pendingManualSettlement >= MANUAL_PENDING_WARN;

  const subsystems: HealthSubsystem[] = [
    {
      id: "bookings",
      label: "Booking flow",
      traffic: trafficFrom(bookingOk, bookingWarn),
      detail: `${bookings.createdInRange} created in window; ${bookings.awaitingHostApproval} awaiting host.`,
    },
    {
      id: "payments",
      label: "Online payments (Stripe)",
      traffic: trafficFrom(paymentOk, paymentWarn),
      detail: `${payments.completed} completed, ${payments.failed} failed; webhooks ${payments.webhookEvents}.`,
    },
    {
      id: "manual",
      label: "Manual payment ops",
      traffic: trafficFrom(manualOpsOk, manualOpsWarn),
      detail: `${bookings.pendingManualSettlement} PENDING manual settlements.`,
    },
    {
      id: "localization",
      label: "Localization funnel signals",
      traffic: "green",
      detail: "Derived from growth_funnel_events locale fields.",
    },
    {
      id: "ai",
      label: "AI / autopilot",
      traffic: trafficFrom(aiOk, aiWarn),
      detail: `${ai.recommendationsCreated} recs; ${ai.approvalPending} pending approvals.`,
    },
    {
      id: "notifications",
      label: "Notifications",
      traffic: trafficFrom(notifOk, notifWarn),
      detail: `${notifications.notificationsCreated} notifications in window.`,
    },
    {
      id: "errors",
      label: "Server error events",
      traffic: trafficFrom(errorOk, errorWarn),
      detail: `${errors.totalInRange} ErrorEvent rows recorded.`,
    },
    {
      id: "admin",
      label: "Admin ops surface",
      traffic: "green",
      detail: "Requires active ADMIN / ACCOUNTANT session.",
    },
  ];

  const weights: Record<string, number> = {
    bookings: 18,
    payments: 18,
    manual: 14,
    localization: 8,
    ai: 10,
    notifications: 6,
    errors: 16,
    admin: 10,
  };
  let score = 0;
  for (const s of subsystems) {
    const w = weights[s.id] ?? 10;
    if (s.traffic === "green") score += w;
    else if (s.traffic === "yellow") score += w * 0.55;
  }
  score = Math.round(Math.min(100, score));

  return { subsystems, score, alerts };
}
