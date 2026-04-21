import type { Metadata } from "next";

import { DealEnginePage } from "@/components/lecipm-dashboard-mock/pages/DealEnginePage";

export const metadata: Metadata = {
  title: "LECIPM UI · Deal engine (mock)",
  robots: { index: false, follow: false },
};

export default function DealsMockPage() {
  return <DealEnginePage />;
}
