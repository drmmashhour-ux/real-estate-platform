"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

type Props = { bookingId: string };

export function SybnbV1HostActions({ bookingId }: Props) {
  const t = useTranslations("Sybnb.v1");
  const router = useRouter();
  const [loading, setLoading] = useState<"appr" | "dec" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function post(path: "approve" | "decline") {
    setErr(null);
    setLoading(path === "approve" ? "appr" : "dec");
    try {
      const res = await fetch(`/api/sybnb/bookings/${bookingId}/${path}`, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
      if (!res.ok || data.success === false) {
        setErr("actionFailed");
        return;
      }
      router.refresh();
    } catch {
      setErr("actionFailed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2 [dir=rtl]:flex-row-reverse">
      <button
        type="button"
        disabled={loading != null}
        onClick={() => void post("approve")}
        className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
      >
        {loading === "appr" ? t("sending") : t("approve")}
      </button>
      <button
        type="button"
        disabled={loading != null}
        onClick={() => void post("decline")}
        className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
      >
        {loading === "dec" ? t("sending") : t("decline")}
      </button>
      {err ? <p className="w-full text-xs text-red-700 [dir=rtl]:text-right">{t("actionFailed")}</p> : null}
    </div>
  );
}
