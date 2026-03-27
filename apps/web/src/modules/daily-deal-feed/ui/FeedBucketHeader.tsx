export function FeedBucketHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[#C9A646]">{title}</h3>
      {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
    </div>
  );
}
