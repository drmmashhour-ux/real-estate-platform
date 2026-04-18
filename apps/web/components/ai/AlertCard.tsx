import type { ReactNode } from "react";

const toneCls = {
  info: "border-blue-500/30 bg-blue-500/10 text-blue-100",
  warning: "border-amber-500/35 bg-amber-500/10 text-amber-100",
  critical: "border-rose-500/35 bg-rose-500/10 text-rose-100",
} as const;

export function AlertCard({
  title,
  children,
  tone = "info",
  icon,
}: {
  title: string;
  children: ReactNode;
  tone?: keyof typeof toneCls;
  icon?: ReactNode;
}) {
  return (
    <div className={["flex gap-3 rounded-2xl border px-4 py-3", toneCls[tone]].join(" ")}>
      {icon ? <div className="shrink-0 pt-0.5">{icon}</div> : null}
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <div className="mt-1 text-xs opacity-90">{children}</div>
      </div>
    </div>
  );
}
