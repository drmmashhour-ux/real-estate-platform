import type { Metadata } from "next";

import { DashboardHome } from "@/components/lecipm-dashboard-mock/pages/DashboardHome";

export const metadata: Metadata = {
  title: "LECIPM UI · Dashboard (mock)",
  robots: { index: false, follow: false },
};

export default function LecipmDashboardMockHomePage() {
  return <DashboardHome />;
}
