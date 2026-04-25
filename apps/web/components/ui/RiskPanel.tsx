import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";

/** critical = red, warning = yellow, ok = green, info = neutral */
export type RiskLevel = "critical" | "warning" | "ok" | "info";

export type RiskItem = {
  id: string;
  title: string;
  description?: string;
  level: RiskLevel;
};

const iconFor = (level: RiskLevel) => {
  switch (level) {
    case "critical":
      return AlertCircle;
    case "warning":
      return AlertTriangle;
    case "ok":
      return CheckCircle2;
    default:
      return Info;
  }
};

const styleFor = (level: RiskLevel) => {
  switch (level) {
    case "critical":
      return {
        border: "border-l-red-500/70",
        icon: "text-red-400",
        bg: "bg-red-500/5",
      };
    case "warning":
      return {
        border: "border-l-amber-400/70",
        icon: "text-amber-300",
        bg: "bg-amber-500/5",
      };
    case "ok":
      return {
        border: "border-l-emerald-500/60",
        icon: "text-emerald-300",
        bg: "bg-emerald-500/5",
      };
    default:
      return {
        border: "border-l-ds-gold/50",
        icon: "text-ds-gold/90",
        bg: "bg-ds-surface/40",
      };
  }
};

export function RiskPanel({
  title = "Risks",
  subtitle,
  items,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  items: RiskItem[];
  className?: string;
}) {
  return (
    <Card variant="lecipm" className={className}>
      <CardHeader>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ds-gold/90">What to watch</p>
        <CardTitle className="mt-1.5 text-xl font-bold text-ds-text">{title}</CardTitle>
        {subtitle ? <p className="mt-2 text-sm leading-relaxed text-ds-text-secondary">{subtitle}</p> : null}
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {items.map((r) => {
            const Icon = iconFor(r.level);
            const s = styleFor(r.level);
            return (
              <li
                key={r.id}
                className={[
                  "flex gap-3 rounded-2xl border border-ds-border/80 border-l-4 p-4",
                  s.border,
                  s.bg,
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <Icon className={["mt-0.5 h-5 w-5 shrink-0", s.icon].join(" ")} strokeWidth={1.75} />
                <div className="min-w-0">
                  <p className="font-semibold text-ds-text">{r.title}</p>
                  {r.description ? <p className="mt-1.5 text-sm leading-relaxed text-ds-text-secondary">{r.description}</p> : null}
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
