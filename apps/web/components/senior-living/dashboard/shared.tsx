"use client";

import Link from "next/link";
import type { ReactNode } from "react";

/** Calm operational shell — white/black/gold, not terminal/trading. */
export function DashboardShell(props: {
  theme: "residence" | "management" | "admin";
  title: string;
  subtitle?: string;
  topRight?: ReactNode;
  nav?: Array<{ href: string; label: string }>;
  children: ReactNode;
}) {
  const shell =
    props.theme === "residence"
      ? "border-zinc-200 bg-zinc-50 text-zinc-900"
    : props.theme === "management"
      ? "border-zinc-300 bg-white text-zinc-900"
      : "border-zinc-800 bg-zinc-950 text-zinc-100";

  const accent =
    props.theme === "admin" ? "text-amber-400" : "text-amber-700";

  return (
    <div className={`min-h-[calc(100vh-4rem)] rounded-2xl border shadow-sm ${shell}`}>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-black/10 px-6 py-6">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${accent}`}>Senior Living Hub</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{props.title}</h1>
          {props.subtitle ?
            <p className="mt-2 max-w-2xl text-sm opacity-80">{props.subtitle}</p>
          : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">{props.topRight}</div>
      </header>
      {props.nav && props.nav.length > 0 ?
        <nav className="flex flex-wrap gap-2 border-b border-black/10 px-6 py-3">
          {props.nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-black/5 hover:text-zinc-900"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      : null}
      <div className="space-y-8 px-6 py-8">{props.children}</div>
    </div>
  );
}

export function KpiCard(props: {
  label: string;
  value: string | number;
  hint?: string;
  variant?: "light" | "dark";
}) {
  const shell =
    props.variant === "dark"
      ? "border-zinc-700 bg-zinc-900/80 text-zinc-100"
      : "border-black/10 bg-white text-zinc-900";
  const labelCls = props.variant === "dark" ? "text-zinc-500" : "text-zinc-500";
  const hintCls = props.variant === "dark" ? "text-zinc-600" : "text-zinc-500";
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${shell}`}>
      <p className={`text-xs font-medium uppercase tracking-wide ${labelCls}`}>{props.label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums">{props.value}</p>
      {props.hint ?
        <p className={`mt-2 text-xs ${hintCls}`}>{props.hint}</p>
      : null}
    </div>
  );
}

export function AlertCard(props: { severity: "info" | "warn" | "urgent"; message: string }) {
  const cls =
    props.severity === "urgent"
      ? "border-red-200 bg-red-50 text-red-900"
    : props.severity === "warn"
      ? "border-amber-200 bg-amber-50 text-amber-950"
      : "border-zinc-200 bg-zinc-50 text-zinc-800";
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>
      <span className="font-semibold">
        {props.severity === "urgent" ? "Urgent — " : props.severity === "warn" ? "Attention — " : ""}
      </span>
      {props.message}
    </div>
  );
}

export function AiSuggestionCard(props: { items: string[] }) {
  if (props.items.length === 0) return null;
  return (
    <section className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-6">
      <h2 className="text-sm font-semibold text-amber-950">Suggestions for you</h2>
      <ul className="mt-4 space-y-3 text-sm text-amber-950/90">
        {props.items.map((t) => (
          <li key={t.slice(0, 40)} className="flex gap-2">
            <span className="text-amber-600">→</span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function StatusBadge(props: { verified: boolean }) {
  return props.verified ?
      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
        Verified
      </span>
    : <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 ring-1 ring-zinc-200">Pending</span>;
}

export function EmptyStateCard(props: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
      <p className="font-medium text-zinc-800">{props.title}</p>
      <p className="mt-2 text-sm text-zinc-500">{props.body}</p>
    </div>
  );
}
