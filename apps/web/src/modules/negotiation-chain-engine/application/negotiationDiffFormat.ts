import type { VersionDiffResult } from "@/src/modules/negotiation-chain-engine/domain/negotiationChain.types";

/** Concise factual lines for UI — same output used by server snapshot and client timeline. */
export function formatNegotiationDiffSummary(diff: VersionDiffResult): string[] {
  const lines: string[] = [];
  if (diff.priceDeltaCents != null && diff.priceDeltaCents !== 0) {
    const sign = diff.priceDeltaCents > 0 ? "+" : "";
    lines.push(`Price: ${sign}$${(diff.priceDeltaCents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
  }
  if (diff.depositChanged) {
    if (diff.depositDeltaCents != null) {
      const sign = diff.depositDeltaCents > 0 ? "+" : "";
      lines.push(`Deposit: ${sign}$${(diff.depositDeltaCents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
    } else {
      lines.push("Deposit: changed");
    }
  }
  if (diff.financingTermsChanged) lines.push("Financing terms: changed");
  if (diff.commissionTermsChanged) lines.push("Commission terms: changed");
  if (diff.deadlinesChanged) lines.push("Deadlines: changed");
  for (const c of diff.clauseChanges) {
    if (c.kind === "added") lines.push(`Clause added: ${c.clauseType}`);
    else if (c.kind === "removed") lines.push(`Clause removed: ${c.clauseType}`);
    else if (c.kind === "modified") lines.push(`Clause modified: ${c.clauseType}`);
  }
  return lines.slice(0, 12);
}
