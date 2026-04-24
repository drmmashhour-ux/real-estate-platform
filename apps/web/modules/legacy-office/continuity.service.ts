/**
 * Succession / continuity awareness — qualitative notes only. Not legal or HR advice.
 */

import type { EntityType, LegacyOfficeState } from "./entity.types";
import { buildOwnershipGraph, getChildren } from "./ownership-graph.service";
import type { ControlRules } from "./control-rules.service";
import { getControlRulesForEntity } from "./control-rules.service";

export type KeyPersonDependency = {
  entityId: string;
  entityName: string;
  entityType: EntityType;
  notes: string;
};

export type ContinuityRiskItem = {
  severity: "INFO" | "WATCH";
  message: string;
};

export type ContinuitySnapshot = {
  keyPersonDependencies: KeyPersonDependency[];
  successorNotes: string[];
  continuityRisks: ContinuityRiskItem[];
  concentrationRisks: ContinuityRiskItem[];
};

function entityNotesFlagged(text: string | null | undefined): boolean {
  if (!text?.trim()) return false;
  const t = text.toLowerCase();
  return (
    t.includes("founder") ||
    t.includes("key person") ||
    t.includes("sole manager") ||
    t.includes("single signer")
  );
}

function maxDepthFrom(graph: ReturnType<typeof buildOwnershipGraph>, entityId: string, seen: Set<string>): number {
  if (seen.has(entityId)) return 0;
  seen.add(entityId);
  const kids = getChildren(graph, entityId);
  if (kids.length === 0) return 1;
  return 1 + Math.max(...kids.map((k) => maxDepthFrom(graph, k.id, new Set(seen))));
}

/**
 * Derives a continuity snapshot from graph shape, governance notes, and optional dashboard notes.
 */
export function buildContinuitySnapshot(
  state: LegacyOfficeState,
  controlRules: ControlRules[],
  options?: {
    globalSuccessorNotes?: string;
    globalKeyPersonNotes?: string;
  }
): ContinuitySnapshot {
  const graph = buildOwnershipGraph(state);
  const keyPersonDependencies: KeyPersonDependency[] = [];

  for (const e of state.entities) {
    const cr = getControlRulesForEntity(controlRules, e.id);
    const combined = [e.governanceNotes, cr?.successionNotes, cr?.boardOrManagerRolesNotes].filter(Boolean).join(" ");
    if (entityNotesFlagged(combined) || entityNotesFlagged(e.ownershipNotes)) {
      keyPersonDependencies.push({
        entityId: e.id,
        entityName: e.name,
        entityType: e.entityType,
        notes:
          "Governance or ownership notes may indicate reliance on specific individuals — discuss with qualified advisors (informational flag only).",
      });
    }
  }

  if (options?.globalKeyPersonNotes?.trim()) {
    keyPersonDependencies.push({
      entityId: "_global",
      entityName: "Global notes",
      entityType: "FAMILY_OFFICE",
      notes: options.globalKeyPersonNotes.trim(),
    });
  }

  const successorNotes: string[] = [];
  if (options?.globalSuccessorNotes?.trim()) successorNotes.push(options.globalSuccessorNotes.trim());
  for (const cr of controlRules) {
    if (cr.successionNotes?.trim()) successorNotes.push(`${cr.entityId}: ${cr.successionNotes.trim()}`);
  }

  const continuityRisks: ContinuityRiskItem[] = [];
  const concentrationRisks: ContinuityRiskItem[] = [];

  if (graph.rootIds.length > 1) {
    continuityRisks.push({
      severity: "WATCH",
      message:
        "Multiple root entities detected — confirm whether parallel top-level structures are intentional for your operating model (informational).",
    });
  }

  for (const rootId of graph.rootIds) {
    const depth = maxDepthFrom(graph, rootId, new Set());
    if (depth >= 5) {
      continuityRisks.push({
        severity: "INFO",
        message:
          "Deep entity stack may increase governance and reporting complexity — document roles and decision paths (informational).",
      });
      break;
    }
  }

  const operating = state.entities.filter((e) => e.entityType === "OPERATING");
  if (operating.length === 1 && state.entities.length > 3) {
    concentrationRisks.push({
      severity: "WATCH",
      message:
        "A single operating company in a broader graph may concentrate operational cash-flow risk — scenario planning only.",
    });
  }

  const vehicles = state.entities.filter((e) => e.entityType === "INVESTMENT_VEHICLE").length;
  if (vehicles > 6) {
    concentrationRisks.push({
      severity: "INFO",
      message: "Many investment vehicles increase monitoring load — consider how reporting is standardized (informational).",
    });
  }

  return {
    keyPersonDependencies,
    successorNotes,
    continuityRisks,
    concentrationRisks,
  };
}
