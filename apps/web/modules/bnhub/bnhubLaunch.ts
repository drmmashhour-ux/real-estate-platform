/**
 * BNHub launch — seed listings, quality bar, and admin promotions.
 * Host quick path: `POST /api/bnhub/host/quick-listing`. Admin seed: `POST /api/admin/bnhub-launch/listing`.
 */

export {
  applyBnhubLaunchPromotionFlags,
  createQuickBnhubListingRecord,
  loadBnhubLaunchDashboardRows,
  type CreateQuickBnhubListingInput,
} from "@/lib/bnhub/bnhub-launch-service";

export {
  BNHUB_LAUNCH_MIN_AMENITIES,
  BNHUB_LAUNCH_MIN_DESCRIPTION,
  BNHUB_LAUNCH_MIN_PHOTOS,
  BNHUB_LAUNCH_TAG_NEW,
  BNHUB_LAUNCH_TAG_SPECIAL,
  bnhubLaunchBadgesFromTags,
  launchTagsFromFlags,
  mergeExperienceTags,
  parseAmenitiesList,
  parsePhotoUrls,
  validateBnhubLaunchListingQuality,
  type LaunchQualityResult,
} from "@/lib/bnhub/bnhub-launch-quality";
