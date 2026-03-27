"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { WorkspaceMembersTable } from "./WorkspaceMembersTable";
import { WorkspaceUsagePanel } from "./WorkspaceUsagePanel";
import { WorkspaceAuditTimeline } from "./WorkspaceAuditTimeline";

export type WorkspaceOverviewDashboardProps = {
  workspaceId: string;
  canViewAudit: boolean;
};

type OverviewPayload = {
  workspace: {
    id: string;
    name: string;
    slug: string;
    planTier: string;
    seatLimit: number;
    memberCount: number;
    pendingInvites: number;
    createdAt: string;
  };
  billing: { planCode: string; status: string; currentPeriodEnd: string | null } | null;
};

type MemberRow = {
  membershipId: string;
  role: string;
  joinedAt: string;
  user: { id: string; email: string | null; name: string | null };
};

type UsageData = {
  workspaceId: string;
  activeMembers: number;
  copilotRuns: number;
  trustgraphRunsFromAudit: number;
  dealAnalysesFromAudit: number;
  auditActionCounts: { action: string; count: number }[];
};

type AuditLogRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: unknown;
  createdAt: string;
  actor: { id: string; email: string | null; name: string | null };
};

export function WorkspaceOverviewDashboard({ workspaceId, canViewAudit }: WorkspaceOverviewDashboardProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewPayload | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [audit, setAudit] = useState<AuditLogRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const [oRes, mRes, uRes, aRes] = await Promise.all([
          fetch(`/api/workspaces/${workspaceId}`, { credentials: "include" }),
          fetch(`/api/workspaces/${workspaceId}/members`, { credentials: "include" }),
          fetch(`/api/workspaces/${workspaceId}/usage`, { credentials: "include" }),
          canViewAudit
            ? fetch(`/api/workspaces/${workspaceId}/audit-logs?take=50`, { credentials: "include" })
            : Promise.resolve(null),
        ]);

        const oJson = (await oRes.json()) as { error?: string; workspace?: OverviewPayload["workspace"]; billing?: OverviewPayload["billing"] };
        if (!oRes.ok) {
          setError(oJson.error ?? `Overview failed (${oRes.status})`);
          return;
        }
        if (!cancelled && oJson.workspace) {
          setOverview({ workspace: oJson.workspace, billing: oJson.billing ?? null });
        }

        const mJson = (await mRes.json()) as { error?: string; members?: MemberRow[] };
        if (mRes.ok && mJson.members && !cancelled) setMembers(mJson.members);

        const uJson = (await uRes.json()) as { error?: string } & Partial<UsageData>;
        if (uRes.ok && uJson.workspaceId && !cancelled) {
          setUsage(uJson as UsageData);
        }

        if (aRes) {
          const aJson = (await aRes.json()) as { error?: string; logs?: AuditLogRow[] };
          if (aRes.ok && aJson.logs && !cancelled) setAudit(aJson.logs);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load workspace");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId, canViewAudit]);

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#0f0f0f] p-8 text-sm text-slate-400">Loading workspace…</div>
    );
  }
  if (error || !overview) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-6 text-sm text-amber-100">
        {error ?? "Workspace unavailable."}
      </div>
    );
  }

  const { workspace, billing } = overview;

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500/90">Enterprise workspace</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-100">{workspace.name}</h1>
            <p className="mt-1 text-sm text-slate-400">
              {workspace.slug} · Plan {workspace.planTier} · Seats {workspace.memberCount}/{workspace.seatLimit}
              {workspace.pendingInvites > 0 ? ` · ${workspace.pendingInvites} pending invite(s)` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href={`/dashboard/workspaces/${workspaceId}/monopoly`} className="text-[#C9A646]/90 hover:text-[#C9A646]">
              Monopoly layer
            </Link>
            <Link href={`/dashboard/workspaces/${workspaceId}/team`} className="text-violet-400/90 hover:text-violet-300">
              Team dashboard
            </Link>
            <Link href="/dashboard/tenant" className="text-emerald-400/90 hover:text-emerald-300">
              ← Team & workspace
            </Link>
          </div>
        </div>
      </header>

      <section className="rounded-xl border border-white/10 bg-[#0f0f0f] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#C9A646]/90">Billing / plan</h2>
        {billing ? (
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-slate-500">Plan code</dt>
              <dd className="font-medium text-slate-100">{billing.planCode}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Status</dt>
              <dd className="font-medium text-slate-100">{billing.status}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Current period ends</dt>
              <dd className="font-medium text-slate-100">
                {billing.currentPeriodEnd ? new Date(billing.currentPeriodEnd).toLocaleDateString() : "—"}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 text-sm text-slate-500">No Stripe subscription linked to this workspace yet.</p>
        )}
      </section>

      {usage ? (
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-slate-100">Usage</h2>
          <WorkspaceUsagePanel usage={usage} />
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-slate-100">Members</h2>
        <WorkspaceMembersTable members={members} />
      </section>

      {canViewAudit ? (
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-slate-100">Admin activity & audit</h2>
          <p className="text-xs text-slate-500">Recent workspace-scoped events (sanitized; no TrustGraph internals).</p>
          <WorkspaceAuditTimeline logs={audit} />
        </section>
      ) : null}
    </div>
  );
}
