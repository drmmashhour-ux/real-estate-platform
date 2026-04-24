"use client";

import { Loader2 } from "lucide-react";

export type BnhubButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  loading?: boolean;
};

export function BnhubButton({
  variant = "primary",
  loading = false,
  className = "",
  children,
  disabled,
  type = "button",
  ...rest
}: BnhubButtonProps) {
  const base = variant === "primary" ? "bnhub-btn bnhub-btn--primary transition-all duration-200 active:scale-95 active:opacity-90" : "bnhub-btn bnhub-btn--secondary transition-all duration-200 active:scale-95 active:opacity-90";
  return (
    <button type={type} className={`${base} ${className}`.trim()} disabled={disabled || loading} {...rest}>
      {loading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}
