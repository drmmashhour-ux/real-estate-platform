"use client";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread Alerts" },
  { id: "strong", label: "Strong Opportunities" },
  { id: "review", label: "Needs Review" },
  { id: "risky", label: "Risky Changes" },
] as const;

export type WatchlistFilterId = (typeof FILTERS)[number]["id"];

export function WatchlistFilters({
  value,
  onChange,
}: {
  value: WatchlistFilterId;
  onChange: (next: WatchlistFilterId) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {FILTERS.map((f) => {
        const active = value === f.id;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onChange(f.id)}
            className={`rounded-full border px-3 py-1 text-xs whitespace-nowrap ${
              active
                ? "border-premium-gold bg-premium-gold/15 text-premium-gold"
                : "border-white/20 text-slate-300 hover:bg-white/5"
            }`}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
