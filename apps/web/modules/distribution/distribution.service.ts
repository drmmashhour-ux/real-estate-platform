import type { PrismaClient } from "@prisma/client";

import { CENTRIS_PLATFORM, requestCentrisPublishPlaceholder } from "./centris.service";
import { distributionLog } from "./log";

export type DistributionChannel = "LECIPM" | "CENTRIS";

export function resolveLeadDistributionChannel(args: {
  requestedChannel?: string | null;
  centrisRow?: { status: string } | null;
}): DistributionChannel {
  const req = (args.requestedChannel || "").toUpperCase();
  if (req === "CENTRIS" && args.centrisRow?.status === "SYNCED") {
    return "CENTRIS";
  }
  return "LECIPM";
}

/**
 * Toggle Centris intent: creates/updates ExternalListing or removes when disabled.
 */
export async function setCentrisDistributionIntent(args: {
  prisma: PrismaClient;
  listingId: string;
  enabled: boolean;
}) {
  if (!args.enabled) {
    await args.prisma.externalListing.deleteMany({
      where: { listingId: args.listingId, platform: CENTRIS_PLATFORM },
    });
    distributionLog("centris_intent_disabled", { listingId: args.listingId });
    return { enabled: false as const };
  }

  await args.prisma.externalListing.upsert({
    where: {
      listingId_platform: { listingId: args.listingId, platform: CENTRIS_PLATFORM },
    },
    create: {
      listingId: args.listingId,
      platform: CENTRIS_PLATFORM,
      status: "PENDING",
      externalId: null,
      lastSyncAt: null,
    },
    update: {
      status: "PENDING",
      errorMessage: null,
    },
  });

  await requestCentrisPublishPlaceholder({
    prisma: args.prisma,
    listingId: args.listingId,
  });

  distributionLog("centris_intent_enabled", { listingId: args.listingId });
  return { enabled: true as const };
}
