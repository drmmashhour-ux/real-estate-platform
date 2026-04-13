"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SchedulingDemoDisclaimer } from "@/components/scheduling/SchedulingStagingCopy";

type Row = {
  id: string;
  title: string;
  type: string;
  status: string;
  startsAt: string;
  endsAt: string;
  meetingMode: string;
  location: string | null;
  broker: { name: string | null; email: string | null };
};

export default function MyAppointmentsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/my/appointments", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((j: { ok?: boolean; appointments?: Row[]; error?: string }) => {
        if (!j.ok) {
          setErr(j.error ?? "Could not load");
          return;
        }
        setErr(null);
        setRows(j.appointments ?? []);
      })
      .catch(() => setErr("Network error or sign-in required"));
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50">
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-semibold text-white">My appointments</h1>
        <SchedulingDemoDisclaimer />
        {err ? <p className="text-sm text-red-300">{err}</p> : null}
        <ul className="space-y-3">
          {rows.map((a) => (
            <li key={a.id} className="rounded-xl border border-white/10 bg-black/30 p-4">
              <Link href={`/dashboard/appointments/${a.id}`} className="font-medium text-emerald-300 hover:underline">
                {a.title}
              </Link>
              <p className="text-xs text-slate-500">
                {a.type.replace(/_/g, " ")} · {a.status} · {a.meetingMode}
              </p>
              <p className="text-sm text-slate-300">
                {new Date(a.startsAt).toLocaleString()} – {new Date(a.endsAt).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">Broker: {a.broker?.name ?? a.broker?.email ?? "—"}</p>
            </li>
          ))}
        </ul>
        {rows.length === 0 && !err ? <p className="text-slate-500">No appointments yet.</p> : null}
      </div>
    </main>
  );
}
