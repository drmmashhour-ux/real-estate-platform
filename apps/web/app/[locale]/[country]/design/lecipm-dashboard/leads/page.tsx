import type { Metadata } from "next";

import { LeadsPage } from "@/components/lecipm-dashboard-mock/pages/LeadsPage";

export const metadata: Metadata = {
  title: "LECIPM UI · Leads (mock)",
  robots: { index: false, follow: false },
};

export default function LeadsMockPage() {
  return <LeadsPage />;
}
