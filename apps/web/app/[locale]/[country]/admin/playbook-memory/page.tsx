import Link from "next/link";
import { redirect } from "next/navigation";
import { PlaybookMemoryDashboard } from "@/components/admin/playbook-memory/PlaybookMemoryDashboard";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { playbookMemoryDashboardService } from "@/modules/playbook-memory/services/playbook-memory-dashboard.service";

export const dynamic = "force-dynamic";

function mapDetail(d: NonNullable<Awaited<ReturnType<typeof playbookMemoryDashboardService.getPlaybookDetail>>>) {
  return {
    playbook: {
      name: d.playbook.name,
      key: d.playbook.key,
      status: d.playbook.status,
      domain: String(d.playbook.domain),
      totalExecutions: d.playbook.totalExecutions,
      successfulExecutions: d.playbook.successfulExecutions,
      failedExecutions: d.playbook.failedExecutions,
    },
    lifecycle: d.lifecycle.map((e) => ({
      id: e.id,
      createdAt: e.createdAt.toISOString(),
      eventType: e.eventType,
      reason: e.reason,
      playbookVersionId: e.playbookVersionId,
    })),
    memorySummaries: d.memorySummaries.map((m) => ({
      id: m.id,
      createdAt: m.createdAt.toISOString(),
      outcomeStatus: m.outcomeStatus,
      actionType: m.actionType,
      domain: m.domain,
    })),
    bandit: d.bandit.map((b) => ({
      id: b.id,
      domain: String(b.domain),
      playbookId: b.playbookId,
      impressions: b.impressions,
      successes: b.successes,
      failures: b.failures,
      avgReward: b.avgReward ?? null,
      updatedAt: b.updatedAt.toISOString(),
    })),
  };
}

export default async function PlaybookMemoryAdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; country: string }>;
  searchParams: Promise<{ p?: string }>;
}) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    redirect("/auth/login?returnUrl=/admin/playbook-memory");
  }

  const { locale, country } = await params;
  const { p: playbookId } = await searchParams;
  const basePath = `/${locale}/${country}/admin/playbook-memory`;

  const [overview, experiment, summaries, recentAssignments, banditRows, detailRaw] = await Promise.all([
    playbookMemoryDashboardService.getOverview(),
    playbookMemoryDashboardService.getExperimentHealth(),
    playbookMemoryDashboardService.getPlaybookSummaries(200),
    playbookMemoryDashboardService.getRecentAssignments({ limit: 40 }),
    playbookMemoryDashboardService.getBanditStatsView({ limit: 50 }),
    playbookId ? playbookMemoryDashboardService.getPlaybookDetail(playbookId) : Promise.resolve(null),
  ]);

  const playbooks = summaries.map((p) => ({
    id: p.id,
    name: p.name,
    key: p.key,
    status: p.status,
    domain: String(p.domain),
    updatedAt: p.updatedAt.toISOString(),
  }));

  const assignments = recentAssignments.map((a) => ({
    id: a.id,
    domain: String(a.domain),
    playbookId: a.playbookId,
    selectionMode: a.selectionMode,
    outcomeStatus: a.outcomeStatus == null ? null : String(a.outcomeStatus),
    createdAt: a.createdAt.toISOString(),
  }));

  const bandit = banditRows.map((b) => ({
    id: b.id,
    domain: String(b.domain),
    playbookId: b.playbookId,
    impressions: b.impressions,
    successes: b.successes,
    failures: b.failures,
    avgReward: b.avgReward ?? null,
    updatedAt: b.updatedAt.toISOString(),
  }));

  const detail = detailRaw ? mapDetail(detailRaw) : null;

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-8 text-slate-50">
      <div className="mx-auto max-w-6xl">
        <Link href={`/${locale}/${country}/admin`} className="text-sm text-amber-400/90 hover:text-amber-300">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-white">Playbook memory (operator)</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/45">
          Read-safe overview and explicit lifecycle controls. Actions are auditable; no automated experiment runners are exposed
          from this page.
        </p>

        <div className="mt-8">
          <PlaybookMemoryDashboard
            overview={overview}
            experiment={experiment}
            playbooks={playbooks}
            assignments={assignments}
            bandit={bandit}
            detail={detail}
            selectedPlaybookId={playbookId ?? null}
            basePath={basePath}
            canControl
          />
        </div>
      </div>
    </main>
  );
}
