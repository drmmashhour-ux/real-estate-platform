export function ComplianceStatusBadge(props: {
  openCases: number;
  escalatedAttention: boolean;
}) {
  if (props.openCases === 0 && !props.escalatedAttention) {
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-200/90">
        No open internal flags
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-amber-500/35 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-100">
      Internal review: {props.openCases} open
      {props.escalatedAttention ? " · escalated/critical" : ""}
    </span>
  );
}
