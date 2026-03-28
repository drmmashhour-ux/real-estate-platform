import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { isFsboPubliclyVisible } from "@/lib/fsbo/constants";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import { BuyerListingDetail } from "@/components/listings/BuyerListingDetail";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import {
  buildBnhubStaySeoSlug,
  buildFsboPublicListingPath,
  publicListingPathLookupKeys,
} from "@/lib/seo/public-urls";
import { mapCrmListingToBuyerPayload, resolvePublicListing } from "@/lib/listings/resolve-public-listing";
import {
  breadcrumbJsonLd,
  realEstateListingJsonLd,
  realEstateProductJsonLd,
} from "@/modules/seo/infrastructure/jsonLd";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";
import { cityToSlug } from "@/lib/market/slug";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

async function resolveListingFromParam(param: string) {
  for (const key of publicListingPathLookupKeys(param)) {
    const r = await resolvePublicListing(key);
    if (r) return r;
  }
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: param } = await params;
  const resolved = await resolveListingFromParam(param);
  if (!resolved) {
    return { title: "Listing" };
  }
  const base = getSiteBaseUrl();
  if (resolved.kind === "bnhub") {
    const stayPath = `/stays/${buildBnhubStaySeoSlug({
      id: resolved.id,
      city: resolved.city,
      propertyType: resolved.propertyType,
    })}`;
    return {
      title: "Short-term stay",
      description: "BNHub short-term rental — see full details on our stays page.",
      alternates: { canonical: `${base}${stayPath}` },
      robots: { index: false, follow: true },
    };
  }
  const canonicalPath =
    resolved.kind === "fsbo"
      ? buildFsboPublicListingPath(resolved.row)
      : `/listings/${encodeURIComponent(resolved.row.id)}`;
  if (resolved.kind === "fsbo") {
    const row = resolved.row;
    if (!isFsboPubliclyVisible(row)) return { title: "Listing", robots: { index: false, follow: false } };
    const priceCad = (row.priceCents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" });
    const beds = row.bedrooms != null ? `${row.bedrooms} bed` : null;
    const baths = row.bathrooms != null ? `${row.bathrooms} bath` : null;
    const facts = [beds, baths].filter(Boolean).join(" · ");
    const desc =
      row.description.replace(/\s+/g, " ").trim().slice(0, 140) ||
      `${row.title} in ${row.city}. ${facts ? `${facts}. ` : ""}Listed for ${priceCad}.`;
    const og = row.coverImage ?? row.images[0] ?? null;
    return buildPageMetadata({
      title: `${row.title} · ${row.city} | ${priceCad}`,
      description: desc,
      path: canonicalPath,
      ogImage: og,
      keywords: [row.city, "for sale", "FSBO", "Quebec real estate", row.listingCode ?? ""].filter(Boolean),
    });
  }
  const row = resolved.row;
  const priceCad = (Number(row.price) || 0).toLocaleString("en-CA", { style: "currency", currency: "CAD" });
  return buildPageMetadata({
    title: `${row.title} · Marketplace`,
    description: `Listed at ${priceCad}. View details and request information from the listing representative on LECIPM.`,
    path: canonicalPath,
    keywords: ["real estate", "marketplace", row.listingCode ?? ""].filter(Boolean),
  });
}

export default async function PublicListingRoute({ params }: Props) {
  const { id: param } = await params;
  const resolved = await resolveListingFromParam(param);
  if (!resolved) {
    notFound();
  }

  if (resolved.kind === "bnhub") {
    permanentRedirect(
      `/stays/${buildBnhubStaySeoSlug({
        id: resolved.id,
        city: resolved.city,
        propertyType: resolved.propertyType,
      })}`,
    );
  }

  if (resolved.kind === "fsbo") {
    const canon = buildFsboPublicListingPath(resolved.row);
    if (`/listings/${param}` !== canon) {
      permanentRedirect(canon);
    }
  }

  const base = getSiteBaseUrl();
  const listingPath =
    resolved.kind === "fsbo"
      ? buildFsboPublicListingPath(resolved.row)
      : `/listings/${encodeURIComponent(resolved.row.id)}`;
  const absUrl = `${base}${listingPath}`;
  const marketCitySlug = resolved.kind === "fsbo" ? cityToSlug(resolved.row.city) : null;

  if (resolved.kind === "fsbo") {
    const row = resolved.row;
    if (!isFsboPubliclyVisible(row)) {
      notFound();
    }
    const images = row.coverImage ? [row.coverImage, ...row.images.filter((u) => u !== row.coverImage)] : [...row.images];
    const productLd = realEstateProductJsonLd({
      url: absUrl,
      name: row.title,
      description: row.description.replace(/\s+/g, " ").trim().slice(0, 800) || `${row.title} in ${row.city}.`,
      city: row.city,
      priceCents: row.priceCents,
      currency: "CAD",
      imageUrls: images,
      numberOfRooms: row.bedrooms,
      propertyTypeHint: row.propertyType ?? "SingleFamilyResidence",
    });
    const listingLd = realEstateListingJsonLd({
      url: absUrl,
      name: row.title,
      description: row.description.replace(/\s+/g, " ").trim().slice(0, 800) || `${row.title} in ${row.city}.`,
      city: row.city,
      streetAddress: row.address,
      priceCents: row.priceCents,
      currency: "CAD",
      imageUrls: images,
      numberOfRooms: row.bedrooms,
    });
    const crumbLd = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Listings", path: "/listings" },
      { name: row.title, path: listingPath },
    ]);
    return (
      <>
        <JsonLdScript data={productLd} />
        <JsonLdScript data={listingLd} />
        <JsonLdScript data={crumbLd} />
        <BuyerListingDetail listing={{ ...row, listingKind: "fsbo" }} />
        <section className="border-t border-slate-800 bg-slate-950 px-4 py-10 text-slate-300">
          <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:flex-wrap sm:justify-center">
            <Link href="/listings" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
              Browse all listings
            </Link>
            {marketCitySlug ? (
              <Link
                href={`/market/${marketCitySlug}`}
                className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
              >
                More in {row.city}
              </Link>
            ) : null}
            <Link href="/bnhub/stays" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
              BNHub short-term stays
            </Link>
          </div>
        </section>
      </>
    );
  }

  const payload = mapCrmListingToBuyerPayload(resolved.row);
  const productLd = realEstateProductJsonLd({
    url: absUrl,
    name: payload.title,
    description: payload.description.replace(/\s+/g, " ").trim().slice(0, 800),
    city: payload.city,
    priceCents: payload.priceCents,
    currency: "CAD",
    imageUrls: payload.coverImage ? [payload.coverImage, ...payload.images] : payload.images,
    numberOfRooms: payload.bedrooms,
    propertyTypeHint: payload.propertyType ?? "Real estate listing",
  });
  const crumbLd = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Listings", path: "/listings" },
    { name: payload.title, path: listingPath },
  ]);
  return (
    <>
      <JsonLdScript data={productLd} />
      <JsonLdScript data={crumbLd} />
      <BuyerListingDetail listing={{ ...payload, listingKind: "crm" }} />
      <section className="border-t border-slate-800 bg-slate-950 px-4 py-10 text-slate-300">
        <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-4">
          <Link href="/listings" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
            Browse all listings
          </Link>
          <Link href="/marketplace" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
            Marketplace
          </Link>
          <Link href="/bnhub/stays" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
            BNHub stays
          </Link>
        </div>
      </section>
    </>
  );
}
