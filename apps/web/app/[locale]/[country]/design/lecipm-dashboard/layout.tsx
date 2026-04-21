import type { ReactNode } from "react";
import { Montserrat, Open_Sans } from "next/font/google";

import { LecipmDashboardMockLayout } from "@/components/lecipm-dashboard-mock/LecipmDashboardMockLayout";

const montserrat = Montserrat({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700"],
  variable: "--font-lecipm-mock-heading",
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600"],
  variable: "--font-lecipm-mock-body",
  display: "swap",
});

export default function LecipmDashboardDesignLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${montserrat.variable} ${openSans.variable} font-[family-name:var(--font-lecipm-mock-body)] antialiased [--font-heading:var(--font-lecipm-mock-heading)]`}
    >
      <LecipmDashboardMockLayout>{children}</LecipmDashboardMockLayout>
    </div>
  );
}
