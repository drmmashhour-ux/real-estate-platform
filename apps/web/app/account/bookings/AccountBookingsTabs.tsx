"use client";

import Link from "next/link";
import { useState } from "react";

export type AccountBookingCard = {
  id: string;
  status: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guestsCount: number | null;
  title: string;
  imageUrl: string | null;
  totalLabel: string;
  paidLabel: string;
  canCancelGuest: boolean;
};

const tabs = [
  { id: "upcoming" as const, label: "Upcoming" },
  { id: "past" as const, label: "Past" },
  { id: "canceled" as const, label: "Canceled" },
];

function Card({ b }: { b: AccountBookingCard }) {
  return (
    <li className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
        {b.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={b.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">No image</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900">{b.title}</p>
        <p className="mt-1 text-sm text-slate-600">
          {b.checkIn.slice(0, 10)} → {b.checkOut.slice(0, 10)} · {b.nights} nights
          {b.guestsCount != null ? ` · ${b.guestsCount} guests` : ""}
        </p>
        <p className="mt-1 text-sm font-medium text-slate-800">{b.totalLabel}</p>
        <p className="text-xs text-slate-500">
          {b.status} {b.paidLabel}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link href={`/bnhub/booking/${b.id}`} className="text-sm font-medium text-sky-700 hover:underline">
            View
          </Link>
          {b.canCancelGuest ? (
            <Link href={`/bnhub/booking/${b.id}`} className="text-sm font-medium text-amber-800 hover:underline">
              Cancel if eligible
            </Link>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export function AccountBookingsTabs(props: {
  upcoming: AccountBookingCard[];
  past: AccountBookingCard[];
  canceled: AccountBookingCard[];
}) {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("upcoming");

  const list =
    tab === "upcoming" ? props.upcoming : tab === "past" ? props.past : props.canceled;
  const empty =
    tab === "upcoming"
      ? "No upcoming trips."
      : tab === "past"
        ? "No past stays yet."
        : "No canceled bookings.";

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === t.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
            <span className="ml-1.5 text-xs font-normal opacity-80">
              ({t.id === "upcoming" ? props.upcoming.length : t.id === "past" ? props.past.length : props.canceled.length})
            </span>
          </button>
        ))}
      </div>
      <ul className="mt-6 space-y-3">
        {list.length === 0 ? (
          <li className="text-sm text-slate-500">{empty}</li>
        ) : (
          list.map((b) => <Card key={b.id} b={b} />)
        )}
      </ul>
    </div>
  );
}
