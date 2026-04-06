import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { PLATFORM_DEFAULT_DESCRIPTION, PLATFORM_DEFAULT_SITE_TITLE, PLATFORM_NAME } from "@/lib/brand/platform";
import { MarketingPageViewTracker } from "@/src/modules/growth/MarketingPageViewTracker";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";

/** Defaults for marketing routes; child `page.tsx` metadata overrides title/description. */
export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: { default: PLATFORM_DEFAULT_SITE_TITLE, template: `%s · ${PLATFORM_NAME}` },
  openGraph: { siteName: PLATFORM_NAME, type: "website", locale: "en_CA" },
  twitter: { card: "summary_large_image" },
  description: PLATFORM_DEFAULT_DESCRIPTION,
  robots: { index: true, follow: true },
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <MarketingPageViewTracker />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
