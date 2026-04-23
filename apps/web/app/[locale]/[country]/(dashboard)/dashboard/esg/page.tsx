import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { EsgDashboardClient } from "@/components/esg/EsgDashboardClient";

export const metadata = {
  title: "ESG dashboard",
  description: "LECIPM environmental, social, and governance scores for CRM listings.",
};

export default async function EsgDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ listingId?: string }>;
}) {
  const userId = await getGuestId();
  if (!userId) redirect("/login?next=/dashboard/esg");

  const sp = await searchParams;

  const listings = await prisma.listing.findMany({
    where: {
      OR: [{ ownerId: userId }, { brokerAccesses: { some: { brokerId: userId } } }],
    },
    select: { id: true, listingCode: true, title: true },
    orderBy: { updatedAt: "desc" },
    take: 80,
  });

  const initial =
    sp.listingId && listings.some((l) => l.id === sp.listingId) ? sp.listingId : listings[0]?.id ?? null;

  return <EsgDashboardClient listings={listings} initialListingId={initial} />;
}
