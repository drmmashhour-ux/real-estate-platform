import type { ChecklistItem, LecipmListingAssetType } from "@prisma/client";
import { complianceFlags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";

const NS = "[compliance]";

function log(event: string, payload?: Record<string, unknown>): void {
  try {
    if (payload) console.info(`${NS} ${event}`, JSON.stringify(payload));
    else console.info(`${NS} ${event}`);
  } catch {
    /* never throw */
  }
}

/** Named events: checklist_created, checklist_item_completed, compliance_completed, compliance_blocked_action, listing_published */
export function logComplianceEvent(event: string, payload: Record<string, unknown>): void {
  log(event, payload);
}

export const COOWNERSHIP_CRITICAL_KEY = "coownership_certificate" as const;

/** Fixed checklist definitions (Reg. 2025 — Québec divided co-ownership). */
export const COOWNERSHIP_CHECKLIST_DEFINITIONS: readonly { key: string; label: string }[] = [
  { key: "coownership_certificate", label: "Certificate of co-ownership condition obtained" },
  { key: "certificate_reviewed", label: "Certificate reviewed and complete" },
  { key: "maintenance_log", label: "Maintenance log verified" },
  { key: "contingency_fund", label: "Contingency fund study verified" },
  { key: "seller_informed", label: "Seller informed of obligations (Art. 1068.1 C.c.Q)" },
] as const;

export function listingRequiresCoownershipChecklist(row: {
  listingType: LecipmListingAssetType;
  isCoOwnership: boolean;
}): boolean {
  return row.listingType === "CONDO" || row.isCoOwnership === true;
}

export type ComplianceStatusPayload = {
  applies: boolean;
  listingType: LecipmListingAssetType;
  isCoOwnership: boolean;
  items: Pick<ChecklistItem, "id" | "key" | "label" | "status" | "required">[];
  /** All required rows completed when checklist applies */
  complete: boolean;
  /** Critical certificate row completed (gates enforcement) */
  certificateComplete: boolean;
};

/**
 * Ensures Québec co-ownership checklist rows exist when the listing is CONDO / co-ownership.
 * Idempotent via unique (listingId, key).
 */
export async function ensureCoOwnershipChecklist(listingId: string): Promise<{ createdKeys: string[] }> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, listingType: true, isCoOwnership: true },
  });
  if (!listing) throw new Error("Listing not found");

  if (!listingRequiresCoownershipChecklist(listing)) {
    return { createdKeys: [] };
  }

  const before = await prisma.checklistItem.count({ where: { listingId } });
  const data = COOWNERSHIP_CHECKLIST_DEFINITIONS.map((def) => ({
    listingId,
    key: def.key,
    label: def.label,
    status: "PENDING" as const,
    required: true,
  }));
  const inserted = await prisma.checklistItem.createMany({ data, skipDuplicates: true });
  const after = await prisma.checklistItem.count({ where: { listingId } });
  if (after > before || inserted.count > 0) {
    log("checklist_created", { listingId, inserted: inserted.count, rowCount: after });
  }

  return { createdKeys: COOWNERSHIP_CHECKLIST_DEFINITIONS.map((d) => d.key) };
}

export async function getComplianceStatus(listingId: string): Promise<ComplianceStatusPayload> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { listingType: true, isCoOwnership: true },
  });
  if (!listing) throw new Error("Listing not found");

  const applies = listingRequiresCoownershipChecklist(listing);
  const items = await prisma.checklistItem.findMany({
    where: { listingId },
    orderBy: { key: "asc" },
    select: { id: true, key: true, label: true, status: true, required: true },
  });

  const requiredItems = items.filter((i) => i.required);
  const complete =
    !applies || (requiredItems.length > 0 && requiredItems.every((i) => i.status === "COMPLETED"));

  const cert = items.find((i) => i.key === COOWNERSHIP_CRITICAL_KEY);
  const certificateComplete = !applies || cert?.status === "COMPLETED";

  return {
    applies,
    listingType: listing.listingType,
    isCoOwnership: listing.isCoOwnership,
    items,
    complete,
    certificateComplete,
  };
}

export async function isComplianceComplete(listingId: string): Promise<boolean> {
  const s = await getComplianceStatus(listingId);
  return s.complete;
}

export async function setChecklistItemCompleted(listingId: string, key: string): Promise<ChecklistItem> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { listingType: true, isCoOwnership: true },
  });
  if (!listing) throw new Error("Listing not found");
  if (!listingRequiresCoownershipChecklist(listing)) {
    throw new Error("Co-ownership checklist does not apply to this listing");
  }

  const allowed = COOWNERSHIP_CHECKLIST_DEFINITIONS.some((d) => d.key === key);
  if (!allowed) throw new Error("Unknown checklist key");

  await ensureCoOwnershipChecklist(listingId);

  const wasComplete = await isComplianceComplete(listingId);

  const updated = await prisma.checklistItem.update({
    where: {
      listingId_key: { listingId, key },
    },
    data: { status: "COMPLETED" },
  });

  log("checklist_item_completed", { listingId, key });

  const nowComplete = await isComplianceComplete(listingId);
  if (!wasComplete && nowComplete) {
    log("compliance_completed", { listingId });
  }

  try {
    const { invalidateComplianceStatusCache } = await import("@/lib/compliance/coownership-compliance-cache");
    invalidateComplianceStatusCache(listingId);
  } catch {
    /* optional cache module in edge */
  }

  return updated;
}

export type CoownershipEnforcementAction = "publish" | "accept_offer";

export const ERR_COOWNERSHIP_PUBLISH =
  "Complete co-ownership compliance before publishing.";
export const ERR_COOWNERSHIP_ACCEPT_OFFER =
  "Complete co-ownership compliance before accepting this offer.";

function enforcementEnabled(): boolean {
  return complianceFlags.coownershipEnforcement === true;
}

/**
 * When FEATURE_COOWNERSHIP_ENFORCEMENT is on, blocks until all required checklist rows are completed.
 */
export async function assertCoownershipEnforcementAllows(
  listingId: string,
  action: CoownershipEnforcementAction
): Promise<void> {
  if (!enforcementEnabled()) return;

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { listingType: true, isCoOwnership: true },
  });
  if (!listing) return;

  if (!listingRequiresCoownershipChecklist(listing)) return;

  await ensureCoOwnershipChecklist(listingId);

  const complete = await isComplianceComplete(listingId);
  if (complete) return;

  log("compliance_blocked_action", { listingId, action });

  throw new Error(action === "publish" ? ERR_COOWNERSHIP_PUBLISH : ERR_COOWNERSHIP_ACCEPT_OFFER);
}

/** Publish / go-live on marketplace — CONDO co-ownership checklist must be complete when enforcement flag is on. */
export async function assertCoownershipPublishAllowed(listingId: string): Promise<void> {
  await assertCoownershipEnforcementAllows(listingId, "publish");
}
