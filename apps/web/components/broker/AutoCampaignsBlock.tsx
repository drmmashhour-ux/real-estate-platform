import { getLegacyDB } from "@/lib/db/legacy";
import { scoreCampaign } from "@/lib/marketing/autonomousCampaignLauncher";
import { derivePerformanceMetrics } from "@/lib/marketing/campaignEnginePure";

import { AutoLaunchButton } from "./AutoLaunchButton";

type Row = {
  id: string;
  platform: string;
  status: string;
  headline: string;
  ctr: string | null;
  score: number | null;
  createdAt: string;
};

async function loadRecent(userId: string): Promise<Row[]> {
  const prisma = getLegacyDB();
  const rows = await prisma.brokerAdSimulationCampaign.findMany({
    where: { userId, createdBy: "ai" },
    orderBy: { createdAt: "desc" },
    take: 12,
    include: { performanceRows: { take: 1, orderBy: { createdAt: "desc" } } },
  });
  return rows.map((c) => {
    const p = c.performanceRows[0];
    const m = p ? derivePerformanceMetrics(p) : null;
    return {
      id: c.id,
      platform: c.platform,
      status: c.status,
      headline: c.headline.slice(0, 80) + (c.headline.length > 80 ? "…" : ""),
      ctr: m ? `${(m.ctr * 100).toFixed(2)}%` : null,
      score: m ? scoreCampaign(m) : null,
      createdAt: c.createdAt.toISOString(),
    };
  });
}

function fmtScore(n: number | null) {
  if (n == null) {
    return "—";
  }
  return n.toFixed(2);
}

/**
 * Order 89 — “Auto campaigns” (simulation-only; `createdBy: ai` from the autonomous launcher when not dry run).
 */
export async function AutoCampaignsBlock({ userId, featureEnabled }: { userId: string; featureEnabled: boolean }) {
  if (!featureEnabled) {
    return null;
  }
  const recent = await loadRecent(userId);
  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Auto campaigns</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Simulation pipeline: no live ad spend. Default dry run scores in memory only. Full run creates `ai` draft campaigns, simulates, and selects top performers. Real publishing always requires manual approval.
          </p>
        </div>
        <AutoLaunchButton />
      </div>
      {recent.length === 0 ? (
        <p className="text-sm text-muted-foreground">No auto-generated campaigns yet. Run a dry run or full run from the button above.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-2 py-2">Platform</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Headline</th>
                <th className="px-2 py-2">CTR</th>
                <th className="px-2 py-2">Raw score hint</th>
                <th className="px-2 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id} className="border-b border-border/60">
                  <td className="px-2 py-2 font-mono text-xs uppercase">{r.platform}</td>
                  <td className="px-2 py-2 capitalize">{r.status}</td>
                  <td className="px-2 py-2 text-muted-foreground">{r.headline}</td>
                  <td className="px-2 py-2 tabular-nums">{r.ctr ?? "—"}</td>
                  <td className="px-2 py-2 tabular-nums">{fmtScore(r.score)}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
