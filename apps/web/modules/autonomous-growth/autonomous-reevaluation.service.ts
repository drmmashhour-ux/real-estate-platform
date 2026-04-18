import { prisma } from "@/lib/db";
import { autonomousGrowthFlags } from "@/config/feature-flags";
import { ingestAutonomousRunIntoLearning } from "./autonomous-learning-feedback.service";
import { appendAutonomousRunEvents, updateAutonomousRunStatus } from "./autonomous-growth.repository";

type RunMetadata = {
  scheduledReevaluationAt?: string;
  reevaluationHours?: number;
};

function parseMetadata(raw: unknown): RunMetadata {
  if (!raw || typeof raw !== "object") return {};
  return raw as RunMetadata;
}

/**
 * Schedules a follow-up check for delayed metrics — stored on run metadata (no hidden queues).
 */
export async function scheduleAutonomousReevaluation(runId: string, hours: number): Promise<void> {
  if (!autonomousGrowthFlags.autonomousGrowthReevaluationV1) {
    throw new Error("FEATURE_AUTONOMOUS_GROWTH_REEVALUATION_V1 is off.");
  }
  const h = Math.min(Math.max(1, hours), 168);
  const at = new Date(Date.now() + h * 60 * 60 * 1000).toISOString();
  const row = await prisma.autonomousGrowthRun.findUnique({ where: { id: runId } });
  if (!row) throw new Error(`Run not found: ${runId}`);
  const meta = parseMetadata(row.metadata);
  await prisma.autonomousGrowthRun.update({
    where: { id: runId },
    data: {
      metadata: {
        ...meta,
        scheduledReevaluationAt: at,
        reevaluationHours: h,
      } as object,
    },
  });
  await appendAutonomousRunEvents(runId, [
    {
      stage: "OBSERVED",
      message: `Reevaluation scheduled for ${at} (${h}h horizon) — compare outcomes when metrics land.`,
    },
  ]);
}

export async function collectDueAutonomousReevaluations(limit = 25): Promise<string[]> {
  if (!autonomousGrowthFlags.autonomousGrowthReevaluationV1) return [];
  const now = new Date().toISOString();
  const rows = await prisma.autonomousGrowthRun.findMany({
    where: { status: { in: ["SUCCEEDED", "PARTIAL"] } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const due: string[] = [];
  for (const r of rows) {
    const m = parseMetadata(r.metadata);
    if (m.scheduledReevaluationAt && m.scheduledReevaluationAt <= now) {
      due.push(r.id);
      if (due.length >= limit) break;
    }
  }
  return due;
}

export async function reevaluateAutonomousRun(runId: string): Promise<{ ok: boolean; notes: string[] }> {
  if (!autonomousGrowthFlags.autonomousGrowthReevaluationV1) {
    return { ok: false, notes: ["FEATURE_AUTONOMOUS_GROWTH_REEVALUATION_V1 is off."] };
  }
  const notes: string[] = [];
  await appendAutonomousRunEvents(runId, [
    {
      stage: "OBSERVED",
      message: "Reevaluation tick — checking delayed outcomes via learning hooks (no fabricated metrics).",
    },
  ]);

  const learn = await ingestAutonomousRunIntoLearning(runId);
  notes.push(...learn.notes);

  const row = await prisma.autonomousGrowthRun.findUnique({ where: { id: runId } });
  const prev = parseMetadata(row?.metadata);
  await updateAutonomousRunStatus(runId, row?.status ?? "SUCCEEDED", {
    ...prev,
    scheduledReevaluationAt: null,
    reevaluationHours: null,
    lastReevaluatedAt: new Date().toISOString(),
  });

  return { ok: true, notes };
}
