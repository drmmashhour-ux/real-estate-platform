import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { HostRevenueAnalyticsClient } from "@/components/host/HostRevenueAnalyticsClient";

export const metadata = {
  title: "Revenue analytics | BNHub Host",
  description: "Occupancy, revenue, and booking insights from real BNHub data.",
};

export const dynamic = "force-dynamic";

export default async function HostRevenueAnalyticsPage() {
  const userId = await getGuestId();
  if (!userId) {
    redirect("/auth/login?next=/dashboard/host/analytics");
  }

  const listings = await prisma.shortTermListing.findMany({
    where: { ownerId: userId },
    select: { id: true, title: true, listingCode: true },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <HostRevenueAnalyticsClient
        initialListingOptions={listings.map((l) => ({
          id: l.id,
          title: l.title,
          listingCode: l.listingCode,
        }))}
      />
    </div>
  );
}
