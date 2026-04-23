import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@repo/db";
import { ListingStatus } from "@prisma/client";
import { PromoLeadForm } from "@/src/modules/bnhub-growth-engine/components/PromoLeadForm";

export const dynamic = "force-dynamic";

export default async function PromoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const campaign = await prisma.bnhubGrowthCampaign.findFirst({
    where: {
      promoSlug: slug,
      status: { in: ["ACTIVE", "READY", "SCHEDULED"] },
    },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          city: true,
          listingCode: true,
          nightPriceCents: true,
          photos: true,
          listingStatus: true,
        },
      },
    },
  });

  if (!campaign || campaign.listing.listingStatus !== ListingStatus.PUBLISHED) {
    notFound();
  }

  const photos = Array.isArray(campaign.listing.photos)
    ? campaign.listing.photos.filter((p): p is string => typeof p === "string")
    : [];
  const hero = photos[0];
  const price = (campaign.listing.nightPriceCents / 100).toFixed(0);
  const stayHref = `/bnhub/${campaign.listing.listingCode || campaign.listing.id}`;

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-500/90">BNHUB promotion</p>
        <h1 className="mt-2 text-3xl font-bold text-white">{campaign.listing.title}</h1>
        <p className="mt-1 text-zinc-400">{campaign.listing.city}</p>
        <p className="mt-2 text-sm text-amber-200/80">From ${price} / night · book on BNHUB</p>

        {hero ? (
          <div className="mt-6 aspect-[16/9] overflow-hidden rounded-2xl border border-amber-500/20 bg-zinc-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={hero} alt="" className="h-full w-full object-cover" />
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <p className="text-sm text-zinc-300 whitespace-pre-wrap">{campaign.aiStrategySummary}</p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={stayHref}
            className="inline-flex rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-semibold text-zinc-950"
          >
            Check availability
          </Link>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Interested in ${campaign.listing.title} (${campaign.listing.city})`)}`}
            className="inline-flex rounded-xl border border-zinc-600 px-5 py-2.5 text-sm font-medium text-zinc-200"
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp (manual)
          </a>
        </div>

        <div className="mt-10 border-t border-zinc-800 pt-8">
          <h2 className="text-lg font-semibold text-white">Request information</h2>
          <p className="mt-1 text-sm text-zinc-500">
            We route this to the host. No automated WhatsApp send until Business templates are connected.
          </p>
          <PromoLeadForm promoSlug={slug} />
        </div>
      </div>
    </main>
  );
}
