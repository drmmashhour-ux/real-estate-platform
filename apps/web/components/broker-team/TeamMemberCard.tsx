import type { BrokerTeamMemberRole, BrokerTeamMemberStatus } from "@prisma/client";

export function TeamMemberCard({
  userId,
  role,
  status,
}: {
  userId: string;
  role: BrokerTeamMemberRole;
  status: BrokerTeamMemberStatus;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-ds-border bg-ds-card/40 px-3 py-2 text-sm">
      <span className="font-mono text-xs text-ds-text-secondary">{userId.slice(0, 8)}…</span>
      <span className="text-ds-text-secondary">
        {role} · {status}
      </span>
    </div>
  );
}
