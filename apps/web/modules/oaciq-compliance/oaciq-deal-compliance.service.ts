import type { ComplianceCaseSeverity, ComplianceCaseType } from "@prisma/client";
import { prisma } from "@/lib/db";

type CheckResult = { ok: boolean; message: string };

/**
 * Opens or updates a ComplianceCase with execution-readiness findings — not a legal determination.
 */
export async function runOaciqDocumentComplianceForDeal(dealId: string): Promise<{ caseId: string; findings: CheckResult[] }> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      documents: { select: { type: true, workflowStatus: true } },
      lecipmFormInstances: { include: { template: true } },
    },
  });
  if (!deal) throw new Error("Deal not found");

  const findings: CheckResult[] = [];
  const docTypes = deal.documents.map((d) => d.type?.toLowerCase() ?? "");

  const hasDs = docTypes.some((t) => t.includes("declaration") || t.includes("ds"));
  const hasIv = docTypes.some((t) => t.includes("identity") || t.includes("iv"));

  if (!hasDs) {
    findings.push({ ok: false, message: "Seller declaration (DS) not detected in deal documents — verify if required for this file." });
  }
  if (!hasIv) {
    findings.push({ ok: false, message: "Identity verification (IV) not detected — verify brokerage policy." });
  }

  const hasCoownershipHint =
    deal.executionMetadata &&
    typeof deal.executionMetadata === "object" &&
    JSON.stringify(deal.executionMetadata).toLowerCase().includes("coownership");

  if (hasCoownershipHint && !docTypes.some((t) => t.includes("syndic"))) {
    findings.push({ ok: false, message: "Co-ownership context suggested — syndicate / co-ownership annexes may be required." });
  }

  const summary = findings.every((f) => f.ok)
    ? "OACIQ document checklist: no blocking flags from automated scan."
    : `OACIQ document checklist: ${findings.filter((f) => !f.ok).length} item(s) need broker review.`;

  const severity: ComplianceCaseSeverity = findings.some((f) => !f.ok) ? "medium" : "low";
  const caseType: ComplianceCaseType = "execution_readiness_risk";

  const existing = await prisma.complianceCase.findFirst({
    where: { dealId, caseType, status: { in: ["open", "under_review", "action_required"] } },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    const row = await prisma.complianceCase.update({
      where: { id: existing.id },
      data: {
        summary,
        findings: { checks: findings } as object,
        severity,
      },
    });
    return { caseId: row.id, findings };
  }

  const row = await prisma.complianceCase.create({
    data: {
      dealId,
      caseType,
      severity,
      status: "open",
      summary,
      findings: { checks: findings } as object,
      openedBySystem: true,
    },
  });

  return { caseId: row.id, findings };
}
