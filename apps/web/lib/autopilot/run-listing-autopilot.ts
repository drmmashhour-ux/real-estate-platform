import type { ListingAutopilotMode, OptimizationRiskLevel } from "@prisma/client";
import { prisma } from "@/lib/db";
import { applySafeFixesForListing } from "@/lib/autopilot/apply-safe-fixes";
import { detectListingIssues } from "@/lib/autopilot/detect-listing-issues";
import { generateCtaFix } from "@/lib/autopilot/generate-cta-fix";
import { generateDescriptionFix } from "@/lib/autopilot/generate-description-fix";
import { generatePhotoOrderSuggestion } from "@/lib/autopilot/generate-photo-order-suggestion";
import { generatePriceSuggestion } from "@/lib/autopilot/generate-price-suggestion";
import { generateTitleFix } from "@/lib/autopilot/generate-title-fix";
import { getOrCreateListingAutopilotSettings } from "@/lib/autopilot/get-autopilot-settings";
import {
  FIELD_DESCRIPTION,
  FIELD_NIGHT_PRICE_CENTS,
  FIELD_PHOTO_ORDER,
  FIELD_SUBTITLE_CTA,
  FIELD_TITLE,
  canAutoApplyField,
  riskForFieldType,
  shouldQueueAllForApproval,
} from "@/lib/autopilot/validators";

function autoFlag(
  mode: ListingAutopilotMode,
  fieldType: string,
  risk: OptimizationRiskLevel,
  s: {
    autoFixTitles: boolean;
    autoFixDescriptions: boolean;
    autoReorderPhotos: boolean;
    autoGenerateContent: boolean;
    allowPriceSuggestions: boolean;
  }
): boolean {
  if (shouldQueueAllForApproval(mode)) return false;
  return canAutoApplyField(mode, fieldType, risk, s);
}

export async function runListingAutopilot(input: {
  listingId: string;
  performedByUserId: string | null;
}): Promise<{ runId: string; summary: string }> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: input.listingId },
    select: {
      id: true,
      ownerId: true,
      title: true,
      description: true,
      subtitle: true,
      city: true,
      region: true,
      roomType: true,
      propertyType: true,
      maxGuests: true,
      beds: true,
      nightPriceCents: true,
      amenities: true,
      houseRules: true,
    },
  });
  if (!listing) throw new Error("Listing not found");

  const settings = await getOrCreateListingAutopilotSettings(listing.ownerId);
  if (settings.mode === "off") {
    throw new Error("Autopilot is off for this account");
  }

  const issues = await detectListingIssues(listing.id);
  const summaryText = issues.summaryLines.join("\n");

  const run = await prisma.listingOptimizationRun.create({
    data: {
      listingId: listing.id,
      status: "running",
      summary: summaryText.slice(0, 8000),
    },
  });

  try {
    const amenities = Array.isArray(listing.amenities)
      ? (listing.amenities as unknown[]).filter((a): a is string => typeof a === "string")
      : [];

    const [titleFix, descFix, ctaFix, photoFix, priceFix] = await Promise.all([
      generateTitleFix({
        currentTitle: listing.title,
        city: listing.city,
        region: listing.region,
        roomType: listing.roomType,
        propertyType: listing.propertyType,
        maxGuests: listing.maxGuests,
        beds: listing.beds,
        issueHints: issues.summaryLines,
      }),
      generateDescriptionFix({
        currentDescription: listing.description ?? "",
        city: listing.city,
        amenitiesSample: amenities,
        houseRulesExcerpt: (listing.houseRules ?? "").slice(0, 1200),
        issueHints: issues.summaryLines,
      }),
      generateCtaFix({
        currentSubtitle: listing.subtitle ?? "",
        title: listing.title,
        city: listing.city,
        issueHints: issues.summaryLines,
      }),
      generatePhotoOrderSuggestion(listing.id),
      settings.allowPriceSuggestions
        ? generatePriceSuggestion(listing.id)
        : Promise.resolve({ proposedNightPriceCents: listing.nightPriceCents, reason: "Disabled", confidenceScore: 0 }),
    ]);

    const rows: Array<{
      runId: string;
      listingId: string;
      fieldType: string;
      currentValue: string | null;
      proposedValue: string | null;
      reason: string | null;
      riskLevel: OptimizationRiskLevel;
      confidenceScore: number;
      autoApplyAllowed: boolean;
      status: "suggested";
    }> = [];

    const pushRow = (
      fieldType: string,
      current: string | null,
      proposed: string | null,
      reason: string | null,
      confidence: number
    ) => {
      const risk = riskForFieldType(fieldType);
      const auto = autoFlag(settings.mode, fieldType, risk, settings);
      rows.push({
        runId: run.id,
        listingId: listing.id,
        fieldType,
        currentValue: current,
        proposedValue: proposed,
        reason,
        riskLevel: risk,
        confidenceScore: confidence,
        autoApplyAllowed: auto,
        status: "suggested",
      });
    };

    if (titleFix.proposedTitle.trim() && titleFix.proposedTitle.trim() !== listing.title.trim()) {
      pushRow(FIELD_TITLE, listing.title, titleFix.proposedTitle, titleFix.reason, titleFix.confidenceScore);
    }
    if (descFix.proposedDescription.trim() && descFix.proposedDescription.trim() !== (listing.description ?? "").trim()) {
      pushRow(
        FIELD_DESCRIPTION,
        listing.description ?? "",
        descFix.proposedDescription,
        descFix.reason,
        descFix.confidenceScore
      );
    }
    if (ctaFix.proposedSubtitle.trim() && ctaFix.proposedSubtitle.trim() !== (listing.subtitle ?? "").trim()) {
      pushRow(FIELD_SUBTITLE_CTA, listing.subtitle ?? "", ctaFix.proposedSubtitle, ctaFix.reason, ctaFix.confidenceScore);
    }
    if (photoFix.proposedOrderIds.length > 0) {
      const currentPhotos = await prisma.bnhubListingPhoto.findMany({
        where: { listingId: listing.id },
        orderBy: [{ sortOrder: "asc" }],
      });
      const cur = JSON.stringify(currentPhotos.map((p) => p.id));
      const next = JSON.stringify(photoFix.proposedOrderIds);
      if (cur !== next) {
        pushRow(FIELD_PHOTO_ORDER, cur, next, photoFix.reason, photoFix.confidenceScore);
      }
    }
    if (settings.allowPriceSuggestions && priceFix.proposedNightPriceCents > 0) {
      const diff = Math.abs(priceFix.proposedNightPriceCents - listing.nightPriceCents);
      if (diff >= Math.max(50, Math.round(listing.nightPriceCents * 0.02))) {
        pushRow(
          FIELD_NIGHT_PRICE_CENTS,
          String(listing.nightPriceCents),
          String(priceFix.proposedNightPriceCents),
          priceFix.reason,
          priceFix.confidenceScore
        );
      }
    }

    if (rows.length > 0) {
      await prisma.listingOptimizationSuggestion.createMany({ data: rows });
    }

    if (settings.mode === "safe_autopilot") {
      await applySafeFixesForListing({
        listingId: listing.id,
        runId: run.id,
        performedByUserId: input.performedByUserId,
      });
    }

    await prisma.listingOptimizationRun.update({
      where: { id: run.id },
      data: { status: "completed", summary: summaryText.slice(0, 8000) },
    });

    return { runId: run.id, summary: summaryText };
  } catch (e) {
    await prisma.listingOptimizationRun.update({
      where: { id: run.id },
      data: {
        status: "failed",
        summary: e instanceof Error ? e.message.slice(0, 2000) : "failed",
      },
    });
    throw e;
  }
}
