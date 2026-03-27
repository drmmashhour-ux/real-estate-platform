import { prisma } from "@/lib/db";

export type BrowsePropertyCard = {
  id: string;
  title: string;
  price: string;
  meta: string;
  badge: string;
  tagColor: string;
  image: string;
  highlight: string;
  city: string;
  priceCents: number;
  propertyType: string;
};

const FALLBACK: BrowsePropertyCard[] = [
  {
    id: "mock-1",
    title: "Waterfront Villa, Palm District",
    price: "$1.2M",
    meta: "4 beds • 3.5 baths • 3,200 sqft",
    badge: "New",
    tagColor: "bg-emerald-500 text-slate-950",
    image: "https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=1200",
    highlight: "Prime coastal neighborhood • Private dock • Infinity pool",
    city: "Montreal",
    priceCents: 120_000_000,
    propertyType: "Condo",
  },
  {
    id: "mock-2",
    title: "City Center Investment Loft",
    price: "$680k",
    meta: "2 beds • 2 baths • 1,150 sqft",
    badge: "Featured",
    tagColor: "bg-slate-900/90 text-slate-100",
    image: "https://images.pexels.com/photos/439391/pexels-photo-439391.jpeg?auto=compress&cs=tinysrgb&w=1200",
    highlight: "Financial district • High rental demand • Concierge building",
    city: "Montreal",
    priceCents: 680_000_00,
    propertyType: "Condo",
  },
  {
    id: "mock-3",
    title: "Boutique Rental Portfolio (3 units)",
    price: "$920k",
    meta: "6 beds • 5 baths • 4,000 sqft total",
    badge: "High Yield",
    tagColor: "bg-emerald-500/90 text-slate-950",
    image: "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1200",
    highlight: "Stabilized multi‑family • Strong cash flow • Growth corridor",
    city: "Laval",
    priceCents: 920_000_00,
    propertyType: "Duplex",
  },
  {
    id: "mock-4",
    title: "Suburban Family Home, Green Oaks",
    price: "$540k",
    meta: "3 beds • 2.5 baths • 2,100 sqft",
    badge: "Family",
    tagColor: "bg-slate-800 text-slate-100",
    image: "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1200",
    highlight: "Quiet cul‑de‑sac • Top‑rated schools • Private backyard",
    city: "Longueuil",
    priceCents: 54_000_000,
    propertyType: "Duplex",
  },
  {
    id: "mock-5",
    title: "Luxury Penthouse, Skyline Tower",
    price: "$1.8M",
    meta: "3 beds • 3 baths • 2,400 sqft",
    badge: "Luxury",
    tagColor: "bg-purple-500 text-slate-50",
    image: "https://images.pexels.com/photos/439391/pexels-photo-439391.jpeg?auto=compress&cs=tinysrgb&w=1200",
    highlight: "Panoramic city views • Private terrace • Residents’ lounge",
    city: "Montreal",
    priceCents: 180_000_000,
    propertyType: "Condo",
  },
];

function formatPrice(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M`;
  if (dollars >= 1000) return `$${Math.round(dollars / 1000)}k`;
  return `$${Math.round(dollars)}`;
}

function fsboToCard(row: {
  id: string;
  title: string;
  city: string;
  priceCents: number;
  bedrooms: number | null;
  bathrooms: number | null;
  surfaceSqft: number | null;
  description: string;
  images: string[];
  coverImage: string | null;
}): BrowsePropertyCard {
  const img = row.coverImage ?? row.images[0] ?? FALLBACK[0].image;
  const beds = row.bedrooms ?? 2;
  const baths = row.bathrooms ?? 2;
  const sqft = row.surfaceSqft ?? 1000;
  return {
    id: row.id,
    title: row.title,
    price: formatPrice(row.priceCents),
    meta: `${beds} beds • ${baths} baths • ${sqft.toLocaleString()} sqft`,
    badge: "Listed",
    tagColor: "bg-emerald-500/90 text-slate-950",
    image: img,
    highlight: row.description.slice(0, 160) + (row.description.length > 160 ? "…" : ""),
    city: row.city,
    priceCents: row.priceCents,
    propertyType: row.description.includes("Duplex") ? "Duplex" : "Condo",
  };
}

/**
 * Published FSBO rows for /properties; if fewer than 5 in DB, pad with static mocks so filters always have material.
 */
export async function getBrowsePropertyCards(): Promise<BrowsePropertyCard[]> {
  try {
    const rows = await prisma.fsboListing.findMany({
      where: { status: "ACTIVE", moderationStatus: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 12,
    });
    const fromDb = rows.map(fsboToCard);
    if (fromDb.length >= 5) return fromDb;
    const seen = new Set(fromDb.map((c) => c.id));
    const padded = [...fromDb];
    for (const m of FALLBACK) {
      if (padded.length >= 8) break;
      if (!seen.has(m.id)) {
        padded.push(m);
        seen.add(m.id);
      }
    }
    return padded;
  } catch {
    return FALLBACK;
  }
}
