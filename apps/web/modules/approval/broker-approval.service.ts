import { prisma } from "@/lib/db";
import { validateExactAllForms } from "@/modules/oaciq-mapper/validation/exact-validation.service";
import { buildCanonicalDealShape } from "@/modules/oaciq-mapper/source-paths/canonical-deal-shape";
import { loadDealForMapper } from "@/lib/oaciq/load-deal-for-mapper";
import { finalizeBrokerApprovalWithSignature } from "./broker-approval-workflow.service";

export type ApprovalReadiness = {
  canApprove: boolean;
  blockers: string[];
  criticalCount: number;
};

/**
 * Broker-only gate: confirms mapping/validation snapshot before execution prep.
 * Does not certify OACIQ compliance — broker remains accountable to publisher rules.
 */
export async function assessApprovalReadiness(
  dealId: string,
  activeFormKeys: string[],
): Promise<ApprovalReadiness> {
  const deal = await loadDealForMapper(dealId);
  if (!deal) return { canApprove: false, blockers: ["Deal not found"], criticalCount: 0 };

  const canonical = buildCanonicalDealShape(deal);
  const { globalIssues, perForm } = validateExactAllForms(deal, canonical, activeFormKeys);
  const criticals = [
    ...globalIssues.filter((i) => i.severity === "critical"),
    ...Object.values(perForm).flatMap((r) => r.crossDocumentCriticals),
  ];
  const blockers = criticals.map((c) => c.message);
  if (activeFormKeys.length === 0) {
    blockers.push("Select at least one active form key for validation snapshot.");
  }
  return {
    canApprove: criticals.length === 0 && activeFormKeys.length > 0,
    blockers,
    criticalCount: criticals.length,
  };
}

export async function recordBrokerApproval(input: {
  dealId: string;
  approvedById: string;
  notes?: string | null;
  snapshot?: Record<string, unknown>;
  /** Required — broker must confirm OACIQ responsibility text in UI before calling. */
  oaciqBrokerAcknowledged: boolean;
}): Promise<{ id: string; approvedAt: Date }> {
  const out = await finalizeBrokerApprovalWithSignature({
    dealId: input.dealId,
    approvedById: input.approvedById,
    notes: input.notes,
    snapshot: input.snapshot,
    oaciqBrokerAcknowledged: input.oaciqBrokerAcknowledged,
    channel: "execute_approve_route",
  });
  return { id: out.legacyApprovalId, approvedAt: out.approvedAt };
}
