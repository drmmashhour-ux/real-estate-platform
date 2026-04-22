"use client";

import { useCallback, useEffect, useState } from "react";

const GOLD = "var(--color-premium-gold)";
const CARD = "#121212";
const STORAGE_PREFIX = "launch_daily_checklist_";

type Checklist = {
  postContent: boolean;
  contact10: boolean;
  get3leads: boolean;
  followUp: boolean;
  closeDeals: boolean;
};

type Stats = {
  leadsToday: number;
  leadsPerDayLast7: [string, number][];
  wonRealEstateLeads7d: number;
  mortgageDealsClosed7d: number;
  loggedCallOrMessageEvents7d: number;
};

const DEFAULT_CHECK: Checklist = {
  postContent: false,
  contact10: false,
  get3leads: false,
  followUp: false,
  closeDeals: false,
};

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function readStoredChecklist(): Checklist {
  if (typeof window === "undefined") return DEFAULT_CHECK;
  try {
    const k = STORAGE_PREFIX + todayKey();
    const raw = localStorage.getItem(k);
    if (!raw) return DEFAULT_CHECK;
    const j = JSON.parse(raw) as Checklist & { callsMade?: number };
    return {
      postContent: Boolean(j.postContent),
      contact10: Boolean(j.contact10),
      get3leads: Boolean(j.get3leads),
      followUp: Boolean(j.followUp),
      closeDeals: Boolean(j.closeDeals),
    };
  } catch {
    return DEFAULT_CHECK;
  }
}

function readStoredCallsMade(): number {
  if (typeof window === "undefined") return 0;
  try {
    const k = STORAGE_PREFIX + todayKey();
    const raw = localStorage.getItem(k);
    if (!raw) return 0;
    const j = JSON.parse(raw) as Checklist & { callsMade?: number };
    return typeof j.callsMade === "number" ? j.callsMade : 0;
  } catch {
    return 0;
  }
}

export function DailyDashboardClient() {
  const [checklist, setChecklist] = useState<Checklist>(() => readStoredChecklist());
  const [callsMade, setCallsMade] = useState(() => readStoredCallsMade());
  const [stats, setStats] = useState<Stats | null>(null);

  const persist = useCallback((next: Checklist, calls: number) => {
    const k = STORAGE_PREFIX + todayKey();
    localStorage.setItem(k, JSON.stringify({ ...next, callsMade: calls }));
  }, []);

  const toggle = (key: keyof Checklist) => {
    setChecklist((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      persist(next, callsMade);
      return next;
    });
  };

  useEffect(() => {
    void fetch("/api/admin/launch-daily-stats", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j && typeof j.leadsToday === "number") setStats(j as Stats);
      });
  }, []);

  const items: { key: keyof Checklist; label: string }[] = [
    { key: "postContent", label: "Post content" },
    { key: "contact10", label: "Contact 10 people" },
    { key: "get3leads", label: "Get 3 leads" },
    { key: "followUp", label: "Follow up" },
    { key: "closeDeals", label: "Close deals" },
  ];

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-premium-gold/30 p-6" style={{ background: CARD }}>
        <h2 className="text-lg font-bold text-white">Today&apos;s checklist</h2>
        <p className="mt-1 text-xs text-[#737373]">Saves locally on this device ({todayKey()}).</p>
        <ul className="mt-4 space-y-3">
          {items.map(({ key, label }) => (
            <li key={key}>
              <label className="flex cursor-pointer items-center gap-3 text-sm text-[#E5E5E5]">
                <input
                  type="checkbox"
                  checked={checklist[key]}
                  onChange={() => toggle(key)}
                  className="h-4 w-4 rounded border-premium-gold/50"
                />
                {label}
              </label>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-white/10 pt-4">
          <p className="text-sm text-[#B3B3B3]">Calls logged (manual counter)</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const n = Math.max(0, callsMade - 1);
                setCallsMade(n);
                persist(checklist, n);
              }}
              className="rounded-lg border border-white/20 px-3 py-1 text-sm text-white"
            >
              −
            </button>
            <span className="min-w-[2rem] text-center font-mono text-lg text-premium-gold">{callsMade}</span>
            <button
              type="button"
              onClick={() => {
                const n = callsMade + 1;
                setCallsMade(n);
                persist(checklist, n);
              }}
              className="rounded-lg px-3 py-1 text-sm font-bold text-black"
              style={{ background: GOLD }}
            >
              +1 call
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 p-6" style={{ background: CARD }}>
        <h2 className="text-lg font-bold text-white">Performance tracking (7 days)</h2>
        <p className="mt-1 text-xs text-[#737373]">Leads per day, CRM activity, and closed deals (mortgage + real estate).</p>
        {!stats ? (
          <p className="mt-4 text-sm text-[#737373]">Loading…</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 p-4">
              <p className="text-xs uppercase text-[#737373]">Leads today</p>
              <p className="mt-1 text-2xl font-bold text-premium-gold">{stats.leadsToday}</p>
            </div>
            <div className="rounded-xl border border-white/10 p-4">
              <p className="text-xs uppercase text-[#737373]">RE deals closed (7d)</p>
              <p className="mt-1 text-2xl font-bold text-emerald-300">{stats.wonRealEstateLeads7d}</p>
            </div>
            <div className="rounded-xl border border-white/10 p-4">
              <p className="text-xs uppercase text-[#737373]">Mortgage deals closed (7d)</p>
              <p className="mt-1 text-2xl font-bold text-emerald-300">{stats.mortgageDealsClosed7d}</p>
            </div>
            <div className="rounded-xl border border-white/10 p-4">
              <p className="text-xs uppercase text-[#737373]">CRM call / DM clicks (7d)</p>
              <p className="mt-1 text-2xl font-bold text-sky-300">{stats.loggedCallOrMessageEvents7d}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs uppercase text-[#737373]">New leads per day</p>
              <div className="mt-2 flex h-24 items-end gap-1">
                {stats.leadsPerDayLast7.map(([day, n]) => (
                  <div key={day} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full max-w-[32px] rounded-t bg-premium-gold/80"
                      style={{ height: `${Math.max(10, Math.min(100, n * 20 + 8))}%` }}
                      title={`${day}: ${n}`}
                    />
                    <span className="max-w-full truncate text-[9px] text-[#737373]">{day.slice(5)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
