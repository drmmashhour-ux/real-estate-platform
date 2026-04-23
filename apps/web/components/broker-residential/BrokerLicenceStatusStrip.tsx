import type { BrokerLicenceEvaluation } from "@/lib/compliance/oaciq/broker-licence-service";

export function BrokerLicenceStatusStrip({ licence }: { licence: BrokerLicenceEvaluation | null }) {
  if (!licence) return null;

  const tone =
    licence.uiStatus === "verified"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
      : licence.uiStatus === "warning"
        ? "border-amber-500/40 bg-amber-500/10 text-amber-100"
        : "border-red-500/50 bg-red-500/10 text-red-100";

  const icon = licence.uiStatus === "verified" ? "✅" : licence.uiStatus === "warning" ? "⚠️" : "❌";

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${tone}`}>
      <p className="font-medium">
        {icon} OACIQ licence (residential){" "}
        <span className="text-xs font-normal opacity-90">— {licence.label}</span>
      </p>
      {licence.warnings.length > 0 ? (
        <ul className="mt-2 list-inside list-disc text-xs opacity-95">
          {licence.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}
      {!licence.allowed && licence.reasons.length > 0 ? (
        <ul className="mt-2 list-inside list-disc text-xs opacity-95">
          {licence.reasons.slice(0, 4).map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
