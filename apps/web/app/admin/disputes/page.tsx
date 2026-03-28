import Link from "next/link";
import { getGuestId, getUserRole, isHubAdminRole } from "@/lib/auth/session";

import { redirect } from "next/navigation";
import { getAllDisputes } from "@/lib/bnhub/disputes";

import { prisma } from "@/lib/db";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { DisputesListClient } from "./disputes-list-client";
import { PlatformLegalDisputesClient, type PlatformLegalDisputeRow } from "./PlatformLegalDisputesClient";

export const dynamic = "force-dynamic";

export default async function AdminDisputesPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/admin/disputes");
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/dashboard");
  const role = await getUserRole();

  const disputes = (await getAllDisputes()).map((d: any) => ({
    ...d,
    evidenceUrls: Array.isArray(d.evidenceUrls) ? d.evidenceUrls.filter((u: unknown): u is string => typeof u === "string") : [],
    booking: d.booking
      ? {
          ...d.booking,
          guest: {
            name: d.booking.guest?.name ?? null,
            email: d.booking.guest?.email ?? "",
          },
          listing: {
            title: d.booking.listing?.title ?? d.listing?.title ?? "Listing",
          },
        }
      : {
          id: d.bookingId,
          guest: { name: null, email: "" },
          listing: { title: d.listing?.title ?? "Listing" },
        },
    listing: {
      id: d.listing?.id ?? d.booking?.listing?.id ?? "",
      title: d.listing?.title ?? d.booking?.listing?.title ?? "Listing",
    },
  })) as any[];

  const platformRows = await prisma.platformLegalDispute.findMany({
    orderBy: { createdAt: "desc" },
    take: 60,
    select: {
      id: true,
      type: true,
      status: true,
      description: true,
      resolutionNote: true,
      bookingId: true,
      listingId: true,
      fsboListingId: true,
      dealId: true,
      platformPaymentId: true,
      openedByUserId: true,
      targetUserId: true,
      createdAt: true,
      openedBy: { select: { email: true } },
      targetUser: { select: { email: true } },
      booking: {
        select: {
          id: true,
          payment: {
            select: {
              id: true,
              payoutHoldReason: true,
              hostPayoutReleasedAt: true,
            },
          },
        },
      },
    },
  });

  const platformLegalInitial: PlatformLegalDisputeRow[] = platformRows.map((r) => ({
    id: r.id,
    type: r.type,
    status: r.status,
    description: r.description,
    resolutionNote: r.resolutionNote,
    bookingId: r.bookingId,
    listingId: r.listingId,
    fsboListingId: r.fsboListingId,
    dealId: r.dealId,
    platformPaymentId: r.platformPaymentId,
    openedByUserId: r.openedByUserId,
    targetUserId: r.targetUserId,
    createdAt: r.createdAt.toISOString(),
    openedBy: r.openedBy,
    targetUser: r.targetUser,
    booking: r.booking
      ? {
          id: r.booking.id,
          payment: r.booking.payment
            ? {
                id: r.booking.payment.id,
                payoutHoldReason: r.booking.payment.payoutHoldReason,
                hostPayoutReleasedAt: r.booking.payment.hostPayoutReleasedAt?.toISOString() ?? null,
              }
            : null,
        }
      : null,
  }));

  return (
    <HubLayout title="Disputes" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher={isHubAdminRole(role)}>
      <div className="mx-auto max-w-6xl space-y-2 px-4 py-8">
        <Link href="/admin/dashboard" className="text-sm text-premium-gold hover:underline">
          ← Control center
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-white">Disputes</h1>
        <p className="mt-1 text-sm text-slate-400">BNHub booking disputes and cross-platform legal cases.</p>

        <section className="mt-6">
          <h2 className="text-lg font-semibold text-slate-100">BNHub bookings</h2>
          <p className="mt-1 text-sm text-slate-500">Guest / host cases tied to a short-term booking.</p>
          <DisputesListClient initialDisputes={disputes} />
        </section>

        <PlatformLegalDisputesClient initialRows={platformLegalInitial} />
      </div>
    </HubLayout>
  );
}
