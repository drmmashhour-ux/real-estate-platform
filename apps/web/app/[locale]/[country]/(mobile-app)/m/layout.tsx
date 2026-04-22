import type { ReactNode } from "react";

import { LecipmMobileShell } from "@/components/mobile/lecipm-mobile-shell";

export default async function MobileAppShellLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;

  return (
    <LecipmMobileShell locale={locale} country={country}>
      {children}
    </LecipmMobileShell>
  );
}
