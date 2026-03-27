"use client";

import { useCallback, useEffect, useState } from "react";
import { OrganizationSettings } from "./OrganizationSettings";
import { TeamMembersPanel } from "./TeamMembersPanel";
import { TeamDashboard } from "./TeamDashboard";

type MemberRow = {
  membershipId: string;
  role: string;
  joinedAt: string;
  user: { id: string; email: string | null; name: string | null };
};

export function WorkspaceTeamShell(props: {
  workspaceId: string;
  initialName: string;
  initialSettings: Record<string, unknown> | null;
  canManageMembers: boolean;
  canEditOrg: boolean;
}) {
  const { workspaceId, initialName, initialSettings, canManageMembers, canEditOrg } = props;
  const [members, setMembers] = useState<MemberRow[]>([]);

  const loadMembers = useCallback(async () => {
    const res = await fetch(`/api/workspaces/${workspaceId}/members`, { credentials: "include" });
    const json = (await res.json()) as { members?: MemberRow[] };
    if (res.ok && json.members) setMembers(json.members);
  }, [workspaceId]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  return (
    <div className="space-y-12">
      <OrganizationSettings
        workspaceId={workspaceId}
        initialName={initialName}
        initialSettings={initialSettings}
        canEdit={canEditOrg}
        onSaved={() => void loadMembers()}
      />
      <TeamMembersPanel
        workspaceId={workspaceId}
        members={members}
        canManageMembers={canManageMembers}
        onRefresh={() => void loadMembers()}
      />
      <TeamDashboard workspaceId={workspaceId} />
    </div>
  );
}
