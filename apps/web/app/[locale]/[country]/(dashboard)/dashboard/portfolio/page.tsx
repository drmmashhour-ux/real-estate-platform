import type { Metadata } from "next";

import { PortfolioDashboardClient } from "@/components/portfolio/portfolio-dashboard-client";

export const metadata: Metadata = {
  title: "Portfolio intelligence · LECIPM",
};

export default async function PortfolioDashboardPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const basePath = `/${locale}/${country}`;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Portfolio intelligence</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Supervised autonomy — health, priorities, capital bands, and cross-portfolio themes. Execution stays
          human-gated.
        </p>
      </div>
      <PortfolioDashboardClient basePath={basePath} />
    </div>
  );
}
