import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Info, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";

type NoticeTone = "neutral" | "info" | "success";

const toneMap: Record<NoticeTone, { Icon: LucideIcon; bar: string; iconClass: string }> = {
  neutral: { Icon: Info, bar: "bg-ds-gold/80", iconClass: "text-ds-gold" },
  info: { Icon: Info, bar: "bg-sky-500/80", iconClass: "text-sky-300" },
  success: { Icon: CheckCircle2, bar: "bg-emerald-500/80", iconClass: "text-emerald-300" },
};

export function NoticePanel({
  title,
  tone = "neutral",
  children,
  footnote,
  className = "",
}: {
  title: string;
  tone?: NoticeTone;
  children: ReactNode;
  footnote?: ReactNode;
  className?: string;
}) {
  const t = toneMap[tone];
  const { Icon } = t;
  return (
    <Card variant="lecipm" className={className}>
      <div className={["h-1.5 w-full", t.bar].join(" ")} />
      <CardHeader className="!pt-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-ds-border bg-ds-surface/50">
            <Icon className={["h-5 w-5", t.iconClass].join(" ")} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ds-gold/90">Notice</p>
            <CardTitle className="mt-1 text-lg font-bold text-ds-text">{title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="!pt-0">
        <div className="text-sm leading-relaxed text-ds-text-secondary">{children}</div>
        {footnote ? <p className="mt-4 text-xs leading-relaxed text-ds-text-secondary/80">{footnote}</p> : null}
      </CardContent>
    </Card>
  );
}
