import type { Metadata } from "next";
import { PortfolioReportsClient } from "@/components/portfolio/portfolio-reports-client";

export const metadata: Metadata = {
  title: "Portfolio reports · LECIPM",
};

export default async function PortfolioReportsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Portfolio reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">Reusable JSON payloads — PDF export can layer on later.</p>
      </div>
      <PortfolioReportsClient />
    </div>
  );
}
