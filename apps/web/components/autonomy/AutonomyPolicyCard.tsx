"use client";

export function AutonomyPolicyCard({
  scopeType,
  scopeKey,
  autonomyMode,
  maxRiskLevel,
  emergencyFreeze,
  version,
}: {
  scopeType: string;
  scopeKey: string;
  autonomyMode: string;
  maxRiskLevel: string;
  emergencyFreeze: boolean;
  version: number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0f0f0f] p-4 text-sm text-slate-200">
      <p className="text-[10px] uppercase text-slate-500">
        {scopeType}:{scopeKey}
      </p>
      <p className="mt-1 font-semibold text-white">Mode {autonomyMode}</p>
      <p className="mt-1 text-xs text-slate-400">Max risk {maxRiskLevel} · v{version}</p>
      {emergencyFreeze ? (
        <p className="mt-2 text-xs font-semibold text-rose-300">Emergency freeze active</p>
      ) : null}
    </div>
  );
}
