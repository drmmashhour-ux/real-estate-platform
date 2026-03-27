type Props = { level: string | null };

export function ReadinessBadge({ level }: Props) {
  if (!level) return <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-400">—</span>;
  return (
    <span className="inline-flex rounded-md border border-white/15 bg-white/5 px-2 py-0.5 text-xs font-medium capitalize text-slate-200">
      {level.replace(/_/g, " ")}
    </span>
  );
}
