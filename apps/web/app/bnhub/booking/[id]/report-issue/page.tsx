import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookingById } from "@/lib/bnhub/booking";
import { getGuestId } from "@/lib/auth/session";
import { ReportIssueForm } from "./report-issue-form";

export default async function ReportIssuePage({
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
  const isGuest = guestId === booking.guestId;
  if (!isGuest) notFound();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <Link
            href={`/bnhub/booking/${id}`}
            className="text-sm font-medium text-slate-400 hover:text-slate-200"
          >
            ← Back to booking
          </Link>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            Report an issue
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {booking.listing.title} · {new Date(booking.checkIn).toLocaleDateString()} – {new Date(booking.checkOut).toLocaleDateString()}
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-slate-400">
          Describe what went wrong. Our team will review and may contact you and the host. If the property was not as described, you may be eligible for a refund.
        </p>
        <ReportIssueForm bookingId={id} />
      </section>
    </main>
  );
}
