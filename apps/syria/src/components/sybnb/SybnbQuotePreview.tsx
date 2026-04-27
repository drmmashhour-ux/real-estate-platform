"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getSybnbStayQuote } from "@/actions/sybnb-booking";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Props = {
  propertyId: string;
};

export function SybnbQuotePreview({ propertyId }: Props) {
  const t = useTranslations("Listing");
  const locale = useLocale();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [err, setErr] = useState<string | null>(null);
  const [line, setLine] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onQuote() {
    setErr(null);
    setLine(null);
    startTransition(async () => {
      const g = Number(guests);
      const r = await getSybnbStayQuote({
        propertyId,
        checkIn,
        checkOut,
        guests: Number.isFinite(g) && g > 0 ? Math.floor(g) : 1,
      });
      if (!r.ok) {
        setErr(r.error === "invalid" ? t("sybnbQuoteInvalidDates") : t("sybnbQuoteError"));
        return;
      }
      const loc = locale.startsWith("ar") ? "ar-SY" : "en-US";
      const fmt = (s: string) =>
        Number(s).toLocaleString(loc, { maximumFractionDigits: 0 });
      setLine(
        t("sybnbQuoteLine", {
          nights: r.nights,
          total: fmt(r.total),
          currency: r.currency,
          fee: fmt(r.platformFee),
        }),
      );
    });
  }

  return (
    <div className="mt-4 space-y-3 rounded-[var(--darlink-radius-xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface-muted)]/40 p-4">
      <p className="text-sm font-semibold text-[color:var(--darlink-text)]">{t("sybnbQuoteTitle")}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-[color:var(--darlink-text)]">
          {t("fieldCheckIn")}
          <Input type="datetime-local" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="mt-1" />
        </label>
        <label className="block text-xs text-[color:var(--darlink-text)]">
          {t("fieldCheckOut")}
          <Input type="datetime-local" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="mt-1" />
        </label>
        <label className="block text-xs text-[color:var(--darlink-text)] sm:col-span-2">
          {t("fieldGuestCountOptional")}
          <Input type="number" min={1} value={guests} onChange={(e) => setGuests(e.target.value)} className="mt-1" />
        </label>
      </div>
      <Button type="button" variant="secondary" disabled={isPending} onClick={onQuote}>
        {t("sybnbQuoteCta")}
      </Button>
      {err ? <p className="text-xs text-amber-800">{err}</p> : null}
      {line ? <p className="text-sm text-[color:var(--darlink-text)]">{line}</p> : null}
    </div>
  );
}
