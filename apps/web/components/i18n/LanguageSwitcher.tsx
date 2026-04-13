"use client";

import { HEADER_SELECT } from "@/components/layout/header-action-classes";
import { UI_LOCALE_ENTRIES, type LocaleCode } from "@/lib/i18n/locales";
import { useI18n } from "@/lib/i18n/I18nContext";
import { routing } from "@/i18n/routing";

export function LanguageSwitcher({
  className = "",
  variant = "light",
}: {
  className?: string;
  /** `header` = same model as Login / Menu (global nav). `centris` = white slide-out menu panel. */
  variant?: "light" | "dark" | "header" | "centris";
}) {
  const { locale, setLocale, t, allowedLocales } = useI18n();

  const selectClass =
    variant === "header"
      ? HEADER_SELECT
      : variant === "centris"
        ? "h-11 w-full cursor-pointer rounded-xl border border-[#0c1a3a]/20 bg-white px-3 text-sm font-medium text-[#0c1a3a] shadow-none transition hover:border-[#0c1a3a]/35 focus:border-[#0c1a3a]/50 focus:outline-none focus:ring-2 focus:ring-[#0c1a3a]/15"
        : variant === "dark"
          ? "cursor-pointer rounded-lg border border-white/20 bg-white/5 px-2 py-1.5 text-xs font-medium text-white shadow-none transition hover:border-premium-gold/50 hover:bg-white/10 focus:border-premium-gold focus:outline-none focus:ring-2 focus:ring-premium-gold/30"
          : "cursor-pointer rounded-lg border border-gray-200 bg-white/90 px-2 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-gray-300 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500";

  return (
    <label className={`flex items-center gap-1.5 ${className}`}>
      <span className="sr-only">{t("common.a11y.selectLanguage")}</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as LocaleCode)}
        className={selectClass}
        aria-label={t("common.a11y.selectLanguage")}
      >
        {UI_LOCALE_ENTRIES.filter(
          (l) =>
            allowedLocales.includes(l.code) &&
            (routing.locales as readonly string[]).includes(l.code),
        ).map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}
