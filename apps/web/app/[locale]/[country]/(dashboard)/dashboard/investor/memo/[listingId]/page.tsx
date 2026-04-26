import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { InvestorMemoDashboardClient } from "@/components/investor/InvestorMemoDashboardClient";
import { userCanAccessInvestorDocuments } from "@/modules/investor/investor-permissions";
import { getLatestInvestorMemo } from "@/modules/investor/investor-memo.service";
import type { InvestorMemoPayload } from "@/modules/investor/investor.types";

export const dynamic = "force-dynamic";

export default async function InvestorMemoPage({
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

  const memo = await getLatestInvestorMemo(listingId);
  const payload = memo ? (memo.payloadJson as InvestorMemoPayload) : null;

  return <InvestorMemoDashboardClient listingId={listingId} initialPayload={payload} />;
}
