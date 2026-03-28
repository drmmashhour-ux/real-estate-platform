/**
 * Step 0 — Trust / fraud data map (actual Prisma entities in this repo).
 * Used by LECIPM rule engine; not exposed to guests.
 *
 * - Users: `User` (+ `IdentityVerification`, emailVerifiedAt)
 * - Listings: `ShortTermListing` (address, city, region, lat/lng, nightPriceCents, photos JSON,
 *   `BnhubListingPhoto`, verificationStatus, listingVerificationStatus, houseRules, disclosures)
 * - Bookings: `Booking` (status, checkIn/checkOut, guestId, listingId, payment / BnhubReservationPayment)
 * - Reviews: `Review` (ratings, comment, guestId, listingId, bookingId unique, moderationHeld, spamScore)
 * - Host performance: `HostPerformance` (cancellationRate, disputeRate, score, …)
 * - Media: listing `photos` JSON + `BnhubListingPhoto`; FSBO uses `FsboListing.images`
 * - Legacy / parallel fraud: `FraudSignal`, `FraudAlert`, `FraudScore`, `BnhubFraudFlag`,
 *   `ListingInvestigation`, `PropertyFraudScore`, `BnhubFraudCheck`, etc.
 * - New LECIPM tables: `FraudRiskScore`, `FraudFlag`, `FraudReviewQueue`, `FraudActionLog`
 */
export {};
