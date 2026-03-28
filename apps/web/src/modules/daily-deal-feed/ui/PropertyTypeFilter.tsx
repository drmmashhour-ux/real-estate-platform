"use client";

const TYPES = ["SINGLE_FAMILY", "CONDO", "TOWNHOUSE", "MULTI_FAMILY"];

export function PropertyTypeFilter({ selected, onChange }: { selected: string[]; onChange: (next: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {TYPES.map((t) => {
        const on = selected.includes(t);
        return (
          <button
            key={t}
            type="button"
            onClick={() => onChange(on ? selected.filter((x) => x !== t) : [...selected, t])}
            className={`rounded-full border px-3 py-1 text-xs ${on ? "border-premium-gold bg-premium-gold/10 text-premium-gold" : "border-white/20 text-slate-300"}`}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}
