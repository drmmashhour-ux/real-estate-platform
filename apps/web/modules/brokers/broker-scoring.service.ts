import type { BrokerProspect } from "@/modules/brokers/broker-pipeline.types";

/**
 * Lightweight 0–100 score from pipeline counters + stage (transparent heuristics; not ML).
 */
export function scoreBrokerProspect(p: BrokerProspect): number {
  const listings = Math.min(40, p.listingsCount ?? 0);
  const recv = Math.min(60, p.leadsReceived ?? 0);
  const unlocked = Math.min(40, p.leadsUnlocked ?? 0);

  const stageScore =
    p.stage === "converted"
      ? 28
      : p.stage === "demo"
        ? 22
        : p.stage === "replied"
          ? 16
          : p.stage === "contacted"
            ? 10
            : p.stage === "new"
              ? 4
              : 0;

  const tagsBonus = (p.operatorTags?.length ?? 0) * 4;
  const activityBonus = p.lastContactAt ? 6 : 0;

  let raw = stageScore + listings * 0.9 + recv * 0.35 + unlocked * 1.8 + tagsBonus + activityBonus;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export type BrokerPriorityBucket = "high_potential" | "inactive_high_value";

export function classifyBrokerPriority(p: BrokerProspect, score: number): BrokerPriorityBucket | null {
  const rev = p.revenueGenerated ?? 0;
  const unlocked = p.leadsUnlocked ?? 0;
  const lastMs = new Date(p.lastActivityAt ?? p.updatedAt).getTime();
  const stale = Number.isFinite(lastMs) && Date.now() - lastMs > 2 * 24 * 60 * 60 * 1000;

  if (score >= 72 && p.stage !== "converted" && p.stage !== "lost") return "high_potential";
  if ((rev > 0 || unlocked >= 2) && stale && p.stage !== "lost") return "inactive_high_value";
  return null;
}
