/**
 * DATA SOURCE MAP — ranking uses only persisted entities in this repo.
 *
 * BNHUB (listingType: "bnhub")
 * - ShortTermListing (`bnhub_listings`): id, city, region, nightPriceCents, maxGuests, propertyType, roomType,
 *   amenities (Json), photos (Json), description, verificationStatus, listingVerificationStatus, listingStatus,
 *   ownerId, createdAt, updatedAt, instantBookEnabled, houseRules, checkInInstructions, latitude/longitude
 * - Booking: status, listingId — completed stays for conversion
 * - Review + PropertyRatingAggregate: review quality / volume
 * - HostPerformance + HostBadge (hostId = listing.ownerId)
 * - Dispute: listingId — trust penalty
 * - BnhubGuestFavorite: listingId — saves
 * - AvailabilitySlot / isListingAvailable — date overlap (applied before ranking in search pipeline)
 *
 * Real estate / FSBO (listingType: "real_estate")
 * - FsboListing: id, city, priceCents, bedrooms, bathrooms, images[], description, status, moderationStatus,
 *   verification (FsboListingVerification), trustScore, riskScore, propertyType, createdAt, updatedAt, featuredUntil
 * - BuyerListingView: fsboListingId — detail views
 * - BuyerSavedListing: fsboListingId — saves
 * - FsboLead: listing engagement / conversion proxy
 *
 * CRM Listing (listingType: "lecipm_crm" — optional sparse profile)
 * - Listing: id, title, price, createdAt — used on buyer browse merge; fewer signals
 *
 * Behaviour telemetry (ranking feedback)
 * - RankingImpressionLog / RankingClickLog (this module)
 * - UserEvent (`user_events`) — growth funnel; not required for v1 listing-level engagement (FSBO uses BuyerListingView)
 *
 * Config
 * - RankingConfig (`ranking_configs`): weightsJson per listingType
 * - SearchRankingConfig — legacy BNHUB search weights; kept for backward compatibility when AI engine is off
 *
 * Executive
 * - ExecutiveRecommendation — anomalies surfaced via rankingExecutiveBridge + feedbackEngine
 */

export const RANKING_LISTING_TYPE_BNHUB = "bnhub" as const;
export const RANKING_LISTING_TYPE_REAL_ESTATE = "real_estate" as const;
export const RANKING_LISTING_TYPE_CRM = "lecipm_crm" as const;

export type RankingListingType =
  | typeof RANKING_LISTING_TYPE_BNHUB
  | typeof RANKING_LISTING_TYPE_REAL_ESTATE
  | typeof RANKING_LISTING_TYPE_CRM;
