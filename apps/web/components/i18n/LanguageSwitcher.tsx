"use client";

import { HEADER_SELECT } from "@/components/layout/header-action-classes";
import { UI_LOCALES, type LocaleCode } from "@/lib/i18n/locales";
import { useI18n } from "@/lib/i18n/I18nContext";

export function LanguageSwitcher({
  className = "",
  variant = "light",
}: {
  className?: string;
  /** `header` = same model as Login / Menu (global nav). */
  variant?: "light" | "dark" | "header";
}) {
  const { locale, setLocale, t } = useI18n();

  const selectClass =
    variant === "header"
      ? HEADER_SELECT
      : variant === "dark"
        ? "cursor-pointer rounded-lg border border-white/20 bg-white/5 px-2 py-1.5 text-xs font-medium text-white shadow-none transition hover:border-premium-gold/50 hover:bg-white/10 focus:border-premium-gold focus:outline-none focus:ring-2 focus:ring-premium-gold/30"
        : "cursor-pointer rounded-lg border border-gray-200 bg-white/90 px-2 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-gray-300 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500";

  return (
    <label className={`flex items-center gap-1.5 ${className}`}>
      <span className="sr-only">{t("a11y_selectLanguage")}</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as LocaleCode)}
        className={selectClass}
        aria-label={t("a11y_selectLanguage")}
      >
        {UI_LOCALES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}
