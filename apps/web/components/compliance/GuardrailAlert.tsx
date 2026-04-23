type GuardrailAlertProps = {
  outcome: "allowed" | "warned" | "soft_blocked" | "hard_blocked" | "manual_review_required";
  message?: string;
};

export default function GuardrailAlert({ outcome, message }: GuardrailAlertProps) {
  if (outcome === "allowed") return null;

  const styles =
    outcome === "warned"
      ? "bg-yellow-900/40 border-yellow-500"
      : outcome === "soft_blocked"
        ? "bg-orange-900/40 border-orange-500"
        : outcome === "manual_review_required"
          ? "bg-amber-950/50 border-amber-500"
          : "bg-red-900/40 border-red-500";

  return (
    <div className={`rounded-xl border p-4 text-white ${styles}`}>
      <div className="font-semibold">
        {outcome === "warned"
          ? "Compliance warning"
          : outcome === "manual_review_required"
            ? "Manual compliance review required"
            : outcome === "soft_blocked"
              ? "Action temporarily blocked"
              : "Action blocked"}
      </div>
      <div className="mt-2 text-sm text-gray-200">
        {message || "This action triggered a compliance guardrail."}
      </div>
    </div>
  );
}
