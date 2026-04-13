import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId, getUserRole, isHubAdminRole } from "@/lib/auth/session";
import { HubLayout } from "@/components/hub/HubLayout";
import { prisma } from "@/lib/db";
import { hubNavigation } from "@/lib/hub/navigation";
import { AdminStaysListingsTable } from "./stays-table-client";

export const dynamic = "force-dynamic";

export default async function AdminStaysListingsPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?returnUrl=/admin/listings/stays");
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/");
  const role = await getUserRole();

  const rows = await prisma.shortTermListing.findMany({
    take: 200,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      listingCode: true,
      title: true,
      city: true,
      listingStatus: true,
      verificationStatus: true,
      nightPriceCents: true,
      ownerId: true,
      bnhubListingTopHostBadge: true,
    },
  });

  return (
    <HubLayout title="Stays (BNHUB)" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher={isHubAdminRole(role)}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <Link href="/admin/listings" className="text-xs text-premium-gold hover:underline">
              ← Listings hub
            </Link>
            <h1 className="mt-1 text-xl font-semibold text-white">Short-term listings</h1>
            <p className="mt-1 text-sm text-slate-400">
              Bulk approve, reject, pause, or feature. Use moderation queue for full review context.
            </p>
          </div>
          <Link
            href="/admin/moderation"
            className="rounded-lg border border-premium-gold/40 px-3 py-2 text-xs font-medium text-premium-gold"
          >
            Open moderation queue
          </Link>
        </div>

        <AdminStaysListingsTable rows={rows} />
      </div>
    </HubLayout>
  );
}
