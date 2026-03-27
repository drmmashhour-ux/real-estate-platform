import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isFsboPubliclyVisible } from "@/lib/fsbo/constants";
import { BuyerListingDetail } from "@/components/listings/BuyerListingDetail";
import { mapCrmListingToBuyerPayload, resolvePublicListing } from "@/lib/listings/resolve-public-listing";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const resolved = await resolvePublicListing(id);
  if (!resolved) {
    return { title: "Listing" };
  }
  if (resolved.kind === "bnhub") {
    return { title: "Short-term stay" };
  }
  if (resolved.kind === "fsbo") {
    const row = resolved.row;
    if (!isFsboPubliclyVisible(row)) return { title: "Listing" };
    return {
      title: `${row.title} · ${row.city}`,
      description: `Property in ${row.city}. View photos and contact options — no login required to browse.`,
    };
  }
  return {
    title: `${resolved.row.title} · Marketplace`,
    description: "View listing details and request information from the listing representative.",
  };
}

export default async function PublicListingRoute({ params }: Props) {
  const { id } = await params;
  const resolved = await resolvePublicListing(id);

  if (!resolved) {
    notFound();
  }

  if (resolved.kind === "bnhub") {
    redirect(`/bnhub/${encodeURIComponent(resolved.slug)}`);
  }

  if (resolved.kind === "fsbo") {
    const row = resolved.row;
    if (!isFsboPubliclyVisible(row)) {
      notFound();
    }
    return <BuyerListingDetail listing={{ ...row, listingKind: "fsbo" }} />;
  }

  const payload = mapCrmListingToBuyerPayload(resolved.row);
  return <BuyerListingDetail listing={{ ...payload, listingKind: "crm" }} />;
}
