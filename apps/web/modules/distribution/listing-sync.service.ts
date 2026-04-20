/**
 * Updates ExternalListing rows when an authorized upstream confirms syndication state.
 */

import type { PrismaClient } from "@prisma/client";

import { CENTRIS_PLATFORM } from "./centris.service";
import { distributionLog } from "./log";

export async function markCentrisSynced(args: {
  prisma: PrismaClient;
  listingId: string;
  externalId: string;
}) {
  await args.prisma.externalListing.upsert({
    where: {
      listingId_platform: { listingId: args.listingId, platform: CENTRIS_PLATFORM },
    },
    create: {
      listingId: args.listingId,
      platform: CENTRIS_PLATFORM,
      externalId: args.externalId,
      status: "SYNCED",
      lastSyncAt: new Date(),
      errorMessage: null,
    },
    update: {
      externalId: args.externalId,
      status: "SYNCED",
      lastSyncAt: new Date(),
      errorMessage: null,
    },
  });
  distributionLog("centris_marked_synced", { listingId: args.listingId });
}

export async function markCentrisError(args: {
  prisma: PrismaClient;
  listingId: string;
  message: string;
}) {
  await args.prisma.externalListing.upsert({
    where: {
      listingId_platform: { listingId: args.listingId, platform: CENTRIS_PLATFORM },
    },
    create: {
      listingId: args.listingId,
      platform: CENTRIS_PLATFORM,
      status: "ERROR",
      errorMessage: args.message,
      lastSyncAt: new Date(),
    },
    update: {
      status: "ERROR",
      errorMessage: args.message,
      lastSyncAt: new Date(),
    },
  });
  distributionLog("centris_marked_error", { listingId: args.listingId });
}
