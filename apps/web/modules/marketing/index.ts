export {
  generateMarketingCopy,
  generateMarketingCreatives,
  type MarketingGeneratorInput,
  type MarketingGeneratorOutput,
  type MarketingCreativeBlocks,
  type MarketingTarget,
} from "./marketing-generator.service";

export * from "./marketing.types";
export * from "./marketing-content.service";
export * from "./marketing-scheduler.service";
export * from "./marketing-distribution.service";
export * from "./marketing-performance.service";
export * from "./marketing-strategy.service";
export * from "./marketing-dashboard.service";
export * from "./marketing-admin-actions.service";

export { luxuryBlackGoldTemplate } from "./templates/luxury-black-gold";
export { minimalModernTemplate } from "./templates/minimal-modern";
export { investorFocusedTemplate } from "./templates/investor-focused";
export { airbnbStyleTemplate } from "./templates/airbnb-style";
export {
  buildFacebookShareUrl,
  buildLinkedInShareUrl,
  downloadTextFile,
  shareNativeOrFallback,
  instagramShareHint,
} from "./export-share";
