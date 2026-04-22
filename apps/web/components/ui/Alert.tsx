import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react";

export type AlertVariant = "info" | "success" | "warning" | "error" | "actionNeeded";

const styles: Record<AlertVariant, string> = {
  info: "border-[#1F6FEB]/35 bg-[#1F6FEB]/10 text-[#E8F1FF]",
  success: "border-[#2E8B57]/35 bg-[#2E8B57]/12 text-emerald-50",
  warning: "border-[#E0A800]/40 bg-[#E0A800]/12 text-amber-50",
  error: "border-[#C73E1D]/40 bg-[#C73E1D]/12 text-red-50",
  actionNeeded: "border-[#D4AF37]/45 bg-[#D4AF37]/10 text-[#FAFAF7]",
};

const icons: Record<AlertVariant, ReactNode> = {
  info: <Info className="h-5 w-5 shrink-0 text-[#1F6FEB]" aria-hidden />,
  success: <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2E8B57]" aria-hidden />,
  warning: <AlertTriangle className="h-5 w-5 shrink-0 text-[#E0A800]" aria-hidden />,
  error: <ShieldAlert className="h-5 w-5 shrink-0 text-[#C73E1D]" aria-hidden />,
  actionNeeded: <ShieldAlert className="h-5 w-5 shrink-0 text-[#D4AF37]" aria-hidden />,
};

export function Alert({
  variant = "info",
  title,
  children,
  action,
  className = "",
}: {
  variant?: AlertVariant;
  title: string;
  /** Short supporting line — avoid paragraphs (Part 12). */
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={[
        "flex gap-4 rounded-xl border px-4 py-3 shadow-sm motion-safe:transition motion-safe:duration-200",
        styles[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="pt-0.5">{icons[variant]}</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-snug">{title}</p>
        {children ?
          <div className="mt-1 text-sm opacity-95">{children}</div>
        : null}
      </div>
      {action ? <div className="shrink-0 self-center">{action}</div> : null}
    </div>
  );
}
