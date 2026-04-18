export type SocialPlatform = "instagram_post" | "instagram_reel" | "tiktok" | "facebook" | "youtube_short" | "linkedin";

export type SocialContentPackage = {
  platform: SocialPlatform;
  hook: string;
  shortCaption: string;
  longCaption: string;
  cta: string;
  hashtags: string[];
  complianceNotes: string[];
  destinationPath?: string;
};
