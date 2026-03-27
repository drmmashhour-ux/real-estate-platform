export function FraudAlertBanner({
  fraudScore,
  riskLevel,
}: {
  fraudScore: number | null;
  riskLevel: string | null;
}) {
  if (fraudScore == null || fraudScore < 40) return null;

  const high = fraudScore >= 70 || riskLevel === "high";
  const styles = high
    ? "border-red-500/40 bg-red-950/40 text-red-100"
    : "border-amber-500/35 bg-amber-950/30 text-amber-100";

  return (
    <div className={`rounded-lg border px-3 py-2 text-xs ${styles}`}>
      <p className="font-semibold">Fraud risk signal</p>
      <p className="mt-0.5 text-[11px] opacity-90">
        Automated checks scored this listing <strong>{fraudScore}/100</strong>
        {riskLevel ? ` (${riskLevel} risk).` : "."} Review details carefully; platform may require a deposit or extra verification.
      </p>
    </div>
  );
}
