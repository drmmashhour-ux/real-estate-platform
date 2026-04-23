import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { HostServiceManager } from "@/components/bnhub/services/HostServiceManager";

export const dynamic = "force-dynamic";

export default async function HostListingHospitalityPage({
  params,
}: {
  params: Promise<{ listingId: string }>;
}) {
  const userId = await getGuestId();
  if (!userId) redirect(`/bnhub/login?next=/bnhub/host/services/listings/${(await params).listingId}`);

  const { listingId } = await params;
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { id: true, title: true, ownerId: true, listingCode: true },
  });
  if (!listing) notFound();
  if (listing.ownerId !== userId) redirect("/bnhub/host/dashboard");

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link href="/bnhub/host/dashboard" className="text-sm text-emerald-400 hover:text-emerald-300">
          ← Host dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Services &amp; add-ons</h1>
        <p className="mt-1 text-slate-400">
          {listing.title}{" "}
          <span className="font-mono text-xs text-slate-600">({listing.listingCode})</span>
        </p>
        <p className="mt-3 text-sm text-slate-500">
          Enable optional services, set pricing, and add notes. Guests see prices before they pay — no hidden fees.
        </p>
        <div className="mt-8">
          <HostServiceManager listingId={listingId} />
        </div>
      </div>
    </main>
  );
}
