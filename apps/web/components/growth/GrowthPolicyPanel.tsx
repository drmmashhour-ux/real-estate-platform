"use client";

import * as React from "react";

import type { GrowthPolicyResult, GrowthPolicySeverity } from "@/modules/growth/policy/growth-policy.types";

function severityMeta(s: GrowthPolicySeverity): { emoji: string; bar: string; pill: string } {
  if (s === "critical")
    return {
      emoji: "🔴",
      bar: "border-red-500/50 bg-red-950/40 text-red-50",
      pill: "bg-red-500/25 text-red-100",
    };
  if (s === "warning")
    return {
      emoji: "🟡",
      bar: "border-amber-500/45 bg-amber-950/35 text-amber-50",
      pill: "bg-amber-500/20 text-amber-100",
    };
  return {
    emoji: "🔵",
    bar: "border-sky-500/35 bg-sky-950/25 text-sky-50",
    pill: "bg-sky-500/20 text-sky-100",
  };
}

function sortPolicies(p: GrowthPolicyResult[]): GrowthPolicyResult[] {
  const order: Record<GrowthPolicySeverity, number> = { critical: 0, warning: 1, info: 2 };
  return [...p].sort((a, b) => order[a.severity] - order[b.severity] || a.id.localeCompare(b.id));
}

function PolicyRows({ items }: { items: GrowthPolicyResult[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-2 space-y-2">
      {items.map((p) => {
        const m = severityMeta(p.severity);
        return (
          <li key={p.id} className={`rounded-lg border px-3 py-2.5 text-sm ${m.bar}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base leading-none">{m.emoji}</span>
              <span className="font-semibold">{p.title}</span>
              <span
                className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${m.pill}`}
              >
                {p.severity}
              </span>
              <span className="rounded border border-white/10 bg-black/30 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-white/70">
                {p.domain}
              </span>
            </div>
            <p className="mt-1 text-[12px] opacity-95">{p.description}</p>
            <p className="mt-1 text-[11px] text-amber-100/80">
              <span className="font-semibold text-amber-200/90">→</span> {p.recommendation}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

export function GrowthPolicyPanel() {
  const [policies, setPolicies] = React.useState<GrowthPolicyResult[]>([]);
  const [note, setNote] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/growth/policy", { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as { policies?: GrowthPolicyResult[]; note?: string; error?: string };
        if (!r.ok) throw new Error(j.error ?? "Failed");
        return j;
      })
      .then((j) => {
        if (cancelled) return;
        setPolicies(sortPolicies(j.policies ?? []));
        setNote(j.note ?? null);
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-black/40 p-4 text-sm text-zinc-500">
        Loading growth policies…
      </div>
    );
  }
  if (err) {
    return (
      <div className="rounded-xl border border-red-900/45 bg-red-950/25 p-4 text-sm text-red-200">
        Growth policy: {err}
      </div>
    );
  }

  const critical = policies.filter((p) => p.severity === "critical");
  const warnings = policies.filter((p) => p.severity === "warning");
  const infos = policies.filter((p) => p.severity === "info");

  return (
    <section
      className="rounded-xl border border-amber-900/40 bg-black/55 p-4 shadow-[0_0_0_1px_rgba(212,175,55,0.1)]"
      data-growth-policy-v1
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-lg font-semibold tracking-tight text-amber-100">Growth policy (V1)</p>
          <p className="mt-0.5 max-w-xl text-[11px] text-zinc-500">
            {note ?? "Advisory evaluation — does not block execution, ads, CRO, Stripe, or bookings."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-[10px] text-zinc-500">
          <span>
            🔴 Critical <strong className="text-zinc-300">{critical.length}</strong>
          </span>
          <span>
            🟡 Warnings <strong className="text-zinc-300">{warnings.length}</strong>
          </span>
          <span>
            🔵 Info <strong className="text-zinc-300">{infos.length}</strong>
          </span>
        </div>
      </div>

      {policies.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">No policy findings for current signals.</p>
      ) : (
        <div className="mt-4 space-y-5">
          {critical.length > 0 ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-red-300/90">
                🔴 Critical
              </p>
              <PolicyRows items={critical} />
            </div>
          ) : null}
          {warnings.length > 0 ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-amber-200/90">
                🟡 Warnings
              </p>
              <PolicyRows items={warnings} />
            </div>
          ) : null}
          {infos.length > 0 ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-sky-200/90">🔵 Info</p>
              <PolicyRows items={infos} />
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
