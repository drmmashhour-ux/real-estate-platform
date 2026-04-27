"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { DrBrainMaintenanceAction } from "@/lib/drbrain/actions";

export function DrBrainMaintenanceActions() {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, setPending] = useState<DrBrainMaintenanceAction | null>(null);
  const [banner, setBanner] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function post(action: DrBrainMaintenanceAction) {
    setBanner(null);
    setPending(action);
    try {
      const res = await fetch("/api/admin/drbrain/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const body = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || body.ok === false) {
        setBanner({ tone: "err", text: body.message ?? t("drbrainMaintenanceFailed") });
      } else {
        setBanner({ tone: "ok", text: body.message ?? t("drbrainMaintenanceDone") });
        router.refresh();
      }
    } catch {
      setBanner({ tone: "err", text: t("drbrainMaintenanceFailed") });
    } finally {
      setPending(null);
      if (bannerTimer.current) clearTimeout(bannerTimer.current);
      bannerTimer.current = setTimeout(() => setBanner(null), 12000);
    }
  }

  const btn =
    "rounded-xl border px-3 py-2 text-sm font-medium transition disabled:opacity-60 disabled:pointer-events-none";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`${btn} border-red-300 bg-red-50 text-red-900 hover:bg-red-100`}
          disabled={pending !== null}
          onClick={() => post("DISABLE_PAYMENTS")}
        >
          {pending === "DISABLE_PAYMENTS" ? t("drbrainMaintenanceRunning") : t("drbrainRunFix")}
        </button>
        <button
          type="button"
          className={`${btn} border-stone-300 bg-white text-stone-900 hover:bg-stone-50`}
          disabled={pending !== null}
          onClick={() => post("CLEAR_CACHE")}
        >
          {pending === "CLEAR_CACHE" ? t("drbrainMaintenanceRunning") : t("drbrainClearCache")}
        </button>
        <button
          type="button"
          className={`${btn} border-stone-300 bg-white text-stone-900 hover:bg-stone-50`}
          disabled={pending !== null}
          onClick={() => post("ENABLE_STRICT_FRAUD")}
        >
          {pending === "ENABLE_STRICT_FRAUD" ? t("drbrainMaintenanceRunning") : t("drbrainStrictFraud")}
        </button>
        <button
          type="button"
          className={`${btn} border-stone-300 bg-white text-stone-900 hover:bg-stone-50`}
          disabled={pending !== null}
          onClick={() => post("RECHECK_SYSTEM")}
        >
          {pending === "RECHECK_SYSTEM" ? t("drbrainMaintenanceRunning") : t("drbrainFixDb")}
        </button>
        <button
          type="button"
          className={`${btn} border-stone-300 bg-white text-stone-900 hover:bg-stone-50`}
          disabled={pending !== null}
          onClick={() => post("RESTART_JOBS")}
        >
          {pending === "RESTART_JOBS" ? t("drbrainMaintenanceRunning") : t("drbrainRestartJobs")}
        </button>
      </div>
      <p className="text-xs text-stone-500">{t("drbrainMaintenanceDisclaimer")}</p>
      {banner ? (
        <p
          className={`rounded-xl px-3 py-2 text-sm ${
            banner.tone === "ok" ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"
          }`}
        >
          {banner.text}
        </p>
      ) : null}
    </div>
  );
}
