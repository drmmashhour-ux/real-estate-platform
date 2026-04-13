import { AdminAiRunStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateAlerts } from "./generate-alerts";
import { generateDailySummary } from "./generate-daily-summary";
import { generateListingDiagnoses } from "./generate-listing-diagnoses";
import { generateRecommendations } from "./generate-recommendations";
import { generateRevenueSummary } from "./generate-revenue-summary";
import { generateUserIntentSummary } from "./generate-user-intent-summary";
import { getPlatformSignals } from "./get-platform-signals";
import type { AdminAiInsightPayload } from "./types";

export type RunDailyAdminAiResult =
  | { ok: true; runId: string; insightCount: number }
  | { ok: false; error: string };

export async function runDailyAdminAi(runType: string = "full_daily"): Promise<RunDailyAdminAiResult> {
  if (!process.env.DATABASE_URL) {
    return { ok: false, error: "Database not configured" };
  }

  const run = await prisma.adminAiRun.create({
    data: {
      runType,
      status: AdminAiRunStatus.running,
      startedAt: new Date(),
    },
  });

  try {
    const signals = await getPlatformSignals();
    if (!signals) {
      await prisma.adminAiRun.update({
        where: { id: run.id },
        data: {
          status: AdminAiRunStatus.failed,
          completedAt: new Date(),
          summary: "Failed to load platform signals",
        },
      });
      return { ok: false, error: "Signals unavailable" };
    }

    const runId = run.id;

    const chunks = await Promise.all([
      generateDailySummary(signals, runId),
      generateAlerts(signals, runId),
      generateRecommendations(signals, runId),
      generateListingDiagnoses(signals, runId),
      generateUserIntentSummary(signals, runId),
      generateRevenueSummary(signals, runId),
    ]);

    const flat: AdminAiInsightPayload[] = chunks.flat();

    if (flat.length > 0) {
      await prisma.adminAiInsight.createMany({
        data: flat.map((row) => ({
          type: row.type,
          title: row.title,
          body: row.body,
          priority: row.priority,
          entityType: row.entityType ?? null,
          entityId: row.entityId ?? null,
          metadataJson: (row.metadataJson ?? {}) as Prisma.InputJsonValue,
        })),
      });
    }

    await prisma.adminAiRun.update({
      where: { id: run.id },
      data: {
        status: AdminAiRunStatus.completed,
        completedAt: new Date(),
        summary: `Generated ${flat.length} insight(s) from platform signals.`,
      },
    });

    return { ok: true, runId: run.id, insightCount: flat.length };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    await prisma.adminAiRun.update({
      where: { id: run.id },
      data: {
        status: AdminAiRunStatus.failed,
        completedAt: new Date(),
        summary: msg,
      },
    });
    return { ok: false, error: msg };
  }
}
