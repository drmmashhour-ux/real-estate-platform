import { prisma } from "@/lib/db";
import { readUseSeededDemoDataFlag } from "./demoConfig";
import { DEMO_PROPERTY_SLUGS, INVESTOR_DEMO_IDS } from "./demoIds";

function useSeededDemoData(): boolean {
  return readUseSeededDemoDataFlag();
}

export type DemoListingKind = "bnhub" | "resale";

export type DemoListingCard = {
  id: string;
  kind: DemoListingKind;
  title: string;
  subtitle?: string;
  location: string;
  priceLabel: string;
  imageUrl: string;
  badges: string[];
  beds?: number;
  baths?: number;
  guests?: number;
};

export type DemoPropertyDetail = DemoListingCard & {
  description: string;
  trustLine: string;
  publicPath?: string;
};

export type DemoConversationPreview = {
  channel: string;
  preview: string;
  from: string;
  at: string;
};

export type DemoCrmLeadPreview = {
  name: string;
  email: string;
  stage: string;
  score: number;
  aiTier: string;
  nextAction: string;
  source: string;
};

export type DemoRevenuePreview = {
  label: string;
  amountLabel: string;
  detail: string;
  isSimulated: boolean;
}[];

export type DemoMetricsSnapshot = {
  dataSourceLabel: string;
  bookingsCount: number;
  inquiriesCount: number;
  revenueLabel: string;
  growthNote: string;
  monetizationLines: string[];
};

const HERO_STAY =
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80";
const HERO_HOME =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80";

const FALLBACK_BNHUB_CARD: DemoListingCard = {
  id: DEMO_PROPERTY_SLUGS.bnhub,
  kind: "bnhub",
  title: "Skyline Loft — Investor Demo Stay",
  subtitle: "Entire place · Instant book ready",
  location: "Montréal, QC",
  priceLabel: "$289 / night",
  imageUrl: HERO_STAY,
  badges: ["BNHub", "Published", "Trust: verified host flow"],
  beds: 2,
  baths: 1,
  guests: 4,
};

const FALLBACK_RESALE_CARD: DemoListingCard = {
  id: DEMO_PROPERTY_SLUGS.resale,
  kind: "resale",
  title: "Plateau Townhome — Investor Demo Listing",
  subtitle: "Single-family · Platform broker available",
  location: "Montréal, QC",
  priceLabel: "$925,000",
  imageUrl: HERO_HOME,
  badges: ["Sale", "CRM lead path", "Premium placement ready"],
  beds: 3,
  baths: 2,
};

async function tryPrisma<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

function mapBnhubToCard(row: {
  id: string;
  title: string;
  city: string;
  region: string | null;
  country: string;
  nightPriceCents: number;
  currency: string;
  beds: number;
  baths: number;
  maxGuests: number;
  listingCode: string;
}): DemoListingCard {
  const nightly = row.nightPriceCents / 100;
  return {
    id: row.id,
    kind: "bnhub",
    title: row.title,
    location: [row.city, row.region, row.country].filter(Boolean).join(", "),
    priceLabel: `${row.currency === "USD" ? "$" : row.currency + " "}${nightly.toFixed(0)} / night`,
    imageUrl: HERO_STAY,
    badges: ["BNHub", row.listingCode, "Live data"],
    beds: row.beds,
    baths: row.baths,
    guests: row.maxGuests,
  };
}

function mapFsboToCard(row: {
  id: string;
  title: string;
  city: string;
  region: string | null;
  country: string;
  priceCents: number;
  bedrooms: number | null;
  bathrooms: number | null;
  listingCode: string | null;
}): DemoListingCard {
  const price = row.priceCents / 100;
  return {
    id: row.id,
    kind: "resale",
    title: row.title,
    location: [row.city, row.region, row.country].filter(Boolean).join(", "),
    priceLabel: `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    imageUrl: HERO_HOME,
    badges: ["Sale", row.listingCode ?? "FSBO", "Live data"],
    beds: row.bedrooms ?? undefined,
    baths: row.bathrooms ?? undefined,
  };
}

const demoBnhubWhere = {
  OR: [
    { id: INVESTOR_DEMO_IDS.BNHUB_LISTING },
    { listingCode: INVESTOR_DEMO_IDS.BNHUB_LISTING_CODE },
  ],
};

const demoResaleWhere = {
  OR: [
    { id: INVESTOR_DEMO_IDS.FSBO_LISTING },
    { listingCode: INVESTOR_DEMO_IDS.FSBO_LISTING_CODE },
  ],
};

/** Featured cards — only investor seed rows (LST-INVDEMO1 / LST-INVDEMO2); never random production listings. */
export async function getDemoFeaturedListings(): Promise<{
  bnhub: DemoListingCard;
  resale: DemoListingCard;
  source: "database" | "fallback";
}> {
  const bnhubDb = await tryPrisma(() =>
    prisma.shortTermListing.findFirst({
      where: demoBnhubWhere,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        city: true,
        region: true,
        country: true,
        nightPriceCents: true,
        currency: true,
        beds: true,
        baths: true,
        maxGuests: true,
        listingCode: true,
      },
    }),
  );

  const resaleDb = await tryPrisma(() =>
    prisma.fsboListing.findFirst({
      where: demoResaleWhere,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        city: true,
        region: true,
        country: true,
        priceCents: true,
        bedrooms: true,
        bathrooms: true,
        listingCode: true,
      },
    }),
  );

  const bnhub = bnhubDb ? mapBnhubToCard(bnhubDb) : FALLBACK_BNHUB_CARD;
  const resale = resaleDb ? mapFsboToCard(resaleDb) : FALLBACK_RESALE_CARD;

  const source: "database" | "fallback" =
    bnhubDb && resaleDb ? "database" : "fallback";

  return { bnhub, resale, source };
}

export async function getDemoBnhubListing(): Promise<DemoPropertyDetail> {
  const { bnhub } = await getDemoFeaturedListings();
  return {
    ...bnhub,
    description:
      "Investor demo narrative: guests discover BNHub stays with clear pricing, house rules, and a booking path that captures payment and commission. Seeded listing LST-INVDEMO1 when `pnpm seed:demo:investor` has run.",
    trustLine: "Host verified · Guest protection policy · Platform-managed payout",
    publicPath: bnhub.id !== DEMO_PROPERTY_SLUGS.bnhub ? `/bnhub/${bnhub.id}` : undefined,
  };
}

export async function getDemoRealEstateListing(): Promise<DemoPropertyDetail> {
  const { resale } = await getDemoFeaturedListings();
  return {
    ...resale,
    description:
      "Investor demo narrative: buyers route inquiries into LECIPM CRM — broker matching, platform broker assist, and document flow. Listing detail mirrors production FSBO / broker inventory.",
    trustLine: "Seller declaration · AI disclosure review · Optional platform broker",
    publicPath:
      resale.id !== DEMO_PROPERTY_SLUGS.resale
        ? `/buy?listing=${encodeURIComponent(resale.id)}`
        : undefined,
  };
}

/**
 * Resolve `/demo/property/[id]` — only slugs `bnhub` / `resale` or exact seeded ids/codes.
 * No arbitrary production listing ids (keeps investor path deterministic).
 */
export async function getDemoPropertyByRouteId(routeId: string): Promise<DemoPropertyDetail | null> {
  const raw = routeId.trim();
  const id = raw.toLowerCase();
  if (id === DEMO_PROPERTY_SLUGS.bnhub) return getDemoBnhubListing();
  if (id === DEMO_PROPERTY_SLUGS.resale) return getDemoRealEstateListing();
  if (raw === INVESTOR_DEMO_IDS.BNHUB_LISTING || raw === INVESTOR_DEMO_IDS.BNHUB_LISTING_CODE) {
    return getDemoBnhubListing();
  }
  if (raw === INVESTOR_DEMO_IDS.FSBO_LISTING || raw === INVESTOR_DEMO_IDS.FSBO_LISTING_CODE) {
    return getDemoRealEstateListing();
  }
  return null;
}

export async function getDemoConversationPreview(): Promise<DemoConversationPreview> {
  const lead = await tryPrisma(() =>
    prisma.lead.findFirst({
      where: useSeededDemoData() ? { id: INVESTOR_DEMO_IDS.CRM_LEAD } : undefined,
      orderBy: { createdAt: "desc" },
      select: { name: true, message: true, createdAt: true },
    }),
  );
  if (lead) {
    return {
      channel: "In-app thread / email bridge",
      preview: lead.message.slice(0, 160) + (lead.message.length > 160 ? "…" : ""),
      from: lead.name,
      at: lead.createdAt.toISOString(),
    };
  }
  return {
    channel: "In-app thread",
    preview:
      "Hi — we’d like a showing this weekend and we’re pre-approved. Can your platform broker join the visit?",
    from: "Jordan (buyer)",
    at: new Date().toISOString(),
  };
}

export async function getDemoCrmLeadPreview(): Promise<DemoCrmLeadPreview> {
  const row = await tryPrisma(() =>
    prisma.lead.findFirst({
      where: { id: INVESTOR_DEMO_IDS.CRM_LEAD },
      orderBy: { createdAt: "desc" },
      select: {
        name: true,
        email: true,
        pipelineStage: true,
        score: true,
        aiTier: true,
        leadSource: true,
      },
    }),
  );
  if (row) {
    return {
      name: row.name,
      email: row.email,
      stage: row.pipelineStage,
      score: row.score,
      aiTier: row.aiTier ?? "warm",
      nextAction: "Schedule showing + attach mortgage pre-approval to deal room",
      source: row.leadSource ?? "listing",
    };
  }
  return {
    name: "Jordan Lee",
    email: "jordan.lee@example.com",
    stage: "qualified",
    score: 82,
    aiTier: "hot",
    nextAction: "AI suggests: send calendar holds + platform broker intro",
    source: "demo",
  };
}

export async function getDemoRevenuePreview(): Promise<DemoRevenuePreview> {
  const demoBooking = await tryPrisma(() =>
    prisma.booking.findUnique({
      where: { id: INVESTOR_DEMO_IDS.BOOKING },
      select: { totalCents: true, guestFeeCents: true },
    }),
  );
  const demoLead = await tryPrisma(() =>
    prisma.lead.findUnique({
      where: { id: INVESTOR_DEMO_IDS.CRM_LEAD },
      select: { id: true },
    }),
  );

  return [
    {
      label: "BNHub — demo booking (seed)",
      amountLabel: demoBooking
        ? `Total $${(demoBooking.totalCents / 100).toFixed(2)} · fees $${(demoBooking.guestFeeCents / 100).toFixed(2)}`
        : "Run pnpm seed:demo:investor",
      detail: "Commission + guest service fee on confirmed stays (illustrative row)",
      isSimulated: !demoBooking,
    },
    {
      label: "Broker / buyer — demo CRM lead",
      amountLabel: demoLead ? "Lead inv-demo-lead-001 in CRM" : "Run pnpm seed:demo:investor",
      detail: "Unlock + routing + assisted close",
      isSimulated: !demoLead,
    },
    {
      label: "Premium listings & placement",
      amountLabel: "SKU-based",
      detail: "Featured placement on discovery surfaces",
      isSimulated: true,
    },
  ];
}

export async function getDemoMetricsSnapshot(): Promise<DemoMetricsSnapshot> {
  const [bookingsCount, inquiriesCount, { source }, demoSeedBooking, demoSeedLead] = await Promise.all([
    tryPrisma(() => prisma.booking.count()),
    tryPrisma(() => prisma.lead.count()),
    getDemoFeaturedListings(),
    tryPrisma(() =>
      prisma.booking.findUnique({
        where: { id: INVESTOR_DEMO_IDS.BOOKING },
        select: { id: true },
      }),
    ),
    tryPrisma(() =>
      prisma.lead.findUnique({
        where: { id: INVESTOR_DEMO_IDS.CRM_LEAD },
        select: { id: true },
      }),
    ),
  ]);

  const bc = bookingsCount ?? 0;
  const ic = inquiriesCount ?? 0;
  const seededListings = source === "database";

  return {
    dataSourceLabel: seededListings
      ? `Investor demo — seeded listings ${INVESTOR_DEMO_IDS.BNHUB_LISTING_CODE} & ${INVESTOR_DEMO_IDS.FSBO_LISTING_CODE} (deterministic)`
      : "Static fallback cards — run pnpm seed:demo:investor for full seeded DB rows",
    bookingsCount: bc,
    inquiriesCount: ic,
    revenueLabel:
      demoSeedBooking && demoSeedLead
        ? "Demo booking + CRM lead rows present (inv-demo ids)"
        : "Seed demo data for inv-demo booking/lead rows",
    growthNote:
      "Platform-wide counts above are real DB totals; investor narrative uses LST-INVDEMO* rows only. No fabricated P&L.",
    monetizationLines: [
      "Booking take-rate on BNHub nights",
      "Broker lead unlock + assisted transaction fees",
      "Premium listing & placement",
    ],
  };
}

export async function getDemoBookingPreview() {
  const listing = await getDemoBnhubListing();
  const nights = 3;
  const nightly = 289;
  const cleaning = 85;
  const subtotal = nightly * nights;
  const serviceFee = Math.round(subtotal * 0.12);
  const total = subtotal + cleaning + serviceFee;

  const bookingRow = await tryPrisma(() =>
    prisma.booking.findUnique({
      where: { id: INVESTOR_DEMO_IDS.BOOKING },
      select: {
        id: true,
        confirmationCode: true,
        status: true,
        nights: true,
        totalCents: true,
        checkIn: true,
        checkOut: true,
      },
    }),
  );

  return {
    listing,
    checkIn: "2026-05-08",
    checkOut: "2026-05-11",
    nights,
    nightly,
    cleaning,
    subtotal,
    serviceFee,
    total,
    stripeNote:
      "Stripe Connect: guest charge → platform fee → host payout (preview only on this demo page — no charge).",
    bookingRecord: bookingRow
      ? {
          id: bookingRow.id,
          code: bookingRow.confirmationCode ?? "—",
          status: String(bookingRow.status),
          totalLabel: `$${(bookingRow.totalCents / 100).toFixed(2)}`,
        }
      : {
          id: "demo-preview",
          code: "BNH-DEMO",
          status: "CONFIRMED (illustrative)",
          totalLabel: `$${total}`,
        },
  };
}
