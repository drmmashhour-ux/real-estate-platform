import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function BookingCancelPage({ searchParams }: Props) {
  const sp = await searchParams;
  const raw = sp.booking_id;
  const bookingId = typeof raw === "string" ? raw.trim() : Array.isArray(raw) ? raw[0]?.trim() ?? "" : "";
  if (!bookingId) {
    redirect("/bnhub/stays");
  }

  const userId = await getGuestId();
  if (!userId) {
    redirect(`/auth/login?next=${encodeURIComponent(`/bnhub/booking-cancel?booking_id=${bookingId}`)}`);
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      guestId: true,
      status: true,
      listingId: true,
      listing: { select: { title: true, listingCode: true } },
    },
  });
  if (!booking || booking.guestId !== userId) {
    redirect("/bnhub/stays");
  }

  const canRetry = booking.status === "PENDING";

  return (
    <main className="mx-auto min-h-[60vh] max-w-lg px-4 py-16 text-slate-900">
      <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-8 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Payment was canceled</h1>
        <p className="mt-2 text-sm text-slate-700">
          No charge was completed. {canRetry ? "Your booking is still pending — you can retry payment." : ""}
        </p>
        {booking.listing?.title ? (
          <p className="mt-4 text-sm font-medium text-slate-800">{booking.listing.title}</p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {canRetry ? (
            <Link
              href={`/bnhub/booking/${booking.id}`}
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-amber-500 px-4 py-3 text-center text-sm font-semibold text-slate-950 hover:bg-amber-400"
            >
              Retry payment
            </Link>
          ) : null}
          <Link
            href={`/bnhub/stays/${encodeURIComponent(booking.listing.listingCode ?? booking.listingId)}`}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Back to listing
          </Link>
        </div>
      </div>
    </main>
  );
}
