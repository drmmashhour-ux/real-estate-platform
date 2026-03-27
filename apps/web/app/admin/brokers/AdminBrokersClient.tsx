"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type App = {
  id: string;
  fullName: string;
  email: string;
  licenseNumber: string;
  authority: string;
  documentUrl: string | null;
  status: string;
  createdAt: Date;
  user: { id: string; name: string | null; email: string; role: string; brokerStatus: string };
};

export function AdminBrokersClient({ applications }: { applications: App[] }) {
  const router = useRouter();
  const [actioning, setActioning] = useState<string | null>(null);

  const pending = applications.filter((a) => a.status === "pending");
  const processed = applications.filter((a) => a.status !== "pending");

  async function approve(id: string) {
    setActioning(id);
    try {
      const res = await fetch(`/api/admin/brokers/applications/${id}/approve`, { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setActioning(null);
    }
  }

  async function reject(id: string) {
    if (!confirm("Reject this application?")) return;
    setActioning(id);
    try {
      const res = await fetch(`/api/admin/brokers/applications/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Rejected by admin" }),
      });
      if (res.ok) router.refresh();
    } finally {
      setActioning(null);
    }
  }

  return (
    <section className="mt-8 space-y-8">
      <div>
        <h2 className="text-lg font-medium text-slate-200">Pending ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No pending applications.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {pending.map((a) => (
              <li key={a.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-100">{a.fullName}</p>
                    <p className="text-sm text-slate-400">{a.email}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      License: {a.licenseNumber} · {a.authority}
                    </p>
                    {a.documentUrl && (
                      <a href={a.documentUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-amber-400 hover:underline">
                        View document
                      </a>
                    )}
                    <p className="mt-2 text-xs text-slate-500">
                      Applied {new Date(a.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={!!actioning}
                      onClick={() => approve(a.id)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {actioning === a.id ? "…" : "Approve"}
                    </button>
                    <button
                      type="button"
                      disabled={!!actioning}
                      onClick={() => reject(a.id)}
                      className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-1.5 text-sm font-medium text-red-300 hover:bg-red-900/50 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {processed.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-slate-200">Processed</h2>
          <ul className="mt-4 space-y-2">
            {processed.map((a) => (
              <li key={a.id} className="rounded-lg border border-slate-800/60 bg-slate-900/40 px-4 py-2 text-sm">
                <span className="font-medium text-slate-300">{a.fullName}</span>
                {" · "}
                <span className={a.status === "approved" ? "text-emerald-400" : "text-red-400"}>{a.status}</span>
                {" · "}
                <span className="text-slate-500">{new Date(a.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
