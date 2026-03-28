import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { marketingTheme } from "@/config/theme";
import { PLATFORM_DEFAULT_DESCRIPTION, PLATFORM_NAME } from "@/lib/brand/platform";

/** Defaults for marketing routes; child `page.tsx` metadata overrides title/description. */
export const metadata: Metadata = {
  openGraph: { siteName: PLATFORM_NAME, type: "website" },
  twitter: { card: "summary_large_image" },
  description: PLATFORM_DEFAULT_DESCRIPTION,
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col text-slate-50" style={{ backgroundColor: marketingTheme.bg }}>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
