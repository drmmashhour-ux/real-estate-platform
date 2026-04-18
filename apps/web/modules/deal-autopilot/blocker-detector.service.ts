import type { AutopilotBlocker } from "./deal-autopilot.types";

type DealLike = {
  documents: { type: string; workflowStatus: string | null }[];
  complianceCases: { status: string; caseType: string; severity: string }[];
  dealClosingConditions: { status: string; conditionType: string; deadline: Date | null }[];
  lecipmDealPayments: { status: string; paymentKind: string }[];
  notaryCoordination: { packageStatus: string; notaryInviteStatus: string | null } | null;
  bankCoordination: { financingStatus: string; missingInfoFlags: unknown } | null;
  signatureSessions: { status: string }[];
  lecipmFormInstances: { status: string; template: { formFamily: string } }[];
};

export function detectBlockers(deal: DealLike): AutopilotBlocker[] {
  const blockers: AutopilotBlocker[] = [];
  const docTypes = deal.documents.map((d) => d.type?.toLowerCase() ?? "");

  if (!docTypes.some((t) => t.includes("declar") || t.includes("ds"))) {
    blockers.push({
      id: "missing_ds",
      category: "document",
      title: "Seller declaration not on file",
      detail: "No deal document typed as seller declaration / DS — confirm whether required for this stage.",
      severity: "high",
    });
  }

  if (!docTypes.some((t) => t.includes("ident") || t.includes("iv"))) {
    blockers.push({
      id: "missing_iv",
      category: "document",
      title: "Identity verification not detected",
      detail: "No IV-class document row found — verify brokerage policy.",
      severity: "medium",
    });
  }

  for (const c of deal.complianceCases) {
    if (["open", "under_review", "action_required"].includes(c.status)) {
      blockers.push({
        id: `compliance_${c.caseType}`,
        category: "compliance",
        title: `Open compliance case (${c.caseType})`,
        detail: `Severity ${c.severity} — resolve or document broker decision.`,
        severity: c.severity === "critical" || c.severity === "high" ? "high" : "medium",
      });
    }
  }

  const pendingFin = deal.dealClosingConditions.filter(
    (x) => x.status === "pending" && x.conditionType.toLowerCase().includes("financ"),
  );
  if (pendingFin.length > 0) {
    blockers.push({
      id: "financing_conditions",
      category: "condition",
      title: "Financing-related conditions still pending",
      detail: `${pendingFin.length} pending — track undertaking / waiver per file.`,
      severity: "medium",
    });
  }

  const stuckPay = deal.lecipmDealPayments.filter((p) => ["requested", "awaiting_payment"].includes(p.status));
  if (stuckPay.length > 0) {
    blockers.push({
      id: "payments_in_flight",
      category: "payment",
      title: "Payments awaiting confirmation",
      detail: `${stuckPay.length} payment row(s) not confirmed — verify trust / deposit evidence.`,
      severity: "medium",
    });
  }

  if (deal.notaryCoordination?.packageStatus && ["blocked", "needs_docs", "incomplete"].includes(deal.notaryCoordination.packageStatus)) {
    blockers.push({
      id: "notary_blocked",
      category: "coordination",
      title: "Notary package needs attention",
      detail: `packageStatus: ${deal.notaryCoordination.packageStatus}`,
      severity: "high",
    });
  }

  const fin = deal.bankCoordination?.financingStatus;
  if (fin && ["ADDITIONAL_INFO_NEEDED", "REFUSED", "CONDITION_FAILED"].includes(fin)) {
    blockers.push({
      id: "bank_blocked",
      category: "coordination",
      title: "Lender coordination needs attention",
      detail: `financingStatus: ${fin}`,
      severity: "medium",
    });
  }

  const unsigned = deal.signatureSessions.filter((s) => !["completed", "signed", "cancelled"].includes(s.status.toLowerCase()));
  if (unsigned.length > 0) {
    blockers.push({
      id: "signatures_open",
      category: "signature",
      title: "Signature sessions not completed",
      detail: `${unsigned.length} open session(s) — align with official signing workflow.`,
      severity: "medium",
    });
  }

  return blockers;
}
