import type { ListingAutopilotMode } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function getOrCreateListingAutopilotSettings(ownerUserId: string) {
  return prisma.listingAutopilotSetting.upsert({
    where: { ownerUserId },
    create: { ownerUserId },
    update: {},
  });
}

export async function updateListingAutopilotSettings(
  ownerUserId: string,
  data: Partial<{
    mode: ListingAutopilotMode;
    autoFixTitles: boolean;
    autoFixDescriptions: boolean;
    autoReorderPhotos: boolean;
    autoGenerateContent: boolean;
    allowPriceSuggestions: boolean;
  }>
) {
  await getOrCreateListingAutopilotSettings(ownerUserId);
  return prisma.listingAutopilotSetting.update({
    where: { ownerUserId },
    data,
  });
}
