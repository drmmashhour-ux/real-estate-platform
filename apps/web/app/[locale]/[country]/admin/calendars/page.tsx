import Link from "next/link";
import { getGuestId, getUserRole, isHubAdminRole } from "@/lib/auth/session";

import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";

import { hubNavigation } from "@/lib/hub/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminCalendarsPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/admin/calendars");
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/");
  const role = await getUserRole();
  const bookings = await prisma.booking.findMany({
    take: 60,
    orderBy: { checkIn: "desc" },
    include: {
      listing: { select: { id: true, title: true, ownerId: true } },
      guest: { select: { name: true, email: true } },
      payment: { select: { hostPayoutCents: true, status: true } },
    },
  });

  return (
    <HubLayout title="Calendars" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher={isHubAdminRole(role)}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Global calendars</h1>
          <p className="mt-2 text-sm text-slate-400">
            Cross-property BNHUB bookings (latest 60). For finance-grade payout timing use{" "}
            <Link href="/admin/finance/payouts" className="text-premium-gold hover:underline">
              broker payouts
            </Link>{" "}
            and{" "}
            <Link href="/admin/finance/reports" className="text-premium-gold hover:underline">
              reports
            </Link>
            .
          </p>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.04] text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Check-in</th>
                <th className="px-4 py-3">Check-out</th>
                <th className="px-4 py-3">Listing</th>
                <th className="px-4 py-3">Guest</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Host payout</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-white/[0.02]">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-300">{b.checkIn.toISOString().slice(0, 10)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-300">{b.checkOut.toISOString().slice(0, 10)}</td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-slate-200">{b.listing.title}</td>
                  <td className="max-w-[160px] truncate px-4 py-3 text-slate-400">{b.guest.name ?? b.guest.email}</td>
                  <td className="px-4 py-3 text-slate-400">{b.status}</td>
                  <td className="px-4 py-3 text-slate-300">
                    {b.payment?.hostPayoutCents != null
                      ? `$${(b.payment.hostPayoutCents / 100).toFixed(2)}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/bnhub/booking/${b.id}`} className="text-premium-gold hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500">
          Full booking admin tools: <Link href="/admin/bookings" className="text-premium-gold hover:underline">/admin/bookings</Link>
        </p>
      </div>
    </HubLayout>
  );
}
