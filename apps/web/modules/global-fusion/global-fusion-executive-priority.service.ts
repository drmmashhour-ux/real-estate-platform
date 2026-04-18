/**
 * Phase G — company-level themes from Fusion signals (heuristic, source-grounded).
 */
import type {
  GlobalFusionExecutivePriority,
  GlobalFusionExecutiveTheme,
  GlobalFusionExecutiveThemeId,
  GlobalFusionExecutiveAssemblyInput,
  GlobalFusionRecommendationKind,
} from "./global-fusion.types";

function kindToTheme(kind: GlobalFusionRecommendationKind | null | undefined): GlobalFusionExecutiveThemeId {
  switch (kind) {
    case "prioritize_growth":
      return "growth_acceleration";
    case "prioritize_stability":
      return "stability_first";
    case "fix_funnel_first":
      return "funnel_first";
    case "expand_ranking_cautiously":
      return "ranking_expansion_candidate";
    case "monitor_only":
      return "stability_first";
    case "defer_until_evidence":
      return "evidence_gap";
    case "require_human_review":
      return "human_review_required";
    default:
      return "neutral";
  }
}

function importanceFromSignals(
  conf: number | null,
  hasBlockers: boolean,
  govElevated: boolean,
): "low" | "medium" | "high" {
  if (govElevated || hasBlockers) return "high";
  if (conf != null && conf >= 0.65) return "high";
  if (conf != null && conf >= 0.45) return "medium";
  return "low";
}

let prioritySeq = 0;

function nextId(prefix: string): string {
  prioritySeq++;
  return `${prefix}_${prioritySeq}`;
}

export function resetGlobalFusionExecutivePrioritySeqForTests(): void {
  prioritySeq = 0;
}

/**
 * Map Fusion recommendations + primary surface into executive priorities (bounded list).
 */
export function buildExecutivePrioritiesFromAssembly(input: GlobalFusionExecutiveAssemblyInput): GlobalFusionExecutivePriority[] {
  const out: GlobalFusionExecutivePriority[] = [];
  const snap = input.fusionPayload.snapshot;
  const gov = input.governanceSnapshot?.status;
  const govElevated =
    gov != null &&
    gov.decision !== "healthy" &&
    gov.decision !== "watch";

  if (snap) {
    for (const r of snap.recommendations.slice(0, 6)) {
      const theme = kindToTheme(r.kind);
      if (theme === "neutral") continue;
      const blockers =
        snap.conflicts
          .filter((c) => c.systems.some((s) => r.systemsDisagreed.includes(s)))
          .map((c) => c.summary)
          .slice(0, 3) ?? [];
      out.push({
        id: nextId("rec"),
        theme,
        importance: importanceFromSignals(
          input.fusionPayload.snapshot?.scores.fusedConfidence ?? null,
          blockers.length > 0,
          govElevated,
        ),
        title: r.title,
        summary: r.why,
        sourceSystems: [...new Set([...r.systemsAgreed, ...r.systemsDisagreed])],
        supportingSignals: [r.kind, r.evidenceSummary].filter(Boolean) as string[],
        blockers,
        risks: [r.riskSummary],
        confidence: input.fusionPayload.snapshot?.scores.fusedConfidence ?? null,
        evidenceSummary: r.evidenceSummary,
      });
    }
  }

  const surface = input.primaryResult?.surface;
  if (surface) {
    const review = surface.groupedBy.require_human_review[0];
    if (review) {
      out.push({
        id: nextId("primary"),
        theme: "human_review_required",
        importance: "high",
        title: review.title,
        summary: review.summary,
        sourceSystems: review.systems,
        supportingSignals: review.tags.slice(0, 4),
        blockers: review.blockers ?? [],
        risks: [review.riskSummary ?? ""].filter(Boolean),
        confidence: null,
        evidenceSummary: review.evidenceSummary ?? "",
      });
    }
  }

  if (govElevated && gov) {
    out.push({
      id: nextId("gov"),
      theme: "governance_attention",
      importance: gov.decision === "rollback_recommended" || gov.decision === "require_human_review" ? "high" : "medium",
      title: `Fusion governance: ${gov.decision}`,
      summary: gov.recommendation,
      sourceSystems: ["brain", "ads", "cro", "ranking"],
      supportingSignals: gov.reasons.slice(0, 6),
      blockers: [],
      risks: gov.warnings.map((w) => w.code),
      confidence: gov.metrics.learningAccuracy,
      evidenceSummary: `fallback ${(gov.metrics.fallbackRate * 100).toFixed(0)}% · conflict ${(gov.metrics.conflictRate * 100).toFixed(0)}%`,
    });
  }

  /** Dedup by title, keep highest importance */
  const seen = new Map<string, GlobalFusionExecutivePriority>();
  for (const p of out) {
    const k = `${p.theme}:${p.title}`;
    const prev = seen.get(k);
    if (!prev || rankImp(p.importance) > rankImp(prev.importance)) seen.set(k, p);
  }
  return [...seen.values()].sort((a, b) => rankImp(b.importance) - rankImp(a.importance)).slice(0, 8);
}

function rankImp(i: GlobalFusionExecutivePriority["importance"]): number {
  return i === "high" ? 3 : i === "medium" ? 2 : 1;
}

/**
 * Cluster priorities into executive themes for summary.themes.
 */
export function clusterExecutiveThemes(priorities: GlobalFusionExecutivePriority[]): GlobalFusionExecutiveTheme[] {
  const byTheme = new Map<GlobalFusionExecutiveThemeId, { ids: string[]; strength: number }>();
  for (const p of priorities) {
    const cur = byTheme.get(p.theme) ?? { ids: [], strength: 0 };
    cur.ids.push(p.id);
    cur.strength += p.importance === "high" ? 0.4 : p.importance === "medium" ? 0.25 : 0.15;
    byTheme.set(p.theme, cur);
  }
  const labels: Record<GlobalFusionExecutiveThemeId, string> = {
    growth_acceleration: "Growth acceleration",
    stability_first: "Stability first",
    launch_readiness: "Launch readiness",
    governance_attention: "Governance attention",
    evidence_gap: "Evidence gap",
    operational_blocker: "Operational blocker",
    ranking_expansion_candidate: "Ranking expansion (cautious)",
    funnel_first: "Funnel first",
    human_review_required: "Human review",
    neutral: "Neutral",
  };
  return [...byTheme.entries()]
    .map(([id, v]) => ({
      id,
      label: labels[id] ?? id,
      signalStrength: Math.min(1, v.strength),
      supportingPriorityIds: v.ids,
    }))
    .sort((a, b) => b.signalStrength - a.signalStrength)
    .slice(0, 10);
}
