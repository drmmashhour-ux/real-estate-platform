"use client";

export function StrategyModeSelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white">
      <option value="balanced">Balanced</option>
      <option value="cashflow">Cashflow</option>
      <option value="appreciation">Appreciation</option>
      <option value="flip">Flip</option>
    </select>
  );
}
