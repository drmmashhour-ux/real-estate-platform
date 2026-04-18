/**
 * LECIPM PLATFORM — One Brain V2 dashboard payload (weights, outcomes, narrative).
 */
import { prisma } from "@/lib/db";
import { oneBrainV3Flags } from "@/config/feature-flags";
import {
  getCurrentSourceWeights,
  getLatestLearningSnapshot,
  listDecisionOutcomes,
  type BrainDecisionOutcomeDTO,
} from "./brain-v2.repository";
import type { BrainSourceWeight } from "./brain-v2.types";
import { getBrainV3RuntimeSnapshot } from "./brain-v3-runtime-cache";

export type BrainTimelineEntry = {
  at: string;
  kind: "outcome" | "learning_run" | "weight_note";
  title: string;
  detail?: string;
};

export type BrainV3SnapshotPayload = {
  persistedSignals: Array<{
    id: string;
    source: string;
    direction: string;
    magnitude: number;
    stability: number;
    confidence: number;
    createdAt: string;
  }>;
  negativeGuards: Array<{
    id: string;
    source: string;
    entityId: string | null;
    signalCount: number;
    reason: string | null;
    lastSignalAt: string;
  }>;
  runtime: ReturnType<typeof getBrainV3RuntimeSnapshot>;
};

export type BrainSnapshotPayload = {
  weights: BrainSourceWeight[];
  recentOutcomes: BrainDecisionOutcomeDTO[];
  strongestSources: BrainSourceWeight[];
  weakestSources: BrainSourceWeight[];
  notes: string[];
  warnings: string[];
  lastLearningRun: Awaited<ReturnType<typeof getLatestLearningSnapshot>>;
  timeline: BrainTimelineEntry[];
  v3?: BrainV3SnapshotPayload | null;
};

export async function buildBrainSnapshot(): Promise<BrainSnapshotPayload> {
  const weights = await getCurrentSourceWeights();
  const recentOutcomes = await listDecisionOutcomes({ limit: 40 });
  const lastLearningRun = await getLatestLearningSnapshot();

  let v3: BrainV3SnapshotPayload | null = null;
  if (
    oneBrainV3Flags.oneBrainV3CrossDomainV1 ||
    oneBrainV3Flags.oneBrainV3DurabilityV1 ||
    oneBrainV3Flags.oneBrainV3NegativeFilterV1
  ) {
    const [persistedSignals, negativeGuards] = await Promise.all([
      prisma.brainCrossDomainSignal.findMany({
        orderBy: { createdAt: "desc" },
        take: 24,
        select: {
          id: true,
          source: true,
          direction: true,
          magnitude: true,
          stability: true,
          confidence: true,
          createdAt: true,
        },
      }),
      prisma.brainNegativeSignalGuard.findMany({
        orderBy: { lastSignalAt: "desc" },
        take: 12,
        select: {
          id: true,
          source: true,
          entityId: true,
          signalCount: true,
          reason: true,
          lastSignalAt: true,
        },
      }),
    ]);
    v3 = {
      persistedSignals: persistedSignals.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
      negativeGuards: negativeGuards.map((g) => ({
        ...g,
        lastSignalAt: g.lastSignalAt.toISOString(),
      })),
      runtime: getBrainV3RuntimeSnapshot(),
    };
  }

  const sorted = [...weights].sort((a, b) => b.weight - a.weight);
  const strongestSources = sorted.slice(0, 3);
  const weakestSources = sorted.slice(-3).reverse();

  const notes: string[] = [];
  const warnings: string[] = [];

  if (recentOutcomes.some((o) => o.outcomeType === "INSUFFICIENT_DATA")) {
    notes.push("Some recent outcomes are marked insufficient data — learning waits for richer before/after metrics.");
  }

  const timeline: BrainTimelineEntry[] = [];

  for (const o of recentOutcomes.slice(0, 15)) {
    timeline.push({
      at: o.createdAt.toISOString(),
      kind: "outcome",
      title: `Outcome · ${o.source} · ${o.outcomeType}`,
      detail: `${o.reason} (score ${o.outcomeScore.toFixed(3)})`,
    });
  }

  if (lastLearningRun) {
    timeline.push({
      at: lastLearningRun.createdAt.toISOString(),
      kind: "learning_run",
      title: `Learning run · ${lastLearningRun.decisionCount} outcomes considered`,
      detail: `Sources touched: ${lastLearningRun.sourceCount}`,
    });
  }

  timeline.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return {
    weights,
    recentOutcomes,
    strongestSources,
    weakestSources,
    notes,
    warnings,
    lastLearningRun,
    timeline,
    v3,
  };
}
