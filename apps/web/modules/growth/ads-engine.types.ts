export type AdPlatform = "facebook" | "google";

export type AdIntent = "buyer" | "seller" | "investor";

export type AdDraft = {
  id: string;
  platform: AdPlatform;
  title: string;
  description: string;
  targeting: string[];
  intent: AdIntent;
};
