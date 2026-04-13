import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { HUB_GOLD_CSS } from "./hub-tokens";

type HubEmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
};

export function HubEmptyState({ title, description, action, icon }: HubEmptyStateProps) {
  const visual = icon ?? <Inbox className="h-7 w-7 opacity-90" strokeWidth={1.5} aria-hidden />;
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-12 text-center md:py-14">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.05] text-premium-gold [&_svg]:shrink-0">
        {visual}
      </div>
      <p className="mt-5 text-lg font-semibold" style={{ color: HUB_GOLD_CSS }}>
        {title}
      </p>
      {description ? <p className="mt-2 max-w-md text-sm text-white/65">{description}</p> : null}
      {action ? <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div> : null}
    </div>
  );
}
