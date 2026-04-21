import type { Metadata } from "next";
import { PortfolioCapitalClient } from "@/components/portfolio/portfolio-capital-client";

export const metadata: Metadata = {
  title: "Portfolio capital allocation · LECIPM",
};

export default async function PortfolioCapitalPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Capital allocation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Notional bands only — no automated capital deployment.
        </p>
      </div>
      <PortfolioCapitalClient />
    </div>
  );
}
