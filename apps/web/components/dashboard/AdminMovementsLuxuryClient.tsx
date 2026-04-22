"use client";

import Link from "next/link";

import type { MovementsDashboardData } from "@/modules/dashboard/view-models";

const movementsDemo: { time: string; type: string; hub: string; detail: string; hubSlug: string }[] = [
  {
    time: "09:12",
    type: "New Listing",
    hub: "Seller Hub",
    detail: "Luxury villa created in Westmount",
    hubSlug: "seller",
  },
  {
    time: "09:40",
    type: "Lead Unlock",
    hub: "Broker Hub",
    detail: "Investor lead purchased for Downtown Montréal",
    hubSlug: "broker",
  },
  {
    time: "10:05",
    type: "Booking",
    hub: "BNHub",
    detail: "2-night stay booked in Old Montréal",
    hubSlug: "bnhub",
  },
  {
    time: "10:18",
    type: "Signup",
    hub: "Buyer Hub",
    detail: "New buyer account created",
    hubSlug: "buyer",
  },
  {
    time: "11:02",
    type: "Application",
    hub: "Rent Hub",
    detail: "Rental application submitted in Laval",
    hubSlug: "rent",
  },
  {
    time: "11:47",
    type: "Payout",
    hub: "BNHub",
    detail: "Host payout processed successfully",
    hubSlug: "bnhub",
  },
];

type Props = {
  adminBase: string;
  data: MovementsDashboardData;
};

export function AdminMovementsLuxuryClient({ adminBase, data }: Props) {
  const platformHref = `${adminBase}/platform`;

  const rows =
    data.movements.length > 0 ?
      data.movements.map((m) => ({
        id: m.id,
        time: m.timeLabel,
        type: m.typeLabel,
        hub: m.hubLabel,
        detail: m.detail,
        hubSlug: m.hubSlug,
      }))
    : movementsDemo.map((m, i) => ({ ...m, id: `demo-${i}` }));

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-black px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.32em] text-[#D4AF37]/78">Platform activity</div>
            <h1 className="mt-3 text-4xl font-semibold text-white">All movements in one place</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60">
              Recent paid lead unlocks, bookings, and activity logs — augmented with demo rows only when empty.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={platformHref}
              className="rounded-full border border-[#D4AF37]/40 px-4 py-2 text-sm text-[#D4AF37] hover:bg-[#D4AF37]/10"
            >
              Marketplace anchor
            </Link>
            <Link
              href={adminBase}
              className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 hover:border-[#D4AF37]/35"
            >
              ← Command center
            </Link>
          </div>
        </div>

        <div className="mt-10 rounded-[30px] border border-white/8 bg-[#0B0B0B] p-6">
          <div className="mb-6 text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">Activity Timeline</div>

          <div className="space-y-4">
            {rows.map((item) => (
              <div
                key={item.id}
                className="grid gap-4 rounded-[24px] border border-white/8 bg-[#111111] px-5 py-4 lg:grid-cols-[100px_180px_160px_1fr_auto] lg:items-center"
              >
                <div className="text-sm text-[#D4AF37]">{item.time}</div>
                <div className="text-white">{item.type}</div>
                {item.hubSlug ?
                  <Link
                    href={`${adminBase}/hubs/${item.hubSlug}`}
                    className="text-sm text-white/55 hover:text-[#D4AF37]"
                  >
                    {item.hub}
                  </Link>
                : <span className="text-sm text-white/55">{item.hub}</span>}
                <div className="text-sm text-white/70">{item.detail}</div>
                <Link
                  href={item.hubSlug ? `${adminBase}/hubs/${item.hubSlug}` : `${adminBase}/movements`}
                  className="inline-flex justify-center rounded-full border border-[#D4AF37]/35 px-4 py-2 text-sm text-[#D4AF37] hover:bg-[#D4AF37]/10"
                >
                  Details
                </Link>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-8 text-xs text-white/35">
          Sources: activity logs, bookings, listing contact purchases (latest first).
        </p>
      </div>
    </main>
  );
}
