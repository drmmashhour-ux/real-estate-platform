import type { Metadata } from "next";
import "./globals.css";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { cookies } from "next/headers";
import { CookieConsentBanner } from "@/components/legal/CookieConsentBanner";
import { HeaderGate } from "@/components/layout/HeaderGate";
import { InvestmentShellChrome } from "@/components/layout/InvestmentShellChrome";
import FooterClient from "@/components/layout/FooterClient";
import FloatingContact from "@/components/ui/FloatingContact";
import { BrowserHistoryNav } from "@/components/ui/BrowserHistoryNav";
import { ImmoChatWidgetLazy } from "@/components/immo/ImmoChatWidgetLazy";
import { AppProviders } from "@/app/providers";
import { DemoModeBanner } from "@/components/layout/DemoModeBanner";
import { getLocaleFromCookieStore, UI_LOCALES } from "@/lib/i18n/locales";
import {
  PLATFORM_CARREFOUR_NAME,
  PLATFORM_DEFAULT_DESCRIPTION,
  PLATFORM_DEFAULT_SITE_TITLE,
  PLATFORM_NAME,
} from "@/lib/brand/platform";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: PLATFORM_DEFAULT_SITE_TITLE,
    template: `%s | ${PLATFORM_NAME}`,
  },
  manifest: "/manifest.json",
  themeColor: "#0B0B0B",
  appleWebApp: {
    capable: true,
    title: "LECIPM",
    statusBarStyle: "black-translucent",
  },
  description: PLATFORM_DEFAULT_DESCRIPTION,
  keywords: [
    "real estate Montreal",
    "Laval property",
    "Quebec real estate platform",
    "Montréal immobilier",
    "plateforme immobilière Québec",
    "BNHub",
    "FSBO",
    PLATFORM_CARREFOUR_NAME,
    PLATFORM_NAME,
    "AI real estate investment",
  ],
  icons: { icon: "/favicon.svg", apple: "/icon.png" },
  openGraph: {
    title: PLATFORM_DEFAULT_SITE_TITLE,
    description: PLATFORM_DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: PLATFORM_DEFAULT_SITE_TITLE,
    description: PLATFORM_DEFAULT_DESCRIPTION,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  /** Default UI language is English (`en`). Other locales apply only when `mi_locale` is set (e.g. language switcher), not from browser auto-detection. */
  const initialLocale = getLocaleFromCookieStore(cookieStore);
  const localeEntry = UI_LOCALES.find((l) => l.code === initialLocale) ?? UI_LOCALES[0];

  return (
    <html
      lang={localeEntry.bcp47}
      dir={localeEntry.rtl ? "rtl" : "ltr"}
      className={`${inter.variable} ${cormorant.variable}`}
    >
      <body
        className={`${inter.className} min-h-screen bg-[#0B0B0B] text-white antialiased`}
      >
        <AppProviders initialLocale={initialLocale}>
          <div className="flex min-h-screen flex-col">
            <HeaderGate />
            <DemoModeBanner />

            <main className="flex min-h-0 flex-1 flex-col overflow-x-hidden pb-28">
              <InvestmentShellChrome>{children}</InvestmentShellChrome>
            </main>

            <CookieConsentBanner />

            <FooterClient />

            <FloatingContact />
            <ImmoChatWidgetLazy />
            <BrowserHistoryNav />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
