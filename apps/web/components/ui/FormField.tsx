import type { ReactNode } from "react";

type FormFieldTone = "light" | "dark" | "lecipm";

const labelClass: Record<FormFieldTone, string> = {
  light: "text-stone-500",
  dark: "text-stone-500",
  lecipm: "text-ds-text-secondary",
};

const hintClass: Record<FormFieldTone, string> = {
  light: "text-stone-500",
  dark: "text-stone-500",
  lecipm: "text-ds-text-secondary/80",
};

export function FormField({
  label,
  error,
  hint,
  children,
  className = "",
  tone = "light",
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  /** LECIPM Premium on black — clearer label + hint contrast */
  tone?: FormFieldTone;
}) {
  return (
    <div className={["space-y-2.5", className].filter(Boolean).join(" ")}>
      <span className={["block text-xs font-semibold uppercase tracking-[0.16em]", labelClass[tone]].join(" ")}>{label}</span>
      {children}
      {hint && !error ? <p className={["text-xs leading-relaxed", hintClass[tone]].join(" ")}>{hint}</p> : null}
      {error ? (
        <p className="text-sm font-medium text-red-500 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
