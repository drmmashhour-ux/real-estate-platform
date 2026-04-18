import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingStatus } from "@prisma/client";
import { landingConversionFlags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { generateLandingCopy } from "@/modules/ads";
import { AdsLandingPageClient, type AdsLandingPreviewItem } from "@/components/ads/AdsLandingPageClient";

export const dynamic = "force-dynamic";

const TYPES = new Set(["bnhub", "host", "buy"]);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string; type: string }>;
}): Promise<Metadata> {
  const { locale, country, type } = await params;
  if (!TYPES.has(type)) return {};
  const titles: Record<string, string> = {
    bnhub: "BNHub stays — LECIPM acquisition landing",
    host: "Host on BNHub — LECIPM acquisition landing",
    buy: "Homes & rentals — LECIPM acquisition landing",
  };
  return buildPageMetadata({
    title: titles[type] ?? "LECIPM",
    description: "Conversion landing for paid traffic — real inventory preview, tracked funnel events.",
    path: `/ads/${type}`,
    locale,
    country,
  });
}

export default async function AdsLandingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; country: string; type: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!landingConversionFlags.landingPagesV1) {
    notFound();
  }

  const { locale, country, type } = await params;
  if (!TYPES.has(type)) {
    notFound();
  }

  const sp = (await searchParams) ?? {};
  const cityRaw = typeof sp.city === "string" ? sp.city : "";
  const city = cityRaw.trim() || "Montréal";

  const copy = generateLandingCopy(type as "bnhub" | "host" | "buy", city);

  const base = `/${locale}/${country}`;
  const primaryHref =
    type === "bnhub"
      ? `${base}/bnhub/stays`
      : type === "host"
        ? `${base}/bnhub/host/listings/new`
        : `${base}/listings`;
  const secondaryHref = `${base}/ads/${type}#lead`;

  const cityFilter = { equals: city, mode: "insensitive" as const };

  const [stayCount, resaleCount] = await Promise.all([
    prisma.shortTermListing.count({
      where: { city: cityFilter, listingStatus: ListingStatus.PUBLISHED },
    }),
    prisma.property.count({ where: { city: cityFilter } }),
  ]);

  const stats: { label: string; value: string }[] =
    type === "bnhub"
      ? [
          { label: `Published BNHub stays in ${city}`, value: fmtCount(stayCount) },
          { label: `Residential listings in ${city}`, value: fmtCount(resaleCount) },
        ]
      : type === "host"
        ? [{ label: `Published stays visible to guests (${city})`, value: fmtCount(stayCount) }]
        : [{ label: `Homes in marketplace (${city})`, value: fmtCount(resaleCount) }];

  let listings: AdsLandingPreviewItem[] = [];
  if (type === "buy") {
    const rows = await prisma.property.findMany({
      where: { city: cityFilter },
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        city: true,
        price: true,
        media: { take: 1, orderBy: { createdAt: "asc" }, select: { fileUrl: true } },
      },
    });
    listings = rows.map((r) => ({
      id: r.id,
      title: `${r.city} — ${fmtMoney(r.price)}`,
      href: `${base}/listings/${r.id}`,
      imageUrl: r.media[0]?.fileUrl ?? null,
      priceLabel: fmtMoney(r.price),
    }));
  } else {
    const rows = await prisma.shortTermListing.findMany({
      where: { city: cityFilter, listingStatus: ListingStatus.PUBLISHED },
      take: 6,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        nightPriceCents: true,
        currency: true,
        listingPhotos: { take: 1, orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }], select: { url: true } },
      },
    });
    listings = rows.map((r) => ({
      id: r.id,
      title: r.title,
      href: `${base}/bnhub/listings/${r.id}`,
      imageUrl: r.listingPhotos[0]?.url ?? null,
      priceLabel: nightlyLabel(r.nightPriceCents, r.currency),
    }));
  }

  return (
    <AdsLandingPageClient
      locale={locale}
      country={country}
      landingType={type as "bnhub" | "host" | "buy"}
      city={city}
      copy={copy}
      stats={stats}
      listings={listings}
      primaryHref={primaryHref}
      secondaryHref={secondaryHref}
    />
  );
}

function fmtCount(n: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
}

function fmtMoney(price: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(
    price,
  );
}

function nightlyLabel(cents: number, currency: string) {
  const cur = currency && currency.length === 3 ? currency : "CAD";
  const n = cents / 100;
  return `${new Intl.NumberFormat(undefined, { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n)} / night`;
}
