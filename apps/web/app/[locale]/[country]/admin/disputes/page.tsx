import Link from "next/link";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { getAllDisputes } from "@/lib/bnhub/disputes";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { DisputesListClient } from "./disputes-list-client";
import { PlatformLegalDisputesClient, type PlatformLegalDisputeRow } from "./PlatformLegalDisputesClient";

export const dynamic = "force-dynamic";

export default async function AdminDisputesControlPage() {
  await requireAdminControlUserId();

  const disputes = (await getAllDisputes()).map((d: Record<string, unknown>) => ({
    ...d,
    evidenceUrls: Array.isArray(d.evidenceUrls)
      ? d.evidenceUrls.filter((u: unknown): u is string => typeof u === "string")
      : [],
    booking: d.booking
      ? {
          ...(d.booking as object),
          guest: {
            name: (d.booking as { guest?: { name?: string | null } }).guest?.name ?? null,
            email: (d.booking as { guest?: { email?: string } }).guest?.email ?? "",
          },
          listing: {
            title:
              (d.booking as { listing?: { title?: string } }).listing?.title ??
              (d.listing as { title?: string } | undefined)?.title ??
              "Listing",
          },
        }
      : {
          id: d.bookingId,
          guest: { name: null, email: "" },
          listing: { title: (d.listing as { title?: string } | undefined)?.title ?? "Listing" },
        },
    listing: {
      id:
        (d.listing as { id?: string } | undefined)?.id ??
        (d.booking as { listing?: { id?: string } } | undefined)?.listing?.id ??
        "",
      title:
        (d.listing as { title?: string } | undefined)?.title ??
        (d.booking as { listing?: { title?: string } } | undefined)?.listing?.title ??
        "Listing",
    },
  })) as never[];

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
    <LecipmControlShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Disputes</h1>
          <p className="mt-1 text-sm text-zinc-500">BNHUB booking disputes and cross-platform legal cases.</p>
        </div>

        <section>
          <h2 className="text-lg font-semibold text-zinc-100">BNHUB bookings</h2>
          <p className="mt-1 text-sm text-zinc-500">Guest / host cases tied to a short-term booking.</p>
          <DisputesListClient initialDisputes={disputes} />
        </section>

        <PlatformLegalDisputesClient initialRows={platformLegalInitial} />

        <p className="text-xs text-zinc-600">
          <Link href="/admin/bnhub-disputes" className="text-zinc-400 underline">
            Legacy BNHUB dispute detail routes
          </Link>
        </p>
      </div>
    </LecipmControlShell>
  );
}
