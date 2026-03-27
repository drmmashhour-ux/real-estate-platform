"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";

type Pricing = {
  lead_price_cents: string;
  subscription_price_cents: string;
  subscription_premium_cents: string;
  premium_onetime_cents: string;
};

type RevenueItem = {
  projectId: string;
  projectName: string;
  totalRevenue: number;
  leadsPaid: number;
};

type Revenue = {
  byProject: RevenueItem[];
  totalRevenue: number;
};

type ProjectRow = {
  id: string;
  name: string;
  featured: boolean;
  featuredUntil: string | null;
};

export default function AdminProjectsMonetizationPage() {
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [ambassadors, setAmbassadors] = useState<{ id: string; email: string; commission: number; isActive: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Pricing>({
    lead_price_cents: "1999",
    subscription_price_cents: "4900",
    subscription_premium_cents: "9900",
    premium_onetime_cents: "19900",
  });

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/projects-pricing", { credentials: "same-origin" }).then((r) => r.json()),
      fetch("/api/admin/projects-revenue", { credentials: "same-origin" }).then((r) => r.json()),
      fetch("/api/projects", { credentials: "same-origin" }).then((r) => r.json()),
      fetch("/api/admin/ambassadors", { credentials: "same-origin" }).then((r) => r.json()),
    ])
      .then(([p, r, projList, a]) => {
        setPricing(p);
        if (p && !p.error) {
          setForm({
            lead_price_cents: p.lead_price_cents ?? "1999",
            subscription_price_cents: p.subscription_price_cents ?? "4900",
            subscription_premium_cents: p.subscription_premium_cents ?? "9900",
            premium_onetime_cents: p.premium_onetime_cents ?? "19900",
          });
        }
        setRevenue(r?.error ? null : r);
        const list = Array.isArray(projList) ? projList : [];
        setProjects(
          list.map((x: { id: string; name: string; featured?: boolean; featuredUntil?: string | null }) => ({
            id: x.id,
            name: x.name,
            featured: !!x.featured,
            featuredUntil: x.featuredUntil ? x.featuredUntil.slice(0, 10) : null,
          }))
        );
        setAmbassadors(Array.isArray(a) ? a : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateProjectFeatured = async (projectId: string, featured: boolean, featuredUntil: string | null) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          featured,
          featuredUntil: featuredUntil || null,
        }),
        credentials: "same-origin",
      });
      if (res.ok) {
        setProjects((prev) =>
          prev.map((row) =>
            row.id === projectId ? { ...row, featured, featuredUntil } : row
          )
        );
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data?.error ?? "Failed to update project");
      }
    } catch {
      alert("Failed to update project");
    }
  };

  const savePricing = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/projects-pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPricing(data);
        alert("Pricing updated.");
      } else {
        alert(data?.error ?? "Failed to update");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <HubLayout title="Admin" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher>
      <div className="space-y-8">
        <Link href="/admin" className="text-sm font-medium text-red-400 hover:underline">
          ← Admin
        </Link>
        <h1 className="text-2xl font-semibold text-white">Projects monetization</h1>

        {loading ? (
          <p className="text-slate-400">Loading…</p>
        ) : (
          <>
            <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 text-lg font-semibold text-red-400">Pricing (cents)</h2>
              <p className="mb-4 text-sm text-slate-400">
                Set lead price, subscription, and premium. Values are in cents (e.g. 1999 = $19.99).
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs text-slate-500">Lead price (cents)</label>
                  <input
                    type="number"
                    value={form.lead_price_cents}
                    onChange={(e) => setForm((f) => ({ ...f, lead_price_cents: e.target.value }))}
                    className="mt-1 w-full rounded border border-white/20 bg-black/20 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500">Subscription basic (cents/mo)</label>
                  <input
                    type="number"
                    value={form.subscription_price_cents}
                    onChange={(e) => setForm((f) => ({ ...f, subscription_price_cents: e.target.value }))}
                    className="mt-1 w-full rounded border border-white/20 bg-black/20 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500">Subscription premium (cents/mo)</label>
                  <input
                    type="number"
                    value={form.subscription_premium_cents}
                    onChange={(e) => setForm((f) => ({ ...f, subscription_premium_cents: e.target.value }))}
                    className="mt-1 w-full rounded border border-white/20 bg-black/20 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500">Premium one-time (cents)</label>
                  <input
                    type="number"
                    value={form.premium_onetime_cents}
                    onChange={(e) => setForm((f) => ({ ...f, premium_onetime_cents: e.target.value }))}
                    className="mt-1 w-full rounded border border-white/20 bg-black/20 px-3 py-2 text-white"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={savePricing}
                disabled={saving}
                className="mt-4 rounded bg-red-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save pricing"}
              </button>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 text-lg font-semibold text-red-400">Ambassador controls</h2>
              <div className="space-y-3">
                {ambassadors.length ? ambassadors.map((a) => (
                  <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
                    <div>
                      <p className="font-medium text-white">{a.email}</p>
                      <p className="text-xs text-slate-400">{a.isActive ? "Active" : "Inactive"} · {(a.commission * 100).toFixed(0)}%</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="rounded bg-white/10 px-3 py-1.5 text-xs text-white">Toggle</button>
                      <button className="rounded bg-white/10 px-3 py-1.5 text-xs text-white">Set %</button>
                    </div>
                  </div>
                )) : <p className="text-sm text-slate-400">No ambassadors yet.</p>}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 text-lg font-semibold text-red-400">Revenue per project</h2>
              {revenue?.byProject?.length ? (
                <>
                  <p className="mb-4 text-2xl font-bold text-white">
                    Total revenue: ${revenue.totalRevenue.toFixed(2)}
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400">
                          <th className="pb-2 pr-4">Project</th>
                          <th className="pb-2 pr-4">Leads paid</th>
                          <th className="pb-2">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {revenue.byProject.map((row) => (
                          <tr key={row.projectId} className="border-b border-white/5">
                            <td className="py-2 pr-4 font-medium text-white">{row.projectName}</td>
                            <td className="py-2 pr-4 text-slate-300">{row.leadsPaid}</td>
                            <td className="py-2 text-green-400">${row.totalRevenue.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="text-slate-500">No project lead payments yet.</p>
              )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 text-lg font-semibold text-red-400">Featured projects</h2>
              <p className="mb-4 text-sm text-slate-400">
                Toggle featured and set featured until date. Premium plan projects are always featured.
              </p>
              {projects.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400">
                        <th className="pb-2 pr-4">Project</th>
                        <th className="pb-2 pr-4">Featured</th>
                        <th className="pb-2">Featured until (YYYY-MM-DD)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((row) => (
                        <tr key={row.id} className="border-b border-white/5">
                          <td className="py-2 pr-4 font-medium text-white">{row.name}</td>
                          <td className="py-2 pr-4">
                            <input
                              type="checkbox"
                              checked={row.featured}
                              onChange={(e) =>
                                updateProjectFeatured(row.id, e.target.checked, row.featuredUntil)
                              }
                              className="rounded border-white/20"
                            />
                          </td>
                          <td className="py-2">
                            <input
                              type="date"
                              value={row.featuredUntil ?? ""}
                              onChange={(e) => {
                                const v = e.target.value || null;
                                setProjects((prev) =>
                                  prev.map((r) =>
                                    r.id === row.id ? { ...r, featuredUntil: v } : r
                                  )
                                );
                                updateProjectFeatured(row.id, row.featured, v);
                              }}
                              className="rounded border border-white/20 bg-black/20 px-2 py-1 text-white"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-500">No projects yet.</p>
              )}
            </section>
          </>
        )}
      </div>
    </HubLayout>
  );
}
