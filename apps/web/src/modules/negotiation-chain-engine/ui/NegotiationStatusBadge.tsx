"use client";

type ChainStatus = "active" | "accepted" | "rejected" | string;

type Props = {
  /** Version or chain status */
  status: "pending" | "accepted" | "rejected" | ChainStatus;
  /** When true, emphasize “accepted + final” styling (green). */
  isFinal?: boolean;
  size?: "sm" | "md";
};

export function NegotiationStatusBadge({ status, isFinal, size = "sm" }: Props) {
  const base =
    size === "sm"
      ? "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      : "inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold uppercase tracking-wide";

  if (status === "accepted" && isFinal) {
    return (
      <span className={`${base} border border-emerald-500/40 bg-emerald-500/15 text-emerald-200`}>
        Accepted · final
      </span>
    );
  }
  if (status === "accepted") {
    return <span className={`${base} border border-emerald-500/30 bg-emerald-500/10 text-emerald-300`}>Accepted</span>;
  }
  if (status === "rejected") {
    return <span className={`${base} border border-rose-500/35 bg-rose-500/15 text-rose-200`}>Rejected</span>;
  }
  if (status === "pending") {
    return <span className={`${base} border border-amber-400/40 bg-amber-500/15 text-amber-100`}>Pending</span>;
  }
  if (status === "active") {
    return (
      <span className={`${base} border border-sky-500/30 bg-sky-500/10 text-sky-200`}>Chain open</span>
    );
  }
  return (
    <span className={`${base} border border-white/15 bg-white/5 text-slate-300`}>
      {String(status).replace(/_/g, " ")}
    </span>
  );
}
