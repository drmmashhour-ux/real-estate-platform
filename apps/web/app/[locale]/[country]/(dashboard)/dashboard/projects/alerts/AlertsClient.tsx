"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { HubTheme } from "@/lib/hub/themes";

type Alert = {
  id: string;
  city: string | null;
  maxPrice: number | null;
  minPrice: number | null;
  projectId: string | null;
  deliveryYear: number | null;
  alertType: string;
  isActive: boolean;
  createdAt: string;
};

export function AlertsClient({ theme }: { theme: HubTheme }) {
  const [list, setList] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(() => {
    fetch("/api/projects/alerts", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchAlerts();
  }, [fetchAlerts]);

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch("/api/projects/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !isActive }),
        credentials: "same-origin",
      });
      if (res.ok) fetchAlerts();
    } catch {}
  };

  const deleteAlert = async (id: string) => {
    if (!confirm("Remove this alert?")) return;
    try {
      const res = await fetch(`/api/projects/alerts?id=${encodeURIComponent(id)}`, { method: "DELETE", credentials: "same-origin" });
      if (res.ok) fetchAlerts();
    } catch {}
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-slate-400">
        Loading alerts…
      </div>
    );
  }

  const active = list.filter((a) => a.isActive);
  const inactive = list.filter((a) => !a.isActive);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">Active alerts</h2>
        {active.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-slate-400">No active alerts.</p>
        ) : (
          <ul className="space-y-3">
            {active.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div>
                  <span className="font-medium text-white">{a.alertType.replace(/-/g, " ")}</span>
                  {a.city && <span className="ml-2 text-slate-400">· {a.city}</span>}
                  {(a.minPrice != null || a.maxPrice != null) && (
                    <span className="ml-2 text-slate-400">
                      ${a.minPrice ?? 0} – ${a.maxPrice ?? "∞"}
                    </span>
                  )}
                  {a.projectId && (
                    <Link href={`/projects/${a.projectId}`} className="ml-2 text-teal-400 hover:underline">
                      View project
                    </Link>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => toggleActive(a.id, true)}
                    className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10"
                  >
                    Pause
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteAlert(a.id)}
                    className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      {inactive.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">Paused alerts</h2>
          <ul className="space-y-3">
            {inactive.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 opacity-75"
              >
                <div>
                  <span className="font-medium text-white">{a.alertType.replace(/-/g, " ")}</span>
                  {a.city && <span className="ml-2 text-slate-400">· {a.city}</span>}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => toggleActive(a.id, false)}
                    className="rounded-lg bg-teal-500/20 px-3 py-1.5 text-xs text-teal-400 hover:bg-teal-500/30"
                  >
                    Resume
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteAlert(a.id)}
                    className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
