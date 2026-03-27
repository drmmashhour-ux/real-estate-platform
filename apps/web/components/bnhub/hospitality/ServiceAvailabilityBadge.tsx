"use client";

export function ServiceAvailabilityBadge({
  state,
}: {
  state: "available" | "request_required" | "pending_approval" | "unavailable" | "verification_required";
}) {
  const labels: Record<typeof state, string> = {
    available: "Available",
    request_required: "Request required",
    pending_approval: "Pending approval",
    unavailable: "Unavailable for this stay",
    verification_required: "Additional verification required",
  };
  const cls =
    state === "available"
      ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
      : state === "unavailable"
        ? "bg-zinc-800 text-zinc-500"
        : "bg-amber-500/10 text-amber-200 ring-1 ring-amber-500/25";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {labels[state]}
    </span>
  );
}
