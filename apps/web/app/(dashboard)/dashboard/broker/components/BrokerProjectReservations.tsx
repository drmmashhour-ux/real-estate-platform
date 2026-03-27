"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Reservation = {
  id: string;
  projectId: string;
  projectUnitId: string;
  status: string;
  fullName: string;
  email: string;
  phone: string;
  note: string | null;
  createdAt: string;
  project?: { id: string; name: string };
  unit?: { id: string; type: string; price: number; status: string };
};

export function BrokerProjectReservations({ accent = "#10b981" }: { accent?: string }) {
  const [list, setList] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch("/api/broker/project-reservations", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchData();
    });
  }, [fetchData]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/projects/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
        credentials: "same-origin",
      });
      if (res.ok) fetchData();
    } catch {}
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm text-slate-400">Loading project reservations…</p>
      </div>
    );
  }

  const pending = list.filter((r) => r.status === "pending");
  const other = list.filter((r) => r.status !== "pending");

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <h3 className="mb-4 text-lg font-semibold" style={{ color: accent }}>
        Project Reservations ({list.length})
      </h3>
      {list.length === 0 ? (
        <p className="text-sm text-slate-400">No reservation requests yet. They will appear here when visitors reserve a unit.</p>
      ) : (
        <div className="space-y-4">
          {pending.length > 0 && (
            <>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">New requests</p>
              {pending.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border p-4"
                  style={{ borderColor: `${accent}40`, backgroundColor: "rgba(255,255,255,0.04)" }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-white">{r.fullName}</p>
                      <p className="text-sm text-slate-400">{r.email} · {r.phone}</p>
                      <p className="mt-1 text-sm text-slate-300">
                        {r.project?.name ?? r.projectId} · {r.unit?.type ?? "Unit"} ${r.unit?.price != null ? r.unit.price.toLocaleString() : ""}
                      </p>
                      {r.note && <p className="mt-2 text-xs text-slate-500">Note: {r.note}</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {r.phone && (
                        <a
                          href={`tel:${r.phone.replace(/\D/g, "").replace(/^(\d{10})$/, "1$1").replace(/^/, "+")}`}
                          className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-90"
                          style={{ borderColor: `${accent}60`, color: accent }}
                        >
                          Call
                        </a>
                      )}
                      <a
                        href={`mailto:${encodeURIComponent(r.email)}`}
                        className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-90"
                        style={{ borderColor: `${accent}60`, color: accent }}
                      >
                        Reply to client
                      </a>
                      <button
                        type="button"
                        onClick={() => updateStatus(r.id, "reserved")}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors hover:opacity-90"
                        style={{ backgroundColor: accent }}
                      >
                        Mark reserved
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(r.id, "cancelled")}
                        className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                  <Link href={`/projects/${r.projectId}`} className="mt-2 inline-block text-xs" style={{ color: accent }}>
                    View project →
                  </Link>
                </div>
              ))}
            </>
          )}
          {other.length > 0 && (
            <>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Other</p>
              {other.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2">
                  <span className="text-sm text-white">{r.fullName}</span>
                  <span className="flex items-center gap-2">
                    <a
                      href={`mailto:${encodeURIComponent(r.email)}`}
                      className="text-xs font-medium"
                      style={{ color: accent }}
                    >
                      Reply to client
                    </a>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${r.status === "reserved" ? "bg-teal-500/20 text-teal-400" : "bg-slate-500/20 text-slate-400"}`}>
                      {r.status}
                    </span>
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
