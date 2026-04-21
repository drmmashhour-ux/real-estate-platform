import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { InvestorIcPackDashboardClient } from "@/components/investor/InvestorIcPackDashboardClient";
import { userCanAccessInvestorDocuments } from "@/modules/investor/investor-permissions";
import { getLatestInvestorIcPack } from "@/modules/investor/investor-ic-pack.service";
import type { InvestorIcPackPayload } from "@/modules/investor/investor.types";

export const dynamic = "force-dynamic";

export default async function InvestorIcPackPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; listingId: string }>;
}) {
  const { listingId } = await params;
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true },
  });
  if (!listing) redirect("/dashboard/investor");

  const allowed = await userCanAccessInvestorDocuments(userId, listingId);
  if (!allowed) redirect("/dashboard/investor");

  const pack = await getLatestInvestorIcPack(listingId);
  const payload = pack ? (pack.payloadJson as InvestorIcPackPayload) : null;

  return <InvestorIcPackDashboardClient listingId={listingId} initialPayload={payload} />;
}
