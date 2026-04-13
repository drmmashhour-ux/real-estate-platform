import { ContentAutomationApprovalMode, ListingStatus, type ShortTermListing } from "@prisma/client";

/**
 * Product rule engine for growth automation (see docs/growth/full-automation.md).
 */
export function listingMustBePublishedForOutbound(listing: { listingStatus: ListingStatus }): boolean {
  return listing.listingStatus === ListingStatus.PUBLISHED;
}

export function cityRequiredForLocalCopy(listing: { city?: string | null }): boolean {
  return Boolean(listing.city?.trim());
}

export function manualApprovalBlocksAutoActions(mode: ContentAutomationApprovalMode): boolean {
  return mode === ContentAutomationApprovalMode.MANUAL;
}

export function describeRuleBlock(reason: string): string {
  return `[rule] ${reason}`;
}

export type MediaQualityAssessment = {
  count: number;
  sufficientForVideo: boolean;
  reasons: string[];
};

export function assessListingMediaForVideo(imageCount: number): MediaQualityAssessment {
  const reasons: string[] = [];
  if (imageCount < 1) reasons.push("No listing images.");
  if (imageCount < 3) reasons.push("Video generation requires at least 3 images.");
  return {
    count: imageCount,
    sufficientForVideo: imageCount >= 3,
    reasons,
  };
}

export function canAutoSchedule(args: {
  listing: ShortTermListing;
  approvalMode: ContentAutomationApprovalMode;
}): { ok: boolean; reason?: string } {
  if (!listingMustBePublishedForOutbound(args.listing)) {
    return { ok: false, reason: "Listing must be published before scheduling." };
  }
  if (manualApprovalBlocksAutoActions(args.approvalMode)) {
    return { ok: false, reason: "Approval mode is manual; use dashboard to schedule." };
  }
  if (args.approvalMode !== ContentAutomationApprovalMode.AUTO_SCHEDULE) {
    return { ok: false, reason: "Approval mode is not auto_schedule." };
  }
  return { ok: true };
}

export function canAutoPublish(args: {
  listing: ShortTermListing;
  approvalMode: ContentAutomationApprovalMode;
}): { ok: boolean; reason?: string } {
  if (!listingMustBePublishedForOutbound(args.listing)) {
    return { ok: false, reason: "Listing must be published before direct publish." };
  }
  if (manualApprovalBlocksAutoActions(args.approvalMode)) {
    return { ok: false, reason: "Approval mode is manual." };
  }
  if (args.approvalMode !== ContentAutomationApprovalMode.AUTO_PUBLISH) {
    return { ok: false, reason: "Approval mode is not auto_publish." };
  }
  return { ok: true };
}
