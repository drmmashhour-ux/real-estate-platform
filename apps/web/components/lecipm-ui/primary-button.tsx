import type { ButtonHTMLAttributes, ReactNode } from "react";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

/** Gold-on-black primary CTA — canonical LECIPM action button. */
export function PrimaryButton({ children, className = "", disabled, type = "button", ...rest }: PrimaryButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={[
        "rounded-lg bg-gold px-6 py-3 font-semibold text-black shadow-md shadow-gold/20",
        "transition duration-200 hover:bg-premium-gold-hover hover:opacity-95 hover:shadow-[0_0_28px_rgb(212_175_55_/_0.35)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        "disabled:pointer-events-none disabled:opacity-45",
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}
