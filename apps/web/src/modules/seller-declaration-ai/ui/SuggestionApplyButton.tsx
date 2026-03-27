"use client";

export function SuggestionApplyButton({ onApply }: { onApply: () => void }) {
  return (
    <button type="button" onClick={onApply} className="rounded-lg bg-[#C9A646] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#E8C547]">
      Apply suggestion
    </button>
  );
}
