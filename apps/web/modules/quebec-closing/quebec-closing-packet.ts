import type { DealClosingCondition, DealClosingDocument } from "@prisma/client";
import { prisma } from "@/lib/db";
import { QC_NOTARY_CHECKLIST_LABELS, type QcNotaryChecklistKey } from "@/modules/quebec-closing/quebec-closing.types";

export type ClosingPacketSection = {
  key: string;
  label: string;
  status: "present" | "partial" | "missing";
  detail?: string;
};

/**
 * Advisory closing packet index for Québec workflow — broker-facing, not legal certification.
 */
export async function buildClosingPacketIndex(dealId: string): Promise<{
  sections: ClosingPacketSection[];
  generatedAt: string;
}> {
  const [deal, conditions, docs, offerDraft, checklist, commissionRows] = await Promise.all([
    prisma.deal.findUnique({
      where: { id: dealId },
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        brokerId: true,
        executionMetadata: true,
        buyer: { select: { name: true, email: true } },
        seller: { select: { name: true, email: true } },
        broker: { select: { name: true, email: true } },
      },
    }),
    prisma.dealClosingCondition.findMany({ where: { dealId } }),
    prisma.dealClosingDocument.findMany({ where: { dealId } }),
    prisma.offerDraft.findFirst({
      where: { dealId, status: { in: ["APPROVED", "SENT"] } },
      orderBy: { updatedAt: "desc" },
      select: { id: true, status: true, updatedAt: true },
    }),
    prisma.dealQuebecNotaryChecklistItem.findMany({ where: { dealId } }),
    prisma.platformCommissionRecord.findMany({
      where: { dealId },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, commissionAmountCents: true, createdAt: true },
    }),
  ]);

  const sections: ClosingPacketSection[] = [];

  sections.push(
    offerDraft ?
      {
        key: "promise_to_purchase",
        label: "Accepted promise to purchase",
        status: "present",
        detail: `Offer draft ${offerDraft.id.slice(0, 8)} · ${offerDraft.status}`,
      }
    : {
        key: "promise_to_purchase",
        label: "Accepted promise to purchase",
        status: "missing",
        detail: "No linked offer draft in accepted/sent state",
      },
  );

  const amendmentDocs = docs.filter((d) => /amend|counter|avenant/i.test(d.title));
  sections.push({
    key: "amendments",
    label: "Amendments / counter-offers",
    status: amendmentDocs.length > 0 ? "present" : "partial",
    detail: amendmentDocs.length ? `${amendmentDocs.length} document(s) in closing room` : "Capture in closing documents if applicable",
  });

  sections.push({
    key: "broker_disclosures",
    label: "Broker disclosures",
    status: "partial",
    detail: "Verify mandatory OACIQ disclosures in compliance hub",
  });

  sections.push({
    key: "identity",
    label: "Identity details (parties)",
    status: deal?.buyer && deal.seller ? "present" : "partial",
    detail: [deal?.buyer?.name, deal?.seller?.name].filter(Boolean).join(" · ") || undefined,
  });

  const financing = conditions.find((c) => /financ/i.test(c.conditionType));
  sections.push(conditionSection("financing_condition", "Financing condition status", financing));

  const inspection = conditions.find((c) => /inspect/i.test(c.conditionType));
  sections.push(conditionSection("inspection_condition", "Inspection condition / reports", inspection));

  const loc = checklist.find((i) => i.itemKey === "CERTIFICATE_OF_LOCATION");
  sections.push(
    loc?.status === "RECEIVED" ?
      { key: "certificate_location", label: "Certificate of location", status: "present" }
    : {
        key: "certificate_location",
        label: "Certificate of location",
        status: "missing",
        detail: QC_NOTARY_CHECKLIST_LABELS.CERTIFICATE_OF_LOCATION,
      },
  );

  const tax = checklist.find((i) => i.itemKey === "TAX_STATEMENTS");
  sections.push(
    tax?.status === "RECEIVED" ?
      { key: "tax_accounts", label: "Tax account information", status: "present" }
    : { key: "tax_accounts", label: "Tax account information", status: "partial" },
  );

  const inspectionDocs = docs.filter((d) => /inspect|report/i.test(d.title));
  sections.push({
    key: "inspection_documents",
    label: "Inspection documents",
    status: inspectionDocs.length > 0 ? "present" : "partial",
    detail: inspectionDocs.length ? `${inspectionDocs.length} file(s)` : undefined,
  });

  const meta = (deal?.executionMetadata ?? {}) as Record<string, unknown>;
  const occ = typeof meta.occupancyNotes === "string" ? meta.occupancyNotes : null;
  sections.push({
    key: "occupancy_keys",
    label: "Occupancy / key arrangements",
    status: occ ? "present" : "partial",
    detail: occ ?? "Set executionMetadata.occupancyNotes or internal notes",
  });

  sections.push({
    key: "commission_statement",
    label: "Commission statement",
    status: commissionRows.length > 0 ? "present" : "partial",
    detail: commissionRows.length ? `${commissionRows.length} recent commission row(s)` : undefined,
  });

  return { sections, generatedAt: new Date().toISOString() };
}

function conditionSection(key: string, label: string, row: DealClosingCondition | undefined): ClosingPacketSection {
  if (!row) return { key, label, status: "missing", detail: "Not tracked" };
  if (row.status === "fulfilled" || row.status === "waived") {
    return { key, label, status: "present", detail: `Status: ${row.status}` };
  }
  if (row.status === "failed") return { key, label, status: "missing", detail: "Failed — resolve" };
  return { key, label, status: "partial", detail: `Status: ${row.status}` };
}

export function documentCategoryHint(doc: DealClosingDocument): QcNotaryChecklistKey | null {
  const t = doc.title.toLowerCase();
  if (t.includes("location") || t.includes("certificate")) return "CERTIFICATE_OF_LOCATION";
  if (t.includes("tax") || t.includes("compte de taxes")) return "TAX_STATEMENTS";
  if (t.includes("mortgage") || t.includes("hypoth")) return "MORTGAGE_INSTRUCTIONS";
  if (t.includes("title") || t.includes("titre") || t.includes("radiation")) return "TITLE_SEARCH";
  if (t.includes("adjust")) return "ADJUSTMENT_STATEMENT";
  return null;
}
