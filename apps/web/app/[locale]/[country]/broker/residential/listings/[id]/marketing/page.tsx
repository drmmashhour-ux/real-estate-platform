import { PlatformRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { brokerAiFlags, brokerOpsFlags } from "@/config/feature-flags";
import { CertificateOfLocationHelperPanel } from "@/components/broker-ai/CertificateOfLocationHelperPanel";
import { getCertificateOfLocationBlockerImpact } from "@/modules/broker-ai/certificate-of-location/certificate-of-location-blocker.service";
import { loadCertificateOfLocationPresentation } from "@/modules/broker-ai/certificate-of-location/certificate-of-location-view-model.service";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ListingGrowthWorkspace } from "@/components/listing-growth/ListingGrowthWorkspace";

export const dynamic = "force-dynamic";

export default async function ListingMarketingPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; id: string }>;
}) {
  const { locale, country, id } = await params;
  const basePath = `/${locale}/${country}/broker/residential`;

  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(`${basePath}/listings/${id}/marketing`)}`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) {
    redirect(`/${locale}/${country}/broker`);
  }

  if (!brokerOpsFlags.residentialMarketingAutopilotV1 && !brokerOpsFlags.listingMarketingIntelligenceV1) {
    return (
      <div className="rounded-2xl border border-amber-900/40 bg-black/50 p-8 text-center text-zinc-400">
        <p>Marketing désactivé.</p>
      </div>
    );
  }

  const listing = await prisma.fsboListing.findFirst({
    where:
      user.role === PlatformRole.ADMIN
        ? { id, listingDealType: "SALE" }
        : { id, listingOwnerType: "BROKER", ownerId: userId, listingDealType: "SALE" },
    select: { id: true, title: true, city: true, listingCode: true },
  });

  if (!listing) {
    redirect(`${basePath}/listings/growth`);
  }

  const title = listing.title;
  const listingId = listing.id;

  const certificateCol =
    brokerAiFlags.brokerAiCertificateOfLocationV1
      ? await loadCertificateOfLocationPresentation({ listingId, brokerFlow: true })
      : null;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200/80">Marketing résidentiel</p>
        <h1 className="font-serif text-2xl text-amber-50">{title}</h1>
        <p className="mt-1 text-xs text-zinc-500">
          {listing?.city} · {listing?.listingCode ?? listingId}
        </p>
      </div>
      {certificateCol ? (
        <CertificateOfLocationHelperPanel
          listingId={listingId}
          viewModel={certificateCol.viewModel}
          blockerImpact={getCertificateOfLocationBlockerImpact(certificateCol.summary)}
        />
      ) : null}
      <ListingGrowthWorkspace listingId={listingId} basePath={basePath} />
    </div>
  );
}
