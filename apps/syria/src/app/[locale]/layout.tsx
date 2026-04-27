import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Cairo, Inter } from "next/font/google";
import { DemoGlobalBanner } from "@/components/demo/DemoGlobalBanner";
import { SyriaHeader } from "@/components/SyriaHeader";
import { SyriaFooter } from "@/components/SyriaFooter";
import { DarlinkMobileNav } from "@/components/DarlinkMobileNav";
import { isDarlinkEnabled, syriaFlags } from "@/lib/platform-flags";
import { routing } from "@/i18n/routing";
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

  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  if (!syriaFlags.SYRIA_PLATFORM_ENABLED) {
    const t = await getTranslations({ locale, namespace: "PlatformDisabled" });
    return (
      <html lang={locale} dir={dir} data-theme="darlink" className={`${cairo.variable} ${inter.variable}`}>
        <body className="min-h-screen bg-[color:var(--darlink-surface)] p-8 text-[color:var(--darlink-text)] antialiased">
          <h1 className="text-xl font-semibold">{t("title")}</h1>
          <p className="mt-2 max-w-lg text-sm text-[color:var(--darlink-text-muted)]">{t("body")}</p>
        </body>
      </html>
    );
  }

  return (
    <html lang={locale} dir={dir} data-theme="darlink" className={`${cairo.variable} ${inter.variable}`}>
      <body
        className={`flex min-h-screen flex-col bg-[color:var(--darlink-surface)] antialiased [--font-darlink-ar:var(--font-darlink-cairo)] [--font-darlink-en:var(--font-darlink-inter)] ${dir === "rtl" ? "darlink-root-rtl" : "darlink-root-ltr"}`}
      >
        <NextIntlClientProvider messages={messages}>
          <DemoGlobalBanner />
          <SyriaHeader />
          <main className="darlink-main-pad mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
          <SyriaFooter />
          <DarlinkMobileNav />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
