export function ExecutionDecisionBadge(props: { label: string; variant?: "ok" | "warn" | "block" }) {
  const cls =
    props.variant === "ok"
      ? "border-emerald-800 text-emerald-300"
      : props.variant === "block"
        ? "border-rose-800 text-rose-300"
        : "border-amber-800 text-amber-300";
  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${cls}`}>{props.label}</span>
  );
}
