import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminBookingsOpsPage() {
  const [
    awaitingHost,
    pendingPayment,
    manualPending,
    confirmedRecent,
    cancelledRecent,
    attention,
  ] = await Promise.all([
    prisma.booking.count({ where: { status: "AWAITING_HOST_APPROVAL" } }),
    prisma.booking.count({ where: { status: "PENDING", manualPaymentSettlement: "NOT_APPLICABLE" } }),
    prisma.booking.count({ where: { manualPaymentSettlement: "PENDING" } }),
    prisma.booking.findMany({
      where: { status: "CONFIRMED" },
      orderBy: { updatedAt: "desc" },
      take: 15,
      select: {
        id: true,
        status: true,
        checkIn: true,
        checkOut: true,
        manualPaymentSettlement: true,
        listing: { select: { title: true, city: true } },
        guest: { select: { email: true } },
      },
    }),
    prisma.booking.findMany({
      where: { status: { in: ["CANCELLED", "CANCELLED_BY_GUEST", "CANCELLED_BY_HOST"] } },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        status: true,
        updatedAt: true,
        listing: { select: { title: true } },
      },
    }),
    prisma.booking.findMany({
      where: {
        OR: [
          { status: "AWAITING_HOST_APPROVAL" },
          { manualPaymentSettlement: "PENDING", status: "PENDING" },
          { manualPaymentSettlement: "FAILED" },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 25,
      select: {
        id: true,
        status: true,
        manualPaymentSettlement: true,
        updatedAt: true,
        listing: { select: { title: true, ownerId: true } },
        guest: { select: { email: true } },
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Operations</p>
        <h1 className="mt-2 text-2xl font-semibold">Booking ops</h1>
        <p className="mt-2 text-sm text-slate-400">
          Pending requests, manual payments, and bookings needing attention. Stripe webhook duplicates are logged
          server-side with <code className="text-slate-500">duplicate_webhook_ignored</code>.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <Link href="/admin" className="text-emerald-400 hover:text-emerald-300">
            ← Admin home
          </Link>
          <Link href="/admin/growth" className="text-amber-400 hover:text-amber-300">
            Growth funnel →
          </Link>
          <Link href="/admin/monitoring" className="text-sky-400 hover:text-sky-300">
            Production monitoring →
          </Link>
        </div>

        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat title="Awaiting host confirmation" value={awaitingHost} />
          <Stat title="Pending (online path)" value={pendingPayment} />
          <Stat title="Manual payment pending" value={manualPending} />
          <Stat title="Needs attention (sample)" value={attention.length} />
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-medium text-white">Bookings needing attention</h2>
          <BookingTable rows={attention} />
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-medium text-white">Recently confirmed</h2>
          <BookingTable rows={confirmedRecent} />
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-medium text-white">Recent cancellations</h2>
          <ul className="mt-2 space-y-2 text-sm text-slate-400">
            {cancelledRecent.map((b) => (
              <li key={b.id} className="flex flex-wrap justify-between gap-2 border-b border-slate-800 py-2">
                <Link href={`/bnhub/booking/${b.id}`} className="text-emerald-400 hover:underline">
                  {b.id.slice(0, 8)}…
                </Link>
                <span>{b.status}</span>
                <span className="text-slate-500">{b.listing.title.slice(0, 40)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function BookingTable(
  props: {
    rows: {
      id: string;
      status: string;
      manualPaymentSettlement?: string;
      checkIn?: Date;
      checkOut?: Date;
      updatedAt?: Date;
      listing: { title: string; city?: string | null; ownerId?: string };
      guest?: { email: string | null } | null;
    }[];
  },
) {
  if (props.rows.length === 0) return <p className="mt-2 text-sm text-slate-500">No rows.</p>;
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
          <tr>
            <th className="px-3 py-2">Booking</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Manual</th>
            <th className="px-3 py-2">Listing</th>
            <th className="px-3 py-2">Guest</th>
          </tr>
        </thead>
        <tbody>
          {props.rows.map((b) => (
            <tr key={b.id} className="border-b border-slate-800/80">
              <td className="px-3 py-2">
                <Link className="text-emerald-400 hover:underline" href={`/bnhub/booking/${b.id}`}>
                  {b.id.slice(0, 10)}…
                </Link>
              </td>
              <td className="px-3 py-2 text-slate-300">{b.status}</td>
              <td className="px-3 py-2 text-slate-400">{b.manualPaymentSettlement ?? "—"}</td>
              <td className="px-3 py-2 text-slate-300">{b.listing.title.slice(0, 48)}</td>
              <td className="px-3 py-2 text-slate-500">{b.guest?.email ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
