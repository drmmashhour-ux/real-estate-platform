"use client";

export function TimelineStep({
  title,
  at,
  detail,
  kind,
}: {
  title: string;
  at: string;
  detail?: string;
  kind: string;
}) {
  return (
    <div className="relative border-l border-ds-gold/25 pl-4 pb-4 last:pb-0">
      <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-ds-gold/80" aria-hidden />
      <p className="text-[11px] uppercase tracking-wide text-ds-text-secondary">{kind}</p>
      <p className="text-sm font-medium text-ds-text">{title}</p>
      <p className="text-xs text-ds-text-secondary">{new Date(at).toLocaleString()}</p>
      {detail ? <p className="mt-1 text-xs text-ds-text-secondary/90">{detail}</p> : null}
    </div>
  );
}
