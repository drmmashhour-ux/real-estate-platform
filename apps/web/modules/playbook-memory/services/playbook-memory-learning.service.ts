import type { MemoryOutcomeStatus, PlaybookScoreBand } from "@prisma/client";
import { playbookLog } from "../playbook-memory.logger";
import * as repo from "../repository/playbook-memory.repository";
import { aggregateNumericScore, numericScoreToBand } from "../utils/playbook-memory-score";

function isSuccess(status: MemoryOutcomeStatus): boolean {
  return status === "SUCCEEDED";
}

function isFailure(status: MemoryOutcomeStatus): boolean {
  return status === "FAILED" || status === "CANCELLED";
}

export async function recalculatePlaybookStats(playbookId: string): Promise<void> {
  const memories = await repo.memoriesForPlaybookAggregate(playbookId);
  const total = memories.length;
  let successes = 0;
  let failures = 0;
  let sumExpected = 0;
  let sumRealizedValue = 0;
  let sumRealizedRev = 0;
  let sumConversion = 0;
  let sumRisk = 0;
  let nConv = 0;
  let nRisk = 0;

  for (const m of memories) {
    if (isSuccess(m.outcomeStatus)) successes += 1;
    else if (isFailure(m.outcomeStatus)) failures += 1;
    if (m.expectedValue != null) sumExpected += m.expectedValue;
    if (m.realizedValue != null) sumRealizedValue += m.realizedValue;
    if (m.realizedRevenue != null) sumRealizedRev += m.realizedRevenue;
    if (m.realizedConversion != null) {
      sumConversion += m.realizedConversion;
      nConv += 1;
    }
    if (m.realizedRiskScore != null) {
      sumRisk += m.realizedRiskScore;
      nRisk += 1;
    }
  }

  const avgExpected = total ? sumExpected / total : null;
  const avgRealizedValue = total ? sumRealizedValue / total : null;
  const avgRealizedRevenue = total ? sumRealizedRev / total : null;
  const avgConversionLift = nConv ? sumConversion / nConv : null;
  const avgRiskScore = nRisk ? sumRisk / nRisk : null;

  const numeric = aggregateNumericScore({
    avgConversionLift,
    avgRealizedRevenue,
    avgRealizedValue,
    avgRiskScore,
    totalExecutions: total,
    successfulExecutions: successes,
  });
  const scoreBand: PlaybookScoreBand = numericScoreToBand(numeric);

  await repo.updateMemoryPlaybook(playbookId, {
    totalExecutions: total,
    successfulExecutions: successes,
    failedExecutions: failures,
    avgExpectedValue: avgExpected,
    avgRealizedValue,
    avgRealizedRevenue,
    avgConversionLift,
    avgRiskScore,
    scoreBand,
    lastExecutedAt: memories[0]?.createdAt ?? undefined,
  });

  playbookLog.info("recalculatePlaybookStats", {
    playbookId,
    total,
    successes,
    failures,
    scoreBand,
  });
}

export async function learnFromMemoryRecord(memoryRecordId: string): Promise<void> {
  const rec = await repo.findMemoryRecordById(memoryRecordId);
  if (!rec?.memoryPlaybookId) return;
  await recalculatePlaybookStats(rec.memoryPlaybookId);
}
