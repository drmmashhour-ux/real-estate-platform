import { prisma } from "@/lib/db";
import { AppointmentStatus, BookingStatus, ListingStatus } from "@prisma/client";
import type { HubJourneyContext } from "./hub-journey.types";
import type { HubKey } from "./hub-journey.types";
import { bumpJourneyMetric, logJourneyMonitoringEvent } from "./hub-journey-monitoring.service";

export type BuildHubJourneyContextArgs = {
  hub: HubKey;
  userId: string | null;
  locale: string;
  country: string;
};

/**
 * Loads read-only signals for journey resolution. Never throws — returns partial context on failure.
 */
export async function buildHubJourneyContextFromDb(
  args: BuildHubJourneyContextArgs,
): Promise<HubJourneyContext> {
  const base: HubJourneyContext = {
    locale: args.locale,
    country: args.country,
    userId: args.userId,
  };

  try {
    if (!args.userId) {
      return base;
    }

    const uid = args.userId;

    switch (args.hub) {
      case "buyer": {
        const [user, viewCount, savedCount, requests, mortgageCount, contactCount, apptCount] =
          await Promise.all([
            prisma.user.findUnique({
              where: { id: uid },
              select: { marketplacePersona: true },
            }),
            prisma.buyerListingView.count({ where: { userId: uid } }),
            prisma.buyerSavedListing.count({ where: { userId: uid } }),
            prisma.buyerRequest.count({ where: { userId: uid } }),
            prisma.mortgageRequest.count({ where: { userId: uid } }),
            prisma.immoContactLog.count({
              where: {
                userId: uid,
                listingId: { not: null },
              },
            }),
            prisma.appointment.count({
              where: {
                clientUserId: uid,
                status: {
                  notIn: [
                    AppointmentStatus.CANCELLED,
                    AppointmentStatus.COMPLETED,
                    AppointmentStatus.NO_SHOW,
                  ],
                },
              },
            }),
          ]);

        const persona = user?.marketplacePersona as { city?: string } | null | undefined;
        return {
          ...base,
          buyerCitySelected: Boolean(persona?.city && String(persona.city).trim().length > 0),
          buyerBudgetSet: mortgageCount > 0,
          buyerBrowseSessions: viewCount,
          buyerShortlistCount: savedCount,
          buyerContactedSeller: contactCount > 0,
          buyerViewingScheduled: apptCount > 0,
          buyerOfferStarted: requests > 0,
        };
      }
      case "seller": {
        const listings = await prisma.fsboListing.findMany({
          where: { ownerId: uid },
          select: {
            status: true,
            images: true,
            description: true,
          },
        });
        const active = listings.filter((l) => l.status === "ACTIVE").length;
        const maxPhotos = listings.reduce((m, l) => Math.max(m, l.images?.length ?? 0), 0);
        const metrics = await prisma.fsboListingMetrics.findMany({
          where: { fsboListing: { ownerId: uid } },
          select: { priceSuggestedCents: true },
          take: 8,
        });
        const inquiryCount = await prisma.fsboLead.count({
          where: { fsboListing: { ownerId: uid } },
        });
        let sellerCertificateLocationSatisfied = true;
        try {
          const { sellerCertificateLocationJourneySatisfied } = await import(
            "@/modules/broker-ai/certificate-of-location/certificate-of-location-journey.service",
          );
          sellerCertificateLocationSatisfied = await sellerCertificateLocationJourneySatisfied(uid);
        } catch {
          sellerCertificateLocationSatisfied = true;
        }
        return {
          ...base,
          sellerListingStarted: listings.length > 0,
          sellerDetailsComplete: listings.some((l) => l.description && l.description.trim().length > 40),
          sellerPhotosCount: maxPhotos,
          sellerPricingViewed: metrics.some((m) => m.priceSuggestedCents != null),
          sellerPublished: active > 0,
          sellerInquiryCount: inquiryCount,
          sellerDealStage: listings.some((l) => l.status === "PENDING_VERIFICATION" || l.status === "ACTIVE"),
          sellerCertificateLocationSatisfied,
        };
      }
      case "rent": {
        const [appCount, browseViews] = await Promise.all([
          prisma.rentalApplication.count({ where: { tenantId: uid } }),
          prisma.buyerListingView.count({ where: { userId: uid } }),
        ]);
        return {
          ...base,
          rentCriteriaSet: browseViews > 0 || appCount > 0,
          rentShortlistCount: appCount,
          rentContacted: appCount > 0,
          rentVisitScheduled: false,
          rentApplicationStarted: appCount > 0,
        };
      }
      case "landlord": {
        const listings = await prisma.rentalListing.findMany({
          where: { landlordId: uid },
          select: { status: true },
        });
        const active = listings.filter((l) => l.status === "ACTIVE").length;
        const hasAny = listings.length > 0;
        const apps = await prisma.rentalApplication.count({
          where: { listing: { landlordId: uid } },
        });
        return {
          ...base,
          landlordHasRentalListing: hasAny,
          landlordListingDraft: listings.some((l) => l.status === "DRAFT"),
          landlordPhotosCount: 0,
          landlordPublished: active > 0,
          landlordLeadCount: apps,
          landlordResponded: apps > 0,
        };
      }
      case "bnhub_guest": {
        const [bookingCount, paidCount, favCount] = await Promise.all([
          prisma.booking.count({ where: { guestId: uid } }),
          prisma.booking.count({
            where: {
              guestId: uid,
              status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
            },
          }),
          prisma.bnhubGuestFavorite.count({ where: { userId: uid } }).catch(() => 0),
        ]);
        return {
          ...base,
          bnGuestSearchDone: bookingCount > 0 || favCount > 0,
          bnGuestCompared: favCount > 1,
          bnGuestOpenedDetail: favCount > 0,
          bnGuestBookingStarted: bookingCount > 0,
          bnGuestBookingPaid: paidCount > 0,
          bnGuestStayActive: paidCount > 0,
        };
      }
      case "bnhub_host": {
        const host = await prisma.bnhubHost.findUnique({
          where: { userId: uid },
          select: { id: true },
        });
        const listings = host
          ? await prisma.shortTermListing.findMany({
              where: { ownerId: uid },
              select: {
                listingStatus: true,
                photos: true,
                amenities: true,
                listingPhotos: { select: { id: true }, take: 1 },
              },
            })
          : [];
        const published = listings.filter((l) => l.listingStatus === ListingStatus.PUBLISHED).length;
        const photoCount = listings.reduce((m, l) => {
          const jsonLen = Array.isArray(l.photos) ? (l.photos as unknown[]).length : 0;
          const relLen = l.listingPhotos?.length ?? 0;
          return Math.max(m, jsonLen + relLen);
        }, 0);
        const bookingCount = await prisma.booking.count({
          where: { listing: { ownerId: uid } },
        });
        const lowConversion =
          published > 0 &&
          bookingCount === 0 &&
          listings.some((l) => {
            const am = l.amenities as unknown;
            return !am || (Array.isArray(am) && am.length < 3);
          });
        return {
          ...base,
          bnHostListingCreated: listings.length > 0,
          bnHostPhotosCount: photoCount,
          bnHostPublished: published > 0,
          bnHostBookingCount: bookingCount,
          bnHostLowConversion: lowConversion,
        };
      }
      case "broker": {
        const [unlocked, contacted, pipeline, closed] = await Promise.all([
          prisma.lead.count({ where: { contactUnlockedByUserId: uid } }),
          prisma.lead.count({
            where: {
              contactUnlockedByUserId: uid,
              OR: [{ lastFollowUpAt: { not: null } }, { pipelineStatus: { not: "new" } }],
            },
          }),
          prisma.lead.count({
            where: {
              introducedByBrokerId: uid,
              pipelineStage: { notIn: ["new", "lost"] },
            },
          }),
          prisma.lead.count({
            where: {
              introducedByBrokerId: uid,
              pipelineStage: { in: ["won", "negotiation"] },
            },
          }),
        ]);
        const profile = await prisma.user.findUnique({
          where: { id: uid },
          select: { name: true, phone: true },
        });
        let brokerCertificateLocationSatisfied = true;
        try {
          const { brokerCertificateLocationJourneySatisfied } = await import(
            "@/modules/broker-ai/certificate-of-location/certificate-of-location-journey.service",
          );
          brokerCertificateLocationSatisfied = await brokerCertificateLocationJourneySatisfied(uid, unlocked);
        } catch {
          brokerCertificateLocationSatisfied = true;
        }
        return {
          ...base,
          brokerProfileComplete: Boolean(profile?.name?.trim()),
          brokerLeadsUnlocked: unlocked,
          brokerLeadsContacted: contacted,
          brokerPipelineMoved: pipeline > 0,
          brokerClosedCount: closed,
          brokerCertificateLocationSatisfied,
        };
      }
      case "investor": {
        const [profile, watchItems, scenarios] = await Promise.all([
          prisma.investorProfile.findFirst({
            where: { userId: uid },
            select: {
              strategy: true,
              targetCities: true,
              budgetCents: true,
            },
          }),
          prisma.dealWatchlistItem.count({
            where: { watchlist: { ownerId: uid } },
          }),
          prisma.portfolioScenario.count({ where: { userId: uid } }),
        ]);
        return {
          ...base,
          investorGoalsSet: Boolean(
            profile &&
              (profile.strategy ||
                (profile.targetCities?.length ?? 0) > 0 ||
                (profile.budgetCents != null && profile.budgetCents > 0)),
          ),
          investorBrowseCount: watchItems > 0 ? 1 : 0,
          investorInsightsViewed: scenarios > 0,
          investorShortlistCount: watchItems,
          investorAnalysisRequested: scenarios > 0,
          investorCompared: scenarios > 1,
        };
      }
      case "admin":
      default:
        return base;
    }
  } catch (e) {
    bumpJourneyMetric("missingDataWarnings");
    logJourneyMonitoringEvent("warn", { hub: args.hub, err: String(e) });
    return base;
  }
}
