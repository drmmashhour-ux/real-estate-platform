"use client";

import { useState } from "react";
import { WorkspaceMembersTable } from "@/components/enterprise/WorkspaceMembersTable";
import { InviteUserModal } from "./InviteUserModal";

type MemberRow = {
  membershipId: string;
  role: string;
  joinedAt: string;
  user: { id: string; email: string | null; name: string | null };
};

export type TeamMembersPanelProps = {
  workspaceId: string;
  members: MemberRow[];
  canManageMembers: boolean;
  onRefresh?: () => void;
};

export function TeamMembersPanel({ workspaceId, members, canManageMembers, onRefresh }: TeamMembersPanelProps) {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-medium text-slate-100">Team members</h2>
        {canManageMembers ? (
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-200 hover:bg-emerald-500/20"
          >
            Invite user
          </button>
        ) : null}
      </div>
      <WorkspaceMembersTable members={members} />
      <InviteUserModal
        workspaceId={workspaceId}
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={() => onRefresh?.()}
      />
    </section>
  );
}
