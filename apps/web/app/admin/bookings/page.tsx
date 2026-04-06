import Link from "next/link";
import { BookingStatus, PaymentStatus } from "@prisma/client";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { getAdminBookings, getAdminBookingSummaryStrip } from "@/lib/admin/control-center";
import { requireAdminControlUserId } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

type Sp = Record<string, string | string[] | undefined>;

function pick(sp: Sp, key: string): string | undefined {
  const v = sp[key];
  if (typeof v === "string") return v.trim() || undefined;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0].trim() || undefined;
  return undefined;
}

export default async function AdminBookingsControlPage({ searchParams }: { searchParams: Promise<Sp> }) {
  await requireAdminControlUserId();
  const sp = await searchParams;
  const search = pick(sp, "q");
  const status = pick(sp, "status") as BookingStatus | undefined;
  const payment = pick(sp, "payment") as PaymentStatus | undefined;
  const dateFrom = pick(sp, "from");
  const dateTo = pick(sp, "to");

  const [strip, rows] = await Promise.all([
    getAdminBookingSummaryStrip(),
    getAdminBookings({
      search,
      status,
      paymentStatus: payment,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    }),
  ]);

  const GOLD = "#D4AF37";

  return (
    <LecipmControlShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Bookings</h1>
          <p className="mt-1 text-sm text-zinc-500">Cross-platform reservations — cancel/refund via BNHub booking tools.</p>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Today check-ins", value: strip.todayCheckIns },
            { label: "Today check-outs", value: strip.todayCheckOuts },
            { label: "Pending refunds (7d)", value: strip.pendingRefunds },
            { label: "Failed payments", value: strip.failedPayments },
          ].map((c) => (
            <div key={c.label} className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
              <p className="text-xs uppercase text-zinc-500">{c.label}</p>
              <p className="mt-1 text-2xl font-bold text-white">{c.value}</p>
            </div>
          ))}
        </section>

        <form className="grid gap-3 rounded-2xl border border-zinc-800 bg-[#111] p-4 lg:grid-cols-6" method="get">
          <input
            name="q"
            defaultValue={search}
            placeholder="ID, guest, property…"
            className="rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm text-white lg:col-span-2"
          />
          <select name="status" defaultValue={status ?? ""} className="rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm text-white">
            <option value="">Booking status</option>
            {Object.values(BookingStatus).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select name="payment" defaultValue={payment ?? ""} className="rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm text-white">
            <option value="">Payment</option>
            {Object.values(PaymentStatus).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input type="date" name="from" defaultValue={dateFrom} className="rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm text-white" />
          <input type="date" name="to" defaultValue={dateTo} className="rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm text-white" />
          <button type="submit" className="rounded-xl border border-zinc-600 px-4 py-2 text-sm text-white">
            Filter
          </button>
        </form>

        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#111]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-black/50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Ref</th>
                  <th className="px-4 py-3">Guest</th>
                  <th className="px-4 py-3">Property</th>
                  <th className="px-4 py-3">Host</th>
                  <th className="px-4 py-3">Stay</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Booking</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id} className="border-b border-zinc-800/80">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">{b.confirmationCode ?? b.id.slice(0, 10)}</td>
                    <td className="px-4 py-3 text-zinc-300">{b.guestName}</td>
                    <td className="px-4 py-3 text-zinc-400">{b.propertyTitle.slice(0, 32)}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{b.hostEmail}</td>
                    <td className="px-4 py-3 text-xs text-zinc-400">
                      {b.checkIn.toISOString().slice(0, 10)} → {b.checkOut.toISOString().slice(0, 10)}
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: GOLD }}>
                      {b.totalCents != null
                        ? (b.totalCents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs">{b.status}</td>
                    <td className="px-4 py-3 text-xs">{b.paymentStatus ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Link href={`/bnhub/booking/${b.id}`} className="text-xs" style={{ color: GOLD }}>
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </LecipmControlShell>
  );
}
