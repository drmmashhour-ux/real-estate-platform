/**
 * Builds autopilot suggestions from the existing unified learning snapshot only.
 * Does not call ads automation, CRO mutators, or change weights.
 */

import { buildUnifiedSnapshot, type UnifiedLearningSnapshot } from "@/modules/growth/unified-learning.service";
import type {
  AiAutopilotAction,
  AiAutopilotImpact,
  AiAutopilotSignalStrength,
  GrowthAutopilotAnalysis,
} from "./ai-autopilot.types";
import { applyLearningToAutopilotPriorityScore } from "./growth-learning-integration.service";

/** Alias matching the growth machine naming — delegates to existing `buildUnifiedSnapshot()`. */
export function buildGrowthUnifiedSnapshot(): UnifiedLearningSnapshot {
  return buildUnifiedSnapshot();
}

function confidenceFromEvidence(hint: UnifiedLearningSnapshot["evidenceQualityHint"]): number {
  if (hint === "HIGH") return 0.82;
  if (hint === "MEDIUM") return 0.58;
  return 0.36;
}

/** Map unified evidence band → display strength (optional layer). */
export function resolveSnapshotSignal(snapshot: UnifiedLearningSnapshot): AiAutopilotSignalStrength {
  const h = snapshot.evidenceQualityHint;
  if (h === "HIGH") return "strong";
  if (h === "MEDIUM") return "medium";
  return "low";
}

function impactWeight(impact: AiAutopilotImpact): number {
  if (impact === "high") return 3;
  if (impact === "medium") return 2;
  return 1;
}

function signalWeight(strength: AiAutopilotSignalStrength): number {
  if (strength === "strong") return 1;
  if (strength === "medium") return 0.62;
  return 0.35;
}

/**
 * priorityScore = f(impact, confidence, signalStrength) → 0–100.
 * Conservative blend — not a business KPI.
 */
export function computePriorityScore(
  impact: AiAutopilotImpact,
  confidence: number,
  signalStrength: AiAutopilotSignalStrength,
): number {
  const iw = impactWeight(impact) / 3;
  const sw = signalWeight(signalStrength);
  const raw = iw * 38 + Math.min(1, Math.max(0, confidence)) * 40 + sw * 22;
  const base = Math.min(100, Math.max(0, Math.round(raw)));
  return applyLearningToAutopilotPriorityScore(base, impact);
}

export function analyzeGrowth(snapshot: UnifiedLearningSnapshot): GrowthAutopilotAnalysis {
  const sql = snapshot.sqlLowConversionCounts;
  return {
    evidenceQuality: snapshot.evidenceQualityHint,
    preferredCta: snapshot.preferredPrimaryCta,
    weakCtaCount: snapshot.weakCtas.length,
    weakHookCount: snapshot.weakHooks.length,
    sqlLowCro: sql?.cro ?? 0,
    sqlLowRetargeting: sql?.retargeting ?? 0,
    summaryLines: [
      `Evidence band: ${snapshot.evidenceQualityHint}`,
      snapshot.preferredPrimaryCta
        ? `Preferred primary CTA label (merged): ${snapshot.preferredPrimaryCta}`
        : "No preferred primary CTA resolved yet.",
      ...(snapshot.warnings?.slice(0, 3) ?? []),
    ],
  };
}

type ActionDraft = Omit<AiAutopilotAction, "createdAt" | "priorityScore" | "signalStrength">;

function baseAction(
  partial: Omit<ActionDraft, "confidence" | "executionMode"> & {
    confidence?: number;
    executionMode?: AiAutopilotAction["executionMode"];
  },
  snapshot: UnifiedLearningSnapshot,
): ActionDraft {
  return {
    ...partial,
    confidence: partial.confidence ?? confidenceFromEvidence(snapshot.evidenceQualityHint),
    executionMode: partial.executionMode ?? "approval_required",
  };
}

function finalizeAction(
  draft: ActionDraft,
  snapshot: UnifiedLearningSnapshot,
  createdAt: string,
): AiAutopilotAction {
  const signalStrength = resolveSnapshotSignal(snapshot);
  return {
    ...draft,
    signalStrength,
    priorityScore: computePriorityScore(draft.impact, draft.confidence, signalStrength),
    createdAt,
  };
}

function groupBySource(actions: AiAutopilotAction[]): {
  ads: AiAutopilotAction[];
  cro: AiAutopilotAction[];
  leads: AiAutopilotAction[];
} {
  const g = { ads: [] as AiAutopilotAction[], cro: [] as AiAutopilotAction[], leads: [] as AiAutopilotAction[] };
  for (const a of actions) {
    g[a.source].push(a);
  }
  const sortDesc = (arr: AiAutopilotAction[]) => arr.sort((x, y) => y.priorityScore - x.priorityScore);
  sortDesc(g.ads);
  sortDesc(g.cro);
  sortDesc(g.leads);
  return g;
}

export type AutopilotActionsBundle = {
  status: "healthy" | "attention";
  panelSignalStrength: AiAutopilotSignalStrength;
  /** Top advisory actions by priority (max 5). */
  actions: AiAutopilotAction[];
  grouped: ReturnType<typeof groupBySource>;
  /** Same as actions — sorted flat list for UI. */
  flat: AiAutopilotAction[];
};

/**
 * Map analysis + snapshot → proposed actions (stable ids so approval store can match across refreshes).
 * Does not include fallback when empty — caller adds fallback or healthy state.
 */
export function generateGrowthActions(
  analysis: GrowthAutopilotAnalysis,
  snapshot: UnifiedLearningSnapshot,
): ActionDraft[] {
  const out: ActionDraft[] = [];

  if (analysis.preferredCta) {
    out.push(
      baseAction(
        {
          id: "ap-ads-review-primary-cta",
          title: "Review primary CTA alignment",
          description: `Unified snapshot suggests prioritizing “${analysis.preferredCta}” for next creative review. No auto-change — confirm with marketing.`,
          source: "ads",
          impact: "high",
          why: "Unified learning favors a stronger primary CTA for the next creative review.",
        },
        snapshot,
      ),
    );
  }

  if (snapshot.bestHooks[0]) {
    out.push(
      baseAction(
        {
          id: "ap-ads-test-top-hook",
          title: "Test top hook variant",
          description: `Leading hook from merged learning: “${snapshot.bestHooks[0]}”. Consider an A/B or copy review before scaling spend.`,
          source: "ads",
          impact: "medium",
          why: "Merged ads data shows a standout hook worth validating before scaling.",
        },
        snapshot,
      ),
    );
  }

  if (analysis.weakCtaCount > 0) {
    out.push(
      baseAction(
        {
          id: "ap-cro-audit-weak-ctas",
          title: "Audit weak CTA labels",
          description: `${analysis.weakCtaCount} weak CTA label(s) surfaced — review landing surfaces for friction; no automated swaps.`,
          source: "cro",
          impact: "medium",
          why: "Low conversion detected on CRO-tagged surfaces.",
        },
        snapshot,
      ),
    );
  }

  if (analysis.sqlLowCro + analysis.sqlLowRetargeting > 0) {
    out.push(
      baseAction(
        {
          id: "ap-leads-review-low-conversion",
          title: "Review low-conversion tagged rows",
          description: `SQL-tagged low conversion: CRO=${analysis.sqlLowCro}, retargeting=${analysis.sqlLowRetargeting}. Human triage only.`,
          source: "leads",
          impact: analysis.sqlLowCro + analysis.sqlLowRetargeting > 4 ? "high" : "low",
          why: "SQL-tagged leads show conversion friction worth triaging.",
        },
        snapshot,
      ),
    );
  }

  return out;
}

function fallbackCollectMore(snapshot: UnifiedLearningSnapshot): ActionDraft {
  return baseAction(
    {
      id: "ap-leads-collect-more-signals",
      title: "Collect more funnel signals",
      description:
        "Snapshot is sparse — keep running tracked campaigns and events so unified learning can surface stronger next actions.",
      source: "leads",
      impact: "low",
      why: "Lead volume below threshold for a higher-confidence next step.",
    },
    snapshot,
  );
}

/**
 * Intelligence bundle: priority scoring, top 5 cap, optional healthy state (no advisory noise).
 * Pass an existing snapshot to avoid rebuilding unified learning twice in one request.
 */
export function buildAutopilotBundleFromSnapshot(snapshot: UnifiedLearningSnapshot): AutopilotActionsBundle {
  const analysis = analyzeGrowth(snapshot);
  const panelSignalStrength = resolveSnapshotSignal(snapshot);
  const createdAt = new Date().toISOString();

  const candidates = generateGrowthActions(analysis, snapshot);

  if (candidates.length === 0 && snapshot.evidenceQualityHint === "HIGH") {
    return {
      status: "healthy",
      panelSignalStrength,
      actions: [],
      grouped: { ads: [], cro: [], leads: [] },
      flat: [],
    };
  }

  const drafts = candidates.length > 0 ? candidates : [fallbackCollectMore(snapshot)];
  const finalized = drafts
    .map((d) => finalizeAction(d, snapshot, createdAt))
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 5);

  return {
    status: "attention",
    panelSignalStrength,
    actions: finalized,
    grouped: groupBySource(finalized),
    flat: finalized,
  };
}

export function buildAutopilotBundle(): AutopilotActionsBundle {
  return buildAutopilotBundleFromSnapshot(buildGrowthUnifiedSnapshot());
}

export function buildAutopilotActions(): AiAutopilotAction[] {
  return buildAutopilotBundle().actions;
}

/**
 * Attach priority, why, and signal to an action built outside this service (e.g. paid funnel, safe leads).
 */
export function applyIntelligenceLayer(
  draft: Omit<AiAutopilotAction, "priorityScore" | "signalStrength">,
  snapshot: UnifiedLearningSnapshot,
  overrides?: { signalStrength?: AiAutopilotSignalStrength },
): AiAutopilotAction {
  const signalStrength = overrides?.signalStrength ?? resolveSnapshotSignal(snapshot);
  return {
    ...draft,
    signalStrength,
    priorityScore: computePriorityScore(draft.impact, draft.confidence, signalStrength),
  };
}
