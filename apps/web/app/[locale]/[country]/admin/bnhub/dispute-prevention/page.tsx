import Link from "next/link";
import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { hubNavigation } from "@/lib/hub/navigation";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

export default async function BnhubDisputePreventionAdminPage() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) redirect("/admin");

  const rows = await prisma.aiDisputeRiskLog.findMany({
    where: { requiresAdminReview: true, adminReviewedAt: null },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      booking: {
        select: {
          id: true,
          confirmationCode: true,
          checkIn: true,
          listing: { select: { id: true, title: true, city: true } },
        },
      },
    },
  });

  return (
    <HubLayout title="BNHUB dispute prevention" hubKey="admin" navigation={hubNavigation.admin}>
      <div className="space-y-6 text-white">
        <Link href="/admin/bnhub/trust" className="text-sm text-amber-400">
          ← BNHUB trust
        </Link>
        <h1 className="text-xl font-bold">Dispute prevention — admin queue</h1>
        <p className="max-w-2xl text-sm text-zinc-500">
          HIGH-risk signals are logged for awareness only. The platform does not adjudicate, refund, or resolve bookings
          from this screen — use your standard support workflow.
        </p>

        {rows.length === 0 ? (
          <p className="text-sm text-zinc-500">No open override-required items.</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 text-sm text-zinc-200"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs text-amber-300">{r.signalType}</span>
                  <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-200">
                    {r.riskLevel}
                  </span>
                </div>
                <p className="mt-2 text-zinc-300">{r.summary}</p>
                <p className="mt-1 text-xs text-zinc-500">{r.recommendedAction}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                  <span className="text-zinc-500">
                    Booking: {r.booking.listing.title} · {r.booking.listing.city}
                  </span>
                  <Link
                    href={`/bnhub/booking/${r.bookingId}`}
                    className="text-amber-400 underline hover:text-amber-300"
                  >
                    Open booking
                  </Link>
                  {r.booking.confirmationCode ? (
                    <span className="font-mono text-zinc-500">{r.booking.confirmationCode}</span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </HubLayout>
  );
}
