"use client";

type Level = "low" | "medium" | "high";

const COPY: Record<Level, { title: string; body: string; className: string }> = {
  low: {
    title: "Premature push risk: low",
    body: "The current signals do not strongly suggest a hard ask would be out of place — you still set the tone.",
    className: "border-slate-600/60 bg-slate-800/50 text-slate-200",
  },
  medium: {
    title: "Premature push risk: medium",
    body: "Consider a clarifying or nurture step before strong close language, especially if your notes differ from the snapshot.",
    className: "border-amber-500/40 bg-amber-500/10 text-amber-100",
  },
  high: {
    title: "Premature push risk: high",
    body: "A forceful close is more likely to feel out of step — rebuild trust, clear blockers, or re-open the thread first.",
    className: "border-rose-500/45 bg-rose-500/10 text-rose-100",
  },
};

export function PrematurePushWarning({ level, explain }: { level: Level; explain?: string[] }) {
  const c = COPY[level];
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${c.className}`}>
      <p className="font-medium">{c.title}</p>
      <p className="mt-1 text-xs opacity-90">{c.body}</p>
      {explain && explain.length > 0 ? (
        <ul className="mt-2 list-inside list-disc text-[11px] opacity-80">
          {explain.slice(0, 2).map((e) => (
            <li key={e.slice(0, 24)}>{e}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
