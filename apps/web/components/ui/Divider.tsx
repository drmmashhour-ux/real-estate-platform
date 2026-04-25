import type { HTMLAttributes, ReactNode } from "react";

type DividerProps = {
  className?: string;
  /** Optional label centered on the line */
  label?: ReactNode;
  /** Horizontal (default) or vertical rule */
  orientation?: "horizontal" | "vertical";
} & Omit<HTMLAttributes<HTMLDivElement>, "role">;

export function Divider({ className = "", label, orientation = "horizontal", ...rest }: DividerProps) {
  if (orientation === "vertical") {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={["h-auto min-h-full w-px shrink-0 bg-ds-border", className].filter(Boolean).join(" ")}
        {...rest}
      />
    );
  }

  if (label) {
    return (
      <div
        role="separator"
        className={["flex items-center gap-4", className].filter(Boolean).join(" ")}
        {...rest}
      >
        <div className="h-px flex-1 bg-ds-border" />
        <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.2em] text-ds-text-secondary">{label}</span>
        <div className="h-px flex-1 bg-ds-border" />
      </div>
    );
  }

  return (
    <div role="separator" className={["h-px w-full bg-ds-border", className].filter(Boolean).join(" ")} {...rest} />
  );
}
