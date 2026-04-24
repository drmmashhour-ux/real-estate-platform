"use client";

import type { UserPreferenceProfileView } from "@/modules/user-intelligence/types/user-intelligence.types";

type Props = { profile: UserPreferenceProfileView | null; loading?: boolean };

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <h3 className="text-sm font-semibold text-premium-gold">{title}</h3>
      <div className="mt-2 text-sm text-slate-300">{children}</div>
    </div>
  );
}

function fmt(v: unknown): string {
  if (v == null) {
    return "—";
  }
  if (typeof v === "object") {
    return JSON.stringify(v, null, 2);
  }
  return String(v);
}

export function UserPreferenceSummary({ profile, loading }: Props) {
  if (loading) {
    return <p className="text-slate-400">Loading your saved preferences…</p>;
  }
  if (!profile) {
    return <p className="text-slate-400">No profile yet. Use Dream Home or your activity to build one.</p>;
  }
  const c = profile.categories;
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        This is the housing-related information we keep to improve search and matches. You can edit explicit entries below. We
        don’t store background or protected characteristics as preference signals.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <Block title="Household">{fmt(c.household)}</Block>
        <Block title="Housing & search">{fmt(c.housing)}</Block>
        <Block title="Lifestyle">{fmt(c.lifestyle)}</Block>
        <Block title="Location">{fmt(c.neighborhood)}</Block>
        <Block title="Budget hints">{fmt(c.budget)}</Block>
        <Block title="Accessibility (your words)">{fmt(c.accessibility)}</Block>
        <Block title="Design & style tags">{fmt(c.design)}</Block>
      </div>
      <p className="text-xs text-slate-500">
        Confidence {profile.confidenceScore != null ? profile.confidenceScore.toFixed(2) : "n/a"} · Signals recorded:{" "}
        {profile.sourceSignalCount} · Last update {profile.lastRebuiltAt ?? "—"}
      </p>
    </div>
  );
}
