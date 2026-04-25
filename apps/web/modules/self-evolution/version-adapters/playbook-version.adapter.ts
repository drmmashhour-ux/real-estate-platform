import type { EvolutionProposalCategory } from "@prisma/client";
import { recordAdapterLog, type AdapterResult } from "./adapter-helpers";

export function applyPlaybookProposedVersion(category: EvolutionProposalCategory, proposedVersionKey: string, proposal: Record<string, unknown>): AdapterResult {
  if (category !== "PLAYBOOK" && category !== "OTHER") {
    return { ok: false, error: "not_playbook", trace: "skip" };
  }
  if (String(proposal.legalWaiver) === "true" || String(proposal.bypass_compliance) === "true") {
    return { ok: false, error: "forbidden", trace: "compliance" };
  }
  return recordAdapterLog(category, proposedVersionKey);
}
