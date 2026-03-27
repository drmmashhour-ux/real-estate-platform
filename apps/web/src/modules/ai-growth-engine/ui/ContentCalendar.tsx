"use client";

import { useEffect, useState } from "react";

type PlanRow = {
  id: string;
  planDate: string;
  topic: string;
  status: string;
  items: { id: string; platform: string; status: string; scheduledAt: string | null }[];
};

export function ContentCalendar({ refreshKey }: { refreshKey?: number }) {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/admin/ai-growth/calendar")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (!j.plans) setError("No data");
        else setPlans(j.plans);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  async function approve(id: string) {
    const res = await fetch(`/api/admin/ai-growth/items/${encodeURIComponent(id)}/approve`, { method: "POST" });
    if (!res.ok) return;
    setPlans((prev) =>
      prev.map((p) => ({
        ...p,
        items: p.items.map((i) => (i.id === id ? { ...i, status: "approved" } : i)),
      })),
    );
  }

  if (loading) return <p className="text-xs text-slate-500">Loading calendar…</p>;
  if (error) return <p className="text-xs text-rose-300">{error}</p>;

  return (
    <section className="rounded-xl border border-white/10 bg-black/30 p-4">
      <h2 className="text-sm font-semibold text-white">Content calendar</h2>
      <ul className="mt-3 space-y-3 text-xs">
        {plans.map((p) => (
          <li key={p.id} className="rounded-lg border border-white/10 bg-black/40 p-3">
            <p className="font-medium text-slate-200">
              {p.planDate} · {p.topic}
            </p>
            <p className="text-[10px] uppercase text-slate-500">{p.status}</p>
            <ul className="mt-2 space-y-1">
              {p.items.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 text-slate-400">
                  <span>
                    {i.platform} · {i.status}
                    {i.scheduledAt ? ` · ${i.scheduledAt}` : ""}
                  </span>
                  {i.status !== "approved" && i.status !== "published" ? (
                    <button
                      type="button"
                      onClick={() => void approve(i.id)}
                      className="rounded border border-emerald-500/40 px-2 py-0.5 text-[10px] text-emerald-300 hover:bg-emerald-500/10"
                    >
                      Approve
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      {!plans.length ? <p className="text-xs text-slate-500">No saved plans yet.</p> : null}
    </section>
  );
}
