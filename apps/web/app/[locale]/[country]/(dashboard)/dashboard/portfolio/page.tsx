import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { listPortfoliosForOwner } from "@/modules/portfolio/portfolio.service";
import { PortfolioDashboardClient } from "@/components/portfolio/portfolio-dashboard-client";
import { PortfolioOsCreateForm } from "./portfolio-os-client";

export const metadata: Metadata = {
  title: "Portfolio OS · LECIPM",
};

export default async function PortfolioDashboardPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const basePath = `/${locale}/${country}`;
  const portfolioBase = `${basePath}/dashboard/portfolio`;

  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== "BROKER" && user.role !== "ADMIN" && user.role !== "INVESTOR")) {
    redirect(`${basePath}/dashboard`);
  }

  const portfolios = await listPortfoliosForOwner(userId);

  return (
    <div className="mx-auto max-w-5xl space-y-10 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Portfolio OS</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track Phase 6 assets, performance, health, capital allocation proposals, and explainable AI recommendations
          — execution stays human-gated.
        </p>
      </div>

      <section className="space-y-4 rounded-lg border p-4">
        <h2 className="font-medium">Your portfolios</h2>
        <PortfolioOsCreateForm />
        <ul className="space-y-2 text-sm">
          {portfolios.length === 0 ?
            <li className="text-muted-foreground">No portfolios yet.</li>
          : portfolios.map((p) => (
              <li key={p.id}>
                <Link className="text-primary underline" href={`${portfolioBase}/${p.id}`}>
                  {p.name}
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  · {p.totalAssets} assets · value {p.totalValue ?? "—"}
                </span>
              </li>
            ))
          }
        </ul>
      </section>

      <section className="space-y-3 border-t pt-8">
        <h2 className="text-lg font-medium">Legacy portfolio intelligence</h2>
        <p className="text-sm text-muted-foreground">
          Cross-portfolio themes and supervised autopilot context (existing workspace).
        </p>
        <PortfolioDashboardClient basePath={basePath} />
      </section>
    </div>
  );
}
