import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { AdminFsboClient } from "./admin-fsbo-client";

export const dynamic = "force-dynamic";

export default async function AdminFsboPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?returnUrl=/admin/fsbo");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") redirect("/");

  const listings = await prisma.fsboListing.findMany({
    orderBy: { updatedAt: "desc" },
    take: 200,
    select: {
      id: true,
      listingCode: true,
      title: true,
      city: true,
      priceCents: true,
      status: true,
      moderationStatus: true,
      ownerId: true,
      rejectReason: true,
      sellerDeclarationCompletedAt: true,
      riskScore: true,
      trustScore: true,
      _count: { select: { leads: true } },
    },
  });

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50">
      <div className="mx-auto max-w-6xl">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">FSBO listings</h1>
        <p className="mt-1 text-sm text-slate-400">
          Moderate sell-by-owner listings. Rejecting hides them from the public directory.
        </p>
        <AdminFsboClient listings={listings} />
      </div>
    </main>
  );
}
