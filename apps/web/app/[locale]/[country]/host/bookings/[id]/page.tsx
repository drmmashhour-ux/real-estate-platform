import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { HostBookingDetailActions } from "@/components/host/HostBookingDetailActions";
import { GuestTrustHostCallout } from "@/components/host/GuestTrustHostCallout";
import { getHostBookingDetail } from "@/lib/host";

export const dynamic = "force-dynamic";

const GOLD = "#D4AF37";

function cad(cents: number) {
  return (cents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

type Props = { params: Promise<{ id: string }> };

export default async function HostBookingDetailPage({ params }: Props) {
  const hostId = await getGuestId();
  if (!hostId) return null;

  const { id } = await params;
  const b = await getHostBookingDetail(hostId, id);
  if (!b) notFound();

  const guestName =
    b.guestContactName?.trim() ||
    b.guest?.name?.trim() ||
    b.guest?.email ||
    b.guestContactEmail ||
    "Guest";
  const guestEmail = b.guestContactEmail ?? b.guest?.email ?? null;
  const guestPhone = b.guestContactPhone ?? b.guest?.phone ?? null;

  const md = b.payment?.moneyBreakdown;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/host/bookings" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Bookings
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-white">Booking</h1>
        <p className="mt-1 font-mono text-sm text-zinc-500">{b.confirmationCode ?? b.id}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
            <h2 className="text-sm font-semibold text-white">Booking summary</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-zinc-500">Booking ID</dt>
                <dd className="mt-0.5 font-mono text-xs text-zinc-300">{b.id}</dd>
              </div>
              {b.bookingCode ? (
                <div>
                  <dt className="text-zinc-500">Internal code</dt>
                  <dd className="mt-0.5 text-zinc-200">{b.bookingCode}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-zinc-500">Status</dt>
                <dd className="mt-0.5 text-zinc-200">{b.status}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Payment</dt>
                <dd className="mt-0.5 text-zinc-200">{b.payment?.status ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Created</dt>
                <dd className="mt-0.5 text-zinc-200">{b.createdAt.toISOString().slice(0, 16)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
            <h2 className="text-sm font-semibold text-white">Guest</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-zinc-500">Name</dt>
                <dd className="mt-0.5 text-zinc-200">{guestName}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Email</dt>
                <dd className="mt-0.5 break-all text-zinc-200">{guestEmail ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Phone</dt>
                <dd className="mt-0.5 text-zinc-200">{guestPhone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Guests</dt>
                <dd className="mt-0.5 text-zinc-200">{b.guestsCount ?? "—"}</dd>
              </div>
            </dl>
            {b.guestTrust ? (
              <div className="mt-4">
                <GuestTrustHostCallout trust={b.guestTrust} />
              </div>
            ) : (
              <p className="mt-4 text-xs text-zinc-500">
                Trust snapshot unavailable for this booking (older reservations may predate automated guest trust).
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
            <h2 className="text-sm font-semibold text-white">Stay details</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-zinc-500">Property</dt>
                <dd className="mt-0.5 text-zinc-200">{b.listing.title}</dd>
                <dd className="text-xs text-zinc-500">{b.listing.city}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Check-in</dt>
                <dd className="mt-0.5 text-zinc-200">{b.checkIn.toISOString().slice(0, 10)}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Check-out</dt>
                <dd className="mt-0.5 text-zinc-200">{b.checkOut.toISOString().slice(0, 10)}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Nights</dt>
                <dd className="mt-0.5 text-zinc-200">{b.nights}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
            <h2 className="text-sm font-semibold text-white">Payment details</h2>
            {md ? (
              <dl className="mt-4 grid gap-2 text-sm">
                <div className="flex justify-between border-b border-zinc-800/80 py-2">
                  <dt className="text-zinc-500">Base / subtotal</dt>
                  <dd className="text-zinc-200">{cad(md.subtotalCents)}</dd>
                </div>
                <div className="flex justify-between border-b border-zinc-800/80 py-2">
                  <dt className="text-zinc-500">Cleaning fee</dt>
                  <dd className="text-zinc-200">{cad(md.cleaningFeeCents)}</dd>
                </div>
                <div className="flex justify-between border-b border-zinc-800/80 py-2">
                  <dt className="text-zinc-500">Guest service fee</dt>
                  <dd className="text-zinc-200">{cad(md.guestServiceFeeCents)}</dd>
                </div>
                <div className="flex justify-between border-b border-zinc-800/80 py-2">
                  <dt className="text-zinc-500">Taxes</dt>
                  <dd className="text-zinc-200">{cad(md.taxesCents)}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="font-medium text-white">Total charged</dt>
                  <dd style={{ color: GOLD }}>{cad(md.totalChargeCents)}</dd>
                </div>
              </dl>
            ) : b.payment ? (
              <dl className="mt-4 grid gap-2 text-sm">
                <div className="flex justify-between border-b border-zinc-800/80 py-2">
                  <dt className="text-zinc-500">Total (payment record)</dt>
                  <dd style={{ color: GOLD }}>{cad(b.payment.amountCents)}</dd>
                </div>
                <div className="flex justify-between py-2 text-zinc-500">
                  <dt>Guest fee</dt>
                  <dd>{cad(b.payment.guestFeeCents)}</dd>
                </div>
                <div className="flex justify-between py-2 text-zinc-500">
                  <dt>Host fee</dt>
                  <dd>{cad(b.payment.hostFeeCents)}</dd>
                </div>
              </dl>
            ) : (
              <p className="mt-4 text-sm text-zinc-500">No payment on file.</p>
            )}
            {b.payment?.stripePaymentId ? (
              <p className="mt-4 font-mono text-xs text-zinc-500">
                Stripe: {b.payment.stripePaymentId}
              </p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
            <h2 className="text-sm font-semibold text-white">Timeline</h2>
            <ul className="mt-4 space-y-3 border-l border-zinc-700 pl-4">
              {b.timeline.map((t, i) => (
                <li key={i} className="relative text-sm">
                  <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-zinc-600" />
                  <p className="text-zinc-200">{t.label}</p>
                  <p className="text-xs text-zinc-500">{t.at.toISOString().slice(0, 16)}</p>
                  {t.detail ? <p className="mt-1 text-xs text-zinc-600">{t.detail}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-4">
          <HostBookingDetailActions
            bookingId={b.id}
            canCancel={b.canCancel}
            canRefund={b.canRefund}
            guestEmail={guestEmail}
          />
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
            <h2 className="text-sm font-semibold text-white">Property</h2>
            <Link
              href={`/bnhub/listings/${b.listing.id}`}
              className="mt-3 inline-flex rounded-xl border border-zinc-600 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
            >
              View listing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
