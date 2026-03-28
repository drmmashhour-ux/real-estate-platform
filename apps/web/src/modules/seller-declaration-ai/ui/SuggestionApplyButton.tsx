"use client";

export function SuggestionApplyButton({ onApply }: { onApply: () => void }) {
  return (
    <button type="button" onClick={onApply} className="rounded-lg bg-premium-gold px-3 py-1.5 text-xs font-medium text-black hover:bg-premium-gold">
      Apply suggestion
    </button>
  );
}
