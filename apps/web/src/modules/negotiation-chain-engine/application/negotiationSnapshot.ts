import { prisma } from "@/lib/db";
import { diffVersions, type DiffClauseRow, type DiffTermRow } from "@/src/modules/negotiation-chain-engine/application/diffVersions";
import {
  getCurrentActiveVersion,
  getNegotiationHistory,
  resolveNegotiationChainForListingCase,
} from "@/src/modules/negotiation-chain-engine/application/negotiationChainService";
import type { NegotiationVersionWithDetails, VersionDiffResult } from "@/src/modules/negotiation-chain-engine/domain/negotiationChain.types";

function termToDiffRow(t: NonNullable<NegotiationVersionWithDetails["terms"]>): DiffTermRow {
  return {
    priceCents: t.priceCents,
    depositCents: t.depositCents,
    financingTerms: t.financingTerms,
    commissionTerms: t.commissionTerms,
    deadlines: t.deadlines,
  };
}

function clausesToDiffRows(v: NegotiationVersionWithDetails): DiffClauseRow[] {
  return v.clauses.map((c) => ({
    clauseType: c.clauseType,
    text: c.text,
    removed: c.removed,
  }));
}

export type NegotiationCaseSnapshot = {
  chain: { id: string; status: string; propertyId: string; caseId: string | null } | null;
  activeVersion: NegotiationVersionWithDetails | null;
  /** Immediate predecessor by version number, if any. */
  previousVersion: NegotiationVersionWithDetails | null;
  diffFromPrevious: VersionDiffResult | null;
};

export { formatNegotiationDiffSummary } from "@/src/modules/negotiation-chain-engine/application/negotiationDiffFormat";

/**
 * Single LECIPM snapshot for listing + case: active version, predecessor, and structured diff.
 */
export async function getNegotiationSnapshotForCase(
  propertyId: string,
  caseId: string | null,
): Promise<NegotiationCaseSnapshot> {
  const chain = await resolveNegotiationChainForListingCase(propertyId, caseId);

  if (!chain) {
    return { chain: null, activeVersion: null, previousVersion: null, diffFromPrevious: null };
  }

  const chainDto = {
    id: chain.id,
    status: chain.status,
    propertyId: chain.propertyId,
    caseId: chain.caseId,
  };

  const [activeVersion, history] = await Promise.all([
    getCurrentActiveVersion(chain.id),
    getNegotiationHistory(chain.id),
  ]);

  let previousVersion: NegotiationVersionWithDetails | null = null;
  let diffFromPrevious: VersionDiffResult | null = null;

  if (activeVersion) {
    previousVersion =
      history
        .filter((h) => h.versionNumber < activeVersion.versionNumber)
        .sort((a, b) => b.versionNumber - a.versionNumber)[0] ?? null;

    if (previousVersion?.terms && activeVersion.terms) {
      diffFromPrevious = diffVersions(
        termToDiffRow(previousVersion.terms),
        clausesToDiffRows(previousVersion),
        termToDiffRow(activeVersion.terms),
        clausesToDiffRows(activeVersion),
      );
    }
  }

  return {
    chain: chainDto,
    activeVersion,
    previousVersion,
    diffFromPrevious,
  };
}
