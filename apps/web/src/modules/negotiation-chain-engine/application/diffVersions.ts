import type { VersionDiffResult } from "@/src/modules/negotiation-chain-engine/domain/negotiationChain.types";

export type DiffTermRow = {
  priceCents: number;
  depositCents: number | null;
  financingTerms: unknown;
  commissionTerms: unknown;
  deadlines: unknown;
};

export type DiffClauseRow = {
  clauseType: string;
  text: string;
  removed: boolean;
};

function jsonChanged(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) !== JSON.stringify(b ?? null);
}

/**
 * Deterministic diff between two frozen versions (terms + clauses). No AI.
 */
export function diffVersions(
  t1: DiffTermRow | null,
  c1: DiffClauseRow[],
  t2: DiffTermRow | null,
  c2: DiffClauseRow[],
): VersionDiffResult {
  const active1 = c1.filter((c) => !c.removed);
  const active2 = c2.filter((c) => !c.removed);

  const clauseChanges: VersionDiffResult["clauseChanges"] = [];

  const byType = (rows: DiffClauseRow[]) => {
    const m = new Map<string, DiffClauseRow>();
    for (const r of rows) m.set(r.clauseType, r);
    return m;
  };

  const m1 = byType(active1);
  const m2 = byType(active2);
  const types = new Set([...m1.keys(), ...m2.keys()]);

  for (const ct of types) {
    const a = m1.get(ct);
    const b = m2.get(ct);
    if (a && !b) {
      clauseChanges.push({ kind: "removed", clauseType: ct, detail: a.text.slice(0, 200) });
    } else if (!a && b) {
      clauseChanges.push({ kind: "added", clauseType: ct, detail: b.text.slice(0, 200) });
    } else if (a && b && a.text !== b.text) {
      clauseChanges.push({ kind: "modified", clauseType: ct });
    } else if (a && b) {
      clauseChanges.push({ kind: "unchanged", clauseType: ct });
    }
  }

  let priceDeltaCents: number | null = null;
  let depositDeltaCents: number | null = null;
  let depositChanged = false;
  if (t1 && t2) {
    priceDeltaCents = t2.priceCents - t1.priceCents;
    const d1 = t1.depositCents;
    const d2 = t2.depositCents;
    depositChanged = d1 !== d2;
    if (d1 != null && d2 != null) depositDeltaCents = d2 - d1;
    else if (d1 !== d2) depositChanged = true;
  }

  return {
    priceDeltaCents,
    depositChanged,
    depositDeltaCents,
    financingTermsChanged: t1 && t2 ? jsonChanged(t1.financingTerms, t2.financingTerms) : false,
    commissionTermsChanged: t1 && t2 ? jsonChanged(t1.commissionTerms, t2.commissionTerms) : false,
    deadlinesChanged: t1 && t2 ? jsonChanged(t1.deadlines, t2.deadlines) : false,
    clauseChanges,
  };
}
