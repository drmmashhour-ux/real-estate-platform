import type { OptimizationRiskLevel } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createOptimizationAuditLog } from "@/lib/autopilot/create-audit-log";
import {
  FIELD_DESCRIPTION,
  FIELD_NIGHT_PRICE_CENTS,
  FIELD_PHOTO_ORDER,
  FIELD_SUBTITLE_CTA,
  FIELD_TITLE,
} from "@/lib/autopilot/validators";
import { updateListingQuality } from "@/lib/quality/update-listing-quality";

export async function applyOptimizationSuggestionToListing(input: {
  suggestionId: string;
  performedByUserId: string | null;
  auditAction: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const s = await prisma.listingOptimizationSuggestion.findUnique({
    where: { id: input.suggestionId },
    include: { listing: { select: { id: true, ownerId: true, title: true, description: true, subtitle: true } } },
  });
  if (!s || !s.listing) return { ok: false, error: "Suggestion not found" };
  if (s.status !== "suggested") {
    return { ok: false, error: "Suggestion is not applicable" };
  }

  if (s.fieldType === FIELD_NIGHT_PRICE_CENTS) {
    await prisma.listingOptimizationSuggestion.update({
      where: { id: s.id },
      data: { status: "approved", updatedAt: new Date() },
    });
    await createOptimizationAuditLog({
      listingId: s.listingId,
      suggestionId: s.id,
      action: "price_suggestion_approved_not_applied",
      oldValue: String(s.currentValue ?? ""),
      newValue: String(s.proposedValue ?? ""),
      performedByUserId: input.performedByUserId,
    });
    return { ok: true };
  }

  const listingId = s.listingId;

  if (s.fieldType === FIELD_TITLE && s.proposedValue) {
    const oldV = s.listing.title;
    await prisma.shortTermListing.update({
      where: { id: listingId },
      data: { title: s.proposedValue.slice(0, 500) },
    });
    await finalizeApplied(s.id, listingId, oldV, s.proposedValue, input.performedByUserId, input.auditAction);
    return { ok: true };
  }

  if (s.fieldType === FIELD_DESCRIPTION && s.proposedValue != null) {
    const oldV = s.listing.description ?? "";
    await prisma.shortTermListing.update({
      where: { id: listingId },
      data: { description: s.proposedValue },
    });
    await finalizeApplied(s.id, listingId, oldV, s.proposedValue, input.performedByUserId, input.auditAction);
    return { ok: true };
  }

  if (s.fieldType === FIELD_SUBTITLE_CTA && s.proposedValue != null) {
    const oldV = s.listing.subtitle ?? "";
    await prisma.shortTermListing.update({
      where: { id: listingId },
      data: { subtitle: s.proposedValue.slice(0, 500) },
    });
    await finalizeApplied(s.id, listingId, oldV, s.proposedValue, input.performedByUserId, input.auditAction);
    return { ok: true };
  }

  if (s.fieldType === FIELD_PHOTO_ORDER && s.proposedValue) {
    let ids: string[] = [];
    try {
      ids = JSON.parse(s.proposedValue) as string[];
    } catch {
      return { ok: false, error: "Invalid photo order payload" };
    }
    const photos = await prisma.bnhubListingPhoto.findMany({ where: { listingId } });
    const valid = ids.filter((id) => photos.some((p) => p.id === id));
    if (valid.length === 0) return { ok: false, error: "No valid photo ids" };
    const oldV = JSON.stringify(photos.sort((a, b) => a.sortOrder - b.sortOrder).map((p) => p.id));
    for (let i = 0; i < valid.length; i++) {
      await prisma.bnhubListingPhoto.update({
        where: { id: valid[i]! },
        data: { sortOrder: i, isCover: i === 0 },
      });
    }
    const newV = JSON.stringify(valid);
    await prisma.listingOptimizationSuggestion.update({
      where: { id: s.id },
      data: { status: "applied", updatedAt: new Date() },
    });
    await createOptimizationAuditLog({
      listingId,
      suggestionId: s.id,
      action: input.auditAction,
      oldValue: oldV,
      newValue: newV,
      performedByUserId: input.performedByUserId,
    });
    await updateListingQuality(listingId).catch(() => {});
    return { ok: true };
  }

  return { ok: false, error: "Unsupported field" };
}

async function finalizeApplied(
  suggestionId: string,
  listingId: string,
  oldVal: string,
  newVal: string,
  performedByUserId: string | null,
  auditAction: string
): Promise<void> {
  await prisma.listingOptimizationSuggestion.update({
    where: { id: suggestionId },
    data: { status: "applied", updatedAt: new Date() },
  });
  await createOptimizationAuditLog({
    listingId,
    suggestionId,
    action: auditAction,
    oldValue: oldVal,
    newValue: newVal,
    performedByUserId,
  });
  await updateListingQuality(listingId).catch(() => {});
}

export function suggestionEligibleForAutoApply(
  risk: OptimizationRiskLevel,
  autoApplyAllowed: boolean
): boolean {
  return risk === "low" && autoApplyAllowed;
}
