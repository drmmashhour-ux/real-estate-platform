/**
 * Qualitative risk themes for discussion — not a formal risk assessment or legal opinion.
 */

import type { LegacyOfficeState } from "./entity.types";
import { buildOwnershipGraph, computeEffectiveOwnership, getChildren } from "./ownership-graph.service";
import type { ControlRules } from "./control-rules.service";
import { getControlRulesForEntity } from "./control-rules.service";
import type { LegacyCapitalBucket } from "./capital-buckets.service";
import { totalCapitalCents } from "./capital-buckets.service";
import { buildContinuitySnapshot } from "./continuity.service";

export type LegacyRiskSeverity = "LOW" | "MEDIUM" | "HIGH";

export type LegacyRiskItem = {
  category: "CONCENTRATION" | "GOVERNANCE_COMPLEXITY" | "CASH_DEPENDENCY" | "OPERATOR_DEPENDENCY";
  severity: LegacyRiskSeverity;
  summary: string;
  detailNotes: string[];
};

export type LegacyRiskView = {
  items: LegacyRiskItem[];
  generatedAt: string;
};

function maxSeverity(a: LegacyRiskSeverity, b: LegacyRiskSeverity): LegacyRiskSeverity {
  const rank = { LOW: 0, MEDIUM: 1, HIGH: 2 };
  return rank[a] >= rank[b] ? a : b;
}

export function buildLegacyRiskView(
  state: LegacyOfficeState,
  controlRules: ControlRules[],
  capitalBuckets: LegacyCapitalBucket[],
  continuityOptions?: { globalSuccessorNotes?: string; globalKeyPersonNotes?: string }
): LegacyRiskView {
  const graph = buildOwnershipGraph(state);
  const items: LegacyRiskItem[] = [];
  const continuity = buildContinuitySnapshot(state, controlRules, continuityOptions);

  const operating = state.entities.filter((e) => e.entityType === "OPERATING");
  let concSeverity: LegacyRiskSeverity = "LOW";
  const concDetails: string[] = [];
  if (operating.length <= 1 && state.entities.length >= 2) {
    concSeverity = "MEDIUM";
    concDetails.push("Operating revenue may flow through a narrow set of entities relative to total structure.");
  }
  const roots = graph.rootIds.length;
  if (roots === 1 && operating.length >= 3) {
    concSeverity = maxSeverity(concSeverity, "LOW");
    concDetails.push("Several operating subsidiaries may diversify operating risk — verify in your own analysis.");
  }
  items.push({
    category: "CONCENTRATION",
    severity: concSeverity,
    summary: "Economic and operational concentration themes (illustrative).",
    detailNotes: concDetails.length ? concDetails : ["No strong concentration flags from graph shape alone."],
  });

  let govSeverity: LegacyRiskSeverity = "LOW";
  const govDetails: string[] = [];
  let longRules = 0;
  for (const e of state.entities) {
    const cr = getControlRulesForEntity(controlRules, e.id);
    const len =
      (cr?.reservedMattersNotes?.length ?? 0) +
      (cr?.votingControlNotes?.length ?? 0) +
      (cr?.boardOrManagerRolesNotes?.length ?? 0);
    if (len > 400) longRules++;
  }
  const entityCount = state.entities.length;
  if (entityCount > 12 || longRules >= 3) {
    govSeverity = "MEDIUM";
    govDetails.push("Entity count and length of governance notes suggest layered decision-making — clarity of authority matters.");
  }
  if (entityCount > 20) govSeverity = "HIGH";
  items.push({
    category: "GOVERNANCE_COMPLEXITY",
    severity: govSeverity,
    summary: "Complexity of entities and documented control concepts (informational).",
    detailNotes: govDetails.length ? govDetails : ["Governance documentation volume appears moderate in this model."],
  });

  const total = totalCapitalCents(capitalBuckets);
  const operatingBucket = capitalBuckets.find((b) => b.key === "OPERATING_CAPITAL");
  const reserveBucket = capitalBuckets.find((b) => b.key === "RESERVE_CAPITAL");
  const opAmt = operatingBucket?.amountCents ?? 0;
  const resAmt = reserveBucket?.amountCents ?? 0;
  let cashSev: LegacyRiskSeverity = "LOW";
  const cashDetails: string[] = [];
  if (total > 0 && resAmt / total < 0.05 && opAmt / total > 0.6) {
    cashSev = "MEDIUM";
    cashDetails.push("Reserve capital is a small share of modeled buckets while operating capital is large — liquidity planning may deserve attention.");
  }
  items.push({
    category: "CASH_DEPENDENCY",
    severity: cashSev,
    summary: "Illustrative liquidity / reserve posture from bucket amounts (self-reported).",
    detailNotes: cashDetails.length ? cashDetails : ["Bucket mix does not trigger illustrative cash-dependency flags."],
  });

  let opDepSev: LegacyRiskSeverity = continuity.keyPersonDependencies.length >= 2 ? "MEDIUM" : "LOW";
  if (continuity.keyPersonDependencies.length === 0) opDepSev = "LOW";
  items.push({
    category: "OPERATOR_DEPENDENCY",
    severity: opDepSev,
    summary: "Dependence on specific operators or key-person language in notes (heuristic).",
    detailNotes:
      continuity.keyPersonDependencies.length > 0
        ? continuity.keyPersonDependencies.map((k) => `${k.entityName}: ${k.notes}`)
        : ["No key-person heuristic matches in current notes."],
  });

  const missingFractions = state.entities.filter(
    (e) => e.parentEntityId && (e.informationalParentHeldFraction == null || e.informationalParentHeldFraction <= 0)
  );
  if (missingFractions.length > 0) {
    items.push({
      category: "CONCENTRATION",
      severity: "LOW",
      summary: "Incomplete ownership fractions on some edges.",
      detailNotes: [
        `${missingFractions.length} entity(ies) have a parent but no informational held fraction — effective ownership from root cannot be computed for those paths.`,
      ],
    });
  }

  return {
    items,
    generatedAt: new Date().toISOString(),
  };
}
