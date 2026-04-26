"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

const RANGE_DAYS = 30;

function dateKeysAhead(count: number): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  for (let i = 0; i < count; i += 1) {
    const x = new Date(d);
    x.setDate(x.getDate() + i);
    const y = x.getFullYear();
    const m = String(x.getMonth() + 1).padStart(2, "0");
    const day = String(x.getDate()).padStart(2, "0");
    out.push(`${y}-${m}-${day}`);
  }
  return out;
}

type Props = {
  listingId: string;
  /** Dates (YYYY-MM-DD) that are **booked** / not available. */
  initialBooked: string[];
  isOwner: boolean;
};

export function ShortStayAvailabilityCalendar({ listingId, initialBooked, isOwner }: Props) {
  const t = useTranslations("Listing");
  const locale = useLocale();
  const isAr = locale.startsWith("ar");
  const [booked, setBooked] = useState<Set<string>>(() => new Set(initialBooked));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setBooked(new Set(initialBooked));
  }, [initialBooked]);

  const days = useMemo(() => dateKeysAhead(RANGE_DAYS), []);

  const fmt = useMemo(
    () =>
      new Intl.DateTimeFormat(isAr ? "ar-SY" : "en-GB", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    [isAr],
  );

  function labelForKey(key: string) {
    const [y, m, d] = key.split("-").map((x) => Number(x));
    return fmt.format(new Date(y, (m ?? 1) - 1, d ?? 1));
  }

  async function persist(next: Set<string>) {
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`/api/listings/${listingId}/availability`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability: [...next].sort() }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setErr(t("availabilitySaveError"));
        return;
      }
    } catch {
      setErr(t("availabilitySaveError"));
    } finally {
      setSaving(false);
    }
  }

  function toggle(key: string) {
    if (!isOwner) return;
    setBooked((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      void persist(n);
      return n;
    });
  }

  return (
    <section
      className="rounded-[var(--darlink-radius-2xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] p-5 shadow-[var(--darlink-shadow-sm)]"
      dir={isAr ? "rtl" : "ltr"}
    >
      <h2 className="text-lg font-semibold text-[color:var(--darlink-text)]">{t("availabilityTitle")}</h2>
      {isOwner ? <p className="mt-1 text-xs text-[color:var(--darlink-text-muted)]">{t("availabilityOwnerHint")}</p> : null}
      {err ? <p className="mt-2 text-sm text-red-700">{err}</p> : null}
      {saving ? <p className="mt-1 text-xs text-[color:var(--darlink-text-muted)]">{t("availabilitySaving")}</p> : null}
      <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
        {days.map((key) => {
          const isBooked = booked.has(key);
          return (
            <li
              key={key}
              className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface-muted)]/30 px-3 py-2 text-sm"
            >
              <span className="font-medium text-[color:var(--darlink-text)]">{labelForKey(key)}</span>
              <span className="text-xs text-[color:var(--darlink-text-muted)]">{key}</span>
              {isOwner ? (
                <Button type="button" variant={isBooked ? "primary" : "secondary"} className="min-h-9 text-xs" onClick={() => toggle(key)}>
                  {isBooked ? t("dateBooked") : t("dateAvailable")}
                </Button>
              ) : (
                <span
                  className={
                    isBooked
                      ? "rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900"
                      : "rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-900"
                  }
                >
                  {isBooked ? t("dateBooked") : t("dateAvailable")}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
