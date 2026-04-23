import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { canAccessBrokerPortfolio } from "@/modules/portfolio/portfolio-policy";
import { getPortfolioById } from "@/modules/portfolio/portfolio.service";
import {
  detectTopPerformers,
  identifyRiskAssets,
  rankAssets,
} from "@/modules/portfolio/portfolio-intelligence.service";
import { getLatestHealth } from "@/modules/portfolio/asset-health.service";
import { getLatestPerformance } from "@/modules/portfolio/asset-performance.service";
import { PortfolioDetailClient } from "./portfolio-detail-client";

export const dynamic = "force-dynamic";

export default async function PortfolioOsDetailPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; portfolioId: string }>;
}) {
  const { locale, country, portfolioId } = await params;
  const base = `/${locale}/${country}/dashboard/portfolio`;

  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== "BROKER" && user.role !== "ADMIN" && user.role !== "INVESTOR")) {
    redirect(`/${locale}/${country}/dashboard`);
  }

  const portfolio = await getPortfolioById(portfolioId);
  if (!portfolio) notFound();

  if (!canAccessBrokerPortfolio(user.role, userId, portfolio)) {
    redirect(base);
  }

  const [ranked, riskAssets, topPerformers] = await Promise.all([
    rankAssets(portfolioId),
    identifyRiskAssets(portfolioId),
    detectTopPerformers(portfolioId),
  ]);

  const decisions = await prisma.lecipmBrokerPortfolioDecision.findMany({
    where: { portfolioId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const assetsWithHealth = await Promise.all(
    portfolio.assetLinks.map(async (l) => ({
      link: l,
      health: await getLatestHealth(l.assetId),
      performance: await getLatestPerformance(l.assetId),
    }))
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <div>
        <Link className="text-sm text-muted-foreground underline" href={base}>
          ← Portfolios
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">{portfolio.name}</h1>
        <p className="text-muted-foreground text-sm">
          Value: {portfolio.totalValue ?? "—"} · Assets: {portfolio.totalAssets}
        </p>
      </div>

      <PortfolioDetailClient portfolioId={portfolioId} />

      <section>
        <h2 className="font-medium">Assets</h2>
        <table className="mt-2 w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b">
              <th className="py-2">Name</th>
              <th>Score</th>
              <th>Band</th>
              <th>Risk</th>
              <th>NOI (last)</th>
            </tr>
          </thead>
          <tbody>
            {assetsWithHealth.map(({ link, health, performance }) => (
              <tr key={link.id} className="border-b border-border/40">
                <td className="py-2">{link.asset.assetName}</td>
                <td>{health?.score?.toFixed(1) ?? "—"}</td>
                <td>{health?.band ?? "—"}</td>
                <td>{health?.riskLevel ?? "—"}</td>
                <td>{performance?.noi != null ? performance.noi.toFixed(0) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="font-medium">Intelligence</h2>
        <div className="mt-2 grid gap-4 text-xs md:grid-cols-3">
          <div>
            <p className="font-medium">Top</p>
            <ul className="mt-1 list-inside list-disc">
              {topPerformers.slice(0, 5).map((r) => (
                <li key={r.assetId}>
                  {r.assetName} ({r.score})
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-medium">Risk</p>
            <ul className="mt-1 list-inside list-disc">
              {riskAssets.slice(0, 5).map((r) => (
                <li key={r.assetId}>{r.assetName}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-medium">Ranking</p>
            <ul className="mt-1 list-inside list-disc">
              {ranked.slice(0, 5).map((r) => (
                <li key={r.assetId}>
                  {r.assetName}: {r.score}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-medium">AI recommendations (proposed)</h2>
        <ul className="mt-2 space-y-2 text-xs">
          {decisions.map((d) => (
            <li key={d.id} className="rounded border p-2">
              <span className="font-mono">{d.decisionType}</span> · confidence{" "}
              {d.confidenceScore ?? "—"} · {d.status}
              <p className="mt-1 text-muted-foreground">{d.rationale.slice(0, 280)}…</p>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-muted-foreground text-xs">
        Recommendations are non-destructive proposals. Execution requires explicit human approval outside this
        demo UI.
      </p>
    </div>
  );
}
