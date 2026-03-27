import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookingById } from "@/lib/bnhub/booking";
import { getGuestId } from "@/lib/auth/session";
import { DisputeForm } from "./dispute-form";

export default async function BookingDisputePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [booking, guestId] = await Promise.all([
    getBookingById(id),
    getGuestId(),
  ]);
  if (!booking) notFound();

  const isGuest = guestId && guestId === booking.guestId;
  const isHost = false; // Would need current user id vs listing.ownerId
  const canDispute = isGuest || isHost;
  const claimantUserId = isGuest ? guestId! : booking.listing.ownerId;

  if (!claimantUserId) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <section className="mx-auto max-w-2xl px-4 py-12">
          <p className="text-slate-400">Sign in to open a dispute for this booking.</p>
          <Link href="/bnhub/login" className="mt-3 inline-block text-emerald-400 hover:text-emerald-300">Sign in</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <Link href={`/bnhub/booking/${id}`} className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
            ← Back to booking
          </Link>
          <h1 className="mt-4 text-xl font-semibold">Open a dispute</h1>
          <p className="mt-1 text-slate-400">
            {booking.listing.title} · {new Date(booking.checkIn).toLocaleDateString()} – {new Date(booking.checkOut).toLocaleDateString()}
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-2xl px-4 py-8">
        <DisputeForm
          bookingId={booking.id}
          claimant={isGuest ? "GUEST" : "HOST"}
          claimantUserId={claimantUserId}
          listingTitle={booking.listing.title}
        />
      </section>
    </main>
  );
}
