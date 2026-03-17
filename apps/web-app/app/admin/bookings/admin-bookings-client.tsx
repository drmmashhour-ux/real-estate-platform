"use client";

import Link from "next/link";

type Booking = {
  id: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  status: string;
  createdAt: Date;
  listing: { id: string; title: string; city: string; ownerId: string };
  guest: { id: string; name: string | null; email: string };
  payment: { status: string; amountCents: number } | null;
};

export function AdminBookingsClient({ bookings }: { bookings: Booking[] }) {
  return (
    <div className="mt-6 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-700 text-slate-400">
            <th className="p-4 font-medium">Booking</th>
            <th className="p-4 font-medium">Listing</th>
            <th className="p-4 font-medium">Guest</th>
            <th className="p-4 font-medium">Dates</th>
            <th className="p-4 font-medium">Status</th>
            <th className="p-4 font-medium">Amount</th>
            <th className="p-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id} className="border-b border-slate-800">
              <td className="p-4">
                <Link href={`/bnhub/booking/${b.id}`} className="font-mono text-emerald-400 hover:underline">
                  {b.id.slice(0, 8)}…
                </Link>
              </td>
              <td className="p-4">
                <Link href={`/bnhub/${b.listing.id}`} className="text-slate-200 hover:text-emerald-400">
                  {b.listing.title}
                </Link>
                <span className="text-slate-500"> · {b.listing.city}</span>
              </td>
              <td className="p-4">
                <span className="text-slate-200">{b.guest.name ?? "—"}</span>
                <span className="text-slate-500"> {b.guest.email}</span>
              </td>
              <td className="p-4 text-slate-400">
                {new Date(b.checkIn).toLocaleDateString()} – {new Date(b.checkOut).toLocaleDateString()} ({b.nights} nights)
              </td>
              <td className="p-4">
                <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs capitalize text-slate-300">
                  {b.status.replace(/_/g, " ")}
                </span>
              </td>
              <td className="p-4 text-slate-400">
                {b.payment ? `$${(b.payment.amountCents / 100).toFixed(0)} (${b.payment.status})` : "—"}
              </td>
              <td className="p-4">
                <Link
                  href={`/admin/fraud?entity=BOOKING&entityId=${b.id}`}
                  className="text-xs text-amber-400 hover:text-amber-300"
                >
                  Fraud tools
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {bookings.length === 0 && (
        <p className="p-8 text-center text-slate-500">No bookings yet.</p>
      )}
    </div>
  );
}
