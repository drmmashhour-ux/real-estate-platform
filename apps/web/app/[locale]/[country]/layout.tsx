import type { ReactNode } from "react";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { CookieConsentBanner } from "@/components/legal/CookieConsentBanner";
import { HeaderGate } from "@/components/layout/HeaderGate";
import { InvestmentShellChrome } from "@/components/layout/InvestmentShellChrome";
import { FooterHistoryNavProvider } from "@/components/layout/FooterHistoryNavContext";
import FooterClient from "@/components/layout/FooterClient";
import { MarketingMainArea } from "@/components/layout/MarketingMainArea";
import { GlobalFooterDock } from "@/components/ui/GlobalFooterDock";
import { ImmoChatWidgetLazy } from "@/components/immo/ImmoChatWidgetLazy";
import { AppProviders } from "@/app/providers";
import { DemoModeBanner } from "@/components/layout/DemoModeBanner";
import { LaunchTrustSignalsBanner } from "@/components/layout/LaunchTrustSignalsBanner";
import { TestModeBanner } from "@/components/layout/TestModeBanner";
import { DebugPanel } from "@/components/DebugPanel";
import { localeAllowListFromFlags, resolveLaunchFlags } from "@/lib/launch/resolve-launch-flags";
import { routing } from "@/i18n/routing";
import type { LocaleCode } from "@/lib/i18n/types";
import {
  getCountryBySlug,
  isCountrySlug,
  isLocaleAllowedForCountry,
  ROUTED_COUNTRY_SLUGS,
  defaultLocaleForCountrySlug,
  type CountryCodeLower,
} from "@/config/countries";
import { CountryProvider } from "@/lib/region/country-context";
import { LaunchBanner, LaunchBannerStatic } from "@/components/landing/LaunchBanner";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string; country: string }>;
};

export function generateStaticParams() {
  const out: { country: CountryCodeLower }[] = [];
  for (const c of ROUTED_COUNTRY_SLUGS) {
    out.push({ country: c });
  }
  return out;
}

export default async function CountryChromeLayout({ children, params }: Props) {
  const { locale, country: countryParam } = await params;
  const slug = countryParam.toLowerCase();

  if (!isCountrySlug(slug) || !ROUTED_COUNTRY_SLUGS.includes(slug as CountryCodeLower)) {
    notFound();
  }
  const country = getCountryBySlug(slug);
  if (!country) notFound();

  if (!isLocaleAllowedForCountry(locale, country)) {
    const fallback = defaultLocaleForCountrySlug(slug as CountryCodeLower);
    redirect(`/${fallback}/${slug}`);
  }

  const launchFlags = await resolveLaunchFlags();
  const fromFlags = localeAllowListFromFlags(launchFlags);
  const allowedLocales = fromFlags.filter((c): c is LocaleCode =>
    (routing.locales as readonly string[]).includes(c),
  );

  return (
    <CountryProvider countrySlug={slug as CountryCodeLower} country={country}>
      <AppProviders allowedLocales={allowedLocales}>
        <FooterHistoryNavProvider>
          <div className="flex min-h-screen flex-col">
            <HeaderGate />
            <Suspense fallback={<LaunchBannerStatic />}>
              <LaunchBanner basePath={`/${locale}/${slug}`} />
            </Suspense>
            <LaunchTrustSignalsBanner />
            <DemoModeBanner />
            <TestModeBanner />

            <MarketingMainArea>
              <InvestmentShellChrome>{children}</InvestmentShellChrome>
            </MarketingMainArea>

            <CookieConsentBanner />

            <FooterClient />

            <GlobalFooterDock />
            <ImmoChatWidgetLazy />
            <DebugPanel />
          </div>
        </FooterHistoryNavProvider>
      </AppProviders>
    </CountryProvider>
  );
}
