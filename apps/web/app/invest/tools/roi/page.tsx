import type { Metadata } from "next";
import { ToolShell } from "@/components/tools/ToolShell";
import { RoiCalculatorClient } from "./RoiCalculatorClient";

export const metadata: Metadata = {
  title: "Investor ROI calculator",
  description: "Estimate rental yield, cap rate, cash flow, and cash-on-cash return — informational only.",
};

export default function InvestRoiPage() {
  return (
    <ToolShell
      title="ROI calculator"
      subtitle="Premium estimates for rental investments — not investment advice."
    >
      <RoiCalculatorClient />
    </ToolShell>
  );
}
