"use client";

import { useCallback, useEffect, useState } from "react";

type Row = { dayOfWeek: number; startTime: string; endTime: string; isActive: boolean };

const DAYS = [
  { d: 0, label: "Sun" },
  { d: 1, label: "Mon" },
  { d: 2, label: "Tue" },
  { d: 3, label: "Wed" },
  { d: 4, label: "Thu" },
  { d: 5, label: "Fri" },
  { d: 6, label: "Sat" },
];

export function BrokerVisitAvailabilityClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/broker/availability", { credentials: "same-origin" });
      const j = (await res.json()) as { availability?: Array<{ dayOfWeek: number; startTime: string; endTime: string; isActive: boolean }>; error?: string };
      if (!res.ok) throw new Error(j.error ?? "Load failed");
      const a = Array.isArray(j.availability) ? j.availability : [];
      setRows(
        a.map((r) => ({
          dayOfWeek: r.dayOfWeek,
          startTime: r.startTime,
          endTime: r.endTime,
          isActive: r.isActive !== false,
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function setDayRow(day: number, patch: Partial<Row>) {
    setRows((prev) => {
      const i = prev.findIndex((r) => r.dayOfWeek === day);
      const base: Row = i >= 0 ? prev[i]! : { dayOfWeek: day, startTime: "09:00", endTime: "17:00", isActive: true };
      const next = { ...base, ...patch };
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = next;
        return copy;
      }
      return [...prev, next];
    });
  }

  async function save() {
    setSaving(true);
    setOk(null);
    setError(null);
    try {
      const res = await fetch("/api/broker/availability", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability: rows.filter((r) => r.isActive) }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Save failed");
      setOk("Saved.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  function loadTemplate() {
    setRows(
      [1, 2, 3, 4, 5].map((d) => ({
        dayOfWeek: d,
        startTime: "09:00",
        endTime: "17:00",
        isActive: true,
      }))
    );
  }

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {ok ? <p className="text-sm text-emerald-400">{ok}</p> : null}
      {loading ? <p className="text-sm text-slate-500">Loading…</p> : null}
      <p className="text-sm text-slate-400">
        Set weekly windows (America/Toronto by default). Visit slots exclude time off and existing bookings.
      </p>
      <button type="button" onClick={loadTemplate} className="text-sm text-premium-gold hover:underline">
        Load Mon–Fri 9–5 template
      </button>
      <div className="grid gap-3 sm:grid-cols-2">
        {DAYS.map(({ d, label }) => {
          const row = rows.find((r) => r.dayOfWeek === d);
          const active = row?.isActive ?? false;
          return (
            <div key={d} className="rounded-xl border border-white/10 bg-black/30 p-3">
              <label className="flex items-center gap-2 text-sm font-medium text-white">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setDayRow(d, { isActive: e.target.checked, startTime: row?.startTime ?? "09:00", endTime: row?.endTime ?? "17:00" })}
                />
                {label}
              </label>
              {active ? (
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <input
                    className="rounded border border-white/15 bg-black/40 px-2 py-1 text-white"
                    type="time"
                    value={row?.startTime ?? "09:00"}
                    onChange={(e) => setDayRow(d, { startTime: e.target.value, isActive: true })}
                  />
                  <span className="self-center text-slate-500">to</span>
                  <input
                    className="rounded border border-white/15 bg-black/40 px-2 py-1 text-white"
                    type="time"
                    value={row?.endTime ?? "17:00"}
                    onChange={(e) => setDayRow(d, { endTime: e.target.value, isActive: true })}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        disabled={saving}
        onClick={() => void save()}
        className="rounded-lg bg-premium-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save availability"}
      </button>
    </div>
  );
}
