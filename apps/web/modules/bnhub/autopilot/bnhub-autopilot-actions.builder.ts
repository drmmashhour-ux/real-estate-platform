/**
 * Builds up to 5 pending BNHub autopilot actions from mission control + host performance + guest conversion.
 */

import { prisma } from "@/lib/db";
import { buildBNHubMissionControl } from "@/modules/bnhub/mission-control/mission-control.service";
import { buildHostPerformanceSummary } from "@/modules/bnhub/host-performance/host-performance.service";
import { buildGuestConversionSummary } from "@/modules/bnhub/guest-conversion/guest-conversion.service";
import type { BNHubAutopilotAction, BNHubAutopilotPayload } from "./bnhub-autopilot.types";
import { clearPendingBnhubAutopilotActionsForListing, putBnhubAutopilotAction } from "./bnhub-autopilot-store.service";
import { recordBnhubAutopilotActionsBuilt } from "./bnhub-autopilot-monitoring.service";

function newId(): string {
  return `bnhub-ap-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function cap5<T>(arr: T[]): T[] {
  return arr.slice(0, 5);
}

/**
 * Generates suggested actions, registers them as **pending** in the in-memory store.
 */
export async function buildBNHubAutopilotActions(listingId: string): Promise<BNHubAutopilotAction[]> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      title: true,
      description: true,
      amenities: true,
      ownerId: true,
      photos: true,
      nightPriceCents: true,
    },
  });

  if (!listing) return [];

  clearPendingBnhubAutopilotActionsForListing(listingId);

  const [mc, guest, hostSummary] = await Promise.all([
    buildBNHubMissionControl(listingId),
    buildGuestConversionSummary(listingId),
    buildHostPerformanceSummary(listing.ownerId).catch(() => null),
  ]);

  const hostRow = hostSummary?.listings.find((l) => l.listingId === listingId);

  const actions: BNHubAutopilotAction[] = [];
  const createdAt = new Date().toISOString();

  const titleLen = (listing.title ?? "").trim().length;
  if (titleLen < 12 || mc.topRisks.some((r) => r.toLowerCase().includes("title"))) {
    const payload: BNHubAutopilotPayload = {
      kind: "title",
      proposedTitle:
        titleLen < 12
          ? `${(listing.title ?? "Stay").trim() || "Comfortable stay"} · ${listing.nightPriceCents ? `from ${(listing.nightPriceCents / 100).toFixed(0)}/night` : "book now"}`
          : (listing.title ?? "").trim(),
      reason: "Title is short or mission control flagged discovery mismatch (advisory draft).",
    };
    actions.push({
      id: newId(),
      listingId,
      type: "IMPROVE_TITLE",
      payload,
      status: "pending",
      reversible: true,
      createdAt,
      why: "Strengthen the headline for search and map cards — review before approving.",
      impact: "high",
    });
  }

  const descLen = (listing.description ?? "").trim().length;
  if (descLen < 80 || (hostRow?.weakSignals.some((w) => w.includes("description")) ?? false)) {
    const payload: BNHubAutopilotPayload = {
      kind: "description",
      proposedDescription:
        (listing.description ?? "").trim() +
        (descLen < 80
          ? "\n\nWe welcome remote workers and families. Message us for local tips — availability updates regularly."
          : ""),
      reason: "Description thin vs peers or host performance flagged content gap.",
    };
    actions.push({
      id: newId(),
      listingId,
      type: "IMPROVE_DESCRIPTION",
      payload,
      status: "pending",
      reversible: true,
      createdAt,
      why: "Expand unique details guests need before booking — editable draft.",
      impact: "medium",
    });
  }

  const amenCount = Array.isArray(listing.amenities) ? listing.amenities.length : 0;
  if (amenCount < 4 || mc.pricingSignal === "elevated_vs_cohort") {
    const append =
      amenCount < 4 ? ["Wifi", "Kitchen", "Heating", "Smoke alarm"] : ["Dedicated workspace"];
    const payload: BNHubAutopilotPayload = {
      kind: "amenities",
      appendAmenities: append,
      reason: "Amenity coverage is below typical competitive listings (suggested append).",
    };
    actions.push({
      id: newId(),
      listingId,
      type: "ADD_AMENITIES",
      payload,
      status: "pending",
      reversible: true,
      createdAt,
      why: "Merge-only append — duplicates are deduped on execution.",
      impact: "medium",
    });
  }

  const photoCount = Array.isArray(listing.photos) ? listing.photos.length : 0;
  if (photoCount < 3) {
    const payload: BNHubAutopilotPayload = {
      kind: "photo_suggestion",
      checklist: [
        "Wide living area shot",
        "Bedroom with natural light",
        "Kitchen or dining angle",
      ],
      reason: "Photo count is low — host uploads required (no auto image fetch).",
    };
    actions.push({
      id: newId(),
      listingId,
      type: "ADD_PHOTO_SUGGESTION",
      payload,
      status: "pending",
      reversible: false,
      createdAt,
      why: "Suggestion only — execution does not upload images.",
      impact: "high",
    });
  }

  if ((mc.trustScore ?? 0) < 45 || guest.status === "weak") {
    const payload: BNHubAutopilotPayload = {
      kind: "trust",
      steps: ["Prompt recent guests for reviews", "Complete verification badges where eligible"],
      reason: "Trust subscore or guest conversion is weak — manual trust work.",
    };
    actions.push({
      id: newId(),
      listingId,
      type: "TRUST_IMPROVEMENT",
      payload,
      status: "pending",
      reversible: false,
      createdAt,
      why: "Operational checklist — not auto-executed.",
      impact: "high",
    });
  }

  if (mc.pricingSignal === "elevated_vs_cohort" || mc.topRisks.some((r) => r.toLowerCase().includes("pric"))) {
    const payload: BNHubAutopilotPayload = {
      kind: "pricing",
      note: "Compare nightly rate to similar stays in your market; adjust manually if needed — no auto price change.",
      reason: "Pricing signal from mission control ranking subscores (advisory).",
    };
    actions.push({
      id: newId(),
      listingId,
      type: "PRICING_SUGGESTION",
      payload,
      status: "pending",
      reversible: false,
      createdAt,
      why: "Suggestion only — never auto-applies rates.",
      impact: "high",
    });
  }

  const capped = cap5(actions);
  for (const a of capped) {
    putBnhubAutopilotAction(a);
  }
  try {
    recordBnhubAutopilotActionsBuilt(capped.length);
  } catch {
    /* */
  }

  return capped;
}
