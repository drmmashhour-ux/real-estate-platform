import type { LocaleCode } from "@/lib/i18n/types";

export function getDirection(locale: LocaleCode): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}
