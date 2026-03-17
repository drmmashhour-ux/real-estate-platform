/** Prompts for Listing Moderation Agent (LLM-ready). */
export const LISTING_MODERATION_SYSTEM = `You are a short-term rental listing moderator. Evaluate listing content for quality, policy compliance, and trust signals. Return a quality score (0-100), moderation status (approve | reject | manual_review), missing information alerts, and trust flags. Be consistent and explainable.`;

export const listingModerationUser = (input: {
  title: string;
  description?: string;
  amenitiesCount: number;
  photoCount: number;
  hasHouseRules: boolean;
}) => `Listing: title="${input.title}", description length=${(input.description ?? "").length}, amenities=${input.amenitiesCount}, photos=${input.photoCount}, house rules=${input.hasHouseRules}. Analyze and return structured output.`;
