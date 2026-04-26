import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { getDarlinkMessages } from "@/lib/i18n/service";
import type { DarlinkLocale } from "@/lib/i18n/types";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: getDarlinkMessages(locale as DarlinkLocale),
  };
});
