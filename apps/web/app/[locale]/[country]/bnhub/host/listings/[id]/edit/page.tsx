import Link from "next/link";
import { notFound } from "next/navigation";
import { getListingById } from "@/lib/bnhub/listings";
import { EditListingForm } from "./edit-listing-form";
import { VerificationChecklist } from "@/components/bnhub/VerificationChecklist";
import { HostBnhubRatingPanel } from "@/components/bnhub/HostBnhubRatingPanel";
import { prisma } from "@repo/db";
import type { ClassificationBreakdown } from "@/src/modules/bnhub-growth-engine/services/propertyClassificationService";
import { AIAssistantPanel } from "@/components/ai/AIAssistantPanel";
import { ContentAutomationHostPanel } from "@/components/bnhub/ContentAutomationHostPanel";

const DEMO_LISTINGS: Record<
  string,
  { id: string; title: string; description: string | null; address: string; city: string; country: string; nightPriceCents: number; beds: number; baths: number; maxGuests: number; photos: string[] }
> = {
  "1": {
    id: "1",
    title: "Luxury Villa",
    description: "Beautiful property with modern amenities.",
    address: "1 Villa Way",
    city: "Demo City",
    country: "US",
    nightPriceCents: 20000,
    beds: 3,
    baths: 2,
    maxGuests: 6,
    photos: [],
  },
  "test-listing-1": {
    id: "test-listing-1",
    title: "Luxury Villa",
    description: "Beautiful property",
    address: "1 Villa Way",
    city: "Demo City",
    country: "US",
    nightPriceCents: 20000,
    beds: 3,
    baths: 2,
    maxGuests: 6,
    photos: [],
  },
  "demo-listing-montreal": {
    id: "demo-listing-montreal",
    title: "Cozy loft in Old Montreal",
    description: "Walking distance to Notre-Dame, cafés, and the river.",
    address: "123 Place Jacques-Cartier",
    city: "Montreal",
    country: "CA",
    nightPriceCents: 12500,
    beds: 2,
    baths: 1,
    maxGuests: 4,
    photos: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"],
  },
};

export default async function HostEditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let listing = await getListingById(id);
  if (!listing) {
    const demo = DEMO_LISTINGS[id];
    listing = demo
      ? ({
          ...demo,
          owner: { id: "demo-owner", name: "Demo Host", hostQuality: null },
          _count: { reviews: 0, bookings: 0 },
          listingPhotos: [],
          reviews: [],
        } as any)
      : null;
  }
  if (!listing) notFound();

  let hostBreakdown: ClassificationBreakdown | null = null;
  if (!DEMO_LISTINGS[id]) {
    const row = await prisma.bnhubPropertyClassification.findUnique({
      where: { listingId: listing.id },
    });
    if (row?.breakdownJson && typeof row.breakdownJson === "object") {
      hostBreakdown = row.breakdownJson as ClassificationBreakdown;
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          <Link href="/bnhub/host/dashboard" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
            ← Host dashboard
          </Link>
          <h1 className="mt-4 text-xl font-semibold">Edit listing</h1>
          <p className="mt-1 text-slate-400">{listing.title}</p>
          <Link
            href={`/tools/design-studio?listingId=${encodeURIComponent(listing.id)}`}
            className="mt-2 inline-block text-sm font-medium text-amber-400 hover:text-amber-300"
          >
            Generate poster (Design Studio) →
          </Link>
        </div>
      </section>
      <section className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <VerificationChecklist listingId={listing.id} />
        {!DEMO_LISTINGS[id] ? <ContentAutomationHostPanel listingId={listing.id} /> : null}
        <HostBnhubRatingPanel breakdown={hostBreakdown} />
        <AIAssistantPanel
          context={{ listingId: listing.id, role: "HOST" }}
          agentKey="listing_optimization"
        />
        <EditListingForm listing={listing as any} />
      </section>
    </main>
  );
}
