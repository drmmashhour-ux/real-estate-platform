import type { Metadata } from "next";

import { InvestmentConsoleClient } from "@/components/lecipm-console/investment-console-client";

export const metadata: Metadata = {
  title: "Investment · LECIPM Console",
};

export default function LecipmConsoleInvestmentPage() {
  return <InvestmentConsoleClient />;
}
