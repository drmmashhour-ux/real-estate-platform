import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PLATFORM_DEFAULT_SITE_TITLE, PLATFORM_NAME } from "@/lib/brand/platform";
import { MarketingPageViewTracker } from "@/src/modules/growth/MarketingPageViewTracker";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: { default: `Blog · ${PLATFORM_DEFAULT_SITE_TITLE}`, template: `%s · Blog · ${PLATFORM_NAME}` },
  description: "Guides for buyers, renters, hosts, and investors — Quebec-focused SEO content and platform deep links.",
  openGraph: {
    siteName: PLATFORM_NAME,
    type: "website",
    locale: "en_CA",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <MarketingPageViewTracker />
      {children}
    </>
  );
}
