import type { LocaleCode } from "@/lib/i18n/locales";
import { bcp47ForUiLocale } from "@/lib/i18n/ai-response-locale";

export function formatDateForUiLocale(
  date: Date,
  locale: LocaleCode,
  style: "short" | "medium" | "long" = "medium",
): string {
  const tag = bcp47ForUiLocale(locale);
  try {
    return new Intl.DateTimeFormat(tag, {
      dateStyle: style === "short" ? "short" : style === "long" ? "long" : "medium",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function formatNumberForUiLocale(
  value: number,
  locale: LocaleCode,
  options?: Intl.NumberFormatOptions,
): string {
  const tag = bcp47ForUiLocale(locale);
  try {
    return new Intl.NumberFormat(tag, options).format(value);
  } catch {
    return String(value);
  }
}

export function formatCurrencyForUiLocale(
  amount: number,
  locale: LocaleCode,
  currency: string,
): string {
  const tag = bcp47ForUiLocale(locale);
  try {
    return new Intl.NumberFormat(tag, { style: "currency", currency }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}
