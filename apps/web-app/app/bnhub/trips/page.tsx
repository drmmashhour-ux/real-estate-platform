import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { getBookingsForGuest } from "@/lib/bnhub/booking";
import { TripsClient } from "./trips-client";

export default async function BNHubTripsPage() {
  const guestId = await getGuestId();

  if (!guestId) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <section className="border-b border-slate-800 bg-slate-950/80">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold">My trips</h1>
            <p className="mt-2 text-slate-400">Sign in to view and manage your trips.</p>
            <Link
              href="/bnhub/login"
              className="mt-4 inline-block rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Sign in
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const bookings = await getBookingsForGuest(guestId);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <Link href="/bnhub" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
            ← Back to search
          </Link>
          <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">My trips</h1>
          <p className="mt-2 text-slate-400">View your bookings and leave reviews after your stay.</p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <TripsClient bookings={bookings} />
      </section>
    </main>
  );
}
