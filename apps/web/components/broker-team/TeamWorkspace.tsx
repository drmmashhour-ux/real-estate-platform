import type { BrokerTeamView, BrokerTeamMemberView } from "@/types/broker-team-client";
import Link from "next/link";
import { TeamMemberCard } from "./TeamMemberCard";
import { TeamActivityFeed } from "./TeamActivityFeed";

export function TeamWorkspace({
  basePath,
  teams,
}: {
  basePath: string;
  teams: (BrokerTeamView)[];
}) {
  if (teams.length === 0) {
    return (
      <div className="rounded-2xl border border-ds-border bg-ds-card/50 p-8">
        <p className="text-sm text-ds-text-secondary">No teams yet. Create one via the API or future onboarding flow.</p>
        <p className="mt-2 text-xs text-ds-text-secondary">
          POST <code className="text-ds-gold/90">/api/broker/team</code> with <code className="text-ds-gold/90">{"{ \"name\": \"…\" }"}</code>
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {teams.map((t) => (
          <div key={t.id} className="rounded-2xl border border-ds-border bg-black/30 p-5 shadow-ds-soft">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-medium text-ds-text">{t.name}</h3>
                <p className="text-xs text-ds-text-secondary">Team id · {t.id.slice(0, 8)}…</p>
              </div>
              <Link
                href={`${basePath}/team/deals`}
                className="text-xs text-ds-gold hover:underline"
              >
                Deal board →
              </Link>
            </div>
            <div className="mt-4 space-y-2">
              {t.members.map((m) => (
                <TeamMemberCard key={m.id} userId={m.userId} role={m.role} status={m.status} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <TeamActivityFeed />
    </div>
  );
}
