import type { Metadata } from "next";

import { InvestmentPage } from "@/components/lecipm-dashboard-mock/pages/InvestmentPage";

export const metadata: Metadata = {
  title: "LECIPM UI · Investment (mock)",
  robots: { index: false, follow: false },
};

export default function InvestmentMockPage() {
  return <InvestmentPage />;
}
