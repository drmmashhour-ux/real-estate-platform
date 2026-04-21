"use client";

export function AutonomySummaryCards(props: {
  queued: number;
  executed: number;
  blocked: number;
  pendingApproval: number;
  emergencyFreeze?: boolean;
  mode?: string;
}) {
  const card =
    "rounded-xl border border-white/10 bg-[#101010] px-4 py-3 text-sm text-slate-200";
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <div className={card}>
        <p className="text-[10px] uppercase text-slate-500">Queued</p>
        <p className="text-2xl font-semibold text-white">{props.queued}</p>
      </div>
      <div className={card}>
        <p className="text-[10px] uppercase text-slate-500">Executed</p>
        <p className="text-2xl font-semibold text-emerald-300">{props.executed}</p>
      </div>
      <div className={card}>
        <p className="text-[10px] uppercase text-slate-500">Blocked</p>
        <p className="text-2xl font-semibold text-amber-300">{props.blocked}</p>
      </div>
      <div className={card}>
        <p className="text-[10px] uppercase text-slate-500">Approval</p>
        <p className="text-2xl font-semibold text-violet-300">{props.pendingApproval}</p>
      </div>
      <div className={card}>
        <p className="text-[10px] uppercase text-slate-500">Policy / freeze</p>
        <p className="text-xs text-slate-300">{props.mode ?? "—"}</p>
        <p className="mt-1 text-xs text-rose-300/90">{props.emergencyFreeze ? "Emergency freeze ON" : " "}</p>
      </div>
    </div>
  );
}
