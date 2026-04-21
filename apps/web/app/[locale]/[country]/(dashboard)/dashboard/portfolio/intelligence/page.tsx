import type { Metadata } from "next";
import { PortfolioIntelligenceClient } from "@/components/portfolio/portfolio-intelligence-client";

export const metadata: Metadata = {
  title: "Portfolio optimization · LECIPM",
};

export default async function PortfolioIntelligencePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Portfolio optimization</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Objective-led runs persist audit records — approvals remain policy-bound.
        </p>
      </div>
      <PortfolioIntelligenceClient />
    </div>
  );
}
