import type { ReactNode } from "react";

import "@/components/soins/soins-hub.css";

import { SoinsDashboardA11yBar } from "@/components/soins/SoinsDashboardA11yBar";

/** Extra bottom padding on small screens where family hub uses sticky nav. */
export default function DashboardSoinsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-[#050505] pb-24 text-[#FAFAF8] md:pb-10">
      <div className="sticky top-0 z-30 border-b border-[#D4AF37]/12 bg-black/85 backdrop-blur-md">
        <SoinsDashboardA11yBar />
      </div>
      {children}
    </div>
  );
}

