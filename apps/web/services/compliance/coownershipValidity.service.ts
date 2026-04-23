import { prisma } from "@/lib/db";
import { logComplianceEvent } from "./coownershipCompliance.service";

export async function refreshChecklistItemExpiry(checklistItemId: string) {
  const item = await prisma.checklistItem.findUnique({
    where: { id: checklistItemId },
  });

  if (!item || !item.validUntil) return;

  const isExpired = new Date() > item.validUntil;

  if (isExpired !== item.isExpired) {
    await prisma.checklistItem.update({
      where: { id: checklistItemId },
      data: { isExpired },
    });

    logComplianceEvent("checklist_item_expiry_changed", {
      listingId: item.listingId,
      checklistItemId,
      key: item.key,
      isExpired,
    });
  }
}

export async function refreshListingComplianceExpiry(listingId: string) {
  const items = await prisma.checklistItem.findMany({
    where: {
      listingId,
      validUntil: { not: null },
    },
  });

  for (const item of items) {
    const isExpired = new Date() > item.validUntil!;
    if (isExpired !== item.isExpired) {
      await prisma.checklistItem.update({
        where: { id: item.id },
        data: { isExpired },
      });
    }
  }
}

/**
 * Logic to determine if a checklist row should block compliance ready state due to expiry.
 */
export function isCriticalRowExpired(item: { key: string; isExpired: boolean }): boolean {
  // Add critical keys that must not be expired
  const criticalKeys = [
    "syndicate_property_insurance_verified",
    "syndicate_third_party_liability_verified",
    "coowner_liability_minimum_verified",
  ];
  return item.isExpired && criticalKeys.includes(item.key);
}
