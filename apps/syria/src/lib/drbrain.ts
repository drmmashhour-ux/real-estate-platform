import { join } from "node:path";
import { runDrBrainForApp } from "@repo/drbrain";
import type { DrBrainCheckResult, DrBrainReport } from "@repo/drbrain";
import { prisma } from "@/lib/db";
import { buildSyriaInvestorDemoReport } from "@/lib/drbrain/demo-data";
import { persistSyriaDrBrainTicketsEmitted } from "@/lib/drbrain/ticket-audit";
import { runSafeAutoMaintenance } from "@/lib/drbrain/auto-maintenance";
import { countBlockedPaymentEventsInWindow, getSybnbPaymentStats } from "@/lib/sybnb/monitoring";

function monorepoRoot(): string {
  return process.env.DRBRAIN_MONOREPO_ROOT?.trim() || join(process.cwd(), "..", "..");
}

async function syriaMarketplaceAnomalies(): Promise<DrBrainCheckResult[]> {
  if (process.env.INVESTOR_DEMO_MODE === "true") {
    return [];
  }

  const [stats, blockedBurst15m] = await Promise.all([
    getSybnbPaymentStats(),
    countBlockedPaymentEventsInWindow(15),
  ]);
  const rows: DrBrainCheckResult[] = [];
  if (blockedBurst15m >= 8) {
    rows.push({
      appId: "syria",
      check: "anomalies.fraud_spike",
      level: "CRITICAL",
      ok: false,
      message: "High volume of blocked payment signals in the last 15 minutes — fraud spike suspected.",
      metadata: { blockedBurst15m },
    });
  }
  if (stats.blockedPayments >= 10) {
    rows.push({
      appId: "syria",
      check: "anomalies.blocked_payment_signals",
      level: "WARNING",
      ok: false,
      message: "Elevated blocked payment audit signals for SYBNB.",
      metadata: { blockedPayments: stats.blockedPayments },
    });
  }
  if (stats.payoutsBlocked >= 5) {
    rows.push({
      appId: "syria",
      check: "anomalies.payout_escrow_blocked_volume",
      level: "WARNING",
      ok: false,
      message: "Multiple payouts in BLOCKED escrow — operator review.",
      metadata: { payoutsBlocked: stats.payoutsBlocked },
    });
  }
  return rows;
}

/**
 * DR.BRAIN health run for Syria / Darlink — Syria Prisma only.
 */
export async function runSyriaDrBrainReport(): Promise<DrBrainReport> {
  if (process.env.DRBRAIN_INVESTOR_DEMO_MODE?.trim().toLowerCase() === "true") {
    return buildSyriaInvestorDemoReport();
  }

  const skipBuild = process.env.DRBRAIN_INCLUDE_BUILD?.trim().toLowerCase() !== "true";

  const report = await runDrBrainForApp({
    appId: "syria",
    env: { ...process.env },
    dbPing: async () => {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    },
    anomalyChecks: syriaMarketplaceAnomalies,
    flags: {
      skipPayments: false,
      skipBuild,
      disableRuntimeKillSwitchArming: true,
      drbrainInvestorDemoMode: false,
      skipTickets: false,
    },
    workspacePaths: { monorepoRoot: monorepoRoot(), appRelativeDir: "apps/syria" },
  });

  if (report.ticketsEmitted?.length) {
    await persistSyriaDrBrainTicketsEmitted(report.ticketsEmitted);
  }

  await runSafeAutoMaintenance(report);
  return report;
}

/**
 * Read-only DR.BRAIN rollup for HTTP monitors — no ticket persistence or auto-maintenance side effects.
 */
export async function runSyriaDrBrainReportReadOnly(): Promise<DrBrainReport> {
  if (process.env.DRBRAIN_INVESTOR_DEMO_MODE?.trim().toLowerCase() === "true") {
    return buildSyriaInvestorDemoReport();
  }

  const skipBuild = process.env.DRBRAIN_INCLUDE_BUILD?.trim().toLowerCase() !== "true";

  return runDrBrainForApp({
    appId: "syria",
    env: { ...process.env },
    dbPing: async () => {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    },
    anomalyChecks: syriaMarketplaceAnomalies,
    flags: {
      skipPayments: false,
      skipBuild,
      disableRuntimeKillSwitchArming: true,
      drbrainInvestorDemoMode: false,
      skipTickets: true,
    },
    workspacePaths: { monorepoRoot: monorepoRoot(), appRelativeDir: "apps/syria" },
  });
}
