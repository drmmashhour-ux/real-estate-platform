import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserRole, isHubAdminRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { AdminIssuesClient } from "./admin-issues-client";

export const dynamic = "force-dynamic";

export default async function AdminIssuesPage() {
  const role = await getUserRole();
  if (!isHubAdminRole(role)) redirect("/admin");

  const issues = await prisma.bookingIssue.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      booking: {
        include: {
          listing: { select: { id: true, title: true, city: true, ownerId: true } },
          guest: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  const list = issues.map((i) => ({
    id: i.id,
    bookingId: i.bookingId,
    issueType: i.issueType,
    description: i.description,
    status: i.status,
    resolvedAt: i.resolvedAt?.toISOString() ?? null,
    resolvedBy: i.resolvedBy,
    createdAt: i.createdAt.toISOString(),
    listingTitle: i.booking.listing.title,
    listingId: i.booking.listing.id,
    guestName: i.booking.guest.name ?? "—",
    guestEmail: i.booking.guest.email ?? "—",
    hostId: i.booking.listing.ownerId,
    refunded: i.booking.refunded,
  }));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">BNHub booking issues</h1>
        <p className="mt-1 text-slate-400">
          Review guest-reported issues, approve refunds, or reject claims. Contact host via user management if needed.
        </p>

        <AdminIssuesClient issues={list} />
      </div>
    </main>
  );
}
