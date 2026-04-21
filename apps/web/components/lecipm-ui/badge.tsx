import type { HTMLAttributes, ReactNode } from "react";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  label: ReactNode;
  /** Default = gold pill; outline = neutral ring for secondary tags */
  variant?: "gold" | "outline";
};

export function Badge({ label, variant = "gold", className = "", ...rest }: BadgeProps) {
  const styles =
    variant === "gold"
      ? "bg-gold text-black"
      : "border border-white/15 bg-white/5 text-neutral-300";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        styles,
        className,
      ].join(" ")}
      {...rest}
    >
      {label}
    </span>
  );
}
