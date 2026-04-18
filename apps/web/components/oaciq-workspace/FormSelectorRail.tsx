"use client";

const FORMS = ["PP", "CP", "DS", "IV", "RIS", "RH"] as const;

export function FormSelectorRail({
  value,
  onChange,
}: {
  value: string;
  onChange: (k: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {FORMS.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
            value === k ? "bg-ds-gold/90 text-black" : "border border-white/15 bg-black/40 text-ds-text"
          }`}
        >
          {k}
        </button>
      ))}
    </div>
  );
}
