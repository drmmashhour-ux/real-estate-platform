import type { ReactNode } from "react";

import { LecipmMobileTabBar } from "./lecipm-mobile-tab-bar";

type Props = {
  locale: string;
  country: string;
  children: ReactNode;
};

/** Bottom padding reserves space for the fixed tab bar (mobile only). */
export function LecipmMobileShell({ locale, country, children }: Props) {
  return (
    <div className="min-h-[100dvh] bg-black text-white md:pb-0 pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
      {children}
      <LecipmMobileTabBar locale={locale} country={country} />
    </div>
  );
}
