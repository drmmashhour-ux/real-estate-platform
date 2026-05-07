import * as React from "react";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const variantStyles: Record<BadgeVariant, string> = {
  default: "border-transparent bg-[#D4AF37]/20 text-[#D4AF37]",
  secondary: "border-transparent bg-white/10 text-white/80",
  destructive: "border-transparent bg-red-500/20 text-red-300",
  outline: "border-white/20 text-white/70",
};

function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: BadgeVariant }) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
export type { BadgeVariant };
