"use client";

type Props = {
  min: number | null;
  max: number | null;
  onChange: (next: { min: number | null; max: number | null }) => void;
};

export function BudgetRangeSelector({ min, max, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <input type="number" value={min ?? ""} onChange={(e) => onChange({ min: Number(e.target.value) || null, max })} placeholder="Min" className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white" />
      <input type="number" value={max ?? ""} onChange={(e) => onChange({ min, max: Number(e.target.value) || null })} placeholder="Max" className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white" />
    </div>
  );
}
