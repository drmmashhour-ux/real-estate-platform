import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Cormorant_Garamond, Inter, Noto_Sans_Arabic } from "next/font/google";
import { getLocale } from "next-intl/server";
import { SkipLinks } from "@/components/accessibility/SkipLinks";
import { ConversionFlagsPanel } from "@/components/dev/ConversionFlagsPanel";
import { UI_LOCALE_ENTRIES } from "@/lib/i18n/locales";
import {
  PLATFORM_CARREFOUR_NAME,
  PLATFORM_DEFAULT_DESCRIPTION,
  PLATFORM_DEFAULT_SITE_TITLE,
  PLATFORM_NAME,
} from "@/lib/brand/platform";
import { OG_DEFAULT_PLATFORM } from "@/lib/seo/og-defaults";
import { LeciShell } from "@/components/leci/LeciShell";
import TenantThemeProvider from "@/components/tenant/TenantThemeProvider";
import { getTenantContextOptional } from "@/lib/tenant/context";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";

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
    "BNHUB",
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
    locale: "en_CA",
    images: [
      {
        url: OG_DEFAULT_PLATFORM,
        width: 1200,
        height: 630,
        alt: `${PLATFORM_NAME} — ${PLATFORM_CARREFOUR_NAME}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: PLATFORM_DEFAULT_SITE_TITLE,
    description: PLATFORM_DEFAULT_DESCRIPTION,
    images: [OG_DEFAULT_PLATFORM],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tenantForBrand = await getTenantContextOptional();
  const activeLocale = await getLocale();
  const localeEntry =
    UI_LOCALE_ENTRIES.find((l) => l.code === activeLocale) ?? UI_LOCALE_ENTRIES[0];
  const arabicShell = localeEntry.code === "ar";

  return (
    <html
      lang={localeEntry.bcp47}
      dir={localeEntry.rtl ? "rtl" : "ltr"}
      className={`${inter.variable} ${cormorant.variable}${arabicShell ? ` ${notoArabic.variable}` : ""}`}
      suppressHydrationWarning
    >
      <body
        className={`${inter.className} min-h-screen bg-[#0B0B0B] text-white antialiased`}
      >
        <SkipLinks />
        <ConversionFlagsPanel />
        <TenantThemeProvider brand={tenantForBrand?.brand}>
          <LeciShell>{children}</LeciShell>
        </TenantThemeProvider>
      </body>
    </html>
  );
}
