/**
 * Assembles final {@link PolicyProposalReport}: generate → dedupe → sort → summary.
 */
import type { PolicyProposal, PolicyProposalInput, PolicyProposalReport } from "./policy-proposal.types";
import { dedupePolicyProposals, sortPolicyProposals } from "./policy-proposal-helpers.service";
import { generatePolicyProposals } from "./policy-proposal-engine.service";

function emptyReport(generatedAt: string): PolicyProposalReport {
  return {
    generatedAt,
    proposals: [],
    summary: {
      totalProposals: 0,
      criticalCount: 0,
      highCount: 0,
    },
  };
}

function summarize(sorted: PolicyProposal[]): PolicyProposalReport["summary"] {
  return {
    totalProposals: sorted.length,
    criticalCount: sorted.filter((p) => p.priority === "CRITICAL").length,
    highCount: sorted.filter((p) => p.priority === "HIGH").length,
    topPriorityTitle: sorted[0]?.title,
  };
}

export function buildPolicyProposalReport(input: PolicyProposalInput | null | undefined): PolicyProposalReport {
  const generatedAt = new Date().toISOString();
  try {
    const raw = generatePolicyProposals(input ?? {});
    const deduped = dedupePolicyProposals(raw);
    const sorted = sortPolicyProposals(deduped);
    return {
      generatedAt,
      proposals: sorted,
      summary: summarize(sorted),
    };
  } catch {
    return emptyReport(generatedAt);
  }
}
