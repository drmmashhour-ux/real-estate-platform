import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-3 py-2 text-sm text-[color:var(--darlink-text)] outline-none ring-0 transition placeholder:text-[color:var(--darlink-text-muted)] focus:border-[color:var(--darlink-accent)]",
        className,
      )}
      {...props}
    />
  );
}
