"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getApiSnapshot, putApiSnapshot } from "@repo/offline";
import { SYRIA_OFFLINE_NAMESPACE } from "@/lib/offline/constants";
import type { LiteBookingRow } from "@/lib/lite/lite-queries";
import { liteBookingsSnapshotKey } from "@/lib/lite/lite-cache-keys";

export function LiteBookingsClient(props: { initial: LiteBookingRow[]; locale: string; authenticated: boolean }) {
  const { initial, locale, authenticated } = props;
  const t = useTranslations("UltraLite");
  const [rows, setRows] = useState<LiteBookingRow[]>(initial);
  const [src, setSrc] = useState<"server" | "cache" | "network">("server");

  useEffect(() => {
    void (async () => {
      const key = liteBookingsSnapshotKey(locale);
      const cached = await getApiSnapshot<LiteBookingRow[]>(SYRIA_OFFLINE_NAMESPACE, key);
      if (cached?.length && typeof navigator !== "undefined" && navigator.onLine === false) {
        setRows(cached);
        setSrc("cache");
      }
    })();
  }, [locale]);

  useEffect(() => {
    void (async () => {
      if (!authenticated) return;
      if (typeof navigator !== "undefined" && navigator.onLine === false) return;
      const res = await fetch(`/api/lite/bookings?locale=${encodeURIComponent(locale)}`, { cache: "no-store" });
      const j = (await res.json().catch(() => ({}))) as { items?: LiteBookingRow[] };
      if (j.items) {
        setRows(j.items);
        setSrc("network");
        await putApiSnapshot(SYRIA_OFFLINE_NAMESPACE, liteBookingsSnapshotKey(locale), j.items);
      }
    })();
  }, [locale, authenticated]);

  if (!authenticated) {
    return <p className="text-neutral-700">{t("signInForRequests")}</p>;
  }

  return (
    <div>
      <p className="mb-2 text-[11px] text-neutral-500">
        {src === "cache" ? t("sourceCache") : t("sourceLive")}
      </p>
      <ul className="list-none p-0">
        {rows.map((r) => (
          <li key={r.id} className="ultra-lite-row">
            <p className="font-semibold text-neutral-900">{r.title}</p>
            <p className="text-[12px] text-neutral-800">{r.price}</p>
            <p className="text-[11px] text-neutral-500">
              {t("statusLabel")}: {r.status}
            </p>
          </li>
        ))}
      </ul>
      {rows.length === 0 ? <p className="py-8 text-neutral-600">{t("emptyRequests")}</p> : null}
    </div>
  );
}
