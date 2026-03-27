import type { GrowthMarketingPlatform } from "@prisma/client";
import type { DraftPayload } from "@/src/modules/growth-automation/domain/growth-automation.types";

export type NormalizedPublishPayload = {
  platform: GrowthMarketingPlatform;
  text: string;
  title?: string;
  link?: string;
  imageUrl?: string;
  videoUrl?: string;
  raw: DraftPayload;
};
