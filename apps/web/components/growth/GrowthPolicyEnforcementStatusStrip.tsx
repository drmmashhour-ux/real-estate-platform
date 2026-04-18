"use client";

/**
 * Compact rollout visibility for operators — reflects feature flags from the server-rendered growth page.
 */

export function GrowthPolicyEnforcementStatusStrip({
  enforcementEnabled,
  panelEnabled,
}: {
  enforcementEnabled: boolean;
  panelEnabled: boolean;
}) {
  const scopeLabel = "Advisory-only scope";

  return (
    <section
      className="rounded-xl border border-zinc-700/80 bg-zinc-950/40 px-4 py-3"
      aria-label="Growth policy enforcement rollout status"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Growth policy enforcement</p>
      <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
        <span
          className={`rounded-full border px-2 py-0.5 font-medium ${
            enforcementEnabled
              ? "border-emerald-800/60 bg-emerald-950/35 text-emerald-100"
              : "border-zinc-600 bg-zinc-900/80 text-zinc-300"
          }`}
        >
          Layer: {enforcementEnabled ? "Enabled" : "Disabled"}
        </span>
        <span
          className={`rounded-full border px-2 py-0.5 font-medium ${
            panelEnabled
              ? "border-sky-800/55 bg-sky-950/25 text-sky-100"
              : "border-zinc-600 bg-zinc-900/80 text-zinc-300"
          }`}
        >
          Panel flag: {panelEnabled ? "On" : "Off"}
        </span>
        <span className="rounded-full border border-amber-900/45 bg-amber-950/20 px-2 py-0.5 font-medium text-amber-100/95">
          {scopeLabel}
        </span>
      </div>

      {!enforcementEnabled ? (
        <p className="mt-3 text-xs leading-relaxed text-amber-100/90">
          <span className="font-semibold text-amber-50">Internal:</span> enforcement is off. Set{" "}
          <code className="rounded bg-zinc-900 px-1 py-0.5 font-mono text-[10px]">
            FEATURE_GROWTH_POLICY_ENFORCEMENT_V1=true
          </code>{" "}
          to emit snapshots and advisory gates. Until then, dependent panels receive no enforcement snapshot (same as
          pre-layer behavior).
        </p>
      ) : null}

      {enforcementEnabled && !panelEnabled ? (
        <p className="mt-3 text-xs leading-relaxed text-sky-100/90">
          <span className="font-semibold text-sky-50">Operator note:</span> the detailed enforcement table is hidden —
          enable <code className="rounded bg-zinc-900 px-1 py-0.5 font-mono text-[10px]">
            FEATURE_GROWTH_POLICY_ENFORCEMENT_PANEL_V1
          </code>{" "}
          to show the full panel below.
        </p>
      ) : null}

      <p className="mt-3 text-[10px] leading-relaxed text-zinc-500">
        This layer does <span className="text-zinc-400">not</span> enforce payments, bookings core, ads execution core,
        or CRO core — only bounded advisory/orchestration signals.
      </p>
    </section>
  );
}
