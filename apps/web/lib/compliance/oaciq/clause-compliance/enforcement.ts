import type { ClauseComplianceFlag } from "@/lib/compliance/oaciq/clause-compliance/types";
import type { ClauseEnforcementDescriptor } from "@/lib/compliance/oaciq/clause-compliance/types";

export function enforcementDescriptorsForFlags(
  clauseId: string,
  flags: readonly ClauseComplianceFlag[],
): ClauseEnforcementDescriptor[] {
  const out: ClauseEnforcementDescriptor[] = [];
  for (const f of flags) {
    switch (f) {
      case "dual_representation_warning":
        out.push({
          kind: "dual_representation_disclosure",
          clauseId,
          actions: ['triggerDisclosure("dual_representation")', "Document consent and scope in the file."],
        });
        break;
      case "off_market":
        out.push(
          {
            kind: "off_market_listing",
            clauseId,
            actions: ["disableListing()", "Listing visibility disabled for marketing surfaces."],
          },
          {
            kind: "stop_marketing",
            clauseId,
            actions: ["stopMarketing()", "Cease paid and organic advertising for this mandate."],
          },
          {
            kind: "maintain_contract_validity",
            clauseId,
            actions: ["maintainContractValidity()", "Brokerage contract remains enforceable subject to its terms."],
          },
        );
        break;
      case "security_deposit_trust":
        out.push({
          kind: "trust_account_workflow",
          clauseId,
          actions: [
            "triggerTrustAccountWorkflow()",
            "Funds to trust; record holder, release conditions, and timeline.",
          ],
        });
        break;
      case "enterprise_combined_transaction":
        out.push({
          kind: "enterprise_scope_review",
          clauseId,
          actions: [
            "Align immovable vs movable components; verify licence scope and disclosure.",
            "Legal review recommended for combined enterprise + real estate clauses.",
          ],
        });
        break;
      default:
        break;
    }
  }
  return out;
}
