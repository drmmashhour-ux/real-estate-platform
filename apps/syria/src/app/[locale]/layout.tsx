import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { Cairo, Inter } from "next/font/google";
import { NarrationProvider } from "@/components/demo/NarrationProvider";
import { DemoRecordingProvider } from "@/components/demo/DemoRecordingProvider";
import { DemoGlobalBanner } from "@/components/demo/DemoGlobalBanner";
import { SyriaHeader } from "@/components/SyriaHeader";
import { SyriaFooter } from "@/components/SyriaFooter";
import { DarlinkMobileNav } from "@/components/DarlinkMobileNav";
import { isDarlinkEnabled, syriaFlags } from "@/lib/platform-flags";
import { routing } from "@/i18n/routing";
import { getAutoNarrationEnvSnapshot } from "@/lib/demo/auto-narration-env";
import { isInvestorDemoModeActive } from "@/lib/sybnb/investor-demo";
import { SyriaOfflineRoot } from "@/components/offline/SyriaOfflineRoot";
import { UltraLiteRibbon } from "@/components/lite/UltraLiteRibbon";
import { SyriaModeProvider } from "@/context/ModeContext";
import { darlinkMetadataBase, buildDarlinkPageMetadata } from "@/lib/seo/darlink-metadata";
import type { DarlinkLocale } from "@/lib/i18n/types";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-darlink-cairo",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-darlink-inter",
  display: "swap",
});

export const dynamic = "force-dynamic";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return { title: "Hadiah Link" };
  }
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    ...darlinkMetadataBase(),
    ...buildDarlinkPageMetadata({
      locale: locale as DarlinkLocale,
      title: t("title"),
      description: t("description"),
      pathname: "/",
    }),
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  if (!isDarlinkEnabled()) {
    return (
      <html lang="en">
        <body>
          <div style={{ padding: 24 }}>Platform temporarily unavailable.</div>
        </body>
      </html>
    );
  }

  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  if (!syriaFlags.SYRIA_PLATFORM_ENABLED) {
    const t = await getTranslations({ locale, namespace: "PlatformDisabled" });
    const dir = locale === "ar" ? "rtl" : "ltr";
    return (
      <html lang={locale} dir={dir} data-theme="darlink" className={`${cairo.variable} ${inter.variable}`}>
        <body className="min-h-screen bg-[color:var(--darlink-surface)] p-8 text-[color:var(--darlink-text)] antialiased">
          <h1 className="text-xl font-semibold">{t("title")}</h1>
          <p className="mt-2 max-w-lg text-sm text-[color:var(--darlink-text-muted)]">{t("body")}</p>
        </body>
      </html>
    );
  }

  const messages = await getMessages();
  const liteRoute = (await headers()).get("x-syria-lite") === "1";

  if (liteRoute) {
    const dir = locale === "ar" ? "rtl" : "ltr";
    return (
      <html lang={locale} dir={dir} data-theme="ultra-lite" data-ultra-lite="true">
        <body className="min-h-screen bg-[#f7f7f7] font-sans text-[13px] leading-snug text-neutral-900 antialiased">
          <NextIntlClientProvider messages={messages}>
            <SyriaModeProvider>
              <SyriaOfflineRoot>
                <UltraLiteRibbon litePath />
                {children}
              </SyriaOfflineRoot>
            </SyriaModeProvider>
          </NextIntlClientProvider>
        </body>
      </html>
    );
  }

  const demoUxActive = isInvestorDemoModeActive();
  const narrationEnv = getAutoNarrationEnvSnapshot();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} data-theme="darlink" className={`${cairo.variable} ${inter.variable}`}>
      <body
        className={`flex min-h-screen flex-col bg-[color:var(--darlink-surface)] antialiased [--font-darlink-ar:var(--font-darlink-cairo)] [--font-darlink-en:var(--font-darlink-inter)] ${dir === "rtl" ? "darlink-root-rtl" : "darlink-root-ltr"}`}
      >
        <NextIntlClientProvider messages={messages}>
          <SyriaModeProvider>
            <NarrationProvider
              investorDemoActive={demoUxActive}
              autoNarrationEnabled={narrationEnv.autoNarrationEnabled}
              autoNarrationTtsEnabled={narrationEnv.autoNarrationTtsEnabled}
            >
              <DemoRecordingProvider demoUxActive={demoUxActive}>
                <SyriaOfflineRoot>
                  <DemoGlobalBanner />
                  <UltraLiteRibbon />
                  <SyriaHeader />
                  <main className="darlink-main-pad mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
                  <SyriaFooter />
                  <DarlinkMobileNav />
                </SyriaOfflineRoot>
              </DemoRecordingProvider>
            </NarrationProvider>
          </SyriaModeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
