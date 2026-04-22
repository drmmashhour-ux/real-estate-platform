"use client";

import type { ReactNode } from "react";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonBlock } from "@/components/ui/SkeletonBlock";

/** Horizontal KPI strip — consistent rhythm (Part 14). */
export function KpiStrip({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${className}`.trim()}>
      {children}
    </div>
  );
}

export function KpiCard(props: {
  label: string;
  value: ReactNode;
  hint?: string;
  loading?: boolean;
  variant?: "dark" | "light";
}) {
  if (props.loading) {
    return (
      <Card variant="stat" className="p-5">
        <SkeletonBlock className="mb-3 h-3 w-24" />
        <SkeletonBlock className="h-8 w-20" />
      </Card>
    );
  }
  const text = props.variant === "light" ? "text-[#5C5C57]" : "text-zinc-500";
  const val = props.variant === "light" ? "text-[#0B0B0B]" : "text-white";
  return (
    <Card variant="stat" hoverable className="p-5">
      <p className={`text-xs font-semibold uppercase tracking-wide ${text}`}>{props.label}</p>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${val}`}>{props.value}</p>
      {props.hint ?
        <p className={`mt-1 text-xs ${text}`}>{props.hint}</p>
      : null}
    </Card>
  );
}

export function TrendCard(props: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  loading?: boolean;
}) {
  return (
    <Card variant="dashboardPanel" className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-[#0B0B0B]">{props.title}</h3>
        {props.action}
      </div>
      <div className="mt-4">
        {props.loading ?
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-[80%]" />
          </div>
        : props.children}
      </div>
    </Card>
  );
}

export function PriorityList(props: {
  title: string;
  items: Array<{ id: string; label: string; meta?: string }>;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (props.items.length === 0) {
    return (
      <Card variant="dashboardPanel" className="p-5">
        <h3 className="text-base font-semibold text-[#0B0B0B]">{props.title}</h3>
        <div className="mt-4">
          <EmptyState
            variant="boxed"
            title={props.emptyTitle ?? "Nothing urgent"}
            description={props.emptyDescription}
            defaultIcon="generic"
          />
        </div>
      </Card>
    );
  }
  return (
    <Card variant="dashboardPanel" className="p-5">
      <h3 className="text-base font-semibold text-[#0B0B0B]">{props.title}</h3>
      <ul className="mt-4 divide-y divide-[#D9D9D2]">
        {props.items.map((x) => (
          <li key={x.id} className="flex justify-between gap-4 py-3 text-sm">
            <span className="font-medium text-[#0B0B0B]">{x.label}</span>
            {x.meta ?
              <span className="shrink-0 text-[#5C5C57]">{x.meta}</span>
            : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function ActivityFeed(props: {
  title: string;
  entries: Array<{ id: string; at: string; label: string }>;
  loading?: boolean;
}) {
  return (
    <Card variant="default" className="border-white/10 bg-[#121212] p-5">
      <h3 className="text-base font-semibold text-white">{props.title}</h3>
      <ul className="mt-4 max-h-80 space-y-3 overflow-y-auto text-xs text-zinc-400">
        {props.loading ?
          Array.from({ length: 4 }).map((_, i) => (
            <li key={i}>
              <SkeletonBlock className="h-4 w-full" />
            </li>
          ))
        : props.entries.map((a) => (
            <li key={a.id} className="flex gap-3 border-b border-white/5 pb-2">
              <span className="shrink-0 text-zinc-600">{a.at}</span>
              <span className="text-zinc-300">{a.label}</span>
            </li>
          ))}
      </ul>
    </Card>
  );
}

export function AlertList(props: { title: string; children: ReactNode }) {
  return (
    <Card variant="alert" className="p-5">
      <h3 className="text-base font-semibold text-amber-900">{props.title}</h3>
      <div className="mt-4 space-y-3">{props.children}</div>
    </Card>
  );
}

export function ComparisonPanel(props: { title: string; children: ReactNode }) {
  return (
    <Card variant="dashboardPanel" className="overflow-hidden p-0">
      <div className="border-b border-[#D9D9D2] px-5 py-4">
        <h3 className="text-base font-semibold text-[#0B0B0B]">{props.title}</h3>
      </div>
      <div className="p-5">{props.children}</div>
    </Card>
  );
}

export function AiSuggestionPanel(props: { title?: string; items: string[] }) {
  return (
    <Card variant="action" glow className="border-amber-200/40 bg-amber-50/[0.07] p-5">
      <h3 className="text-sm font-semibold text-amber-200">{props.title ?? "Suggestions"}</h3>
      <ul className="mt-4 space-y-2 text-sm text-amber-50/95">
        {props.items.map((t) => (
          <li key={t.slice(0, 40)} className="flex gap-2">
            <span className="text-amber-400">→</span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function HeatmapPanelShell(props: { title: string; children: ReactNode }) {
  return (
    <Card variant="default" className="p-5">
      <h3 className="text-base font-semibold text-white">{props.title}</h3>
      <div className="mt-4 min-h-[120px] rounded-[var(--ds-radius-md)] border border-white/10 bg-black/40 p-4">{props.children}</div>
    </Card>
  );
}

export function QuickActionBar(props: { children: ReactNode }) {
  return (
    <div
      data-onboarding-anchor="quick-action"
      className="flex flex-wrap items-center gap-2 rounded-[var(--ds-radius-lg)] border border-[#D9D9D2] bg-[#FAFAF7] p-3 shadow-sm"
    >
      {props.children}
    </div>
  );
}
