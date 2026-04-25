import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";
import { cloneElement, isValidElement } from "react";

import { Loader2 } from "lucide-react";

type Variant =
  | "primary"
  | "goldPrimary"
  /** LECIPM Premium: gold background, true black text — same intent as `goldPrimary`, tuned for #000 / #D4AF37 shell */
  | "lpPrimary"
  | "secondary"
  /** LECIPM Premium: gold border + gold label on dark */
  | "outlineGold"
  | "outline"
  | "ghost"
  | "danger";
type Size = "sm" | "md" | "lg" | "senior";

const variants: Record<Variant, string> = {
  primary:
    "bg-[#0B0B0B] text-white border border-[#0B0B0B] shadow-sm hover:bg-[#151515] hover:shadow active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2",
  goldPrimary:
    "bg-premium-gold text-[#0B0B0B] shadow-md shadow-premium-gold/25 hover:bg-premium-gold-hover focus-visible:ring-2 focus-visible:ring-premium-gold focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0B0B] active:scale-[0.98]",
  lpPrimary:
    "bg-ds-gold text-ds-bg shadow-ds-glow hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ds-gold/80 focus-visible:ring-offset-2 focus-visible:ring-offset-ds-bg active:scale-[0.98] motion-safe:transition",
  secondary:
    "bg-white text-[#0B0B0B] border border-[#D9D9D2] shadow-sm hover:border-[#5C5C57]/35 hover:bg-[#FAFAF7] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#D4AF37]",
  outlineGold:
    "border border-ds-gold/60 bg-transparent text-ds-gold hover:bg-ds-gold/10 hover:border-ds-gold/90 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ds-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ds-bg motion-safe:transition",
  outline:
    "border border-white/25 bg-transparent text-white hover:bg-white/10 hover:border-white/35 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#D4AF37]",
  ghost:
    "text-premium-gold/90 hover:bg-premium-gold/10 hover:text-premium-gold focus-visible:ring-2 focus-visible:ring-premium-gold/35 active:scale-[0.98]",
  danger:
    "bg-[#C73E1D] text-white hover:brightness-110 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#C73E1D]",
};

const sizes: Record<Size, string> = {
  sm: "rounded-lg px-3 py-1.5 text-xs",
  md: "rounded-xl px-5 py-2.5 text-sm",
  lg: "rounded-xl px-6 py-3 text-base",
  senior:
    "min-h-[56px] w-full rounded-xl px-8 text-[18px] font-semibold sm:h-14 sm:min-h-0 sm:w-auto sm:px-10",
};

function cx(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  loading?: boolean;
  asChild?: boolean;
};

export function Button({
  variant = "goldPrimary",
  size = "md",
  className = "",
  children,
  disabled,
  loading,
  asChild,
  ...props
}: ButtonProps) {
  const base = cx(
    "inline-flex items-center justify-center font-semibold motion-safe:transition motion-safe:duration-200 motion-safe:ease-out",
    "disabled:pointer-events-none disabled:opacity-45",
    "focus-visible:outline-none",
    variants[variant],
    sizes[size],
    loading ? "relative cursor-wait" : "",
    className,
  );

  if (asChild && isValidElement(children)) {
    const el = children as ReactElement<{ className?: string }>;
    return cloneElement(el, {
      ...(props as Record<string, unknown>),
      className: cx(base, el.props?.className),
      "aria-busy": loading ? true : undefined,
      ...(loading ? { "data-loading": true as const } : {}),
    });
  }

  return (
    <button
      type="button"
      disabled={disabled ?? loading}
      className={base}
      aria-busy={loading ? true : undefined}
      {...props}
    >
      {loading ?
        <>
          <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" aria-hidden />
          {children}
        </>
      : children}
    </button>
  );
}

/** Senior Hub — large touch target, gold, full width on mobile. */
export function SeniorPrimaryButton(props: Omit<ButtonProps, "variant" | "size">) {
  return <Button variant="goldPrimary" size="senior" {...props} />;
}
