"use client";

import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { autonomyGlassCard, autonomyGlowActive, autonomyGoldText, autonomyMuted } from "./autonomy-styles";

export type OverviewBarProps = {
  revenueCentsToday: number | null;
  revenueCentsWeek: number | null;
  revenueCentsMonth: number | null;
  activeDeals: number | null;
  bookingsToday: number | null;
  conversionRate: number | null;
  autonomyStatus: "ON" | "LIMITED" | "OFF";
  highRiskAlertsCount: number;
  revenueNote?: string | null;
  globalPaused: boolean;
  /** Quick mode UX — persisted via `/api/autonomy-command-center/quick-mode`. */
  onPauseAll: () => Promise<void>;
  onResumeAll: () => Promise<void>;
  onQuickMode: (mode: "ASSIST" | "SAFE" | "FULL") => Promise<void>;
};

function money(cents: number | null): string {
  if (cents == null || Number.isNaN(cents)) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function pct(p: number | null): string {
  if (p == null || Number.isNaN(p)) return "—";
  const v = p <= 1 ? p * 100 : p;
  return `${v.toFixed(1)}%`;
}

export function SystemOverviewStrip(props: OverviewBarProps) {
  const glow = props.autonomyStatus === "ON" && !props.globalPaused ? autonomyGlowActive : "";

  return (
    <div className={`${autonomyGlassCard} ${glow} p-5 transition-shadow duration-500`}>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#D4AF37]/15 pb-4">
        <div>
          <p className={`text-xs uppercase tracking-[0.25em] ${autonomyMuted}`}>Executive overview</p>
          <h1 className={`font-serif text-2xl md:text-3xl ${autonomyGoldText}`}>Autonomy Command Center</h1>
          <p className={`mt-1 max-w-2xl text-sm ${autonomyMuted}`}>
            Unified observability for bounded autonomy — every lane remains explainable, gated, and reversible unless policy
            explicitly allows automation.
          </p>
          {props.revenueNote ?
            <p className={`mt-2 text-xs ${autonomyMuted}`}>{props.revenueNote}</p>
          : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/admin/full-autopilot"
            className="rounded-lg border border-[#D4AF37]/40 px-3 py-1.5 text-xs font-medium text-[#D4AF37] hover:bg-[#D4AF37]/10"
          >
            Legacy full autopilot UI
          </Link>
          <Button
            variant="danger"
            size="sm"
            className="!border-red-900/80 !bg-red-950/80 hover:!bg-red-900"
            onClick={() => void props.onPauseAll()}
          >
            Pause all autonomy
          </Button>
          <Button variant="secondary" size="sm" onClick={() => void props.onResumeAll()} className="!bg-[#1a1814]">
            Resume
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="!border-[#D4AF37]/40 !text-[#E8D889]"
            onClick={() =>
              void fetch("/api/autonomy-command-center/emergency-kill", { method: "POST" }).then(() =>
                window.location.reload()
              )
            }
          >
            Emergency kill
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#b8b3a8]"
            onClick={() =>
              void fetch("/api/autonomy-command-center/recompute", { method: "POST" }).then(() =>
                window.location.reload()
              )
            }
          >
            Force recompute
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#b8b3a8]"
            onClick={() =>
              void fetch("/api/autonomy-command-center/learning-reset", { method: "POST" }).then(() =>
                alert("Learning reset recorded in audit trail (non-destructive).")
              )
            }
          >
            Reset learning (audit)
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        <Metric label="Revenue (today)" value={money(props.revenueCentsToday)} accent />
        <Metric label="Revenue (week)" value={money(props.revenueCentsWeek)} />
        <Metric label="Revenue (month)" value={money(props.revenueCentsMonth)} />
        <Metric label="Active deals" value={props.activeDeals != null ? String(props.activeDeals) : "—"} />
        <Metric label="Bookings today" value={props.bookingsToday != null ? String(props.bookingsToday) : "—"} />
        <Metric label="Conversion" value={pct(props.conversionRate)} />
        <Metric
          label="Autonomy status"
          value={props.globalPaused ? "PAUSED" : props.autonomyStatus}
          accent
          sub={props.globalPaused ? "Global pause engaged" : undefined}
        />
        <Metric label="High-risk alerts" value={String(props.highRiskAlertsCount)} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[#D4AF37]/15 pt-4">
        <span className={`text-xs uppercase tracking-widest ${autonomyMuted}`}>Quick mode</span>
        <Button variant="outline" size="sm" className="!border-[#D4AF37]/35" onClick={() => void props.onQuickMode("ASSIST")}>
          Assist
        </Button>
        <Button variant="secondary" size="sm" className="!bg-[#2a2418]" onClick={() => void props.onQuickMode("SAFE")}>
          Safe
        </Button>
        <Button variant="goldPrimary" size="sm" onClick={() => void props.onQuickMode("FULL")}>
          Full (policy-capped)
        </Button>
      </div>
    </div>
  );
}

function Metric(props: {
  label: string;
  value: string;
  accent?: boolean;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-[#D4AF37]/10 bg-black/40 px-3 py-2">
      <p className={`text-[10px] uppercase tracking-wider ${autonomyMuted}`}>{props.label}</p>
      <p className={`font-semibold ${props.accent ? autonomyGoldText : "text-[#f4efe4]"}`}>{props.value}</p>
      {props.sub ?
        <p className="text-[10px] text-[#8e887b]">{props.sub}</p>
      : null}
    </div>
  );
}
