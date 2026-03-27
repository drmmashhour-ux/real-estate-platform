"use client";

import Link from "next/link";

type Booking = {
  id: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  status: string;
  bookingSource: string;
  createdAt: Date;
  guestNotes?: string | null;
  specialRequest?: string | null;
  specialRequestsJson?: unknown;
  listing: { id: string; title: string; city: string; ownerId: string };
  guest: { id: string; name: string | null; email: string };
  payment: { status: string; amountCents: number } | null;
};

function formatSpecialRequests(json: unknown): string {
  if (!json || typeof json !== "object" || json === null) return "";
  const o = json as Record<string, unknown>;
  const parts: string[] = [];
  const services = o.services && typeof o.services === "object" && o.services !== null ? (o.services as Record<string, unknown>) : null;
  if (services?.airportPickup === true) parts.push("Airport pickup");
  if (services?.parking === true) parts.push("Parking");
  if (services?.shuttle === true) parts.push("Shuttle");
  if (typeof o.extraServices === "string" && o.extraServices.trim()) parts.push(`Extras: ${o.extraServices.trim()}`);
  const gp = o.guestPet && typeof o.guestPet === "object" && o.guestPet !== null ? (o.guestPet as Record<string, unknown>) : null;
  if (gp?.travelingWithPet === true) {
    parts.push(
      `Pet: ${String(gp.type ?? "?")}${gp.weightKg != null && gp.weightKg !== "" ? ` · ${String(gp.weightKg)} kg` : ""}`
    );
  }
  return parts.join(" · ");
}

export function AdminBookingsClient({ bookings }: { bookings: Booking[] }) {
  return (
    <div className="mt-6 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-700 text-slate-400">
            <th className="p-4 font-medium">Booking</th>
            <th className="p-4 font-medium">Source</th>
            <th className="p-4 font-medium">Listing</th>
            <th className="p-4 font-medium">Guest</th>
            <th className="p-4 font-medium">Dates</th>
            <th className="p-4 font-medium">Requests</th>
            <th className="p-4 font-medium">Status</th>
            <th className="p-4 font-medium">Amount</th>
            <th className="p-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => {
            const structured = formatSpecialRequests(b.specialRequestsJson);
            const notes = [b.specialRequest, b.guestNotes].filter(Boolean).join(" · ");
            return (
              <tr key={b.id} className="border-b border-slate-800 align-top">
                <td className="p-4">
                  <Link href={`/bnhub/booking/${b.id}`} className="font-mono text-emerald-400 hover:underline">
                    {b.id.slice(0, 8)}…
                  </Link>
                </td>
                <td className="p-4">
                  <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-xs text-slate-300">{b.bookingSource}</span>
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
                <td className="max-w-[280px] p-4 text-xs text-slate-400">
                  {structured ? <p className="text-slate-300">{structured}</p> : null}
                  {notes ? <p className="mt-1 text-slate-500">{notes}</p> : null}
                  {!structured && !notes ? "—" : null}
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
            );
          })}
        </tbody>
      </table>
      {bookings.length === 0 && (
        <p className="p-8 text-center text-slate-500">No bookings yet.</p>
      )}
    </div>
  );
}
