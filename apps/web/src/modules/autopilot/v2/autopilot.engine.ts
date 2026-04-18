import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { intelligenceFlags } from "@/config/feature-flags";
import { getLecipmCoreAutopilotMode } from "@/src/modules/autopilot/autopilot.env";
import { resolveTriggersFromSignals, type FsboSignalInput } from "./autopilot.rules";
import { buildSuggestionsFromTriggers } from "./autopilot.actions";
import { prioritizeSuggestions } from "./autopilot.prioritize";
import type { AutopilotV2Trigger } from "./autopilot.types";
import { logInfo } from "@/lib/logger";

const MS_DAY = 86_400_000;

async function recentPendingDedupe(listingId: string, type: string): Promise<boolean> {
  const since = new Date(Date.now() - 72 * MS_DAY);
  const existing = await prisma.autopilotV2Suggestion.findFirst({
    where: { listingId, type, status: "pending", createdAt: { gte: since } },
    select: { id: true },
  });
  return Boolean(existing);
}

export async function runAutopilotV2ForListing(args: {
  listingId: string;
  eventHint?: string;
  explicitTriggers?: AutopilotV2Trigger[];
}): Promise<{ created: number; skippedReason?: string }> {
  if (!intelligenceFlags.autopilotV2) {
    return { created: 0, skippedReason: "feature_off" };
  }

  const mode = getLecipmCoreAutopilotMode();
  if (mode === "OFF") {
    return { created: 0, skippedReason: "mode_off" };
  }

  const row = await prisma.fsboListing.findUnique({
    where: { id: args.listingId },
    include: {
      _count: { select: { buyerListingViews: true, buyerSavedListings: true, leads: true } },
    },
  });
  if (!row) return { created: 0, skippedReason: "listing_not_found" };

  const daysSinceUpdate = (Date.now() - row.updatedAt.getTime()) / MS_DAY;
  const signal: FsboSignalInput = {
    viewCount: row._count.buyerListingViews,
    saveCount: row._count.buyerSavedListings,
    leadCount: row._count.leads,
    priceCents: row.priceCents,
    city: row.city,
    titleLen: row.title?.length ?? 0,
    descLen: row.description?.length ?? 0,
    imageCount: Array.isArray(row.images) ? row.images.length : 0,
    daysSinceUpdate,
  };

  const triggers =
    args.explicitTriggers?.length ?
      args.explicitTriggers
    : resolveTriggersFromSignals(args.eventHint, signal);

  if (triggers.length === 0) {
    return { created: 0, skippedReason: "no_triggers" };
  }

  const rawPayloads = buildSuggestionsFromTriggers(triggers, signal);
  const payloads = await prioritizeSuggestions(rawPayloads);
  let created = 0;

  for (const p of payloads) {
    if (await recentPendingDedupe(args.listingId, p.type)) continue;

    await prisma.autopilotV2Suggestion.create({
      data: {
        listingId: args.listingId,
        type: p.type,
        payload: p.suggestedChange as Prisma.InputJsonValue,
        confidence: p.confidence,
        impactEstimate: p.impactEstimate,
        explanation: p.explanation as Prisma.InputJsonValue,
        suggestedChange: p.suggestedChange as Prisma.InputJsonValue,
        autoApplicable: mode === "SAFE_AUTOPILOT" ? false : p.autoApplicable,
        status: "pending",
        trigger: triggers[0] ?? null,
      },
    });
    created += 1;
  }

  logInfo("autopilot_v2_run", { listingId: args.listingId, created, mode });
  return { created };
}

/** Fan-out from intelligence events — throttled to high-signal types (avoid spam on every view). */
export async function maybeRunAutopilotV2FromEvent(input: {
  type: string;
  listingId: string;
  userId?: string | null;
  payload?: Record<string, unknown>;
  eventId: string | null;
}): Promise<void> {
  if (!["listing_updated", "price_changed"].includes(input.type)) return;

  const hint = input.type === "listing_updated" ? "listing_updated" : "price_changed";

  await runAutopilotV2ForListing({ listingId: input.listingId, eventHint: hint });
}
