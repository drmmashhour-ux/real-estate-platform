/**
 * SYBNB-28 — Public social proof for brand presence (listings + tracked engagement, non-demo).
 */

import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { SYBNB_ANALYTICS_EVENT_TYPES } from "@/lib/sybnb/sybnb-analytics-events";
import { syriaPropertyExcludeInvestorDemoWhere } from "@/lib/sybnb/demo-metrics-filter";
import { getSybnbPublicListingCount } from "@/lib/sybnb/sybnb-public-data";

function sybnbEventListingNonDemoOrUnsetWhere(): Prisma.SybnbEventWhereInput {
  return {
    OR: [{ listingId: null }, { listing: syriaPropertyExcludeInvestorDemoWhere() }],
  };
}

function sybnbNonDemoActorWhere(): Prisma.SybnbEventWhereInput {
  return {
    OR: [
      { userId: null },
      {
        user: {
          NOT: [{ email: { startsWith: "DEMO_" } }, { email: { contains: "investor.sybnb.demo" } }],
        },
      },
    ],
  };
}

export type SybnbBrandSocialProof = {
  listings: number;
  /** Listing views + booking-request events (7d UTC), non-demo. */
  activity7d: number;
  /** Contact taps WhatsApp/phone (7d UTC), non-demo. */
  conversations7d: number;
};

/** Rolling last 7 days UTC — aligns with weekly social momentum narrative. */
export async function getSybnbBrandSocialProof(): Promise<SybnbBrandSocialProof> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 7);
  since.setUTCHours(0, 0, 0, 0);

  const eventBase: Prisma.SybnbEventWhereInput = {
    createdAt: { gte: since },
    AND: [sybnbEventListingNonDemoOrUnsetWhere(), sybnbNonDemoActorWhere()],
  };

  try {
    const [listings, views, reqs, contacts] = await Promise.all([
      getSybnbPublicListingCount(),
      prisma.sybnbEvent.count({
        where: { ...eventBase, type: SYBNB_ANALYTICS_EVENT_TYPES.LISTING_VIEW },
      }),
      prisma.sybnbEvent.count({
        where: { ...eventBase, type: SYBNB_ANALYTICS_EVENT_TYPES.BOOKING_REQUEST },
      }),
      prisma.sybnbEvent.count({
        where: {
          ...eventBase,
          type: {
            in: [
              SYBNB_ANALYTICS_EVENT_TYPES.CONTACT_CLICK,
              SYBNB_ANALYTICS_EVENT_TYPES.HOTEL_CONTACT_CLICK,
              SYBNB_ANALYTICS_EVENT_TYPES.PHONE_REVEAL,
            ],
          },
        },
      }),
    ]);

    return {
      listings,
      activity7d: views + reqs,
      conversations7d: contacts,
    };
  } catch (e) {
    console.error("[SYBNB] getSybnbBrandSocialProof", e instanceof Error ? e.message : e);
    const listings = await getSybnbPublicListingCount();
    return { listings, activity7d: 0, conversations7d: 0 };
  }
}

export function getSybnbBrandSocialUrls(): { facebook: string | null; instagram: string | null } {
  const fb = process.env.NEXT_PUBLIC_SYBNB_FACEBOOK_URL?.trim() ?? "";
  const ig = process.env.NEXT_PUBLIC_SYBNB_INSTAGRAM_URL?.trim() ?? "";
  return {
    facebook: fb.startsWith("http") ? fb : null,
    instagram: ig.startsWith("http") ? ig : null,
  };
}
