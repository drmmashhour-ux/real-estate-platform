import { AssignmentTable } from "./AssignmentTable";
import { BanditStatsTable } from "./BanditStatsTable";
import { ExperimentMonitorPanel } from "./ExperimentMonitorPanel";
import { PlaybookControls } from "./PlaybookControls";
import { PlaybookDetailPanel } from "./PlaybookDetailPanel";
import { PlaybookSummaryCards } from "./PlaybookSummaryCards";
import { PlaybookTable, type PlaybookRow } from "./PlaybookTable";
import type { ExperimentHealth, PlaybookMemoryOverview } from "@/modules/playbook-memory/services/playbook-memory-dashboard.service";

type Asg = { id: string; domain: string; playbookId: string; selectionMode: string; outcomeStatus: string | null; createdAt: string };
type Bnd = {
  id: string;
  domain: string;
  playbookId: string;
  impressions: number;
  successes: number;
  failures: number;
  avgReward: number | null;
  updatedAt: string;
};

type DPanel = {
  playbook: { name: string; key: string; status: string; domain: string; totalExecutions: number; successfulExecutions: number; failedExecutions: number };
  lifecycle: { id: string; createdAt: string; eventType: string; reason: string | null; playbookVersionId: string | null }[];
  memorySummaries: { id: string; createdAt: string; outcomeStatus: string; actionType: string; domain: string }[];
  bandit: Bnd[];
} | null;

export function PlaybookMemoryDashboard({
  overview,
  experiment,
  playbooks,
  assignments,
  bandit,
  detail,
  selectedPlaybookId,
  basePath,
  canControl,
}: {
  overview: PlaybookMemoryOverview;
  experiment: ExperimentHealth | null;
  playbooks: PlaybookRow[];
  assignments: Asg[];
  bandit: Bnd[];
  detail: DPanel;
  selectedPlaybookId: string | null;
  basePath: string;
  canControl: boolean;
}) {
  return (
    <div className="space-y-8 text-white/90">
      <PlaybookSummaryCards overview={overview} experiment={experiment} />
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#D4AF37]">Playbooks</h2>
        <PlaybookTable playbooks={playbooks} basePath={basePath} />
      </section>
      {selectedPlaybookId ? (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#D4AF37]">Selected playbook</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <PlaybookDetailPanel detail={detail} playbookId={selectedPlaybookId} />
            <PlaybookControls playbookId={selectedPlaybookId} canControl={canControl} />
          </div>
        </section>
      ) : null}
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#D4AF37]">Experiment</h2>
        <ExperimentMonitorPanel experiment={experiment} />
      </section>
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#D4AF37]">Recent assignments</h2>
        <AssignmentTable assignments={assignments} />
      </section>
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#D4AF37]">Bandit stats (top)</h2>
        <BanditStatsTable rows={bandit} />
      </section>
    </div>
  );
}
