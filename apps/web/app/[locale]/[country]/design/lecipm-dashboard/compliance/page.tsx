import type { Metadata } from "next";

import { CompliancePage } from "@/components/lecipm-dashboard-mock/pages/CompliancePage";

export const metadata: Metadata = {
  title: "LECIPM UI · Compliance (mock)",
  robots: { index: false, follow: false },
};

export default function ComplianceMockPage() {
  return <CompliancePage />;
}
