"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

type Props = { bookingId: string };

/** Host-only — simulated escrow step (no PSP). */
export function EscrowMarkPaidButton({ bookingId }: Props) {
  const t = useTranslations("Sybnb.escrow");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sybnb/bookings/${encodeURIComponent(bookingId)}/mark-paid`, {
        method: "POST",
        credentials: "same-origin",
      });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
      if (!res.ok || data.success === false) {
        throw new Error(typeof data.error === "string" ? data.error : "request_failed");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 [dir=rtl]:text-right">
      <button
        type="button"
        disabled={loading}
        onClick={() => void onClick()}
        className="rounded-lg border border-emerald-800 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-950 hover:bg-emerald-100 disabled:opacity-50"
      >
        {loading ? "…" : t("markPaidCta")}
      </button>
      <p className="mt-1 text-[11px] text-neutral-600">{t("markPaidHint")}</p>
      {error ? <p className="mt-1 text-[11px] text-red-700">{error}</p> : null}
    </div>
  );
}
