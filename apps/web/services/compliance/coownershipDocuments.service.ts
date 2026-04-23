import { prisma } from "@/lib/db";
import { logComplianceEvent } from "./coownershipCompliance.service";

export async function attachDocumentToChecklistItem(
  checklistItemId: string,
  documentId: string,
  actorUserId?: string
) {
  const item = await prisma.checklistItem.findUnique({
    where: { id: checklistItemId },
  });

  if (!item) throw new Error("Checklist item not found");

  const existingDocs = (item.supportingDocumentIds as string[]) || [];
  if (existingDocs.includes(documentId)) return item;

  const nextDocs = [...existingDocs, documentId];

  const updated = await prisma.checklistItem.update({
    where: { id: checklistItemId },
    data: {
      supportingDocumentIds: nextDocs,
      // Automatically upgrade to DOCUMENTED if it was DECLARED
      verificationLevel: item.verificationLevel === "DECLARED" ? "DOCUMENTED" : item.verificationLevel,
    },
  });

  logComplianceEvent("document_attached_to_checklist", {
    listingId: item.listingId,
    checklistItemId,
    documentId,
    actorUserId,
  });

  return updated;
}

export async function detachDocumentFromChecklistItem(
  checklistItemId: string,
  documentId: string,
  actorUserId?: string
) {
  const item = await prisma.checklistItem.findUnique({
    where: { id: checklistItemId },
  });

  if (!item) throw new Error("Checklist item not found");

  const existingDocs = (item.supportingDocumentIds as string[]) || [];
  const nextDocs = existingDocs.filter((id) => id !== documentId);

  const updated = await prisma.checklistItem.update({
    where: { id: checklistItemId },
    data: {
      supportingDocumentIds: nextDocs,
      // Downgrade to DECLARED if no docs left and it was DOCUMENTED
      verificationLevel:
        nextDocs.length === 0 && item.verificationLevel === "DOCUMENTED"
          ? "DECLARED"
          : item.verificationLevel,
    },
  });

  logComplianceEvent("document_detached_from_checklist", {
    listingId: item.listingId,
    checklistItemId,
    documentId,
    actorUserId,
  });

  return updated;
}

/**
 * Specialized helpers for common co-ownership document types.
 * Links them to their respective checklist items by key.
 */
export async function uploadInsuranceCertificate(listingId: string, documentId: string, actorUserId: string) {
  return attachDocumentByItemKey(listingId, "syndicate_property_insurance_verified", documentId, actorUserId);
}

export async function uploadSyndicatePolicy(listingId: string, documentId: string, actorUserId: string) {
  return attachDocumentByItemKey(listingId, "syndicate_third_party_liability_verified", documentId, actorUserId);
}

export async function uploadValuationReport(listingId: string, documentId: string, actorUserId: string) {
  return attachDocumentByItemKey(listingId, "syndicate_valuation_within_5_years_verified", documentId, actorUserId);
}

async function attachDocumentByItemKey(listingId: string, key: string, documentId: string, actorUserId: string) {
  const item = await prisma.checklistItem.findUnique({
    where: { listingId_key: { listingId, key } },
  });
  if (!item) throw new Error(`Checklist item with key ${key} not found for listing ${listingId}`);
  return attachDocumentToChecklistItem(item.id, documentId, actorUserId);
}
