"use client";

type Props = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  accent?: string;
};

export function AIExplainButton({ label, onClick, disabled, accent = "var(--color-premium-gold)" }: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:bg-white/5 disabled:opacity-40"
      style={{ borderColor: `${accent}66`, color: accent }}
    >
      {label}
    </button>
  );
}
