import type { MarketingPublishChannel } from "@prisma/client";
import type { MarketingPublishProvider } from "../types";
import { emailProviderPublish } from "./email-provider";
import { xProviderPublish } from "./x-provider";
import { linkedinProviderPublish } from "./linkedin-provider";
import { instagramProviderPublish } from "./instagram-provider";
import { tiktokProviderPublish } from "./tiktok-provider";

export function getMarketingPublishProvider(channel: MarketingPublishChannel): MarketingPublishProvider {
  switch (channel) {
    case "EMAIL":
      return emailProviderPublish;
    case "X":
      return xProviderPublish;
    case "LINKEDIN":
      return linkedinProviderPublish;
    case "INSTAGRAM":
      return instagramProviderPublish;
    case "TIKTOK":
      return tiktokProviderPublish;
    default:
      return emailProviderPublish;
  }
}
