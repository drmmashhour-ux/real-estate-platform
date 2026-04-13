"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { HubTheme } from "@/lib/hub/themes";

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
  unit?: { id: string; type: string; price: number; size: number; status: string };
};

export function ReservationsClient({ theme }: { theme: HubTheme }) {
  const [list, setList] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(() => {
    fetch("/api/projects/reservations", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchList();
  }, [fetchList]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-slate-400">
        Loading reservations…
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center">
        <p className="text-slate-400">No reservations yet.</p>
        <Link href="/projects" className="mt-4 inline-block text-teal-400 hover:underline">
          Browse projects →
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-xs font-medium uppercase tracking-wider text-slate-500">
            <th className="px-6 py-4">Project</th>
            <th className="px-6 py-4">Unit</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Contact</th>
            <th className="px-6 py-4">Date</th>
            <th className="px-6 py-4">Action</th>
          </tr>
        </thead>
        <tbody>
          {list.map((r) => (
            <tr key={r.id} className="border-b border-white/5">
              <td className="px-6 py-4">
                <Link href={`/projects/${r.projectId}`} className="font-medium text-teal-400 hover:underline">
                  {r.project?.name ?? r.projectId}
                </Link>
              </td>
              <td className="px-6 py-4 text-slate-300">
                {r.unit?.type ?? "—"} {r.unit?.price != null && `· $${r.unit.price.toLocaleString()}`}
              </td>
              <td className="px-6 py-4">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  r.status === "reserved" ? "bg-teal-500/20 text-teal-400" :
                  r.status === "cancelled" ? "bg-red-500/20 text-red-400" :
                  r.status === "completed" ? "bg-slate-500/20 text-slate-400" :
                  "bg-amber-500/20 text-amber-400"
                }`}>
                  {r.status}
                </span>
              </td>
              <td className="px-6 py-4 text-slate-300">
                {r.fullName}<br />
                <span className="text-xs text-slate-500">{r.email} · {r.phone}</span>
              </td>
              <td className="px-6 py-4 text-slate-500">
                {new Date(r.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4">
                <Link href={`/projects/${r.projectId}`} className="text-xs text-teal-400 hover:underline">
                  View project
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
