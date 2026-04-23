"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getStepRecord } from "../city-launch-progress.service";
import {
  buildCityLaunchFullView,
  updateLaunchStep,
  updatePerformanceMetrics,
} from "../city-launch.service";

import type { LaunchPhaseId, LaunchStep, StepStatus } from "../city-launch.types";

type Props = { territoryId: string; adminBase: string };

const PHASE_ORDER: LaunchPhaseId[] = [
  "PRE_LAUNCH",
  "LAUNCH",
  "EARLY_TRACTION",
  "SCALE",
  "DOMINATION",
];

export function CityLaunchTerritoryClient({ territoryId, adminBase }: Props) {
  const [tick, setTick] = useState(0);
  const view = useMemo(() => buildCityLaunchFullView(territoryId), [territoryId, tick]);

  const [metricsForm, setMetricsForm] = useState({
    leadsGenerated: "",
    brokersOnboarded: "",
    listingsCreated: "",
    bookingsBnhub: "",
    dealsClosed: "",
    revenueCents: "",
    growthRate: "",
  });

  useEffect(() => {
    if (!view) return;
    const m = view.metrics;
    setMetricsForm({
      leadsGenerated: String(m.leadsGenerated),
      brokersOnboarded: String(m.brokersOnboarded),
      listingsCreated: String(m.listingsCreated),
      bookingsBnhub: String(m.bookingsBnhub),
      dealsClosed: String(m.dealsClosed),
      revenueCents: String(m.revenueCents),
      growthRate: String(m.growthRate),
    });
  }, [view, tick]);

  if (!view) {
    return (
      <div className="mx-auto max-w-4xl p-6 text-zinc-400">
        Territory not found.
        <Link href={`${adminBase}/city-launch`} className="mt-4 block text-sky-400 underline">
          ← Back
        </Link>
      </div>
    );
  }

  function refresh() {
    setTick((x) => x + 1);
  }

  function saveMetrics(e: React.FormEvent) {
    e.preventDefault();
    const p: Partial<{ leadsGenerated: number; brokersOnboarded: number; listingsCreated: number; bookingsBnhub: number; dealsClosed: number; revenueCents: number; growthRate: number }> =
      {};
    if (metricsForm.leadsGenerated !== "") p.leadsGenerated = Number(metricsForm.leadsGenerated);
    if (metricsForm.brokersOnboarded !== "") p.brokersOnboarded = Number(metricsForm.brokersOnboarded);
    if (metricsForm.listingsCreated !== "") p.listingsCreated = Number(metricsForm.listingsCreated);
    if (metricsForm.bookingsBnhub !== "") p.bookingsBnhub = Number(metricsForm.bookingsBnhub);
    if (metricsForm.dealsClosed !== "") p.dealsClosed = Number(metricsForm.dealsClosed);
    if (metricsForm.revenueCents !== "") p.revenueCents = Number(metricsForm.revenueCents);
    if (metricsForm.growthRate !== "") p.growthRate = Number(metricsForm.growthRate);
    updatePerformanceMetrics(territoryId, p);
    refresh();
  }

  function patchStep(stepId: string, status: StepStatus, notes?: string, assignedTo?: string) {
    updateLaunchStep(territoryId, stepId, { status, notes, resultNotes: notes });
    refresh();
  }

  const stepsByPhase = useMemo(() => {
    const m = new Map<LaunchPhaseId, LaunchStep[]>();
    for (const p of PHASE_ORDER) m.set(p, []);
    for (const s of view.steps) {
      const arr = m.get(s.phaseId) ?? [];
      arr.push(s);
      m.set(s.phaseId, arr);
    }
    return m;
  }, [view.steps]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 text-white">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase text-zinc-500">City launch</p>
          <h1 className="text-2xl font-semibold">{view.playbook.territoryName}</h1>
          <p className="text-sm text-zinc-400">{view.integration.regionLabel}</p>
        </div>
        <Link
          href={`${adminBase}/city-launch`}
          className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-zinc-300"
        >
          ← All cities
        </Link>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-sm font-semibold">Performance metrics</h2>
        <form onSubmit={saveMetrics} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field
            label="Leads generated"
            value={metricsForm.leadsGenerated}
            onChange={(v) => setMetricsForm((s) => ({ ...s, leadsGenerated: v }))}
          />
          <Field
            label="Brokers onboarded"
            value={metricsForm.brokersOnboarded}
            onChange={(v) => setMetricsForm((s) => ({ ...s, brokersOnboarded: v }))}
          />
          <Field
            label="Listings created"
            value={metricsForm.listingsCreated}
            onChange={(v) => setMetricsForm((s) => ({ ...s, listingsCreated: v }))}
          />
          <Field
            label="BNHub bookings"
            value={metricsForm.bookingsBnhub}
            onChange={(v) => setMetricsForm((s) => ({ ...s, bookingsBnhub: v }))}
          />
          <Field
            label="Deals closed"
            value={metricsForm.dealsClosed}
            onChange={(v) => setMetricsForm((s) => ({ ...s, dealsClosed: v }))}
          />
          <Field
            label="Revenue (cents)"
            value={metricsForm.revenueCents}
            onChange={(v) => setMetricsForm((s) => ({ ...s, revenueCents: v }))}
          />
          <Field
            label="Growth rate"
            value={metricsForm.growthRate}
            onChange={(v) => setMetricsForm((s) => ({ ...s, growthRate: v }))}
          />
          <div className="flex items-end">
            <button
              type="submit"
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
            >
              Save metrics
            </button>
          </div>
        </form>
        <p className="mt-2 text-[11px] text-zinc-600">
          Local demo storage — wire CRM for authoritative KPIs. Drives adaptation rules.
        </p>
      </section>

      <section className="grid gap-4 rounded-2xl border border-white/10 bg-zinc-950/50 p-4 sm:grid-cols-4">
        <Metric label="Completion" value={`${view.progress.completionPercent}%`} />
        <Metric label="Velocity" value={`${view.progress.velocityStepsPerWeek.toFixed(1)} /wk`} />
        <Metric label="Phase" value={view.currentPhaseId.replace(/_/g, " ")} />
        <Metric label="Readiness" value={view.integration.readinessBand} />
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-sm font-semibold">Strategy recap</h2>
        <p className="mt-2 text-sm text-zinc-300">{view.playbook.launchStrategySummary}</p>
      </section>

      {PHASE_ORDER.map((phase) => (
        <section key={phase} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <h2 className="text-sm font-semibold capitalize text-emerald-200/90">{phase.replace(/_/g, " ")}</h2>
          <div className="mt-3 space-y-3">
            {(stepsByPhase.get(phase) ?? []).map((s) => (
              <StepRow key={`${s.id}-${tick}`} territoryId={territoryId} step={s} onPatch={patchStep} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-xs">
      <span className="text-zinc-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-white/15 bg-zinc-900 px-2 py-1 text-sm"
        inputMode="decimal"
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase text-zinc-500">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function StepRow({
  territoryId,
  step,
  onPatch,
}: {
  territoryId: string;
  step: LaunchStep;
  onPatch: (stepId: string, status: StepStatus, notes?: string, assignedTo?: string) => void;
}) {
  const rec = getStepRecord(territoryId, step.id);
  const status = rec?.status ?? "pending";
  const [notes, setNotes] = useState(rec?.notes ?? "");
  const [assign, setAssign] = useState(rec?.assignedTo ?? "");

  return (
    <div
      className={`rounded-xl border p-3 text-sm ${
        step.isAdaptation ? "border-violet-600/40 bg-violet-950/25" : "border-white/10 bg-black/20"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-white">{step.title}</p>
          <p className="mt-1 text-xs text-zinc-400">{step.description}</p>
          <p className="mt-2 text-[11px] text-zinc-500">
            {step.category} · Hub {step.assignedHub} · {step.priority}
          </p>
          <p className="mt-1 text-[11px] text-emerald-200/80">Success: {step.successMetric}</p>
        </div>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase text-zinc-300">{status}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <select
          value={status}
          onChange={(e) => onPatch(step.id, e.target.value as StepStatus, notes, assign)}
          className="rounded-lg border border-white/15 bg-zinc-900 px-2 py-1 text-xs"
        >
          {(["pending", "in_progress", "blocked", "completed"] as const).map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
        <input
          placeholder="Assign to"
          value={assign}
          onChange={(e) => setAssign(e.target.value)}
          onBlur={() => onPatch(step.id, status, notes, assign)}
          className="rounded-lg border border-white/15 bg-zinc-900 px-2 py-1 text-xs"
        />
        <input
          placeholder="Notes / results"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => onPatch(step.id, status, notes, assign)}
          className="min-w-[180px] flex-1 rounded-lg border border-white/15 bg-zinc-900 px-2 py-1 text-xs"
        />
      </div>
    </div>
  );
}
