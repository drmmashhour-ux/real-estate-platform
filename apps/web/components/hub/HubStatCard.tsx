import type { HubTheme } from "@/lib/hub/themes";

type HubStatCardProps = {
  label: string;
  value: string | number;
  sub?: string;
  theme?: HubTheme;
  accent?: string;
  className?: string;
};

export function HubStatCard({ label, value, sub, theme, accent, className = "" }: HubStatCardProps) {
  const color = accent ?? theme?.accent;
  return (
    <div
      className={`rounded-xl border p-4 shadow-lg shadow-black/20 transition-all duration-300 ease-out motion-safe:hover:scale-[1.02] motion-safe:hover:shadow-xl ${className}`}
      style={{
        backgroundColor: theme?.cardBg ?? "rgba(255,255,255,0.05)",
        borderColor: color ? `${color}30` : "rgba(255,255,255,0.1)",
      }}
    >
      <p className="text-xs font-medium uppercase tracking-wider opacity-80" style={{ color: color ?? "inherit" }}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold" style={{ color: theme?.text ?? "#fff" }}>
        {value}
      </p>
      {sub ? (
        <p className="mt-0.5 text-xs" style={{ color: theme?.textMuted ?? "rgba(255,255,255,0.5)" }}>
          {sub}
        </p>
      ) : null}
    </div>
  );
}
