type Ms = {
  id: string;
  label: string;
  target: number;
  current: number;
  unit: string;
  complete: boolean;
};

export function MilestoneTracker({ milestones }: { milestones: Ms[] }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
      <h2 className="text-lg font-semibold text-zinc-100">Milestones</h2>
      <ul className="mt-4 space-y-3">
        {milestones.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-4 text-sm">
            <span className="text-zinc-300">{m.label}</span>
            <span className={m.complete ? "text-emerald-400" : "text-zinc-500"}>
              {m.unit === "users" ? `${m.current} / ${m.target}` : `${m.current}`}
              {m.complete ? " ✓" : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
