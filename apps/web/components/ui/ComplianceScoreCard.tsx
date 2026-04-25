import type { ReactNode } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";

export type ComplianceBand = "good" | "warning" | "critical";

const band = {
  good: {
    label: "On track" as const,
    Icon: CheckCircle2,
    ring: "ring-emerald-500/30",
    bar: "from-emerald-500 to-emerald-400",
    sub: "text-emerald-200/90",
  },
  warning: {
    label: "Review soon" as const,
    Icon: AlertTriangle,
    ring: "ring-amber-400/35",
    bar: "from-amber-500 to-amber-300",
    sub: "text-amber-100/90",
  },
  critical: {
    label: "Action required" as const,
    Icon: AlertCircle,
    ring: "ring-red-500/40",
    bar: "from-red-600 to-red-400",
    sub: "text-red-200/90",
  },
};

export function ComplianceScoreCard({
  title = "Compliance score",
  score,
  band: bandKey,
  caption,
  footer,
  className = "",
}: {
  title?: string;
  /** 0–100 */
  score: number;
  band: ComplianceBand;
  caption?: string;
  footer?: ReactNode;
  className?: string;
}) {
  const b = band[bandKey];
  const { Icon } = b;
  const safe = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <Card variant="lecipm" className={["overflow-hidden", className].filter(Boolean).join(" ")}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ds-gold/90">{b.label}</p>
            <CardTitle className="mt-1.5 text-xl font-bold text-ds-text">{title}</CardTitle>
          </div>
          <div
            className={[
              "flex h-12 w-12 items-center justify-center rounded-2xl ring-1 bg-ds-surface/50",
              b.ring,
            ].join(" ")}
          >
            <Icon className="h-6 w-6 text-ds-text" strokeWidth={1.75} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-bold tabular-nums tracking-tight text-ds-text sm:text-6xl">{safe}</span>
          <span className="text-lg font-medium text-ds-text-secondary/90">/ 100</span>
        </div>
        {caption ? <p className={["mt-3 text-sm leading-relaxed", b.sub].join(" ")}>{caption}</p> : null}
        <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-ds-border">
          <div
            className={["h-full rounded-full bg-gradient-to-r motion-safe:transition-all motion-safe:duration-500", b.bar].join(" ")}
            style={{ width: `${safe}%` }}
          />
        </div>
        {footer ? <div className="mt-5 border-t border-ds-border/80 pt-4 text-sm text-ds-text-secondary">{footer}</div> : null}
      </CardContent>
    </Card>
  );
}
