import { prisma } from "@/lib/db";
import type { ComplianceRuleHit } from "./compliance-rules.types";

export async function runCommunicationRules(dealId: string): Promise<ComplianceRuleHit[]> {
  const drafts = await prisma.lecipmCommunicationDraft.findMany({
    where: { dealId, status: { in: ["draft", "pending_approval"] } },
    select: { id: true, requiresApproval: true, draftType: true },
    take: 30,
  });

  const risky = drafts.filter((d) => !d.requiresApproval);
  if (risky.length === 0) return [];

  return [
    {
      ruleKey: "communication.draft_without_approval_gate",
      caseType: "communication_compliance_risk",
      severity: "medium",
      title: "Communication drafts without approval requirement",
      summary:
        "Some communication drafts are flagged without mandatory approval. Confirm brokerage policy for client-impacting messages.",
      reasons: risky.map((d) => `Draft ${d.id} requiresApproval=false`),
      affectedEntities: risky.map((d) => ({ type: "communication_draft", id: d.id })),
      suggestedActions: ["Require approval for external-facing drafts where policy demands"],
      findingType: "approval_policy_gap",
    },
  ];
}
