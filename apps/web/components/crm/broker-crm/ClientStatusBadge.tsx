import type { BrokerClientStatus } from "@prisma/client";

const STYLE: Record<BrokerClientStatus, string> = {
  LEAD: "border-slate-500/40 bg-slate-500/15 text-slate-200",
  CONTACTED: "border-sky-500/40 bg-sky-500/10 text-sky-100",
  QUALIFIED: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
  VIEWING: "border-cyan-500/40 bg-cyan-500/10 text-cyan-100",
  NEGOTIATING: "border-violet-500/40 bg-violet-500/10 text-violet-100",
  UNDER_CONTRACT: "border-amber-500/50 bg-amber-500/15 text-amber-100",
  CLOSED: "border-green-500/50 bg-green-500/15 text-green-100",
  LOST: "border-red-500/40 bg-red-500/10 text-red-200",
};

function label(s: BrokerClientStatus): string {
  return s.replace(/_/g, " ");
}

export function ClientStatusBadge({ status }: { status: BrokerClientStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STYLE[status]}`}
    >
      {label(status)}
    </span>
  );
}
