import type { Metadata } from "next";

import { LeadsConsoleClient } from "@/components/lecipm-console/leads-console-client";

export const metadata: Metadata = {
  title: "Leads · LECIPM Console",
};

export default function LecipmConsoleLeadsPage() {
  return <LeadsConsoleClient />;
}
