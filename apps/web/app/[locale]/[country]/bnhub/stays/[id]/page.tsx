import { BnhubListingView } from "@/app/bnhub/bnhub-listing-view";
import { hasAdUtmParams } from "@/lib/marketing/bnhub-ad-landing-url";

export const dynamic = "force-dynamic";

/** Public stay detail — canonical path `/bnhub/stays/[id]` (id or listing code). */
export default async function BnhubStayDetailPage({
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
      seoCanonicalPath={`/bnhub/stays/${encodeURIComponent(id)}`}
      prefill={prefill}
      adLanding={hasAdUtmParams(sp)}
    />
  );
}
