"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { isMarketingHomePath } from "@/lib/layout/marketing-home";

/**
 * Marketing home: less bottom padding (no floating dock). Other routes: room for GlobalFooterDock.
 */
export function MarketingMainArea({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const home = isMarketingHomePath(pathname);
  return (
    <main
      id="main-content"
      className={`flex min-h-0 flex-1 flex-col overflow-x-hidden ${home ? "pb-8 sm:pb-10" : "pb-40"}`}
    >
      {children}
    </main>
  );
}
