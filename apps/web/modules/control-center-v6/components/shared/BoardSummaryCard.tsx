"use client";

export function BoardSummaryCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
      <h3 className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-200">{body}</p>
    </div>
  );
}
