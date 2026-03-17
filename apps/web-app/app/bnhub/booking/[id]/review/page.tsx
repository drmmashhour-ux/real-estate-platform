import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookingById } from "@/lib/bnhub/booking";
import { getGuestId } from "@/lib/auth/session";
import { ReviewForm } from "../../../review-form";

export default async function BookingReviewPage({
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
  if (booking.status !== "COMPLETED") {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <section className="mx-auto max-w-2xl px-4 py-12">
          <p className="text-slate-400">You can only review completed stays.</p>
          <Link href="/bnhub" className="mt-3 inline-block text-emerald-400 hover:text-emerald-300">
            Back to search
          </Link>
        </section>
      </main>
    );
  }
  if (booking.review) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <section className="mx-auto max-w-2xl px-4 py-12">
          <p className="text-slate-400">You already reviewed this stay.</p>
          <Link href={`/bnhub/${booking.listingId}`} className="mt-3 inline-block text-emerald-400 hover:text-emerald-300">
            View listing
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <h1 className="text-xl font-semibold">Leave a review</h1>
          <p className="mt-1 text-sm text-slate-400">
            {booking.listing.title} · {new Date(booking.checkIn).toLocaleDateString()} – {new Date(booking.checkOut).toLocaleDateString()}
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-2xl px-4 py-8">
        <ReviewForm
          bookingId={booking.id}
          listingId={booking.listingId}
          listingTitle={booking.listing.title}
          guestId={guestId}
        />
      </section>
    </main>
  );
}
