"use client";

export function ValidationBadge({ severity }: { severity: "info" | "warning" | "critical" }) {
  const cls =
    severity === "critical"
      ? "border-red-500/50 bg-red-950/40 text-red-100"
      : severity === "warning"
        ? "border-amber-500/40 bg-amber-950/30 text-amber-100"
        : "border-sky-500/40 bg-sky-950/30 text-sky-100";
  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      {severity}
    </span>
  );
}
