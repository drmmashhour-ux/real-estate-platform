import { diffVersions } from "@/src/modules/negotiation-chain-engine/application/diffVersions";
import type { DiffClauseRow, DiffTermRow } from "@/src/modules/negotiation-chain-engine/application/diffVersions";
import type { NegotiationVersionWithDetails, VersionDiffResult } from "@/src/modules/negotiation-chain-engine/domain/negotiationChain.types";

export function termFromVersion(v: NegotiationVersionWithDetails): DiffTermRow | null {
  if (!v.terms) return null;
  return {
    priceCents: v.terms.priceCents,
    depositCents: v.terms.depositCents,
    financingTerms: v.terms.financingTerms,
    commissionTerms: v.terms.commissionTerms,
    deadlines: v.terms.deadlines,
  };
}

export function clausesForDiff(v: NegotiationVersionWithDetails): DiffClauseRow[] {
  return v.clauses.map((c) => ({
    clauseType: c.clauseType,
    text: c.text,
    removed: c.removed,
  }));
}

/** Diff vs previous version in chain (same engine as server snapshot). */
export function diffFromPreviousVersion(
  prev: NegotiationVersionWithDetails | null,
  current: NegotiationVersionWithDetails,
): VersionDiffResult | null {
  if (!prev?.terms || !current.terms) return null;
  const t1 = termFromVersion(prev);
  const t2 = termFromVersion(current);
  if (!t1 || !t2) return null;
  return diffVersions(t1, clausesForDiff(prev), t2, clausesForDiff(current));
}
