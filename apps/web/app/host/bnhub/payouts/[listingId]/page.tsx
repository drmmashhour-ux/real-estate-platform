import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function HostPayoutsByListingPage({ params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await params;
  const userId = await getGuestId();
  if (!userId) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-50">
        <Link href="/bnhub/login" className="text-emerald-400">
          Sign in
        </Link>
      </main>
    );
  }

  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { ownerId: true, title: true },
  });
  if (!listing || listing.ownerId !== userId) notFound();

  const payouts = await prisma.bnhubHostPayoutRecord.findMany({
    where: { listingId, hostUserId: userId },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
      <div className="mx-auto max-w-3xl">
        <Link href="/host/bnhub/payouts" className="text-sm text-emerald-400">
          ← All payouts
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">{listing.title}</h1>
        <ul className="mt-8 space-y-2">
          {payouts.map((p) => (
            <li key={p.id} className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3 text-sm">
              Booking {p.bookingId.slice(0, 8)}… · {p.payoutStatus} · {(p.netAmountCents / 100).toFixed(2)}{" "}
              {p.currency.toUpperCase()}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
