import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { generateAllRecommendations } from "./action-generator";
import { buildGrowthBrainSnapshot } from "./data-source";
import { applyLearningToDrafts } from "./learning";
import { scoreBuyerIntent } from "./buyer-intent-scorer";
import { scoreGrowthLead } from "./lead-scorer";
import { persistRecommendations } from "./persist";
import { getGrowthAutomationModeFromEnv } from "./rules";
import type { GrowthLeadSummary, GrowthBrainSnapshot } from "./types";

export type GrowthBrainRunResult = {
  runId: string;
  sparse: boolean;
  created: number;
  superseded: number;
  globalHints: GrowthBrainSnapshot["globalHints"];
};

function uniqueLeads(snapshot: GrowthBrainSnapshot): GrowthLeadSummary[] {
  const m = new Map<string, GrowthLeadSummary>();
  for (const l of [...snapshot.staleGrowthLeads, ...snapshot.hotGrowthLeads]) {
    m.set(l.id, l);
  }
  return [...m.values()];
}

/**
 * Full brain run: snapshot → score → recommend → learn → persist.
 */
export async function runGrowthBrainEngine(prisma: PrismaClient): Promise<GrowthBrainRunResult> {
  const runId = randomUUID();
  const snapshot = await buildGrowthBrainSnapshot(prisma);

  const scoredLeads = uniqueLeads(snapshot).map((l) => scoreGrowthLead(l, snapshot));
  const scoredBuyers = snapshot.highIntentBuyers.map(scoreBuyerIntent);

  let drafts = generateAllRecommendations(snapshot, scoredLeads, scoredBuyers);
  drafts = await applyLearningToDrafts(prisma, drafts);

  const mode = getGrowthAutomationModeFromEnv();
  const { created, superseded } = await persistRecommendations(prisma, runId, drafts, mode);

  return {
    runId,
    sparse: snapshot.sparse,
    created,
    superseded,
    globalHints: snapshot.globalHints,
  };
}
