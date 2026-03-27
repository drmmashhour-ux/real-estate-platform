import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { SellerListingWizard } from "@/components/seller/SellerListingWizard";
import { getTrustGraphFeatureFlags } from "@/lib/trustgraph/feature-flags";

export const dynamic = "force-dynamic";

export default async function AdminFsboEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?returnUrl=${encodeURIComponent(`/admin/fsbo/${id}/edit`)}`);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") redirect("/");

  const listing = await prisma.fsboListing.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!listing) redirect("/admin/fsbo");

  const tg = getTrustGraphFeatureFlags();

  return (
    <main className="min-h-screen bg-[#0B0B0B] text-slate-100">
      <div className="mx-auto max-w-3xl px-4 pt-4">
        <Link href="/admin/fsbo" className="text-sm text-amber-400 hover:underline">
          ← FSBO admin
        </Link>
      </div>
      <Suspense fallback={<div className="p-10 text-center text-slate-500">Loading…</div>}>
        <SellerListingWizard
          initialListingId={id}
          createPath={`/admin/fsbo/${id}/edit`}
          dashboardHref="/admin/fsbo"
          listingsHref="/admin/fsbo"
          pageTitle="Edit listing (admin)"
          trustGraph={{ listingBadge: tg.listingBadge, declarationWidget: tg.declarationWidget }}
        />
      </Suspense>
    </main>
  );
}
