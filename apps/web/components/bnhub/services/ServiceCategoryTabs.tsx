"use client";

const LABELS: Record<string, string> = {
  TRANSPORT: "Transport",
  FOOD: "Food",
  CLEANING: "Cleaning",
  CONVENIENCE: "Convenience",
  EXPERIENCE: "Experience",
  ALL: "All",
};

export function ServiceCategoryTabs({
  categories,
  value,
  onChange,
}: {
  categories: string[];
  value: string;
  onChange: (c: string) => void;
}) {
  const tabs = ["ALL", ...categories];
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Service categories">
      {tabs.map((c) => (
        <button
          key={c}
          type="button"
          role="tab"
          aria-selected={value === c}
          onClick={() => onChange(c)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
            value === c
              ? "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-500/40"
              : "bg-slate-800/80 text-slate-400 hover:bg-slate-800"
          }`}
        >
          {LABELS[c] ?? c}
        </button>
      ))}
    </div>
  );
}
