import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ChannelManagerClient } from "./channel-manager-client";

export default async function HostChannelManagerPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/login?next=/bnhub/host/channel-manager");

  const listings = await prisma.shortTermListing.findMany({
    where: { ownerId: userId },
    select: { id: true, title: true },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <Link href="/bnhub/host/dashboard" className="text-sm font-medium text-amber-400 hover:text-amber-300">
            ← Host dashboard
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-white">Channel manager &amp; OTA sync</h1>
          <p className="mt-1 text-sm text-slate-400">
            iCal import/export MVP. API connectors are staged — use calendar URLs from Airbnb, Booking.com, or Vrbo.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <ChannelManagerClient listings={listings} />
      </section>
    </main>
  );
}
