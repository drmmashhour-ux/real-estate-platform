"use client";

import { useTranslations } from "next-intl";

/**
 * Airbnb-style hero for the short-stay marketplace — search lives in browse filters below.
 */
export function SybnbHomeHero() {
  const t = useTranslations("Sybnb");

  return (
    <div className="relative overflow-hidden rounded-[var(--darlink-radius-2xl)] border border-[color:var(--darlink-border)] bg-gradient-to-br from-[color:var(--darlink-surface)] via-amber-50/40 to-emerald-50/50 px-6 py-10 shadow-[var(--darlink-shadow-md)] [dir:rtl]:text-right">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[color:var(--darlink-sand)]/25 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-emerald-200/20 blur-3xl" aria-hidden />
      <div className="relative max-w-2xl space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--darlink-text-muted)]">SYBNB</p>
        <h1 className="text-3xl font-bold tracking-tight text-[color:var(--darlink-text)] sm:text-4xl">{t("title")}</h1>
        <p className="text-sm leading-relaxed text-[color:var(--darlink-text-muted)] sm:text-base">{t("subtitle")}</p>
      </div>
    </div>
  );
}
