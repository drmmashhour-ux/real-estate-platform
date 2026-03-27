"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Row = {
  id: string;
  type: string;
  title: string | null;
  message: string | null;
  dueAt: string | null;
  createdAt: string;
  brokerClient: { id: string; fullName: string; status: string };
};

export function BrokerTasksClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);

  function load() {
    void fetch("/api/broker/crm/tasks", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((j: { ok?: boolean; interactions?: Row[]; error?: string }) => {
        if (!j.ok) {
          setErr(j.error ?? "Could not load");
          return;
        }
        setErr(null);
        setRows(j.interactions ?? []);
      })
      .catch(() => setErr("Network error"));
  }

  useEffect(() => {
    load();
  }, []);

  const { overdue, today, upcoming } = useMemo(() => {
    const sod = new Date();
    sod.setHours(0, 0, 0, 0);
    const eod = new Date(sod);
    eod.setDate(eod.getDate() + 1);

    const overdue: Row[] = [];
    const today: Row[] = [];
    const upcoming: Row[] = [];

    for (const r of rows) {
      if (!r.dueAt) {
        upcoming.push(r);
        continue;
      }
      const d = new Date(r.dueAt);
      if (d < sod) overdue.push(r);
      else if (d >= sod && d < eod) today.push(r);
      else upcoming.push(r);
    }
    const sortByDue = (a: Row, b: Row) =>
      String(a.dueAt ?? "").localeCompare(String(b.dueAt ?? ""));
    overdue.sort(sortByDue);
    today.sort(sortByDue);
    upcoming.sort(sortByDue);
    return { overdue, today, upcoming };
  }, [rows]);

  async function complete(clientId: string, interactionId: string) {
    await fetch(`/api/broker/clients/${clientId}/interactions/${interactionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ completed: true }),
    });
    load();
  }

  function section(title: string, list: Row[]) {
    if (list.length === 0) return null;
    return (
      <section className="rounded-xl border border-white/10 bg-black/30 p-4">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {list.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-start justify-between gap-2 border-b border-white/5 pb-2 last:border-0"
            >
              <div>
                <Link
                  href={`/dashboard/broker/clients/${r.brokerClient.id}`}
                  className="font-medium text-emerald-300 hover:underline"
                >
                  {r.brokerClient.fullName}
                </Link>
                <p className="text-xs text-slate-500">
                  {r.type.replace(/_/g, " ")}
                  {r.title ? ` · ${r.title}` : ""}
                </p>
                {r.dueAt ? (
                  <p className="text-[11px] text-slate-600">Due {new Date(r.dueAt).toLocaleString()}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => complete(r.brokerClient.id, r.id)}
                className="shrink-0 rounded border border-emerald-500/40 px-2 py-1 text-[11px] text-emerald-200 hover:bg-emerald-500/10"
              >
                Done
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {err ? <p className="text-sm text-red-300">{err}</p> : null}
      {section("Overdue", overdue)}
      {section("Due today", today)}
      {section("Upcoming", upcoming)}
      {!err && rows.length === 0 ? (
        <p className="text-sm text-slate-500">No open tasks or follow-ups.</p>
      ) : null}
    </div>
  );
}
