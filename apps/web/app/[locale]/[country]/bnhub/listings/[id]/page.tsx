import type { Metadata } from "next";
import { generateMetadataForBnhubStayRoute } from "@/lib/seo/bnhub-stay-metadata";
import { BnhubListingView } from "../../bnhub-listing-view";
import { hasAdUtmParams } from "@/lib/marketing/bnhub-ad-landing-url";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string; country: string }>;
}): Promise<Metadata> {
  const { id, locale, country } = await params;
  return generateMetadataForBnhubStayRoute(id, locale, country);
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const checkIn = typeof sp.checkIn === "string" ? sp.checkIn : undefined;
  const checkOut = typeof sp.checkOut === "string" ? sp.checkOut : undefined;
  const guests = typeof sp.guests === "string" ? sp.guests : undefined;
  const prefill =
    checkIn != null || checkOut != null || guests != null ? { checkIn, checkOut, guests } : undefined;
  return (
    <BnhubListingView
      routeLookupKey={id}
      seoCanonicalPath={`/bnhub/listings/${encodeURIComponent(id)}`}
      prefill={prefill}
      adLanding={hasAdUtmParams(sp)}
    />
  );
}
