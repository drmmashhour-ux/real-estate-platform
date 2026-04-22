import { prisma } from "@/lib/db";
import type { AdminDashboardSummaryData, RevenueDashboardData } from "@/modules/dashboard/view-models";
import { startOfUtcDayFromDate } from "@/modules/dashboard/services/revenue-dashboard.service";
import { getAdminDashboardSummaryData } from "@/modules/dashboard/services/admin-dashboard.service";
import { getRevenueDashboardData } from "@/modules/dashboard/services/revenue-dashboard.service";

import type { AdminAnomalyVm, AnomalySeverity } from "./admin-intelligence.types";

function sev(s: AnomalySeverity) {
  return s;
}

export type AdminAnomalyContext = {
  rev: RevenueDashboardData;
  summary: AdminDashboardSummaryData;
  failedPayments24h: number;
  stalePendingPayments24h: number;
  priorDayBookings: number;
};

export function buildAdminAnomalies(ctx: AdminAnomalyContext): AdminAnomalyVm[] {
  const { rev, summary, failedPayments24h, stalePendingPayments24h, priorDayBookings } = ctx;

  const anomalies: AdminAnomalyVm[] = [];

  const avg = rev.sevenDayAverageCents;
  const today = rev.todayRevenueCents;
  if (avg > 5000 && today < avg * 0.5) {
    anomalies.push({
      id: "rev-soft-day",
      severity: sev("HIGH"),
      title: "Platform revenue well below 7-day average",
      explanation: `Today platform share ${(today / 100).toFixed(0)} CAD vs 7d avg ${(avg / 100).toFixed(0)} CAD.`,
      recommendedAction: "Verify Stripe webhooks, BNHub checkout, and marketplace payment flows.",
    });
  }

  if (avg > 1000 && today > avg * 2.5) {
    anomalies.push({
      id: "rev-spike",
      severity: sev("MEDIUM"),
      title: "Unusual revenue spike vs rolling average",
      explanation: "Could be batch settlements or a large one-off transaction.",
      recommendedAction: "Review largest platform payments and booking batches for today.",
    });
  }

  if (failedPayments24h >= 5) {
    anomalies.push({
      id: "pay-fail-volume",
      severity: sev("HIGH"),
      title: "Elevated payment failure volume (24h)",
      explanation: `${failedPayments24h} failed platform payment rows in the last 24 hours.`,
      recommendedAction: "Check Stripe Dashboard and `/admin/finance` reconciliation.",
    });
  }

  if (stalePendingPayments24h >= 25) {
    anomalies.push({
      id: "pay-pending-backlog",
      severity: sev("LOW"),
      title: "Large pending payment backlog (24h)",
      explanation: `${stalePendingPayments24h} payments still pending — possible webhook delay.`,
      recommendedAction: "Inspect Stripe payment intents and webhook delivery logs.",
    });
  }

  if (summary.bookingsToday > 0 && priorDayBookings > 0) {
    const pct = Math.round(((summary.bookingsToday - priorDayBookings) / priorDayBookings) * 100);
    if (pct >= 80) {
      anomalies.push({
        id: "booking-spike-dod",
        severity: sev("MEDIUM"),
        title: "Sharp day-over-day booking intake increase",
        explanation: `Today ${summary.bookingsToday} bookings vs yesterday ${priorDayBookings} (${pct}% change).`,
        recommendedAction: "Confirm inventory and host capacity if BNHub-heavy.",
      });
    }
  }

  if (summary.riskAlertsApprox >= 3) {
    anomalies.push({
      id: "abuse-signals",
      severity: sev("MEDIUM"),
      title: "Multiple high-severity abuse signals today",
      explanation: `${summary.riskAlertsApprox} HIGH severity abuse signals recorded.`,
      recommendedAction: "Open risk / moderation queue and cross-check accounts.",
    });
  }

  return anomalies;
}

async function loadAnomalySidecar(): Promise<{
  failedPayments24h: number;
  stalePendingPayments24h: number;
  priorDayBookings: number;
}> {
  const since24h = new Date(Date.now() - 24 * 3600 * 1000);
  const todayStart = startOfUtcDayFromDate(new Date());

  const [failedPayments24h, stalePendingPayments24h, priorDayBookings] = await Promise.all([
    prisma.platformPayment
      .count({
        where: {
          status: "failed",
          createdAt: { gte: since24h },
        },
      })
      .catch(() => 0),
    prisma.platformPayment
      .count({
        where: {
          status: "pending",
          createdAt: { gte: since24h },
        },
      })
      .catch(() => 0),
    prisma.booking
      .count({
        where: {
          createdAt: {
            gte: new Date(todayStart.getTime() - 86400000),
            lt: todayStart,
          },
        },
      })
      .catch(() => 0),
  ]);

  return { failedPayments24h, stalePendingPayments24h, priorDayBookings };
}

/** Batches Prisma sidecar queries with summary + revenue when provided. */
export async function detectAdminAnomaliesFromRefs(
  rev: RevenueDashboardData,
  summary: AdminDashboardSummaryData,
): Promise<AdminAnomalyVm[]> {
  const side = await loadAnomalySidecar();
  return buildAdminAnomalies({ rev, summary, ...side });
}

/**
 * Rule-based anomaly scan — no ML; suitable for production guardrails and admin triage.
 */
export async function detectAdminAnomalies(): Promise<AdminAnomalyVm[]> {
  const [rev, summary] = await Promise.all([getRevenueDashboardData(), getAdminDashboardSummaryData()]);
  return detectAdminAnomaliesFromRefs(rev, summary);
}
