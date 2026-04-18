export {
  generateMarketingCopy,
  generateMarketingCreatives,
  type MarketingGeneratorInput,
  type MarketingGeneratorOutput,
  type MarketingCreativeBlocks,
  type MarketingTarget,
} from "./marketing-generator.service";

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
