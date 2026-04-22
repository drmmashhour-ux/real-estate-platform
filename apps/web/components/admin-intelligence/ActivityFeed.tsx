"use client";

import Link from "next/link";

import type { AdminRecentActivityItem } from "@/modules/admin-intelligence/admin-intelligence.types";

const gold = "#D4AF37";

const kindLabel: Record<AdminRecentActivityItem["kind"], string> = {
  booking: "Booking",
  lead: "Lead",
  payment: "Payment",
  listing: "Listing",
};

export function ActivityFeed({
  items,
  adminBase,
}: {
  items: AdminRecentActivityItem[];
  adminBase: string;
}) {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{
        borderColor: "rgba(212, 175, 55, 0.15)",
        background: "linear-gradient(180deg, rgba(12,12,12,0.98), rgba(4,4,4,1))",
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: gold }}>
            Recent activity
          </p>
          <p className="text-sm text-zinc-500">Bookings, leads, payments</p>
        </div>
        <Link href={`${adminBase}/activity`} className="text-xs font-semibold text-zinc-400 hover:text-[#D4AF37]">
          Full log →
        </Link>
      </div>
      <ul className="mt-4 space-y-3">
        {items.slice(0, 10).map((item) => (
          <li
            key={item.id}
            className="flex gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0"
          >
            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold uppercase tracking-wide text-black"
              style={{ background: gold }}
            >
              {item.kind[0]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-white">
                <span className="text-zinc-500">{kindLabel[item.kind]} · </span>
                {item.detail}
              </p>
              <p className="text-xs text-zinc-600">
                {new Date(item.occurredAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
