import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { SybnbBookingStatus } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { money } from "@/lib/format";
import { pickListingTitle } from "@/lib/listing-localized";
import { SybnbBookingLifecycle } from "@/components/sybnb/SybnbBookingLifecycle";
import { SybnbV1HostActions } from "@/components/sybnb/SybnbV1HostActions";
import { SybnbV1HostConfirm } from "@/components/sybnb/SybnbV1HostConfirm";

type Props = { params: Promise<{ id: string }> };

function v1StatusLabel(s: SybnbBookingStatus, t: Awaited<ReturnType<typeof getTranslations>>): string {
  switch (s) {
    case "requested":
      return t("status_requested");
    case "approved":
      return t("status_approved");
    case "declined":
      return t("status_declined");
    case "cancelled":
      return t("status_cancelled");
    case "completed":
      return t("status_completed");
    case "confirmed":
      return t("status_confirmed");
    case "payment_pending":
      return t("status_payment_pending");
    case "paid":
      return t("status_paid");
    case "refunded":
      return t("status_refunded");
    case "needs_review":
      return t("status_needs_review");
    default: {
      const _u: never = s;
      return String(_u);
    }
  }
}

export default async function SybnbV1RequestStatusPage(props: Props) {
  const { id } = await props.params;
  const locale = await getLocale();
  const t = await getTranslations("Sybnb.v1");
  const u = await getSessionUser();

  const b = await prisma.sybnbBooking.findUnique({
    where: { id },
    include: { listing: true, guest: true, host: true },
  });
  if (!b) {
    notFound();
  }
  if (!u || (u.id !== b.guestId && u.id !== b.hostId && u.role !== "ADMIN")) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950 [dir=rtl]:text-right">
        {t("forbidden")}
      </div>
    );
  }
  const isHost = u.id === b.hostId;
  const title = pickListingTitle(b.listing, locale);
  const statusLabel = v1StatusLabel(b.status, t);

  return (
    <div className="mx-auto max-w-2xl space-y-6 [dir=rtl]:text-right">
      <h1 className="text-xl font-semibold text-neutral-900">{t("requestTitle")}</h1>
      <SybnbBookingLifecycle
        status={b.status}
        isHost={isHost}
        t={t as unknown as (key: string) => string}
      />
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-neutral-500">{t("property")}</p>
        <p className="mt-0.5 font-medium text-neutral-900">
          <Link href={`/sybnb/listings/${b.listingId}`} className="text-amber-900 underline-offset-2 hover:underline">
            {title}
          </Link>
        </p>
        <p className="mt-3 text-sm text-neutral-500">{t("dates")}</p>
        <p className="font-mono text-sm text-neutral-800">
          {b.checkIn.toISOString().slice(0, 10)} → {b.checkOut.toISOString().slice(0, 10)}
        </p>
        <p className="mt-3 text-sm text-neutral-500">{t("guests")}</p>
        <p className="text-sm text-neutral-900">{b.guests}</p>
        <p className="mt-3 text-sm text-neutral-500">{t("nights")}</p>
        <p className="text-sm text-neutral-900">{b.nights}</p>
        <p className="mt-3 text-sm text-neutral-500">{t("paymentStatus")}</p>
        <p className="text-sm text-neutral-900">{b.paymentStatus}</p>
        <p className="mt-3 text-sm text-neutral-500">{t("total")}</p>
        <p className="text-lg font-semibold text-neutral-900">{money(b.totalAmount, b.currency)}</p>
        <p className="mt-3 text-sm text-neutral-500">{t("status")}</p>
        <p className="text-sm font-medium text-neutral-900">{statusLabel}</p>
        {b.paymentStatus === "manual_required" && b.status === "approved" ? (
          <p className="mt-2 text-xs text-amber-800">{t("manualNext")}</p>
        ) : null}
        {isHost && b.status === "requested" ? (
          <div className="mt-4">
            <SybnbV1HostActions bookingId={b.id} />
          </div>
        ) : null}
        {isHost && b.status === "approved" ? (
          <div className="mt-4 space-y-1">
            <p className="text-xs text-neutral-600">{t("confirmHint")}</p>
            <SybnbV1HostConfirm bookingId={b.id} />
          </div>
        ) : null}
      </div>
      <p>
        <Link href="/sybnb/host" className="text-sm font-medium text-amber-800 underline-offset-2 hover:underline">
          {t("backHost")}
        </Link>
      </p>
    </div>
  );
}
