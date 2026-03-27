import type { ReactNode } from "react";

/**
 * Shared empty state — supports both legacy (icon + children) and trust-dashboard (title + action) APIs.
 */
export function EmptyState({
  title,
  description,
  action,
  icon,
  children,
}: {
  title: string;
  description?: string;
  /** Preferred when not using children */
  action?: ReactNode;
  icon?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-12 text-center">
      {icon ? <p className="text-2xl">{icon}</p> : null}
      <p className={`text-base font-medium text-white ${icon ? "mt-3" : ""}`}>{title}</p>
      {description ? <p className="mt-2 text-sm text-[#A1A1A1]">{description}</p> : null}
      {children ?? action ? <div className="mt-6 flex justify-center">{children ?? action}</div> : null}
    </div>
  );
}
