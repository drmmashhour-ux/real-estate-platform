import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { NotificationList, type NotificationRow } from "@/components/notifications/NotificationList";

export const dynamic = "force-dynamic";

export default async function BNHubGuestNotificationsPage() {
  const guestId = await getGuestId();

  if (!guestId) {
    redirect("/bnhub/login?next=/bnhub/notifications");
  }

  const [rows, activeBooking] = await Promise.all([
    prisma.notification.findMany({
      where: {
        userId: guestId,
        actionUrl: { startsWith: "/bnhub/booking/" },
        status: { in: ["UNREAD", "READ"] },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.booking.findFirst({
      where: {
        guestId,
        status: { in: ["PENDING", "AWAITING_HOST_APPROVAL", "CONFIRMED"] },
      },
      orderBy: { checkIn: "asc" },
      include: {
        listing: { select: { title: true, city: true } },
      },
    }),
  ]);

  const initial: NotificationRow[] = rows.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    status: n.status,
    priority: n.priority,
    actionUrl: n.actionUrl,
    actionLabel: n.actionLabel,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <Link href="/bnhub/trips" className="text-sm font-medium text-premium-gold hover:text-premium-gold">
            ← Back to my trips
          </Link>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">BNHUB guest notifications</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Reservation updates and travel confirmations</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">
            Follow your booking requests, payment confirmations, host responses, and next travel reminders in one guest-only inbox.
          </p>

          {activeBooking ? (
            <div className="mt-6 rounded-2xl border border-premium-gold/20 bg-premium-gold/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-premium-gold">Current active reservation</p>
              <p className="mt-2 text-lg font-semibold text-white">{activeBooking.listing.title}</p>
              <p className="mt-1 text-sm text-slate-400">
                {activeBooking.listing.city} · {activeBooking.checkIn.toLocaleDateString()} - {activeBooking.checkOut.toLocaleDateString()}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/bnhub/booking/${activeBooking.id}`}
                  className="rounded-full bg-premium-gold px-4 py-2 text-sm font-semibold text-black hover:brightness-110"
                >
                  Open booking
                </Link>
                <Link
                  href={`/guest/payments/${activeBooking.id}`}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/5"
                >
                  Payment details
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <NotificationList initial={initial} defaultTab="unread" />
      </section>
    </main>
  );
}
