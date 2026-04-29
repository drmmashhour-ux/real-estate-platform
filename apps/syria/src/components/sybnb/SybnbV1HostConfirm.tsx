"use client";

import { triggerNarration } from "@/lib/demo/narrator";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

type Props = { bookingId: string; bookingVersion: number };

export function SybnbV1HostConfirm({ bookingId, bookingVersion }: Props) {
  const t = useTranslations("Sybnb.v1");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function post() {
    setErr(null);
    setLoading(true);
    const cv = Math.max(1, Math.floor(bookingVersion));
    try {
      const res = await fetch(`/api/sybnb/bookings/${bookingId}/confirm`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientVersion: cv }),
      });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
      if (data.error === "CONFLICT" || data.error === "SOFT_LOCK") {
        setErr("bookingConflictRefresh");
        router.refresh();
        return;
      }
      if (!res.ok || data.success === false) {
        setErr("actionFailed");
        return;
      }
      router.refresh();
    } catch {
      setErr("actionFailed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="[dir=rtl]:text-right">
      <button
        type="button"
        disabled={loading}
        data-demo-record="sybnb_host_confirm_booking"
        onClick={() => {
          triggerNarration("ACTION_HOST_CONFIRM");
          void post();
        }}
        className="rounded-lg bg-amber-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-900 disabled:opacity-50"
      >
        {loading ? t("sending") : t("confirmBooking")}
      </button>
      {err ? <p className="mt-2 text-xs text-red-700 [dir=rtl]:text-right">{t(err)}</p> : null}
    </div>
  );
}
