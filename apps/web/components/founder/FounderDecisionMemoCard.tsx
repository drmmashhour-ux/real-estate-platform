"use client";

export function FounderDecisionMemoCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-amber-200/80">{title}</div>
      <p className="mt-2 text-sm text-zinc-200">{body}</p>
    </div>
  );
}
