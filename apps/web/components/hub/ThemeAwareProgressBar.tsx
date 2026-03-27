type ThemeAwareProgressBarProps = {
  value: number;
  max?: number;
  accent?: string;
  bg?: string;
  label?: string;
  className?: string;
};

export function ThemeAwareProgressBar({
  value,
  max = 100,
  accent = "#22c55e",
  bg = "rgba(255,255,255,0.1)",
  label,
  className = "",
}: ThemeAwareProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={className}>
      {label ? (
        <div className="mb-1 flex justify-between text-xs">
          <span>{label}</span>
          <span>{Math.round(pct)}%</span>
        </div>
      ) : null}
      <div
        className="h-2 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: bg }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: accent }}
        />
      </div>
    </div>
  );
}
