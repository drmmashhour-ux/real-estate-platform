import type { ReactNode } from "react";

export function FormField({
  label,
  error,
  hint,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`.trim()}>
      <span className="block text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</span>
      {children}
      {hint && !error ? <p className="text-xs text-stone-500">{hint}</p> : null}
      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
    </div>
  );
}
