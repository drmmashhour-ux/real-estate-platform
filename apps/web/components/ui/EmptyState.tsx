import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { FiltersEmptyIcon } from "@/components/ui/empty-state-icons";

type Variant = "boxed" | "centered";

export type EmptyStateIcon = ReactNode | string;

function IconDisc({
  children,
  variant,
}: {
  children: ReactNode;
  variant: Variant;
}) {
  const ring =
    variant === "centered"
      ? "border-white/12 bg-white/[0.05] text-premium-gold"
      : "border-white/10 bg-white/[0.06] text-premium-gold";
  return (
    <div
      className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border ${ring} [&_svg]:shrink-0`}
      aria-hidden
    >
      {children}
    </div>
  );
}

function renderIcon(icon: EmptyStateIcon | undefined, variant: Variant, defaultVisual: "filters" | "generic") {
  if (icon === undefined) {
    return (
      <IconDisc variant={variant}>
        {defaultVisual === "filters" ? <FiltersEmptyIcon /> : <Inbox className="h-7 w-7 opacity-90" strokeWidth={1.5} />}
      </IconDisc>
    );
  }
  if (typeof icon === "string") {
    return (
      <IconDisc variant={variant}>
        <span className="text-3xl leading-none">{icon}</span>
      </IconDisc>
    );
  }
  return <IconDisc variant={variant}>{icon}</IconDisc>;
}

/**
 * Shared empty state — icon, title, optional description, and action slot (buttons/links).
 * Pass `icon` as a Lucide node, emoji string, or omit for a sensible default (`filters` vs `generic`).
 */
export function EmptyState({
  title,
  description,
  action,
  icon,
  children,
  variant = "boxed",
  defaultIcon = "filters",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: EmptyStateIcon;
  children?: ReactNode;
  variant?: Variant;
  /** When `icon` is omitted: `filters` = search icon; `generic` = inbox. */
  defaultIcon?: "filters" | "generic";
}) {
  const iconBlock = renderIcon(icon, variant, defaultIcon);

  if (variant === "centered") {
    return (
      <div className="py-16 text-center text-white/55 md:py-20" role="status" aria-live="polite">
        {iconBlock}
        <div className="mt-5 text-lg font-semibold text-white">{title}</div>
        {description ? <div className="lecipm-subtitle mx-auto mt-2 max-w-md">{description}</div> : null}
        {children ?? action ? (
          <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
            {children ?? action}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border border-dashed border-premium-gold/25 bg-premium-gold/[0.03] p-[var(--lecipm-card-padding)] py-10 text-center sm:py-12"
      role="status"
      aria-live="polite"
    >
      {iconBlock}
      <p className="mt-5 text-base font-semibold text-white">{title}</p>
      {description ? <p className="lecipm-subtitle mt-3">{description}</p> : null}
      {children ?? action ? (
        <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
          {children ?? action}
        </div>
      ) : null}
    </div>
  );
}
