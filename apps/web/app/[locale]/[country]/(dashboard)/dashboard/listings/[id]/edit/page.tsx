import { notFound, redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { canAccessCrmListingCompliance } from "@/lib/compliance/crm-listing-access";
import { prisma } from "@repo/db";
import {
  centrisEligibilityUiLabel,
  centrisListingEligibilityEnforced,
  getBrokerCentrisListingEligibility,
} from "@/lib/centris/centris-listing-eligibility.service";
import { ListingEditClient } from "./listing-edit-client";

export const dynamic = "force-dynamic";

export default async function ListingEditPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; id: string }>;
}) {
  const { locale, country, id } = await params;
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");

  const ok = await canAccessCrmListingCompliance(userId, id);
  if (!ok) notFound();

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      id: true,
      listingCode: true,
      title: true,
      price: true,
      listingType: true,
      isCoOwnership: true,
      crmMarketplaceLive: true,
      centrisPublicationState: true,
      ownerId: true,
    },
  });
  if (!listing) notFound();

  const centrisEligibility = await getBrokerCentrisListingEligibility(listing.ownerId ?? userId);
  const centrisUi = centrisEligibilityUiLabel(centrisEligibility);

  const prefix = `/${locale}/${country}`;
  const listingsIndexHref = `${prefix}/dashboard/listings`;
  const detailHref = `${prefix}/dashboard/listings/${encodeURIComponent(id)}`;
  const assistantHref = `${prefix}/dashboard/listings/assistant?listingId=${encodeURIComponent(id)}`;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <ListingEditClient
        listing={listing}
        centris={{
          publicationState: listing.centrisPublicationState,
          enforcementEnabled: centrisListingEligibilityEnforced(),
          eligible: centrisUi === "eligible",
          headline: centrisUi === "eligible" ? "Eligible for Centris" : "Not connected to Centris",
          detail:
            centrisUi === "eligible"
              ? "You can export listing data as JSON for manual upload to the Centris portal. LECIPM does not post to Centris on your behalf unless a separate authorized integration is enabled."
              : "Confirm your OACIQ licence and Centris subscription on file. Draft listings stay on LECIPM until eligibility is complete (when enforcement is on).",
        }}
        listingsIndexHref={listingsIndexHref}
        detailHref={detailHref}
        assistantHref={assistantHref}
      />
    </main>
  );
}
