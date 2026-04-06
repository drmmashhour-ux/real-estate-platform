import type { ReactNode } from "react";
import { HUB_GOLD_CSS } from "./hub-tokens";

type HubEmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function HubEmptyState({ title, description, action }: HubEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-center">
      <p className="text-lg font-semibold" style={{ color: HUB_GOLD_CSS }}>
        {title}
      </p>
      {description ? <p className="mt-2 max-w-md text-sm text-white/65">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
