"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { SchedulingDemoDisclaimer } from "@/components/scheduling/SchedulingStagingCopy";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Rule = {
  id: string;
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  isActive: boolean;
  timezone: string | null;
};

export default function BrokerAvailabilityPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [tz, setTz] = useState("UTC");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startM, setStartM] = useState(9 * 60);
  const [endM, setEndM] = useState(17 * 60);

  function load() {
    void fetch("/api/broker/availability", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((j: { ok?: boolean; rules?: Rule[]; error?: string }) => {
        if (!j.ok) {
          setErr(j.error ?? "Could not load");
          return;
        }
        setErr(null);
        setRules(j.rules ?? []);
      })
      .catch(() => setErr("Network error"));
  }

  useEffect(() => {
    load();
  }, []);

  async function addRule(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/broker/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        dayOfWeek,
        startMinute: startM,
        endMinute: endM,
        timezone: tz || null,
      }),
    });
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setErr(j.error ?? "Could not save");
      return;
    }
    load();
  }

  async function deleteRule(id: string) {
    await fetch(`/api/broker/availability/${id}`, { method: "DELETE", credentials: "same-origin" });
    load();
  }

  function fmt(m: number) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${h}:${mm.toString().padStart(2, "0")}`;
  }

  return (
    <HubLayout title="Availability" hubKey="broker" navigation={hubNavigation.broker}>
      <div className="max-w-2xl space-y-6 text-slate-100">
        <Link href="/dashboard/broker/calendar" className="text-sm text-emerald-400 hover:underline">
          ← Calendar
        </Link>
        <SchedulingDemoDisclaimer />
        <p className="text-sm text-slate-400">
          Weekly windows use minutes from midnight (UTC for v1). Add multiple rows per day as needed.
        </p>

        <form onSubmit={addRule} className="rounded-xl border border-white/10 bg-black/30 p-4">
          <h3 className="text-sm font-semibold text-white">Add window</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-slate-400">
              Day
              <select
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm text-white"
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(parseInt(e.target.value, 10))}
              >
                {DAYS.map((d, i) => (
                  <option key={d} value={i}>
                    {d} ({i})
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-400">
              Timezone label
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-2 font-mono text-sm text-white"
                value={tz}
                onChange={(e) => setTz(e.target.value)}
              />
            </label>
            <label className="text-xs text-slate-400">
              Start (min from midnight)
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm text-white"
                value={startM}
                onChange={(e) => setStartM(parseInt(e.target.value, 10) || 0)}
              />
            </label>
            <label className="text-xs text-slate-400">
              End (min)
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm text-white"
                value={endM}
                onChange={(e) => setEndM(parseInt(e.target.value, 10) || 0)}
              />
            </label>
          </div>
          <button
            type="submit"
            className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-500"
          >
            Save window
          </button>
        </form>

        {err ? <p className="text-sm text-red-300">{err}</p> : null}

        <ul className="space-y-2 text-sm">
          {rules.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2"
            >
              <span>
                {DAYS[r.dayOfWeek] ?? r.dayOfWeek}: {fmt(r.startMinute)}–{fmt(r.endMinute)}{" "}
                <span className="text-slate-500">{r.timezone ?? "UTC"}</span>
              </span>
              <button type="button" className="text-xs text-red-300 hover:underline" onClick={() => deleteRule(r.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
    </HubLayout>
  );
}
