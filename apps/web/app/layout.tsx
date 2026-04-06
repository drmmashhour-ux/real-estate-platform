import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Cormorant_Garamond, Inter, Noto_Sans_Arabic } from "next/font/google";
import { cookies } from "next/headers";
import { CookieConsentBanner } from "@/components/legal/CookieConsentBanner";
import { HeaderGate } from "@/components/layout/HeaderGate";
import { InvestmentShellChrome } from "@/components/layout/InvestmentShellChrome";
import FooterClient from "@/components/layout/FooterClient";
import FloatingContact from "@/components/ui/FloatingContact";
import { BrowserHistoryNav } from "@/components/ui/BrowserHistoryNav";
import { ImmoChatWidgetLazy } from "@/components/immo/ImmoChatWidgetLazy";
import { AppProviders } from "@/app/providers";
import { SkipLinks } from "@/components/accessibility/SkipLinks";
import { DemoModeBanner } from "@/components/layout/DemoModeBanner";
import { TestModeBanner } from "@/components/layout/TestModeBanner";
import { DebugPanel } from "@/components/DebugPanel";
import { UI_LOCALE_ENTRIES } from "@/lib/i18n/locales";
import { resolveInitialLocale } from "@/lib/i18n/resolve-initial-locale";
import { localeAllowListFromFlags, resolveLaunchFlags } from "@/lib/launch/resolve-launch-flags";
import {
  PLATFORM_CARREFOUR_NAME,
  PLATFORM_DEFAULT_DESCRIPTION,
  PLATFORM_DEFAULT_SITE_TITLE,
  PLATFORM_NAME,
} from "@/lib/brand/platform";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";

if (process.env.NODE_ENV === "development") {
  console.log("[API BASE]", process.env.NEXT_PUBLIC_APP_URL);
}

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

const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-noto-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteBaseUrl()),
  title: {
    default: PLATFORM_DEFAULT_SITE_TITLE,
    template: `%s | ${PLATFORM_NAME}`,
  },
  manifest: "/manifest.json",
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
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.png", sizes: "192x192", type: "image/png" }],
  },
  openGraph: {
    title: PLATFORM_DEFAULT_SITE_TITLE,
    description: PLATFORM_DEFAULT_DESCRIPTION,
    siteName: PLATFORM_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: PLATFORM_DEFAULT_SITE_TITLE,
    description: PLATFORM_DEFAULT_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0b0b",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  /** English default; `mi_locale` or saved profile locale when authenticated. */
  const initialLocale = await resolveInitialLocale(cookieStore);
  const launchFlags = await resolveLaunchFlags();
  const allowedLocales = localeAllowListFromFlags(launchFlags);
  const localeEntry = UI_LOCALE_ENTRIES.find((l) => l.code === initialLocale) ?? UI_LOCALE_ENTRIES[0];
  const arabicShell = localeEntry.code === "ar";

  return (
    <html
      lang={localeEntry.bcp47}
      dir={localeEntry.rtl ? "rtl" : "ltr"}
      className={`${inter.variable} ${cormorant.variable}${arabicShell ? ` ${notoArabic.variable}` : ""}`}
    >
      <body
        className={`${inter.className} min-h-screen bg-[#0B0B0B] text-white antialiased`}
      >
        <AppProviders initialLocale={initialLocale} allowedLocales={allowedLocales}>
          <div className="flex min-h-screen flex-col">
            <HeaderGate />
            <DemoModeBanner />
            <TestModeBanner />

            <main id="main-content" className="flex min-h-0 flex-1 flex-col overflow-x-hidden pb-28">
              <InvestmentShellChrome>{children}</InvestmentShellChrome>
            </main>

            <CookieConsentBanner />

            <FooterClient />

            <FloatingContact />
            <ImmoChatWidgetLazy />
            <BrowserHistoryNav />
            <DebugPanel />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
