"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { HubTheme } from "@/lib/hub/themes";
import { analyzeProject } from "@/lib/ai/projects-analysis";

type Project = {
  id: string;
  name: string;
  city: string;
  developer: string;
  deliveryDate: string;
  startingPrice: number;
  status: string;
  units?: { id: string; type: string; price: number; size: number; status: string }[];
  subscription?: { isTrial: boolean; trialEnd: string; plan: string } | null;
};

type Lead = { id: string; projectId?: string | null };

type Props = { theme: HubTheme; isAdmin: boolean };

export function ProjectsDashboardClient({ theme, isAdmin }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [alertsCount, setAlertsCount] = useState(0);
  const [reservationsCount, setReservationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    city: "",
    address: "",
    developer: "",
    description: "",
    deliveryDate: "",
    startingPrice: "",
    status: "upcoming",
  });

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/projects", { credentials: "same-origin" }).then((r) => r.json()),
      fetch("/api/leads", { credentials: "same-origin" }).then((r) => r.json()),
      fetch("/api/projects/favorites", { credentials: "same-origin" }).then((r) => r.json()),
      fetch("/api/projects/alerts", { credentials: "same-origin" }).then((r) => r.json()),
      fetch("/api/projects/reservations", { credentials: "same-origin" }).then((r) => r.json()),
    ])
      .then(([projectsData, leadsData, favData, alertsData, resData]) => {
        setProjects(Array.isArray(projectsData) ? projectsData : []);
        setLeads(Array.isArray(leadsData) ? leadsData : []);
        setFavoritesCount(Array.isArray(favData) ? favData.length : 0);
        setAlertsCount(Array.isArray(alertsData) ? alertsData.filter((a: { isActive: boolean }) => a.isActive).length : 0);
        setReservationsCount(Array.isArray(resData) ? resData.length : 0);
      })
      .catch(() => {
        setProjects([]);
        setLeads([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const submitCreate = async () => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: createForm.name,
        city: createForm.city,
        address: createForm.address,
        developer: createForm.developer,
        description: createForm.description || undefined,
        deliveryDate: createForm.deliveryDate || undefined,
        startingPrice: createForm.startingPrice ? Number(createForm.startingPrice) : undefined,
        status: createForm.status || undefined,
      }),
      credentials: "same-origin",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data?.error ?? "Failed to create project");
      return;
    }
    setCreateOpen(false);
    setCreateForm({
      name: "",
      city: "",
      address: "",
      developer: "",
      description: "",
      deliveryDate: "",
      startingPrice: "",
      status: "upcoming",
    });
    setProjects((prev) => (data?.id ? [...prev, { ...data, units: data.units ?? [] }] : prev));
  };

  const byStatus = projects.reduce(
    (acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const totalUnits = projects.reduce((sum, p) => sum + (p.units?.length ?? 0), 0);
  const leadCountByProject = leads.reduce<Record<string, number>>((acc, l) => {
    if (l.projectId) {
      acc[l.projectId] = (acc[l.projectId] ?? 0) + 1;
    }
    return acc;
  }, {});
  const projectLeadsCount = leads.filter((l) => l.projectId).length;

  const analyses = projects.map((p) => analyzeProject(p, p.units ?? []));
  const avgScore = analyses.length ? Math.round(analyses.reduce((s, a) => s + a.score, 0) / analyses.length) : 0;

  return (
    <>
      {/* Quick Actions */}
      <div className="mb-8 flex flex-wrap items-center gap-4">
        {isAdmin && (
          <button
            type="button"
            onClick={() => setCreateOpen((o) => !o)}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: theme.accent }}
          >
            {createOpen ? "Cancel" : "Create Project"}
          </button>
        )}
        <Link
          href="/dashboard/leads"
          className="rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98]"
        >
          View Leads
        </Link>
        <Link
          href="/projects"
          className="rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-white/10"
        >
          Public Projects →
        </Link>
      </div>

      {/* AI Insights summary */}
      <section className="mb-8 rounded-2xl border border-white/10 p-6 shadow-xl" style={{ backgroundColor: theme.cardBg }}>
        <h2 className="mb-4 text-lg font-semibold" style={{ color: theme.accent }}>
          AI Insights Summary
        </h2>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.textMuted }}>Avg. investment score</p>
            <p className="mt-1 text-2xl font-bold" style={{ color: theme.accent }}>{avgScore}/100</p>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.textMuted }}>Project leads</p>
            <p className="mt-1 text-2xl font-bold" style={{ color: theme.accent }}>{projectLeadsCount}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.textMuted }}>Total units</p>
            <p className="mt-1 text-2xl font-bold" style={{ color: theme.accent }}>{totalUnits}</p>
          </div>
          <Link href="/dashboard/projects/favorites" className="rounded-xl bg-white/5 p-4 transition-colors hover:bg-white/10">
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.textMuted }}>Favorites</p>
            <p className="mt-1 text-2xl font-bold" style={{ color: theme.accent }}>{favoritesCount}</p>
          </Link>
          <Link href="/dashboard/projects/alerts" className="rounded-xl bg-white/5 p-4 transition-colors hover:bg-white/10">
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.textMuted }}>Active alerts</p>
            <p className="mt-1 text-2xl font-bold" style={{ color: theme.accent }}>{alertsCount}</p>
          </Link>
          <Link href="/dashboard/projects/reservations" className="rounded-xl bg-white/5 p-4 transition-colors hover:bg-white/10">
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.textMuted }}>Reservations</p>
            <p className="mt-1 text-2xl font-bold" style={{ color: theme.accent }}>{reservationsCount}</p>
          </Link>
        </div>
        <p className="mt-4 text-sm" style={{ color: theme.textMuted }}>
          Demand heatmap: view <Link href="/projects" className="font-medium hover:underline" style={{ color: theme.accent }}>projects page</Link> and switch to Heatmap View for AI demand zones.
        </p>
      </section>

      {/* Create project form */}
      {isAdmin && createOpen && (
        <div className="mb-8 rounded-2xl border border-white/10 p-6 shadow-xl" style={{ backgroundColor: theme.cardBg }}>
          <h3 className="mb-4 text-lg font-semibold" style={{ color: theme.text }}>
            New project
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              placeholder="Name"
              value={createForm.name}
              onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/50 transition-all duration-200 focus:ring-2"
              style={{ ["--tw-ring-color" as string]: theme.accent }}
            />
            <input
              placeholder="City"
              value={createForm.city}
              onChange={(e) => setCreateForm((f) => ({ ...f, city: e.target.value }))}
              className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/50"
            />
            <input
              placeholder="Address"
              value={createForm.address}
              onChange={(e) => setCreateForm((f) => ({ ...f, address: e.target.value }))}
              className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/50"
            />
            <input
              placeholder="Developer"
              value={createForm.developer}
              onChange={(e) => setCreateForm((f) => ({ ...f, developer: e.target.value }))}
              className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/50"
            />
            <input
              placeholder="Delivery date (YYYY-MM-DD)"
              value={createForm.deliveryDate}
              onChange={(e) => setCreateForm((f) => ({ ...f, deliveryDate: e.target.value }))}
              className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/50"
            />
            <input
              placeholder="Starting price"
              type="number"
              value={createForm.startingPrice}
              onChange={(e) => setCreateForm((f) => ({ ...f, startingPrice: e.target.value }))}
              className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/50"
            />
            <select
              value={createForm.status}
              onChange={(e) => setCreateForm((f) => ({ ...f, status: e.target.value }))}
              className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white"
            >
              <option value="upcoming">Upcoming</option>
              <option value="under-construction">Under construction</option>
              <option value="delivered">Delivered</option>
            </select>
            <div className="sm:col-span-2">
              <textarea
                placeholder="Description"
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/50"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={submitCreate}
            className="mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-900 transition-all duration-200 active:scale-[0.98]"
            style={{ backgroundColor: theme.accent }}
          >
            Create
          </button>
        </div>
      )}

      {/* My Projects / Market Projects – same list with premium cards */}
      <section className="rounded-2xl border border-white/10 overflow-hidden shadow-xl" style={{ backgroundColor: theme.cardBg }}>
        <h2 className="border-b border-white/10 px-6 py-4 text-lg font-semibold" style={{ color: theme.text }}>
          Projects
        </h2>
        {loading ? (
          <p className="p-8 text-sm" style={{ color: theme.textMuted }}>
            Loading…
          </p>
        ) : projects.length === 0 ? (
          <p className="p-8 text-sm" style={{ color: theme.textMuted }}>
            No projects yet. {isAdmin ? "Create one above." : ""}
          </p>
        ) : (
          <div className="divide-y divide-white/10">
            {projects.map((p) => {
              const analysis = analyzeProject(p, p.units ?? []);
              const unitsCount = p.units?.length ?? 0;
              const availableCount = p.units?.filter((u) => u.status === "available").length ?? 0;
              const leadsCount = leadCountByProject[p.id] ?? 0;
              return (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 transition-all duration-200 hover:bg-white/5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/projects/${p.id}`}
                        className="font-semibold hover:underline"
                        style={{ color: theme.accent }}
                      >
                        {p.name}
                      </Link>
                      <Link
                        href={`/dashboard/projects/${p.id}`}
                        className="text-xs font-medium opacity-80 hover:underline"
                        style={{ color: theme.accent }}
                      >
                        Dashboard →
                      </Link>
                    </div>
                    <p className="mt-0.5 text-sm" style={{ color: theme.textMuted }}>
                      {p.city} · {p.developer}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs" style={{ color: theme.textMuted }}>
                      <span>{unitsCount} units</span>
                      <span>{availableCount} available</span>
                      <span>{leadsCount} leads</span>
                      {p.subscription?.isTrial && p.subscription?.trialEnd && (
                        <span>
                          Trial: {Math.max(0, Math.ceil((new Date(p.subscription.trialEnd).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))} days left
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="capitalize rounded-full px-2 py-0.5 bg-white/10" style={{ color: theme.textMuted }}>
                      {p.status.replace(/-/g, " ")}
                    </span>
                    <span style={{ color: theme.accent }}>
                      {p.startingPrice ? `From $${(p.startingPrice / 1000).toFixed(0)}k` : "—"}
                    </span>
                    <span style={{ color: theme.textMuted }}>
                      Score {analysis.score}/100
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <p className="mt-6">
        <Link href="/projects" className="text-sm font-medium hover:underline" style={{ color: theme.accent }}>
          View public projects page →
        </Link>
      </p>

      <section className="mt-8 rounded-2xl border border-white/10 p-6 shadow-xl" style={{ backgroundColor: theme.cardBg }}>
        <h2 className="text-lg font-semibold" style={{ color: theme.accent }}>
          Invite friends & earn rewards
        </h2>
        <p className="mt-2 text-sm" style={{ color: theme.textMuted }}>
          Share your referral link and unlock rewards when invited users become active or upgrade.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/dashboard/referrals" className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-900" style={{ backgroundColor: theme.accent }}>
            Copy referral link
          </Link>
          <Link href="/dashboard/ambassador" className="rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white">
            View ambassador dashboard
          </Link>
        </div>
      </section>
    </>
  );
}
