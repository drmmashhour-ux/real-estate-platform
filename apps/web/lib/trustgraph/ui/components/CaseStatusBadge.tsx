type Props = { status: string };

export function CaseStatusBadge({ status }: Props) {
  return (
    <span className="inline-flex rounded-md border border-white/10 bg-slate-900/60 px-2 py-0.5 text-xs font-medium capitalize text-slate-200">
      {status.replace(/_/g, " ")}
    </span>
  );
}
