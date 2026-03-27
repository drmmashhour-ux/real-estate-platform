"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { isInvestmentShellPath } from "@/lib/product-focus";
import { InvestmentMobileBottomNav } from "@/components/investment/InvestmentMobileBottomNav";

/**
 * Mobile: extra bottom padding for fixed tab bar + optional safe-area.
 * Desktop: normal footer clearance (pb-28 from parent main).
 */
export function InvestmentShellChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const shell = isInvestmentShellPath(pathname);

  if (!shell) {
    return <div className="min-h-0 flex-1 overflow-x-hidden">{children}</div>;
  }

  return (
    <div className="min-h-0 flex-1 overflow-x-hidden pb-[calc(4.25rem+env(safe-area-inset-bottom))] lg:pb-0">
      {children}
      <InvestmentMobileBottomNav />
    </div>
  );
}
