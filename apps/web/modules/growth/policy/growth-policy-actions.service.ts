/**
 * Map advisory policy findings → concrete navigation + resolution notes (no execution).
 */

import type { GrowthPolicyResult } from "@/modules/growth/policy/growth-policy.types";
import type { GrowthPolicyAction, GrowthPolicyActionBundle } from "@/modules/growth/policy/growth-policy-actions.types";
import { buildGrowthPolicyResolution } from "@/modules/growth/policy/growth-policy-resolution.service";
import {
  logGrowthPolicyActionBundle,
  logGrowthPolicyDomainMapping,
} from "@/modules/growth/policy/growth-policy-actions-monitoring.service";
import { selectTopPolicyAction } from "@/modules/growth/policy/growth-policy-top-action.service";

const MAX_ACTIONS = 8;

function actionTypeFor(p: GrowthPolicyResult): GrowthPolicyAction["actionType"] {
  if (p.domain === "governance" && p.severity === "critical") return "review";
  if (p.domain === "messaging" && (p.severity === "warning" || p.severity === "critical")) return "review";
  if (p.domain === "pricing" && p.severity === "warning") return "inspect";
  if (p.severity === "info") return "navigate";
  return "navigate";
}

function resolutionLabelFor(p: GrowthPolicyResult): string {
  if (p.domain === "governance") return "Review enforcement";
  if (p.domain === "broker") return "Open broker pipeline";
  if (p.domain === "pricing") return "Inspect pricing signals";
  if (p.domain === "ads") return "Review acquisition funnel";
  if (p.domain === "leads") return "Fix lead throughput";
  if (p.domain === "messaging") return "Triage messaging queue";
  if (p.domain === "content") return "Review content loop";
  if (p.domain === "cro") return "Run CRO review";
  return "Open workspace";
}

function mapOne(p: GrowthPolicyResult): GrowthPolicyAction {
  const res = buildGrowthPolicyResolution(p);
  const notes = [
    res.explanation,
    `When resolved (roughly): ${res.resolvedLooksLike}`,
    ...res.checksBeforeClear.map((c) => `Verify: ${c}`),
  ].slice(0, 6);

  return {
    id: `gpa-${p.id}`,
    policyId: p.id,
    domain: p.domain,
    severity: p.severity,
    title: p.title,
    resolutionLabel: resolutionLabelFor(p),
    rationale: p.recommendation,
    targetSurface: `dashboard:${p.domain}`,
    actionType: actionTypeFor(p),
    queryParams: { policyId: p.id },
    notes,
  };
}

/** Merge duplicate domain targets — keep stricter severity (one action per growth domain surface). */
function dedupeActions(actions: GrowthPolicyAction[]): GrowthPolicyAction[] {
  const rank: Record<GrowthPolicyAction["severity"], number> = { critical: 0, warning: 1, info: 2 };
  const keyOf = (a: GrowthPolicyAction) => a.domain;
  const best = new Map<string, GrowthPolicyAction>();

  for (const a of actions) {
    const k = keyOf(a);
    const cur = best.get(k);
    if (!cur || rank[a.severity] < rank[cur.severity]) {
      best.set(k, a);
    }
  }

  return [...best.values()].sort((a, b) => {
    const d = rank[a.severity] - rank[b.severity];
    if (d !== 0) return d;
    return a.policyId.localeCompare(b.policyId);
  });
}

export function buildGrowthPolicyActions(policies: GrowthPolicyResult[]): GrowthPolicyAction[] {
  const mapped = policies.map(mapOne);
  const deduped = dedupeActions(mapped);
  return deduped.slice(0, MAX_ACTIONS);
}

export function buildGrowthPolicyActionBundle(policies: GrowthPolicyResult[]): GrowthPolicyActionBundle {
  const actions = buildGrowthPolicyActions(policies);
  const topAction = selectTopPolicyAction(actions);
  const bundle: GrowthPolicyActionBundle = {
    actions,
    topAction,
    generatedAt: new Date().toISOString(),
  };
  try {
    logGrowthPolicyActionBundle({
      actionCount: actions.length,
      topDomain: topAction?.domain,
      hasTop: !!topAction,
    });
    for (const a of actions) {
      logGrowthPolicyDomainMapping(a.domain, a.targetSurface);
    }
  } catch {
    /* ignore */
  }
  return bundle;
}
