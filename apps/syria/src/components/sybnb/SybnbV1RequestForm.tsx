"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { enqueueSybnbSyncItem } from "@/lib/sybnb/sync-queue";
import { getClientId } from "@/lib/sybnb/sync-client-id";
import { useSyriaOffline } from "@/components/offline/SyriaOfflineProvider";
import { Input } from "@/components/ui/Input";
import { triggerNarration } from "@/lib/demo/narrator";

type Props = {
  listingId: string;
  guestsMax: number | null;
  disabled?: boolean;
};

export function SybnbV1RequestForm({ listingId, guestsMax, disabled }: Props) {
  const t = useTranslations("Sybnb.v1");
  const router = useRouter();
  const { online, refreshQueueHint } = useSyriaOffline();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [queuedOffline, setQueuedOffline] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    triggerNarration("ACTION_REQUEST_BOOKING");
    setError(null);
    setLoading(true);
    const guestN = Math.max(1, Math.floor(Number(guests) || 1));
    const syncId = crypto.randomUUID();
    try {
      if (!online) {
        enqueueSybnbSyncItem({
          id: syncId,
          type: "booking_action",
          payload: {
            action: "booking_request",
            listingId,
            checkIn,
            checkOut,
            guests: guestN,
          },
        });
        await refreshQueueHint();
        setError(null);
        return;
      }

      const res = await fetch("/api/sybnb/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Client-Request-Id": syncId,
        },
        credentials: "same-origin",
        body: JSON.stringify({
          listingId,
          checkIn,
          checkOut,
          guests: guestN,
          clientRequestId: syncId,
          clientId: getClientId(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        booking?: { id: string };
        error?: string;
      };
      if (!res.ok || data.success === false) {
        enqueueSybnbSyncItem({
          id: syncId,
          type: "booking_action",
          payload: {
            action: "booking_request",
            listingId,
            checkIn,
            checkOut,
            guests: guestN,
          },
        });
        setError(data.error ?? "error");
        return;
      }
      if (data.booking?.id) {
        router.push(`/sybnb/requests/${data.booking.id}`);
        router.refresh();
      }
    } catch {
      enqueueSybnbSyncItem({
        id: syncId,
        type: "booking_action",
        payload: {
          action: "booking_request",
          listingId,
          checkIn,
          checkOut,
          guests: guestN,
        },
      });
      setError("network");
    } finally {
      setLoading(false);
    }
  }

  const maxG = guestsMax != null && guestsMax > 0 ? guestsMax : 99;

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3">
      <h2 className="text-base font-semibold text-neutral-900 [dir:rtl]:text-right">{t("requestSectionTitle")}</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs text-neutral-700 [dir=rtl]:text-right">
          {t("checkIn")}
          <Input
            required
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="mt-1"
            disabled={disabled || loading}
          />
        </label>
        <label className="text-xs text-neutral-700 [dir=rtl]:text-right">
          {t("checkOut")}
          <Input
            required
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="mt-1"
            disabled={disabled || loading}
          />
        </label>
        <label className="text-xs sm:col-span-2 [dir=rtl]:text-right">
          {t("guests")}
          <Input
            name="guest_count"
            type="number"
            min={1}
            max={maxG}
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            className="mt-1"
            disabled={disabled || loading}
          />
        </label>
      </div>
      {error ? (
        <p className="text-xs text-red-700 [dir=rtl]:text-right">
          {error === "blocked" || error === "not_stay" || error === "not_found"
            ? t("errors.blocked")
            : error === "bad_dates" || error === "validation"
              ? t("errors.dates")
              : error === "own_listing"
                ? t("errors.own")
                : t("errors.generic")}
        </p>
      ) : null}
      {queuedOffline ? (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs text-amber-950 [dir=rtl]:text-right">
          {t("offlineQueued")}
        </div>
      ) : null}
      <p className="text-xs text-neutral-500 [dir=rtl]:text-right">{t("noPaymentNote")}</p>
      <button
        type="submit"
        disabled={disabled || loading}
        className="h-12 w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-sm font-semibold text-neutral-950 shadow-md transition hover:from-amber-400 hover:to-amber-500 disabled:opacity-50"
      >
        {loading ? t("sending") : t("requestCta")}
      </button>
    </form>
  );
}
