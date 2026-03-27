import type { ReactNode } from "react";

type Tone = "danger" | "warning" | "success" | "neutral";

const toneClass: Record<Tone, string> = {
  danger: "bg-red-500/15 text-red-300 ring-1 ring-red-500/25",
  warning: "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/25",
  success: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25",
  neutral: "bg-white/5 text-[#A1A1A1] ring-1 ring-white/10",
};

export function StatusPill({
  tone,
  children,
  icon,
  className = "",
}: {
  tone: Tone;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex max-w-full items-start gap-2 rounded-lg px-2.5 py-1.5 text-xs leading-snug ${toneClass[tone]} ${className}`.trim()}
    >
      {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
      <span>{children}</span>
    </span>
  );
}
