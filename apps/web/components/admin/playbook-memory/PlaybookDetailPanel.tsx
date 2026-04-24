import { BanditStatsTable } from "./BanditStatsTable";
import { LifecycleEventList } from "./LifecycleEventList";

type Detail = {
  playbook: { name: string; key: string; status: string; domain: string; totalExecutions: number; successfulExecutions: number; failedExecutions: number };
  lifecycle: { id: string; createdAt: string; eventType: string; reason: string | null; playbookVersionId: string | null }[];
  memorySummaries: { id: string; createdAt: string; outcomeStatus: string; actionType: string; domain: string }[];
  bandit: {
    id: string;
    domain: string;
    playbookId: string;
    impressions: number;
    successes: number;
    failures: number;
    avgReward: number | null;
    updatedAt: string;
  }[];
};

export function PlaybookDetailPanel({ detail, playbookId }: { detail: Detail | null; playbookId: string | null }) {
  if (!playbookId) {
    return <p className="text-sm text-white/50">Select a playbook from the table to inspect details.</p>;
  }
  if (detail == null) {
    return <p className="text-sm text-amber-200/80">Playbook not found or could not be loaded.</p>;
  }
  return (
    <div className="space-y-4 rounded-xl border border-amber-600/20 bg-[#0a0a0a] p-4 text-white/90">
      <div>
        <h2 className="text-lg font-semibold text-white">{detail.playbook.name}</h2>
        <p className="text-xs text-white/50">
          {detail.playbook.key} · {detail.playbook.domain} · {detail.playbook.status} · total runs {detail.playbook.totalExecutions} (ok {detail.playbook.successfulExecutions} / fail{" "}
          {detail.playbook.failedExecutions})
        </p>
      </div>
      <LifecycleEventList events={detail.lifecycle} />
      <div>
        <p className="text-xs font-semibold uppercase text-[#D4AF37]">Recent memory records</p>
        {detail.memorySummaries.length === 0 ? (
          <p className="text-sm text-white/50">None.</p>
        ) : (
          <ul className="mt-1 max-h-32 space-y-1 overflow-y-auto text-xs text-white/70">
            {detail.memorySummaries.map((m) => (
              <li key={m.id}>
                {m.createdAt.slice(0, 19)} · {m.actionType} · {m.outcomeStatus} · {m.domain}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase text-[#D4AF37]">Bandit stats (rows)</p>
        <div className="mt-2">
          <BanditStatsTable rows={detail.bandit} />
        </div>
      </div>
    </div>
  );
}
