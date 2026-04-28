"use client";

import { triggerNarration } from "@/lib/demo/narrator";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

type Props = { bookingId: string };

export function SybnbV1HostConfirm({ bookingId }: Props) {
  const t = useTranslations("Sybnb.v1");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function post() {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/sybnb/bookings/${bookingId}/confirm`, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
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
        onClick={() => {
          triggerNarration("ACTION_HOST_CONFIRM");
          void post();
        }}
        className="rounded-lg bg-amber-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-900 disabled:opacity-50"
      >
        {loading ? t("sending") : t("confirmBooking")}
      </button>
      {err ? <p className="mt-2 text-xs text-red-700 [dir=rtl]:text-right">{t("actionFailed")}</p> : null}
    </div>
  );
}
