"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { ProjectPaywall } from "@/components/projects/ProjectPaywall";

type Subscription = {
  projectId: string;
  isTrial: boolean;
  trialEnd: string;
  daysRemaining: number;
  plan: string;
  isActive: boolean;
  isExpired: boolean;
};

type Stats = {
  projectId: string;
  projectName: string;
  totalLeads: number;
  unlockedLeads: number;
  lockedLeads: number;
  revenue: number;
  conversionRate: number;
  plan: string;
  isTrial: boolean;
  trialEnd: string | null;
};

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  projectId: string | null;
  status: string;
  score: number;
  isLocked?: boolean;
  createdAt: string;
};

export default function ProjectDetailDashboardPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const theme = getHubTheme("projects");
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/projects/${id}/subscription`, { credentials: "same-origin" }).then((r) => r.json()),
      fetch(`/api/projects/${id}/stats`, { credentials: "same-origin" }).then((r) => r.json()),
      fetch("/api/leads", { credentials: "same-origin" }).then((r) => r.json()),
    ])
      .then(([sub, st, leadsData]) => {
        setSubscription(sub?.error ? null : sub);
        setStats(st?.error ? null : st);
        const list = Array.isArray(leadsData) ? leadsData : [];
        setLeads(list.filter((l: Lead) => l.projectId === id));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const [unlockLoading, setUnlockLoading] = useState<string | null>(null);
  const startUnlockCheckout = async (leadId: string) => {
    setUnlockLoading(leadId);
    try {
      const res = await fetch(`/api/projects/${id}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "lead", leadId }),
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data?.error ?? "Checkout failed");
      }
    } finally {
      setUnlockLoading(null);
    }
  };

  if (!id) {
    return (
      <HubLayout title="Projects" hubKey="projects" navigation={hubNavigation.projects}>
        <p className="text-slate-400">Invalid project.</p>
        <Link href="/dashboard/projects" className="text-teal-400 hover:underline">← Projects</Link>
      </HubLayout>
    );
  }

  return (
    <HubLayout
      title="Projects"
      hubKey="projects"
      navigation={hubNavigation.projects}
    >
      <div className="space-y-8">
        <Link href="/dashboard/projects" className="inline-block text-sm font-medium text-teal-400 hover:underline">
          ← All projects
        </Link>

        {loading ? (
          <p className="text-slate-400">Loading…</p>
        ) : (
          <>
            {subscription?.isExpired && subscription?.plan === "free" && stats && (
              <ProjectPaywall
                projectId={id}
                projectName={stats.projectName}
                onSubscribe={fetchData}
              />
            )}

            {subscription && !(subscription.isExpired && subscription.plan === "free") && (
              <section className="rounded-2xl border border-white/10 p-6" style={{ backgroundColor: theme.cardBg }}>
                <h2 className="mb-4 text-lg font-semibold" style={{ color: theme.accent }}>
                  Trial & plan
                </h2>
                <div className="flex flex-wrap gap-4">
                  {subscription.isTrial && (
                    <p className="text-slate-300">
                      Trial: <strong>{subscription.daysRemaining} days remaining</strong>
                    </p>
                  )}
                  <p className="text-slate-300">
                    Plan: <strong className="capitalize">{subscription.plan.replace(/_/g, " ")}</strong>
                  </p>
                </div>
              </section>
            )}

            {stats && (
              <section className="rounded-2xl border border-white/10 p-6" style={{ backgroundColor: theme.cardBg }}>
                <h2 className="mb-4 text-lg font-semibold" style={{ color: theme.accent }}>
                  Stats
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="rounded-xl bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-500">Leads received</p>
                    <p className="mt-1 text-2xl font-bold" style={{ color: theme.accent }}>{stats.totalLeads}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-500">Unlocked</p>
                    <p className="mt-1 text-2xl font-bold text-white">{stats.unlockedLeads}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-500">Locked</p>
                    <p className="mt-1 text-2xl font-bold text-amber-400">{stats.lockedLeads}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-500">Revenue</p>
                    <p className="mt-1 text-2xl font-bold" style={{ color: theme.accent }}>${stats.revenue.toFixed(2)}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-500">Conversion</p>
                    <p className="mt-1 text-2xl font-bold text-white">{stats.conversionRate}%</p>
                  </div>
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-white/10 overflow-hidden" style={{ backgroundColor: theme.cardBg }}>
              <h2 className="border-b border-white/10 px-6 py-4 text-lg font-semibold" style={{ color: theme.text }}>
                Leads
              </h2>
              {leads.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">No leads yet for this project.</p>
              ) : (
                <div className="divide-y divide-white/10">
                  {leads.map((lead) => (
                    <div key={lead.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                      <div>
                        <p className="font-medium text-white">{lead.name}</p>
                        <p className="text-sm text-slate-400">
                          {lead.isLocked ? "Contact locked" : `${lead.email} · ${lead.phone}`}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 line-clamp-1">{lead.message}</p>
                        <p className="mt-1 text-xs" style={{ color: theme.accent }}>Score: {lead.score}</p>
                      </div>
                      {lead.isLocked ? (
                        <button
                          type="button"
                          onClick={() => startUnlockCheckout(lead.id)}
                          disabled={!!unlockLoading}
                          className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
                        >
                          {unlockLoading === lead.id ? "Redirecting…" : "Unlock ($19.99)"}
                        </button>
                      ) : (
                        <span className="text-sm text-slate-400">Unlocked</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </HubLayout>
  );
}
